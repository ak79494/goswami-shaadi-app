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
            String rashi
            
    ) {
    }

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
    
    
}