package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="hidden_profiles",
       uniqueConstraints=@UniqueConstraint(columnNames={"user_id","hidden_user_id"}))
public class HiddenProfile {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @ManyToOne(optional=false) @JoinColumn(name="hidden_user_id") private User hiddenUser;
    private LocalDateTime createdAt = LocalDateTime.now();
    public Long getId(){return id;}
    public void setId(Long id){this.id=id;}
    public User getUser(){return user;}
    public void setUser(User user){this.user=user;}
    public User getHiddenUser(){return hiddenUser;}
    public void setHiddenUser(User hiddenUser){this.hiddenUser=hiddenUser;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
}
