package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="conversations",
    uniqueConstraints=@UniqueConstraint(columnNames={"user1_id","user2_id"}))
public class Conversation {
    public Conversation() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user1_id") private User user1;
    @ManyToOne(optional=false) @JoinColumn(name="user2_id") private User user2;
    private LocalDateTime updatedAt = LocalDateTime.now();
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser1() { return user1; }
    public void setUser1(User user1) { this.user1 = user1; }
    public User getUser2() { return user2; }
    public void setUser2(User user2) { this.user2 = user2; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

}
