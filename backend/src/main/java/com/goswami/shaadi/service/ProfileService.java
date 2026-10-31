package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.ProfileDtos.*;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;

import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProfileService {

    private final ProfileRepository profiles;
    private final UserRepository users;
    private final PartnerPreferenceRepository prefs;

    public ProfileService(
            ProfileRepository p,
            UserRepository u,
            PartnerPreferenceRepository pr
    ) {
        profiles = p;
        users = u;
        prefs = pr;
    }

    // =========================================
    // SAVE PROFILE
    // =========================================

    @Transactional
    public Profile save(Long uid, ProfileRequest r) {

        User u = users.findById(uid)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found")
                );

        Profile p = profiles.findByUserId(uid)
                .orElseGet(Profile::new);

        p.setUser(u);

        p.setFirstName(r.firstName());
        p.setLastName(r.lastName());
        p.setDateOfBirth(r.dateOfBirth());
        p.setMobileNumber(r.mobileNumber());

        p.setCity(r.city());
        p.setState(r.state());
        p.setCountry(r.country());

        p.setMotherTongue(r.motherTongue());
        p.setReligion(r.religion());
        p.setCommunity(r.community());
        p.setSubCommunity(r.subCommunity());

        p.setMaritalStatus(r.maritalStatus());
        p.setHeight(r.height());
        p.setBodyType(r.bodyType());

        p.setEducation(r.education());
        p.setCollege(r.college());

        p.setProfession(r.profession());
        p.setCompany(r.company());
        p.setIncomeRange(r.incomeRange());

        p.setAboutMe(r.aboutMe());

        // Interests & hobbies: allow unlimited entries, while keeping
        // blank/duplicate values out of the collection table.
        java.util.List<String> hobbies = r.hobbies() == null
                ? new java.util.ArrayList<>()
                : r.hobbies().stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::trim)
                        .filter(h -> !h.isBlank())
                        .distinct()
                        .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));
        p.setHobbies(hobbies);

        p.setFamilyType(r.familyType());
        p.setFamilyValues(r.familyValues());
        p.setFatherName(r.fatherName());
        p.setMotherName(r.motherName());
        p.setFatherOccupation(r.fatherOccupation());
        p.setMotherOccupation(r.motherOccupation());
        p.setSiblings(r.siblings());

        p.setLifestyle(r.lifestyle());
        p.setFoodPreference(r.foodPreference());
        p.setSmoking(r.smoking());
        p.setDrinking(r.drinking());
        p.setTimeOfBirth(r.timeOfBirth());
        p.setPlaceOfBirth(r.placeOfBirth());
        p.setManglik(r.manglik());
        p.setNakshatra(r.nakshatra());
        p.setRashi(r.rashi());

        // Profile visibility
        if (r.profileVisible() != null) {
            p.setProfileVisible(r.profileVisible());
        }
        

        // Contact visibility
        if (r.contactVisible() != null) {
            p.setContactVisible(r.contactVisible());
        }

        p.setUpdatedAt(
                java.time.LocalDateTime.now()
        );

        return profiles.save(p);
    }


    // =========================================
    // INTERESTS & HOBBIES
    // =========================================

    public java.util.List<String> getHobbies(Long uid) {
        Profile p = profiles.findByUserId(uid)
                .orElseThrow(() -> new IllegalArgumentException("Profile not created"));
        return p.getHobbies() == null
                ? new java.util.ArrayList<>()
                : new java.util.ArrayList<>(p.getHobbies());
    }

    @Transactional
    public Profile saveHobbies(Long uid, HobbiesRequest request) {
        Profile p = profiles.findByUserId(uid)
                .orElseThrow(() -> new IllegalArgumentException("Profile not created"));

        java.util.List<String> hobbies = request == null || request.hobbies() == null
                ? new java.util.ArrayList<>()
                : request.hobbies().stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::trim)
                        .filter(h -> !h.isBlank())
                        .distinct()
                        .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        p.setHobbies(hobbies);
        p.setUpdatedAt(java.time.LocalDateTime.now());
        return profiles.save(p);
    }


    // =========================================
    // GET MY PROFILE
    // =========================================

    public Profile get(Long uid) {

        return profiles.findByUserId(uid)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Profile not created"
                        )
                );
    }


    // =========================================
    // SEARCH PROFILES / DISCOVER
    // =========================================
    //
    // IMPORTANT:
    //
    // Current logged-in user is EXCLUDED.
    //
    // Opposite-gender profiles are shown automatically.
    // MALE login   -> FEMALE profiles
    // FEMALE login -> MALE profiles
    // OTHER login  -> OTHER profiles
    //
    // Current logged-in user is excluded.
    // Only profileVisible = true profiles are shown.
    // are shown.
    //
    // =========================================

    public Page<Profile> search(
            Long uid,
            String city,
            String religion,
            String profession,
            String type,
            int page,
            int size
    ) {

        // Make sure logged-in user exists
        User currentUser = users.findById(uid)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        // =========================================
        // OPPOSITE GENDER
        // =========================================

        Gender oppositeGender;

        if (currentUser.getGender() == Gender.MALE) {
            oppositeGender = Gender.FEMALE;
        } else if (currentUser.getGender() == Gender.FEMALE) {
            oppositeGender = Gender.MALE;
        } else {
            oppositeGender = Gender.OTHER;
        }

        Pageable pageable = PageRequest.of(
                page,
                Math.min(size, 50)
        );

        city = blank(city);
        religion = blank(religion);
        profession = blank(profession);

        // =========================================
        // ACTIVE PROFILES
        // =========================================

        if ("active".equalsIgnoreCase(type)) {

            return profiles.searchActive(
                    uid,
                    oppositeGender,
                    city,
                    religion,
                    profession,
                    pageable
            );
        }

        // =========================================
        // NEW PROFILES
        // =========================================

        return profiles.searchNew(
                uid,
                oppositeGender,
                city,
                religion,
                profession,
                pageable
        );
    }


    // =========================================
    // BLANK FILTER HELPER
    // =========================================

    private String blank(String s) {

        return s == null || s.isBlank()
                ? null
                : s.trim();
    }


    // =========================================
    // PARTNER PREFERENCE
    // =========================================

    @Transactional
    public PartnerPreference savePreference(
            Long uid,
            PreferenceRequest r
    ) {

        User u = users.findById(uid)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        PartnerPreference p =
                prefs.findByUserId(uid)
                        .orElseGet(
                                PartnerPreference::new
                        );

        p.setUser(u);

        p.setMinAge(r.minAge());
        p.setMaxAge(r.maxAge());

        p.setPreferredGender(
                r.preferredGender()
        );

        p.setReligions(
                r.religions()
        );

        p.setCommunities(
                r.communities()
        );

        p.setCities(
                r.cities()
        );

        p.setEducation(
                r.education()
        );

        p.setProfession(
                r.profession()
        );

        p.setMaritalStatuses(
                r.maritalStatuses()
        );

        p.setFoodPreference(
                r.foodPreference()
        );

        p.setLifestyle(
                r.lifestyle()
        );

        p.setExpectations(
                r.expectations()
        );

        return prefs.save(p);
    }
    
 // =========================================
 // GET PROFILE BY GOSWAMI ID
 // =========================================

 public Profile getByGoswamiId(String goswamiId) {

     if (goswamiId == null || goswamiId.isBlank()) {
         throw new IllegalArgumentException(
                 "Goswami ID is required"
         );
     }

     String id = goswamiId.trim().toUpperCase();

     User user = users.findByGoswamiId(id)
             .orElseThrow(() ->
                     new IllegalArgumentException(
                             "No profile found for Goswami ID: " + id
                     )
             );

     Profile profile = profiles.findByUserId(user.getId())
             .orElseThrow(() ->
                     new IllegalArgumentException(
                             "Profile not created for Goswami ID: " + id
                     )
             );

     if (!profile.isProfileVisible()) {
         throw new IllegalArgumentException(
                 "This profile is currently not visible"
         );
     }

     return profile;
 }
 
 


    // =========================================
    // GET PARTNER PREFERENCEsss
    // =========================================

    public PartnerPreference getPreference(Long uid) {

        return prefs.findByUserId(uid)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Partner preference not created"
                        )
                );
    }
    
    @Transactional(readOnly = true)
    public PreferenceMatchResponse calculatePreferenceMatch(
            Long viewerUid,
            Long viewedUserId
    ) {

        Profile viewer = profiles.findByUserId(viewerUid)
                .orElseThrow(() ->
                        new IllegalArgumentException("Your profile not found")
                );

        Profile viewedProfile = profiles.findByUserId(viewedUserId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Viewed profile not found")
                );

        PartnerPreference preference =
                prefs.findByUserId(viewedUserId).orElse(null);

        java.util.List<PreferenceMatchDetail> details =
                new java.util.ArrayList<>();

        /*
         * 1. AGE
         */
        Integer viewerAge =
                calculateAge(viewer.getDateOfBirth());

        String agePreference =
                preference != null
                        ? buildAgePreference(
                                preference.getMinAge(),
                                preference.getMaxAge()
                        )
                        : "Not specified";

        boolean ageMatched =
                preference != null
                        && viewerAge != null
                        && preference.getMinAge() != null
                        && preference.getMaxAge() != null
                        && viewerAge >= preference.getMinAge()
                        && viewerAge <= preference.getMaxAge();

        details.add(
                new PreferenceMatchDetail(
                        "Age",
                        agePreference,
                        ageMatched
                )
        );


        /*
         * 2. PREFERRED GENDER
         */
        String viewerGender = null;

        if (viewer.getUser() != null &&
                viewer.getUser().getGender() != null) {

            viewerGender =
                    String.valueOf(viewer.getUser().getGender());
        }

        String genderPreference =
                preference != null
                        ? displayValue(preference.getPreferredGender())
                        : "Not specified";

        boolean genderMatched =
                preference != null &&
                matchesPreference(
                        viewerGender,
                        preference.getPreferredGender()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Preferred Gender",
                        genderPreference,
                        genderMatched
                )
        );


        /*
         * 3. MARITAL STATUS
         */
        String maritalPreference =
                preference != null
                        ? displayValue(preference.getMaritalStatuses())
                        : "Not specified";

        boolean maritalMatched =
                preference != null &&
                matchesPreference(
                        viewer.getMaritalStatus(),
                        preference.getMaritalStatuses()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Marital Status",
                        maritalPreference,
                        maritalMatched
                )
        );


        /*
         * 4. RELIGION
         */
        String religionPreference =
                preference != null
                        ? displayValue(preference.getReligions())
                        : "Not specified";

        boolean religionMatched =
                preference != null &&
                matchesPreference(
                        viewer.getReligion(),
                        preference.getReligions()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Religion",
                        religionPreference,
                        religionMatched
                )
        );


        /*
         * 5. COMMUNITY
         */
        String communityPreference =
                preference != null
                        ? displayValue(preference.getCommunities())
                        : "Not specified";

        boolean communityMatched =
                preference != null &&
                matchesPreference(
                        viewer.getCommunity(),
                        preference.getCommunities()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Community",
                        communityPreference,
                        communityMatched
                )
        );


        /*
         * 6. CITY
         */
        String cityPreference =
                preference != null
                        ? displayValue(preference.getCities())
                        : "Not specified";

        boolean cityMatched =
                preference != null &&
                matchesPreference(
                        viewer.getCity(),
                        preference.getCities()
                );

        details.add(
                new PreferenceMatchDetail(
                        "City",
                        cityPreference,
                        cityMatched
                )
        );


        /*
         * 7. EDUCATION
         */
        String educationPreference =
                preference != null
                        ? displayValue(preference.getEducation())
                        : "Not specified";

        boolean educationMatched =
                preference != null &&
                matchesPreference(
                        viewer.getEducation(),
                        preference.getEducation()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Education",
                        educationPreference,
                        educationMatched
                )
        );


        /*
         * 8. PROFESSION
         */
        String professionPreference =
                preference != null
                        ? displayValue(preference.getProfession())
                        : "Not specified";

        boolean professionMatched =
                preference != null &&
                matchesPreference(
                        viewer.getProfession(),
                        preference.getProfession()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Profession",
                        professionPreference,
                        professionMatched
                )
        );


        /*
         * 9. FOOD
         */
        String foodPreference =
                preference != null
                        ? displayValue(preference.getFoodPreference())
                        : "Not specified";

        boolean foodMatched =
                preference != null &&
                matchesPreference(
                        viewer.getFoodPreference(),
                        preference.getFoodPreference()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Food Preference",
                        foodPreference,
                        foodMatched
                )
        );


        /*
         * 10. LIFESTYLE
         */
        String lifestylePreference =
                preference != null
                        ? displayValue(preference.getLifestyle())
                        : "Not specified";

        boolean lifestyleMatched =
                preference != null &&
                matchesPreference(
                        viewer.getLifestyle(),
                        preference.getLifestyle()
                );

        details.add(
                new PreferenceMatchDetail(
                        "Lifestyle",
                        lifestylePreference,
                        lifestyleMatched
                )
        );


        int total = details.size();

        int matched = (int) details.stream()
                .filter(PreferenceMatchDetail::matched)
                .count();

        int percentage =
                total == 0
                        ? 0
                        : Math.round(
                                ((float) matched / total) * 100
                        );

        String message;

        if (percentage >= 80) {
            message = "Excellent Match";
        } else if (percentage >= 60) {
            message = "Very Good Match";
        } else if (percentage >= 40) {
            message = "Good Match";
        } else {
            message = "Some Preferences Match";
        }

        return new PreferenceMatchResponse(
                matched,
                total,
                percentage,
                message,
                details
        );
    }


    /*
     * AGE CALCULATION
     */
    private Integer calculateAge(
            java.time.LocalDate dateOfBirth
    ) {

        if (dateOfBirth == null) {
            return null;
        }

        return java.time.Period
                .between(
                        dateOfBirth,
                        java.time.LocalDate.now()
                )
                .getYears();
    }


    /*
     * AGE RANGE DISPLAY
     */
    private String buildAgePreference(
            Integer minAge,
            Integer maxAge
    ) {

        if (minAge == null && maxAge == null) {
            return "Not specified";
        }

        if (minAge == null) {
            return "Up to " + maxAge;
        }

        if (maxAge == null) {
            return minAge + "+";
        }

        return minAge + " to " + maxAge;
    }


    /*
     * NORMAL STRING DISPLAY
     */
    private String displayValue(String value) {

        if (value == null ||
                value.trim().isEmpty()) {

            return "Not specified";
        }

        return value.trim();
    }


    /*
     * GENERIC PREFERENCE MATCH
     */
    private boolean matchesPreference(
            String actualValue,
            String preferenceValue
    ) {

        if (actualValue == null ||
                actualValue.trim().isEmpty()) {

            return false;
        }

        if (preferenceValue == null ||
                preferenceValue.trim().isEmpty()) {

            return false;
        }

        String actual =
                actualValue.trim().toLowerCase();

        String preference =
                preferenceValue.trim().toLowerCase();

        /*
         * Open preference
         */
        if (preference.equals("any") ||
                preference.equals("all") ||
                preference.equals("open to all") ||
                preference.equals("doesn't matter") ||
                preference.equals("doesnt matter")) {

            return true;
        }

        /*
         * Multiple values separated by comma
         */
        String[] values =
                preference.split(",");

        for (String value : values) {

            String item =
                    value.trim().toLowerCase();

            if (item.isEmpty()) {
                continue;
            }

            if (actual.equals(item) ||
                    actual.contains(item) ||
                    item.contains(actual)) {

                return true;
            }
        }

        return false;
    }
    
    
}