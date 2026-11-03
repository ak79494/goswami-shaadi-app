package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.ChatDtos.ConversationSummary;
import com.goswami.shaadi.dto.MessageDtos.*;
import com.goswami.shaadi.model.Message;
import com.goswami.shaadi.service.ChatService;

import jakarta.validation.Valid;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.socket.messaging.SessionConnectedEvent;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService s;
    private final SimpMessagingTemplate broker;

    public ChatController(
            ChatService s,
            SimpMessagingTemplate broker
    ) {
        this.s = s;
        this.broker = broker;
    }

    private Long uid(Authentication a) {
        return (Long) a.getPrincipal();
    }

    // Besides new messages, a chat topic carries small events: "refresh" (ticks changed or a message was
    // deleted, so reload this chat) and "typing".
    private void event(Long to, String event, Long aboutUserId) {
        broker.convertAndSend(
                "/topic/chat/" + to,
                Map.of("event", event, "userId", aboutUserId)
        );
    }

    private void delivered(Long uid) {
        for (Long sender : s.markDelivered(uid)) {
            event(sender, "refresh", uid);
        }
    }

    /** The member's app just came online, so what was waiting for them has now reached their phone. */
    @EventListener
    public void onConnected(SessionConnectedEvent e) {
        Principal user = e.getUser();
        if (user != null) delivered(Long.valueOf(user.getName()));
    }

    public record TypingFrame(Long toUserId) {}

    /** Sent over the websocket to /app/chat.typing while a member types. */
    @MessageMapping("/chat.typing")
    public void typing(Principal user, @Payload TypingFrame frame) {
        if (user == null || frame == null || frame.toUserId() == null) return;
        Long from = Long.valueOf(user.getName());
        if (s.canMessage(from, frame.toUserId())) event(frame.toUserId(), "typing", from);
    }

    // =========================================
    // MY MESSAGE INBOX
    // =========================================

    @GetMapping
    public List<ConversationSummary> conversations(
            Authentication a
    ) {
        delivered(uid(a));
        return s.conversations(uid(a));
    }

    // =========================================
    // UNREAD MESSAGE COUNT
    // =========================================

    @GetMapping("/unread-count")
    public long unreadCount(
            Authentication a
    ) {
        delivered(uid(a));
        return s.unreadCount(uid(a));
    }

    // =========================================
    // CHAT MESSAGES
    // =========================================

    @GetMapping("/{otherUserId}/messages")
    public List<Message> messages(
            Authentication a,
            @PathVariable Long otherUserId
    ) {

        delivered(uid(a));

        return s.messages(
                uid(a),
                otherUserId
        );
    }

    // =========================================
    // SEND MESSAGE
    // =========================================

    @PostMapping("/messages")
    public Message send(
            Authentication a,
            @Valid @RequestBody SendMessageRequest r
    ) {

        Message m =
                s.send(
                        uid(a),
                        r
                );

        broker.convertAndSend(
                "/topic/chat/" + r.toUserId(),
                m
        );

        return m;
    }

    // =========================================
    // SEND VOICE MESSAGE
    // =========================================

    @PostMapping(value = "/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Message sendVoice(
            Authentication a,
            @RequestParam Long toUserId,
            @RequestPart("file") MultipartFile file
    ) throws Exception {

        Message m = s.sendVoice(uid(a), toUserId, file);

        broker.convertAndSend(
                "/topic/chat/" + toUserId,
                m
        );

        return m;
    }

    // =========================================
    // DELETE MESSAGES
    // =========================================

    @PostMapping("/messages/delete")
    public void delete(
            Authentication a,
            @Valid @RequestBody DeleteMessagesRequest r
    ) {

        for (Long other : s.deleteMessages(uid(a), r.ids(), r.forEveryone())) {
            event(other, "refresh", uid(a));
        }
    }

    // =========================================
    // MARK CHAT READ
    // =========================================

    @PatchMapping("/{otherUserId}/read")
    public void markRead(
            Authentication a,
            @PathVariable Long otherUserId
    ) {

        if (s.markRead(
                uid(a),
                otherUserId
        )) {
            event(otherUserId, "refresh", uid(a));
        }
    }
}