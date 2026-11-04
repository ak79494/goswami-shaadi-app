package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.ProfileDtos.*;
import static com.goswami.shaadi.dto.ProfileDtos.*;
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
    private final BlockRepository blocks;
    private final com.fasterxml.jackson.databind.ObjectMapper mapper;

    public ProfileService(
            ProfileRepository p,
            UserRepository u,
            PartnerPreferenceRepository pr,
            BlockRepository b,
            com.fasterxml.jackson.databind.ObjectMapper mapper
    ) {
        profiles = p;
        users = u;
        prefs = pr;
        blocks = b;
        this.mapper = mapper;
    }

    /**
     * The member's own profile, including the private fields that are hidden from everyone else
     * (login email, registered phone, mobile and WhatsApp numbers).
     */
    public com.fasterxml.jackson.databind.node.ObjectNode ownerView(Profile p) {
        com.fasterxml.jackson.databind.node.ObjectNode node = mapper.valueToTree(p);
        node.put("mobileNumber", p.getMobileNumber());
        node.put("whatsappNumber", p.getWhatsappNumber());
        com.fasterxml.jackson.databind.node.ObjectNode user = (com.fasterxml.jackson.databind.node.ObjectNode) node.get("user");
        if (user != null && p.getUser() != null) {
            user.put("email", p.getUser().getEmail());
            user.put("phone", p.getUser().getPhone());
        }
        return node;
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
        // Older clients don't send the contact fields; keep what is stored instead of wiping it.
        if (r.mobileNumber() != null) {
            p.setMobileNumber(digitsOrNull(r.mobileNumber()));
        }
        if (r.whatsappNumber() != null) {
            p.setWhatsappNumber(digitsOrNull(r.whatsappNumber()));
        }

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
        

        // Contact visibility. contactDisplayOption is the setting the apps use; contactVisible is
        // kept in step with it for older clients.
        if (r.contactDisplayOption() != null) {
            String option = switch (r.contactDisplayOption().trim().toUpperCase()) {
                case CONTACT_CONNECTED -> CONTACT_CONNECTED;
                case CONTACT_HIDDEN -> CONTACT_HIDDEN;
                default -> CONTACT_PREMIUM;
            };
            p.setContactDisplayOption(option);
            p.setContactVisible(!CONTACT_HIDDEN.equals(option));
        } else if (r.contactVisible() != null && r.contactVisible() != p.isContactVisible()) {
            // Only an actual flip of the old on/off switch counts: every profile created before
            // contactDisplayOption existed still carries contactVisible=false by default.
            p.setContactVisible(r.contactVisible());
            p.setContactDisplayOption(r.contactVisible() ? CONTACT_PREMIUM : CONTACT_HIDDEN);
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

    /** Someone who blocked you can't be opened by you, however you try to reach their profile. */
    public void checkNotBlockedBy(Long owner, Long viewer) {
        if (!users.existsByIdAndEnabledTrue(owner) || blocks.findByUserIdAndBlockedUserId(owner, viewer).isPresent()) {
            throw new IllegalArgumentException("This profile is not available");
        }
    }

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
        java.time.LocalDateTime declinedSince =
                java.time.LocalDateTime.now().minusDays(InteractionService.DECLINE_PAUSE_DAYS);

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
                    declinedSince,
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
                declinedSince,
                pageable
        );
    }


    // =========================================
    // BLANK FILTER HELPER
    // =========================================

    private String digitsOrNull(String s) {
        String digits = s.replaceAll("[^0-9]", "");
        if (digits.length() == 12 && digits.startsWith("91")) {
            digits = digits.substring(2);
        }
        if (digits.isEmpty()) {
            return null;
        }
        if (digits.length() != 10) {
            throw new IllegalArgumentException("Enter a valid 10-digit mobile number");
        }
        return digits;
    }

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
     // Old biodatas still show the GS IDs used under the previous name.
     if (id.startsWith("GS")) id = "GJ" + id.substring(2);
     final String memberId = id;

     User user = users.findByGoswamiId(memberId)
             .orElseThrow(() ->
                     new IllegalArgumentException(
                             "No profile found for Goswami ID: " + memberId
                     )
             );

     Profile profile = profiles.findByUserId(user.getId())
             .orElseThrow(() ->
                     new IllegalArgumentException(
                             "Profile not created for Goswami ID: " + memberId
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


    @Transactional(readOnly = true)
    public CompatibilityResponse compatibility(Long viewerUid, Long otherUid) {
        Profile viewer = get(viewerUid);
        Profile other = profiles.findByUserId(otherUid)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found"));

        PreferenceSide theirs = preferenceSide(viewer, prefs.findByUserId(otherUid).orElse(null));
        PreferenceSide mine = preferenceSide(other, prefs.findByUserId(viewerUid).orElse(null));

        int total = theirs.total() + mine.total();
        Integer percentage = total == 0
                ? null
                : Math.round(100f * (theirs.matched() + mine.matched()) / total);
        return new CompatibilityResponse(percentage, theirs, mine);
    }

    /** Checks a candidate's profile against each preference that was actually set. */
    private PreferenceSide preferenceSide(Profile candidate, PartnerPreference pref) {
        java.util.List<PreferenceMatchDetail> details = new java.util.ArrayList<>();
        if (pref != null) {
            if (pref.getMinAge() != null || pref.getMaxAge() != null) {
                Integer age = calculateAge(candidate.getDateOfBirth());
                boolean ok = age != null
                        && (pref.getMinAge() == null || age >= pref.getMinAge())
                        && (pref.getMaxAge() == null || age <= pref.getMaxAge());
                details.add(new PreferenceMatchDetail(
                        "Age", buildAgePreference(pref.getMinAge(), pref.getMaxAge()) + " years", ok));
            }
            addIfSet(details, "Marital status", pref.getMaritalStatuses(), candidate.getMaritalStatus());
            addIfSet(details, "Religion", pref.getReligions(), candidate.getReligion());
            addIfSet(details, "Community", pref.getCommunities(), candidate.getCommunity());
            addIfSet(details, "City", pref.getCities(), candidate.getCity());
            addIfSet(details, "Education", pref.getEducation(), candidate.getEducation());
            addIfSet(details, "Profession", pref.getProfession(), candidate.getProfession());
            addIfSet(details, "Diet", pref.getFoodPreference(), candidate.getFoodPreference());
            addIfSet(details, "Lifestyle", pref.getLifestyle(), candidate.getLifestyle());
        }
        int matched = (int) details.stream().filter(PreferenceMatchDetail::matched).count();
        return new PreferenceSide(matched, details.size(), details);
    }

    private void addIfSet(
            java.util.List<PreferenceMatchDetail> details,
            String label,
            String preference,
            String actual
    ) {
        if (preference == null || preference.isBlank()) return;
        details.add(new PreferenceMatchDetail(label, preference.trim(), matchesPreference(actual, preference)));
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