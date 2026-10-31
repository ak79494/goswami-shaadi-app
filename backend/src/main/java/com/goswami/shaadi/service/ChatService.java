package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.ChatDtos.ConversationSummary;
import com.goswami.shaadi.dto.MessageDtos.SendMessageRequest;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
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
    private final Path uploadDir;

    public ChatService(
            UserRepository users,
            ProfileRepository profiles,
            ConversationRepository conversations,
            MessageRepository messages,
            BlockRepository blocks,
            NotificationRepository notifications,
            ProfilePhotoRepository photos,
            InterestRequestRepository requests,
            @Value("${app.upload-dir}") String uploadDir
    ) {
        this.users = users;
        this.profiles = profiles;
        this.conversations = conversations;
        this.messages = messages;
        this.blocks = blocks;
        this.notifications = notifications;
        this.photos = photos;
        this.requests = requests;
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
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

        Message saved = messages.save(m);

        // Create notification for receiver
        Notification n = new Notification();

        n.setUser(receiver);
        n.setType("MESSAGE");
        n.setMessage(
                "You received a new message from "
                + sender.getEmail()
        );
        n.setRead(false);

        notifications.save(n);

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
        Message saved = messages.save(m);

        Notification n = new Notification();
        n.setUser(receiver);
        n.setType("MESSAGE");
        n.setMessage("You received a voice message from " + sender.getEmail());
        n.setRead(false);
        notifications.save(n);

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
                );
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

            String name = otherUser.getEmail();

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
                            );

            String lastMessage = "";

            String lastMessageTime = "";

            if (!msgs.isEmpty()) {

                Message last =
                        msgs.get(msgs.size() - 1);

                lastMessage =
                        last.getContent();

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
    // MARK MESSAGES AS READ
    // =========================================

    @Transactional
    public void markRead(
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

        for (Message m : unread) {
            m.setRead(true);
        }

        messages.saveAll(unread);
    }
}