package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="shortlists",
    uniqueConstraints=@UniqueConstraint(columnNames={"user_id","target_user_id"}))
public class Shortlist {
    public Shortlist() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @ManyToOne(optional=false) @JoinColumn(name="target_user_id") private User targetUser;
    private LocalDateTime createdAt = LocalDateTime.now();
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public User getTargetUser() { return targetUser; }
    public void setTargetUser(User targetUser) { this.targetUser = targetUser; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

}
