package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "profile_visits",
       indexes = {
           @Index(name = "idx_profile_visits_profile_user", columnList = "profile_user_id"),
           @Index(name = "idx_profile_visits_visitor_user", columnList = "visitor_user_id")
       })
public class ProfileVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "visitor_user_id", nullable = false)
    private User visitor;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_user_id", nullable = false)
    private User profileUser;

    @Column(nullable = false)
    private LocalDateTime visitedAt = LocalDateTime.now();

    public ProfileVisit() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getVisitor() {
        return visitor;
    }

    public void setVisitor(User visitor) {
        this.visitor = visitor;
    }

    public User getProfileUser() {
        return profileUser;
    }

    public void setProfileUser(User profileUser) {
        this.profileUser = profileUser;
    }

    public LocalDateTime getVisitedAt() {
        return visitedAt;
    }

    public void setVisitedAt(LocalDateTime visitedAt) {
        this.visitedAt = visitedAt;
    }
}
