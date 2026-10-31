package com.goswami.shaadi.model;

import jakarta.persistence.*;

@Entity @Table(name="partner_preferences")
public class PartnerPreference {
    public PartnerPreference() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @OneToOne(optional=false) @JoinColumn(name="user_id", unique=true) private User user;
    private Integer minAge = 21;
    private Integer maxAge = 35;
    private String preferredGender;
    private String religions;
    private String communities;
    private String cities;
    private String education;
    private String profession;
    private String maritalStatuses;
    private String foodPreference;
    private String lifestyle;
    @Column(length=2000) private String expectations;
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }
    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }
    public String getPreferredGender() { return preferredGender; }
    public void setPreferredGender(String preferredGender) { this.preferredGender = preferredGender; }
    public String getReligions() { return religions; }
    public void setReligions(String religions) { this.religions = religions; }
    public String getCommunities() { return communities; }
    public void setCommunities(String communities) { this.communities = communities; }
    public String getCities() { return cities; }
    public void setCities(String cities) { this.cities = cities; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getProfession() { return profession; }
    public void setProfession(String profession) { this.profession = profession; }
    public String getMaritalStatuses() { return maritalStatuses; }
    public void setMaritalStatuses(String maritalStatuses) { this.maritalStatuses = maritalStatuses; }
    public String getFoodPreference() { return foodPreference; }
    public void setFoodPreference(String foodPreference) { this.foodPreference = foodPreference; }
    public String getLifestyle() { return lifestyle; }
    public void setLifestyle(String lifestyle) { this.lifestyle = lifestyle; }
    public String getExpectations() { return expectations; }
    public void setExpectations(String expectations) { this.expectations = expectations; }

}
