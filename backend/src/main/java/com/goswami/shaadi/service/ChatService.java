package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.ChatDtos.ConversationSummary;
import com.goswami.shaadi.dto.MessageDtos.SendMessageRequest;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;

import org.springframework.messaging.simp.user.SimpUserRegistry;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ChatService {

    private final UserRepository users;
    private final ProfileRepository profiles;
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final BlockRepository blocks;
    private final NotificationRepository notifications;
    private final ProfilePhotoRepository photos;
    private final InterestRequestRepository requests;
    private final SimpUserRegistry online;
    private final Path uploadDir;
    private final PushService push;

    public ChatService(
            UserRepository users,
            ProfileRepository profiles,
            ConversationRepository conversations,
            MessageRepository messages,
            BlockRepository blocks,
            NotificationRepository notifications,
            ProfilePhotoRepository photos,
            InterestRequestRepository requests,
            SimpUserRegistry online,
            @Value("${app.upload-dir}") String uploadDir,
            PushService push
    ) {
        this.users = users;
        this.profiles = profiles;
        this.conversations = conversations;
        this.messages = messages;
        this.blocks = blocks;
        this.notifications = notifications;
        this.photos = photos;
        this.requests = requests;
        this.online = online;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.push = push;
    }

    // Notifications show the sender's first name (or Goswami ID), never their email address.
    /** Says who wrote, never what they wrote: phones show notifications on the lock screen. */
    private void pushMessage(User sender, Long toUserId, String body) {
        push.send(toUserId, new PushService.Push(PushService.MESSAGES, "chat-" + sender.getId(), senderLabel(sender), body,
            java.util.Map.of("type", "chat", "userId", String.valueOf(sender.getId()))));
    }

    private String senderLabel(User u) {
        return profiles.findByUserId(u.getId())
                .map(Profile::getFirstName)
                .orElse(u.getGoswamiId());
    }

    private Conversation conversation(Long a, Long b) {

        long x = Math.min(a, b);
        long y = Math.max(a, b);

        return conversations
                .findByUser1IdAndUser2Id(x, y)
                .orElseGet(() -> {

                    Conversation c = new Conversation();

                    c.setUser1(
                            users.findById(x).orElseThrow()
                    );

                    c.setUser2(
                            users.findById(y).orElseThrow()
                    );

                    c.setUpdatedAt(LocalDateTime.now());

                    return conversations.save(c);
                });
    }

    // =========================================
    // MESSAGE ACCESS
    // =========================================

    private boolean hasMessagingInterest(Long a, Long b) {
        return requests.findBySenderIdAndReceiverId(a, b)
                .map(r -> r.getStatus() == RequestStatus.PENDING || r.getStatus() == RequestStatus.ACCEPTED)
                .orElse(false)
                || requests.findBySenderIdAndReceiverId(b, a)
                .map(r -> r.getStatus() == RequestStatus.PENDING || r.getStatus() == RequestStatus.ACCEPTED)
                .orElse(false);
    }

    public boolean canMessage(Long a, Long b) {
        return hasMessagingInterest(a, b)
                && blocks.findByUserIdAndBlockedUserId(a, b).isEmpty()
                && blocks.findByUserIdAndBlockedUserId(b, a).isEmpty();
    }

    private boolean isOnline(Long userId) {
        return online.getUser(String.valueOf(userId)) != null;
    }

    private static boolean hiddenFor(Long uid, Message m) {
        return m.getSender().getId().equals(uid) ? m.isHiddenForSender() : m.isHiddenForReceiver();
    }

    private static String quoteOf(Message m) {
        if ("VOICE".equals(m.getMessageType())) return "🎤 Voice message";
        String text = m.getContent();
        return text.length() > 200 ? text.substring(0, 200) + "…" : text;
    }

    // =========================================
    // SEND MESSAGE
    // =========================================

    @Transactional
    public Message send(
            Long from,
            SendMessageRequest r
    ) {

        if (from.equals(r.toUserId())) {
            throw new IllegalArgumentException(
                    "Cannot message yourself"
            );
        }

        // One interest in either direction is enough to open messaging.
        // Acceptance is NOT required. Direct messaging without any interest
        // remains blocked.
        if (!hasMessagingInterest(from, r.toUserId())) {
            throw new IllegalArgumentException(
                    "Send an interest request before messaging this profile."
            );
        }

        if (
                blocks.findByUserIdAndBlockedUserId(
                        from,
                        r.toUserId()
                ).isPresent()
                ||
                blocks.findByUserIdAndBlockedUserId(
                        r.toUserId(),
                        from
                ).isPresent()
        ) {
            throw new IllegalArgumentException(
                    "Messaging unavailable"
            );
        }

        User sender =
                users.findById(from).orElseThrow();

        User receiver =
                users.findById(r.toUserId()).orElseThrow();

        Conversation c =
                conversation(from, r.toUserId());

        c.setUpdatedAt(LocalDateTime.now());

        conversations.save(c);

        Message m = new Message();

        m.setConversation(c);
        m.setSender(sender);
        m.setContent(r.content());
        m.setRead(false);
        if (isOnline(r.toUserId())) m.setDeliveredAt(LocalDateTime.now());

        if (r.replyToId() != null) {
            Message quoted = messages.findById(r.replyToId())
                    .filter(q -> q.getConversation().getId().equals(c.getId())
                            && !Message.TYPE_DELETED.equals(q.getMessageType()))
                    .orElseThrow(() -> new IllegalArgumentException(
                            "The message you're replying to is no longer available"
                    ));
            m.setReplyToId(quoted.getId());
            m.setReplyToSenderId(quoted.getSender().getId());
            m.setReplyToText(quoteOf(quoted));
        }

        Message saved = messages.save(m);

        // Create notification for receiver
        Notification n = new Notification();

        n.setUser(receiver);
        n.setType("MESSAGE");
        n.setMessage(
                "You received a new message from "
                + senderLabel(sender)
        );
        n.setRead(false);

        notifications.save(n);
        pushMessage(sender, receiver.getId(), "Sent you a message");

        return saved;
    }

    // =========================================
    // SEND VOICE MESSAGE
    // =========================================

    @Transactional
    public Message sendVoice(Long from, Long toUserId, MultipartFile file) throws Exception {

        if (from.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot message yourself");
        }
        if (!hasMessagingInterest(from, toUserId)) {
            throw new IllegalArgumentException("Send an interest request before messaging this profile.");
        }
        if (blocks.findByUserIdAndBlockedUserId(from, toUserId).isPresent()
                || blocks.findByUserIdAndBlockedUserId(toUserId, from).isPresent()) {
            throw new IllegalArgumentException("Messaging unavailable");
        }
        if (file == null || file.isEmpty() || file.getContentType() == null
                || !file.getContentType().toLowerCase().startsWith("audio/")) {
            throw new IllegalArgumentException("Only audio files are allowed");
        }
        if (file.getSize() > 10L * 1024L * 1024L) {
            throw new IllegalArgumentException("Voice message is too large");
        }

        User sender = users.findById(from).orElseThrow();
        User receiver = users.findById(toUserId).orElseThrow();
        Conversation c = conversation(from, toUserId);
        c.setUpdatedAt(LocalDateTime.now());
        conversations.save(c);

        Files.createDirectories(uploadDir);
        String original = Objects.requireNonNullElse(file.getOriginalFilename(), "voice.webm");
        String ext = ".webm";
        int dot = original.lastIndexOf('.');
        if (dot >= 0 && dot < original.length() - 1) {
            String candidate = original.substring(dot).replaceAll("[^A-Za-z0-9.]", "");
            if (candidate.length() <= 8) ext = candidate.toLowerCase();
        }
        String safe = "voice-" + UUID.randomUUID() + ext;
        Files.copy(file.getInputStream(), uploadDir.resolve(safe), StandardCopyOption.REPLACE_EXISTING);

        Message m = new Message();
        m.setConversation(c);
        m.setSender(sender);
        m.setContent("Voice message");
        m.setMessageType("VOICE");
        m.setAudioUrl("/uploads/" + safe);
        m.setRead(false);
        if (isOnline(toUserId)) m.setDeliveredAt(LocalDateTime.now());
        Message saved = messages.save(m);

        Notification n = new Notification();
        n.setUser(receiver);
        n.setType("MESSAGE");
        n.setMessage("You received a voice message from " + senderLabel(sender));
        n.setRead(false);
        notifications.save(n);
        pushMessage(sender, toUserId, "Sent you a voice message");

        return saved;
    }

    // =========================================
    // GET CHAT MESSAGES
    // =========================================

    public List<Message> messages(
            Long uid,
            Long other
    ) {

        Conversation c =
                conversation(uid, other);

        return messages
                .findByConversationIdOrderByCreatedAtAsc(
                        c.getId()
                )
                .stream()
                .filter(m -> !hiddenFor(uid, m))
                .toList();
    }

    // =========================================
    // DELETE FOR ME / FOR EVERYONE
    // =========================================

    /** Returns the members whose chat changed and should reload it. "Delete for me" tells no one. */
    @Transactional
    public Set<Long> deleteMessages(
            Long uid,
            List<Long> ids,
            boolean forEveryone
    ) {

        Set<Long> changedFor = new HashSet<>();

        for (Message m : messages.findAllById(ids)) {

            Conversation c = m.getConversation();
            Long user1 = c.getUser1().getId();
            Long user2 = c.getUser2().getId();

            if (!user1.equals(uid) && !user2.equals(uid)) {
                throw new IllegalArgumentException("Message not found");
            }

            if (!forEveryone) {
                if (m.getSender().getId().equals(uid)) m.setHiddenForSender(true);
                else m.setHiddenForReceiver(true);
                continue;
            }

            if (!m.getSender().getId().equals(uid)) {
                throw new IllegalArgumentException("You can only delete your own messages for everyone");
            }
            if (m.getDeleteForEveryoneSeconds() <= 0) {
                throw new IllegalArgumentException(
                        "Messages can only be deleted for everyone within "
                        + Message.DELETE_FOR_EVERYONE_HOURS + " hours of sending"
                );
            }

            removeVoiceFile(m.getAudioUrl());
            m.setContent(Message.DELETED_TEXT);
            m.setMessageType(Message.TYPE_DELETED);
            m.setAudioUrl(null);
            m.setReplyToId(null);
            m.setReplyToSenderId(null);
            m.setReplyToText(null);
            messages.updateQuotes(m.getId(), Message.DELETED_TEXT);
            changedFor.add(user1.equals(uid) ? user2 : user1);
        }

        return changedFor;
    }

    private void removeVoiceFile(String audioUrl) {
        if (audioUrl == null) return;
        try {
            Files.deleteIfExists(uploadDir.resolve(audioUrl.substring(audioUrl.lastIndexOf('/') + 1)));
        } catch (Exception ignored) {
        }
    }

    // =========================================
    // GET MY CONVERSATIONS
    // =========================================

    public List<ConversationSummary> conversations(
            Long uid
    ) {

        List<Conversation> list =
                conversations
                        .findByUser1IdOrUser2IdOrderByUpdatedAtDesc(
                                uid,
                                uid
                        );

        List<ConversationSummary> result =
                new ArrayList<>();

        for (Conversation c : list) {

            User otherUser;

            if (c.getUser1().getId().equals(uid)) {
                otherUser = c.getUser2();
            } else {
                otherUser = c.getUser1();
            }

            String name = otherUser.getGoswamiId();

            try {
                Profile profile =
                        profiles
                                .findByUserId(otherUser.getId())
                                .orElse(null);

                if (profile != null) {

                    String first =
                            profile.getFirstName() == null
                            ? ""
                            : profile.getFirstName();

                    String last =
                            profile.getLastName() == null
                            ? ""
                            : profile.getLastName();

                    String full =
                            (first + " " + last).trim();

                    if (!full.isBlank()) {
                        name = full;
                    }
                }

            } catch (Exception ignored) {
            }

            List<Message> msgs =
                    messages
                            .findByConversationIdOrderByCreatedAtAsc(
                                    c.getId()
                            )
                            .stream()
                            .filter(m -> !hiddenFor(uid, m))
                            .toList();

            String lastMessage = "";

            String lastMessageTime = "";

            if (!msgs.isEmpty()) {

                Message last =
                        msgs.get(msgs.size() - 1);

                lastMessage =
                        Message.TYPE_DELETED.equals(last.getMessageType()) && last.getSender().getId().equals(uid)
                        ? "You deleted this message"
                        : last.getContent();

                if (last.getCreatedAt() != null) {
                    lastMessageTime =
                            last.getCreatedAt().toString();
                }
            }

            long unread =
                    messages
                            .countByConversationIdAndSenderIdAndReadFalse(
                                    c.getId(),
                                    otherUser.getId()
                            );

            String photoUrl = null;
            try {
                List<ProfilePhoto> userPhotos =
                        photos.findByUserIdOrderBySortOrderAsc(otherUser.getId());
                if (!userPhotos.isEmpty()) {
                    ProfilePhoto primary = userPhotos.stream()
                            .filter(ProfilePhoto::isPrimaryPhoto)
                            .findFirst()
                            .orElse(userPhotos.get(0));
                    photoUrl = primary.getUrl();
                }
            } catch (Exception ignored) {
            }

            LocalDateTime lastActive = otherUser.getLastActiveAt();
            boolean online = lastActive != null
                    && lastActive.isAfter(LocalDateTime.now().minusMinutes(5));

            result.add(
                    new ConversationSummary(
                            otherUser.getId(),
                            name,
                            otherUser.getGoswamiId(),
                            lastMessage,
                            lastMessageTime,
                            unread,
                            photoUrl,
                            online,
                            lastActive == null ? null : lastActive.toString()
                    )
            );
        }

        return result;
    }

    // =========================================
    // UNREAD MESSAGE COUNT
    // =========================================

    public long unreadCount(Long uid) {

        long count = 0;

        List<Conversation> list =
                conversations
                        .findByUser1IdOrUser2IdOrderByUpdatedAtDesc(
                                uid,
                                uid
                        );

        for (Conversation c : list) {

            Long otherId;

            if (c.getUser1().getId().equals(uid)) {
                otherId = c.getUser2().getId();
            } else {
                otherId = c.getUser1().getId();
            }

            count +=
                    messages
                            .countByConversationIdAndSenderIdAndReadFalse(
                                    c.getId(),
                                    otherId
                            );
        }

        return count;
    }

    // =========================================
    // MARK MESSAGES AS DELIVERED
    // =========================================

    /** Everything waiting for this member has reached their phone. Returns who sent it. */
    @Transactional
    public List<Long> markDelivered(Long uid) {

        List<Long> senders = messages.sendersWaitingOnDelivery(uid);

        if (!senders.isEmpty()) {
            messages.markDelivered(uid, LocalDateTime.now());
        }

        return senders;
    }

    // =========================================
    // MARK MESSAGES AS READ
    // =========================================

    /** Returns whether anything was newly read, so the sender's ticks can update. */
    @Transactional
    public boolean markRead(
            Long uid,
            Long otherUserId
    ) {

        Conversation c =
                conversation(uid, otherUserId);

        List<Message> unread =
                messages
                        .findByConversationIdAndSenderIdAndReadFalse(
                                c.getId(),
                                otherUserId
                        );

        LocalDateTime now = LocalDateTime.now();

        for (Message m : unread) {
            m.setRead(true);
            m.setReadAt(now);
            if (m.getDeliveredAt() == null) m.setDeliveredAt(now);
        }

        messages.saveAll(unread);

        return !unread.isEmpty();
    }
}