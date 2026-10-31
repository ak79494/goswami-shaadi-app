package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="blocks",
    uniqueConstraints=@UniqueConstraint(columnNames={"user_id","blocked_user_id"}))
public class Block {
    public Block() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @ManyToOne(optional=false) @JoinColumn(name="blocked_user_id") private User blockedUser;
    private LocalDateTime createdAt = LocalDateTime.now();
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public User getBlockedUser() { return blockedUser; }
    public void setBlockedUser(User blockedUser) { this.blockedUser = blockedUser; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

}
