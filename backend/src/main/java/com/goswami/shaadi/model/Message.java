package com.goswami.shaadi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Duration;
import java.time.LocalDateTime;
import jakarta.persistence.Column;

@Entity @Table(name="messages")
public class Message {
    /** How long after sending a member can still delete a message for everyone. */
    public static final long DELETE_FOR_EVERYONE_HOURS = 8;
    public static final String TYPE_DELETED = "DELETED";
    public static final String DELETED_TEXT = "This message was deleted";
    /** Calls are logged in the chat as "📞 Voice call · 2:31" (see the app's call screen). */
    public static final String CALL_LOG_PREFIX = "📞";

    public Message() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="conversation_id") private Conversation conversation;
    @ManyToOne(optional=false) @JoinColumn(name="sender_id") private User sender;
    @Column(nullable=false, length=4000) private String content;
    @Column(name = "message_type", length=20) private String messageType = "TEXT";
    @Column(name = "audio_url", length=500) private String audioUrl;
    @Column(name = "is_read", nullable = false)
    private boolean read;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    // The message this one replies to, copied here so the quote still shows if the original is later hidden.
    @Column(name = "reply_to_id") private Long replyToId;
    @Column(name = "reply_to_sender_id") private Long replyToSenderId;
    @Column(name = "reply_to_text", length=300) private String replyToText;
    // "Delete for me": each side's choice is private, so it is never sent to the apps.
    @JsonIgnore @Column(name = "hidden_for_sender", nullable = false) private boolean hiddenForSender;
    @JsonIgnore @Column(name = "hidden_for_receiver", nullable = false) private boolean hiddenForReceiver;
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Conversation getConversation() { return conversation; }
    public void setConversation(Conversation conversation) { this.conversation = conversation; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public Long getReplyToId() { return replyToId; }
    public void setReplyToId(Long replyToId) { this.replyToId = replyToId; }
    public Long getReplyToSenderId() { return replyToSenderId; }
    public void setReplyToSenderId(Long replyToSenderId) { this.replyToSenderId = replyToSenderId; }
    public String getReplyToText() { return replyToText; }
    public void setReplyToText(String replyToText) { this.replyToText = replyToText; }
    public boolean isHiddenForSender() { return hiddenForSender; }
    public void setHiddenForSender(boolean hiddenForSender) { this.hiddenForSender = hiddenForSender; }
    public boolean isHiddenForReceiver() { return hiddenForReceiver; }
    public void setHiddenForReceiver(boolean hiddenForReceiver) { this.hiddenForReceiver = hiddenForReceiver; }

    /** Seconds left to delete this for everyone. Sent as a countdown so a wrong clock on the phone doesn't matter. */
    public long getDeleteForEveryoneSeconds() {
        if (createdAt == null || TYPE_DELETED.equals(messageType) || (content != null && content.startsWith(CALL_LOG_PREFIX))) return 0;
        return Math.max(0, Duration.between(LocalDateTime.now(), createdAt.plusHours(DELETE_FOR_EVERYONE_HOURS)).getSeconds());
    }

}
