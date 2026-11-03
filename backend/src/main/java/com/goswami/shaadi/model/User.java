package com.goswami.shaadi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity @Table(name="users")
public class User {
    public User() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    // Login details are private: User is embedded in profile, interest and message responses.
    // The owner gets them from /api/profiles/me; others only via the premium contact endpoint.
    @JsonIgnore @Column(nullable=false, unique=true) private String email;
    @JsonIgnore @Column(nullable=false, unique=true) private String phone;
    // Never serialize: User is embedded in profile, interest and message responses.
    @JsonIgnore @Column(nullable=false) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Gender gender;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Role role = Role.USER;
    @Column(name = "goswami_id", unique = true, nullable = false, length = 20)
    private String goswamiId;
    private boolean enabled = true;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime lastActiveAt = LocalDateTime.now();

    @Column
    private boolean premiumMember = false;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private PremiumPlan premiumPlan;

    private LocalDateTime premiumValidUntil;
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getLastActiveAt() { return lastActiveAt; }

    public boolean isPremiumMember() { return premiumMember; }
    public void setPremiumMember(boolean premiumMember) { this.premiumMember = premiumMember; }

    public PremiumPlan getPremiumPlan() { return premiumPlan; }
    public void setPremiumPlan(PremiumPlan premiumPlan) { this.premiumPlan = premiumPlan; }

    public LocalDateTime getPremiumValidUntil() { return premiumValidUntil; }
    public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }
    public void setPremiumValidUntil(LocalDateTime premiumValidUntil) { this.premiumValidUntil = premiumValidUntil; }
	public String getGoswamiId() {
		return goswamiId;
	}
	public void setGoswamiId(String goswamiId) {
		this.goswamiId = goswamiId;
	}
    

}
