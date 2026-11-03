package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** A "please call me back" request from the Help screen — a lead for the GoswamiShaadi team. */
@Entity
@Table(name = "help_requests")
public class HelpRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null when the request came from someone who isn't signed in. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 15)
    private String phone;

    @Column(nullable = false, length = 60)
    private String topic;

    @Column(length = 1000)
    private String message;

    /** NEW, CONTACTED or CLOSED. */
    @Column(nullable = false, length = 20)
    private String status = "NEW";

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public HelpRequest() {}

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
