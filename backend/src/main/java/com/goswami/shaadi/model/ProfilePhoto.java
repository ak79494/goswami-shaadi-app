package com.goswami.shaadi.model;

import jakarta.persistence.*;

@Entity @Table(name="profile_photos")
public class ProfilePhoto {
    public ProfilePhoto() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
    @Column(nullable=false) private String fileName;
    @Column(nullable=false) private String url;
    private boolean primaryPhoto;
    private int sortOrder;
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
    public boolean isPrimaryPhoto() { return primaryPhoto; }
    public void setPrimaryPhoto(boolean primaryPhoto) { this.primaryPhoto = primaryPhoto; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

}
