package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** Where to send a member's notifications while the app is closed. One phone has one token, whoever last signed in on it. */
@Entity @Table(name="device_tokens")
public class DeviceToken {
    public DeviceToken() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @Column(nullable=false, unique=true, length=512) private String token;
    private LocalDateTime updatedAt = LocalDateTime.now();
    public Long getId(){return id;}
    public User getUser(){return user;}
    public void setUser(User user){this.user=user;}
    public String getToken(){return token;}
    public void setToken(String token){this.token=token;}
    public LocalDateTime getUpdatedAt(){return updatedAt;}
    public void setUpdatedAt(LocalDateTime updatedAt){this.updatedAt=updatedAt;}
}
