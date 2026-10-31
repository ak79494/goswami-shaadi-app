package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.ChatDtos.ConversationSummary;
import com.goswami.shaadi.dto.MessageDtos.*;
import com.goswami.shaadi.model.Message;
import com.goswami.shaadi.service.ChatService;

import jakarta.validation.Valid;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

    // =========================================
    // MY MESSAGE INBOX
    // =========================================

    @GetMapping
    public List<ConversationSummary> conversations(
            Authentication a
    ) {
        return s.conversations(uid(a));
    }

    // =========================================
    // UNREAD MESSAGE COUNT
    // =========================================

    @GetMapping("/unread-count")
    public long unreadCount(
            Authentication a
    ) {
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
    // MARK CHAT READ
    // =========================================

    @PatchMapping("/{otherUserId}/read")
    public void markRead(
            Authentication a,
            @PathVariable Long otherUserId
    ) {

        s.markRead(
                uid(a),
                otherUserId
        );
    }
}