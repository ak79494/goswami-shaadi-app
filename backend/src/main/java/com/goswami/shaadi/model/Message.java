package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import jakarta.persistence.Column;

@Entity @Table(name="messages")
public class Message {
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

}
