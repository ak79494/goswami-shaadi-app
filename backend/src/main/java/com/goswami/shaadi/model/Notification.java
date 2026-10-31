package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="notifications")
public class Notification {
    public Notification() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @Column(nullable=false, length=500) private String message;
    private String type;
    @Column(name = "is_read", nullable = false)
    private boolean read;
    private LocalDateTime createdAt = LocalDateTime.now();
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

}
