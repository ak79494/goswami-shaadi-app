package com.goswami.shaadi.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class ProfileDtos {

    public record ProfileRequest(
            @NotBlank String firstName,
            String lastName,
            LocalDate dateOfBirth,
            String mobileNumber,
            String city,
            String state,
            String country,
            String motherTongue,
            String religion,
            String community,
            String subCommunity,
            String maritalStatus,
            String height,
            String bodyType,
            String education,
            String college,
            String profession,
            String company,
            String incomeRange,
            String aboutMe,
            java.util.List<String> hobbies,
            String familyType,
            String familyValues,
            String fatherName,
            String motherName,
            String fatherOccupation,
            String motherOccupation,
            Integer siblings,
            String lifestyle,
            String foodPreference,
            String smoking,
            String drinking,
            Boolean profileVisible,
            Boolean contactVisible,
            String timeOfBirth,
            String placeOfBirth,
            String manglik,
            String nakshatra,
            String rashi,
            String whatsappNumber,
            String contactDisplayOption
    ) {
    }

    /** Who may see a member's phone and WhatsApp numbers. */
    public static final String CONTACT_PREMIUM = "PREMIUM";
    public static final String CONTACT_CONNECTED = "CONNECTED";
    public static final String CONTACT_HIDDEN = "HIDDEN";

    /**
     * Result of a contact lookup. When {@code available} is false, {@code reason} says why:
     * PREMIUM_REQUIRED, CONNECT_FIRST, HIDDEN, BLOCKED or NO_NUMBER.
     */
    public record ContactResponse(boolean available, String reason, String phone, String whatsapp) {}

    /** Dedicated payload for the Interests & Hobbies editor. */
    public record HobbiesRequest(
            java.util.List<String> hobbies
    ) {}

    public record PreferenceRequest(
            Integer minAge,
            Integer maxAge,
            String preferredGender,
            String religions,
            String communities,
            String cities,
            String education,
            String profession,
            String maritalStatuses,
            String foodPreference,
            String lifestyle,
            String expectations
    ) {
    }
    
    public record PreferenceMatchDetail(
            String label,
            String value,
            boolean matched
    ) {}

    public record PreferenceMatchResponse(
            int matched,
            int total,
            int percentage,
            String message,
            java.util.List<PreferenceMatchDetail> details
    ) {}

    /** How one member fits the other member's partner preferences (only the preferences they set). */
    public record PreferenceSide(int matched, int total, java.util.List<PreferenceMatchDetail> details) {}

    /**
     * Two-way compatibility for the "You & her" section: theirs = how the viewer fits their
     * preferences, mine = how they fit the viewer's. percentage is null when neither set any.
     */
    public record CompatibilityResponse(Integer percentage, PreferenceSide theirs, PreferenceSide mine) {}
    
    
}