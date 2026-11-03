package com.goswami.shaadi.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.goswami.shaadi.model.Notification;
import com.goswami.shaadi.model.Profile;
import com.goswami.shaadi.model.RequestStatus;
import com.goswami.shaadi.repository.BlockRepository;
import com.goswami.shaadi.repository.InterestRequestRepository;
import com.goswami.shaadi.repository.NotificationRepository;
import com.goswami.shaadi.repository.ProfileRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

/**
 * In-app voice and video calls. Audio and video normally flow directly between the two phones over
 * WebRTC; the server relays the call set-up messages ("signals") over each member's private
 * websocket topic. When the phones can't reach each other (strict mobile-carrier networks), the apps
 * switch to "relay" mode and send compressed voice through the server instead (relayAudio).
 */
@Service
public class CallService {

    private static final Set<String> TYPES = Set.of(
        "invite", "ringing", "accept", "decline", "busy", "cancel", "end",
        "offer", "answer", "ice", "relay", "media"
    );
    private static final Set<String> FINAL = Set.of("decline", "busy", "cancel", "end");
    /** How long an unanswered call rings; matches the apps' timeout. */
    private static final Duration RING = Duration.ofSeconds(45);
    private static final int MAX_AUDIO_FRAME = 8_000;
    /** How long signals stay available for an app that missed them while its websocket was down. */
    private static final Duration INBOX_KEEP = Duration.ofMinutes(2);
    private static final int INBOX_MAX = 200;

    private final UserRepository users;
    private final ProfileRepository profiles;
    private final BlockRepository blocks;
    private final InterestRequestRepository requests;
    private final NotificationRepository notifications;
    private final SimpMessagingTemplate broker;
    private final SimpUserRegistry online;
    private final PushService push;
    private final List<Map<String, Object>> iceServers;

    /** Calls ringing or in progress, by call id. In memory: a call only lives as long as the server. */
    private final Map<String, Call> calls = new ConcurrentHashMap<>();
    /** Recent signals per member, numbered by `seq`, so an app can catch up after a dropped websocket. */
    private final Map<Long, Deque<Map<String, Object>>> inbox = new ConcurrentHashMap<>();
    // Starts from the clock so numbers keep growing across server restarts.
    private final AtomicLong seq = new AtomicLong(System.currentTimeMillis() * 1000);

    public CallService(
        UserRepository users,
        ProfileRepository profiles,
        BlockRepository blocks,
        InterestRequestRepository requests,
        NotificationRepository notifications,
        SimpMessagingTemplate broker,
        SimpUserRegistry online,
        PushService push,
        @Value("${app.calls.stun-urls:stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302}") String stunUrls,
        @Value("${app.calls.turn-urls:}") String turnUrls,
        @Value("${app.calls.turn-username:}") String turnUsername,
        @Value("${app.calls.turn-credential:}") String turnCredential
    ) {
        this.users = users;
        this.profiles = profiles;
        this.blocks = blocks;
        this.requests = requests;
        this.notifications = notifications;
        this.broker = broker;
        this.online = online;
        this.push = push;

        List<Map<String, Object>> servers = new ArrayList<>();
        List<String> stun = split(stunUrls);
        if (!stun.isEmpty()) servers.add(Map.of("urls", stun));
        List<String> turn = split(turnUrls);
        if (!turn.isEmpty()) {
            // A TURN relay lets calls connect when both phones are behind strict mobile-carrier NAT.
            servers.add(Map.of("urls", turn, "username", turnUsername, "credential", turnCredential));
        }
        this.iceServers = List.copyOf(servers);
    }

    public record Signal(Long toUserId, String callId, String type, JsonNode data) {}

    /** delivered: the other member's app is connected right now, so their phone is ringing. */
    public record SignalResult(boolean delivered) {}

    private static final class Call {
        final Long caller;
        final Long callee;
        final boolean video;
        final Instant startedAt = Instant.now();
        volatile Instant acceptedAt;
        volatile Instant endedAt;

        Call(Long caller, Long callee, boolean video) {
            this.caller = caller;
            this.callee = callee;
            this.video = video;
        }

        Long other(Long member) {
            if (member.equals(caller)) return callee;
            if (member.equals(callee)) return caller;
            return null;
        }

        boolean ringing() {
            return acceptedAt == null && endedAt == null && startedAt.plus(RING).isAfter(Instant.now());
        }

        boolean live() {
            return acceptedAt != null && endedAt == null;
        }
    }

    public Map<String, Object> config() {
        return Map.of("iceServers", iceServers);
    }

    public SignalResult signal(Long fromUserId, Signal s) {
        if (s == null || s.toUserId() == null) throw new IllegalArgumentException("Who are you calling?");
        if (s.type() == null || !TYPES.contains(s.type())) throw new IllegalArgumentException("Unknown call signal");
        if (s.callId() == null || !s.callId().matches("[A-Za-z0-9-]{8,64}")) throw new IllegalArgumentException("Invalid call");
        if (s.data() != null && s.data().toString().length() > 20_000) throw new IllegalArgumentException("Call signal too large");
        if (fromUserId.equals(s.toUserId())) throw new IllegalArgumentException("You can't call yourself");
        if (!users.existsById(s.toUserId())) throw new IllegalArgumentException("Member not found");

        Call call = calls.get(s.callId());
        if ("invite".equals(s.type())) {
            if (call != null) throw new IllegalArgumentException("Invalid call");
            checkAllowed(fromUserId, s.toUserId());
            forgetOldCalls();
            boolean video = s.data() != null && s.data().path("video").asBoolean(false);
            calls.put(s.callId(), new Call(fromUserId, s.toUserId(), video));
        } else if (call != null) {
            // Only the two people on a call can send signals for it.
            if (!s.toUserId().equals(call.other(fromUserId))) throw new IllegalArgumentException("Invalid call");
            if ("accept".equals(s.type()) && fromUserId.equals(call.callee) && call.endedAt == null) {
                call.acceptedAt = Instant.now();
            } else if (FINAL.contains(s.type()) && call.endedAt == null) {
                call.endedAt = Instant.now();
                if (call.acceptedAt == null && !"decline".equals(s.type()) && !"busy".equals(s.type())) {
                    missedCall(call, s.callId());
                }
            }
        } else {
            // Unknown call (e.g. the server restarted mid-call): still let the two members end it.
            checkAllowed(fromUserId, s.toUserId());
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("seq", seq.incrementAndGet());
        payload.put("fromUserId", fromUserId);
        payload.put("fromName", firstName(fromUserId));
        payload.put("callId", s.callId());
        payload.put("type", s.type());
        payload.put("data", s.data());
        payload.put("at", System.currentTimeMillis());
        remember(s.toUserId(), payload);
        broker.convertAndSend("/topic/call/" + s.toUserId(), payload);
        boolean connected = online.getUser(String.valueOf(s.toUserId())) != null;
        // With the app closed, this notification is the only way the phone can ring. Opening it picks up the call (ringingFor).
        if ("invite".equals(s.type()) && !connected) {
            boolean video = s.data() != null && s.data().path("video").asBoolean(false);
            push.send(s.toUserId(), new PushService.Push(PushService.CALLS, "call-" + s.callId(),
                "Incoming " + (video ? "video" : "voice") + " call", firstName(fromUserId) + " is calling you on GoswamiJodi",
                Map.of("type", "call")));
        }
        return new SignalResult(connected);
    }

    public record Inbox(long seq, List<Map<String, Object>> signals) {}

    /** Signals for this member numbered after `after` (from the last two minutes), plus the latest number. */
    public Inbox signalsFor(Long userId, long after) {
        long cutoff = System.currentTimeMillis() - INBOX_KEEP.toMillis();
        List<Map<String, Object>> list = inbox.getOrDefault(userId, new ConcurrentLinkedDeque<>()).stream()
            .filter(p -> (long) p.get("seq") > after && (long) p.get("at") >= cutoff)
            .toList();
        return new Inbox(seq.get(), list);
    }

    private void remember(Long userId, Map<String, Object> payload) {
        Deque<Map<String, Object>> box = inbox.computeIfAbsent(userId, k -> new ConcurrentLinkedDeque<>());
        box.addLast(payload);
        long cutoff = System.currentTimeMillis() - INBOX_KEEP.toMillis();
        while (box.size() > INBOX_MAX || (!box.isEmpty() && (long) box.peekFirst().get("at") < cutoff)) {
            box.pollFirst();
        }
    }

    /**
     * A call that is still ringing for this member: the app asks when it comes back to the foreground
     * or reconnects, so a call that arrived while the phone was offline for a moment isn't lost.
     */
    public Optional<Map<String, Object>> ringingFor(Long userId) {
        return calls.entrySet().stream()
            .filter(e -> e.getValue().callee.equals(userId) && e.getValue().ringing())
            .findFirst()
            .map(e -> {
                Map<String, Object> invite = new LinkedHashMap<>();
                invite.put("fromUserId", e.getValue().caller);
                invite.put("fromName", firstName(e.getValue().caller));
                invite.put("callId", e.getKey());
                invite.put("type", "invite");
                invite.put("data", Map.of("video", e.getValue().video));
                return invite;
            });
    }

    /** Relay mode: forwards one compressed voice frame to the other person on a connected call. */
    public void relayAudio(Long fromUserId, String callId, String frame) {
        if (callId == null || frame == null || frame.length() > MAX_AUDIO_FRAME) return;
        Call call = calls.get(callId);
        if (call == null || !call.live()) return;
        Long to = call.other(fromUserId);
        if (to == null) return;
        broker.convertAndSend("/topic/audio/" + to, Map.of("callId", callId, "d", frame));
    }

    private void checkAllowed(Long from, Long to) {
        if (blocks.findByUserIdAndBlockedUserId(from, to).isPresent()
                || blocks.findByUserIdAndBlockedUserId(to, from).isPresent()) {
            throw new IllegalArgumentException("Calling unavailable");
        }
        // Same rule as chat: an interest in either direction (pending or accepted).
        if (!hasInterest(from, to)) {
            throw new IllegalArgumentException("Send an interest request before calling this profile.");
        }
    }

    private void missedCall(Call call, String callId) {
        users.findById(call.callee).ifPresent(callee -> {
            Notification n = new Notification();
            n.setUser(callee);
            n.setType("CALL");
            n.setMessage("Missed " + (call.video ? "video" : "voice") + " call from " + firstName(call.caller));
            notifications.save(n);
            push.send(call.callee, new PushService.Push(PushService.MESSAGES, "call-" + callId, "Missed call", n.getMessage(), Map.of("type", "notification")));
        });
    }

    private void forgetOldCalls() {
        Instant now = Instant.now();
        calls.values().removeIf(c ->
            (c.endedAt != null && c.endedAt.plusSeconds(60).isBefore(now))
                || c.startedAt.plus(Duration.ofHours(4)).isBefore(now));
    }

    private String firstName(Long userId) {
        return profiles.findByUserId(userId).map(Profile::getFirstName).orElse("Member");
    }

    private boolean hasInterest(Long a, Long b) {
        return requests.findBySenderIdAndReceiverId(a, b).map(r -> open(r.getStatus())).orElse(false)
            || requests.findBySenderIdAndReceiverId(b, a).map(r -> open(r.getStatus())).orElse(false);
    }

    private boolean open(RequestStatus status) {
        return status == RequestStatus.PENDING || status == RequestStatus.ACCEPTED;
    }

    private static List<String> split(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(",")).map(String::trim).filter(x -> !x.isEmpty()).toList();
    }
}
