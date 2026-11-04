package com.goswami.shaadi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity @Table(name="profiles")
public class Profile {
    public Profile() {
    }

    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @OneToOne(optional=false) @JoinColumn(name="user_id", unique=true) private User user;
    @Column(nullable=false) private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    // Contact numbers are never part of the public profile JSON. Members see them through
    // GET /api/profiles/user/{id}/contact, which checks premium membership and privacy settings.
    @JsonIgnore private String mobileNumber;
    @JsonIgnore private String whatsappNumber;
    private String city;
    private String state;
    private String country = "India";
    private String motherTongue;
    private String religion;
    private String community;
    private String subCommunity;
    private String maritalStatus;
    private String height;
    private String bodyType;
    private String education;
    private String college;
    private String profession;
    private String company;
    private String incomeRange;
    @Column(length=3000) private String aboutMe;

    /**
     * User-selected interests and hobbies.
     * Stored in a separate collection table so a profile can have any
     * number of hobbies without changing the profiles table schema.
     */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "profile_hobbies",
            joinColumns = @JoinColumn(name = "profile_id")
    )
    @OrderColumn(name = "hobby_order")
    @Column(name = "hobby", length = 200)
    private List<String> hobbies = new ArrayList<>();
    private String familyType;
    private String familyValues;
    private String fatherName;
    private String motherName;
    private String fatherOccupation;
    private String motherOccupation;
    private Integer siblings;
    private String lifestyle;
    private String foodPreference;
    private String smoking;
    private String drinking;
    private boolean profileVisible = true;
    private boolean contactVisible = false;
    private LocalDateTime updatedAt = LocalDateTime.now();
    // Explicit getters/setters: keeps the project independent of Lombok.
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getMotherTongue() { return motherTongue; }
    public void setMotherTongue(String motherTongue) { this.motherTongue = motherTongue; }
    public String getReligion() { return religion; }
    public void setReligion(String religion) { this.religion = religion; }
    public String getCommunity() { return community; }
    public void setCommunity(String community) { this.community = community; }
    public String getSubCommunity() { return subCommunity; }
    public void setSubCommunity(String subCommunity) { this.subCommunity = subCommunity; }
    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }
    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }
    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }
    public String getEducation() { return education; }
    public void setEducation(String education) { this.education = education; }
    public String getCollege() { return college; }
    public void setCollege(String college) { this.college = college; }
    public String getProfession() { return profession; }
    public void setProfession(String profession) { this.profession = profession; }
    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }
    public String getIncomeRange() { return incomeRange; }
    public void setIncomeRange(String incomeRange) { this.incomeRange = incomeRange; }
    public String getAboutMe() { return aboutMe; }
    public void setAboutMe(String aboutMe) { this.aboutMe = aboutMe; }
    public List<String> getHobbies() { return hobbies; }
    public void setHobbies(List<String> hobbies) { this.hobbies = hobbies; }
    public String getFamilyType() { return familyType; }
    public void setFamilyType(String familyType) { this.familyType = familyType; }
    public String getFamilyValues() { return familyValues; }
    public void setFamilyValues(String familyValues) { this.familyValues = familyValues; }
    public String getFatherOccupation() { return fatherOccupation; }
    public void setFatherOccupation(String fatherOccupation) { this.fatherOccupation = fatherOccupation; }
    public String getMotherOccupation() { return motherOccupation; }
    public void setMotherOccupation(String motherOccupation) { this.motherOccupation = motherOccupation; }
    public Integer getSiblings() { return siblings; }
    public void setSiblings(Integer siblings) { this.siblings = siblings; }
    public String getLifestyle() { return lifestyle; }
    public void setLifestyle(String lifestyle) { this.lifestyle = lifestyle; }
    public String getFoodPreference() { return foodPreference; }
    public void setFoodPreference(String foodPreference) { this.foodPreference = foodPreference; }
    public String getSmoking() { return smoking; }
    public void setSmoking(String smoking) { this.smoking = smoking; }
    public String getDrinking() { return drinking; }
    public void setDrinking(String drinking) { this.drinking = drinking; }
    public boolean isProfileVisible() { return profileVisible; }
    public void setProfileVisible(boolean profileVisible) { this.profileVisible = profileVisible; }
    public boolean isContactVisible() { return contactVisible; }
    public void setContactVisible(boolean contactVisible) { this.contactVisible = contactVisible; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    private String contactDisplayOption;
    private String timeOfBirth;
    private String placeOfBirth;
    private String manglik;
    private String nakshatra;
    private String rashi;
	public String getFatherName() {
		return fatherName;
	}
	public void setFatherName(String fatherName) {
		this.fatherName = fatherName;
	}
	public String getMotherName() {
		return motherName;
	}
	public void setMotherName(String motherName) {
		this.motherName = motherName;
	}
	public String getMobileNumber() {
		return mobileNumber;
	}
	public void setMobileNumber(String mobileNumber) {
		this.mobileNumber = mobileNumber;
	}
	public String getWhatsappNumber() {
		return whatsappNumber;
	}
	public void setWhatsappNumber(String whatsappNumber) {
		this.whatsappNumber = whatsappNumber;
	}
	public String getContactDisplayOption() {
		return contactDisplayOption;
	}
	public void setContactDisplayOption(String contactDisplayOption) {
		this.contactDisplayOption = contactDisplayOption;
	}
	public String getTimeOfBirth() {
		return timeOfBirth;
	}
	public void setTimeOfBirth(String timeOfBirth) {
		this.timeOfBirth = timeOfBirth;
	}
	public String getPlaceOfBirth() {
		return placeOfBirth;
	}
	public void setPlaceOfBirth(String placeOfBirth) {
		this.placeOfBirth = placeOfBirth;
	}
	public String getManglik() {
		return manglik;
	}
	public void setManglik(String manglik) {
		this.manglik = manglik;
	}
	public String getNakshatra() {
		return nakshatra;
	}
	public void setNakshatra(String nakshatra) {
		this.nakshatra = nakshatra;
	}
	public String getRashi() {
		return rashi;
	}
	public void setRashi(String rashi) {
		this.rashi = rashi;
	}	
    

}
