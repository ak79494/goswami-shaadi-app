package com.goswami.shaadi.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="profile_reports")
public class ProfileReport {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="reporter_user_id") private User reporter;
    @ManyToOne(optional=false) @JoinColumn(name="reported_user_id") private User reportedUser;
    @Column(nullable=false, length=120) private String reason;
    @Column(length=2000) private String details;
    @Column(length=500) private String evidencePath;
    @Column(nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    // Empty on reports made before the team could review them: those count as open.
    @Column(length=20) private String status = "OPEN";
    private LocalDateTime reviewedAt;
    public String getStatus(){return status;}
    public void setStatus(String status){this.status=status;}
    public LocalDateTime getReviewedAt(){return reviewedAt;}
    public void setReviewedAt(LocalDateTime reviewedAt){this.reviewedAt=reviewedAt;}
    public Long getId(){return id;}
    public void setId(Long id){this.id=id;}
    public User getReporter(){return reporter;}
    public void setReporter(User reporter){this.reporter=reporter;}
    public User getReportedUser(){return reportedUser;}
    public void setReportedUser(User reportedUser){this.reportedUser=reportedUser;}
    public String getReason(){return reason;}
    public void setReason(String reason){this.reason=reason;}
    public String getDetails(){return details;}
    public void setDetails(String details){this.details=details;}
    public String getEvidencePath(){return evidencePath;}
    public void setEvidencePath(String evidencePath){this.evidencePath=evidencePath;}
    public LocalDateTime getCreatedAt(){return createdAt;}
    public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
}
