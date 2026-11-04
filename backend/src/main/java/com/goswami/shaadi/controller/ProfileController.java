package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.ProfileDtos.*;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.service.ContactService;
import com.goswami.shaadi.service.ProfileService;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService s;
    private final ContactService contacts;

    public ProfileController(ProfileService s, ContactService contacts) {
        this.s = s;
        this.contacts = contacts;
    }


    private Long uid(Authentication a) {

        return (Long) a.getPrincipal();
    }


    // =========================================
    // MY PROFILE
    // =========================================

    @GetMapping("/me")
    public ObjectNode me(Authentication a) {

        return s.ownerView(s.get(uid(a)));
    }


    // =========================================
    // SAVE PROFILE
    // =========================================

    @PutMapping("/me")
    public ObjectNode save(
            Authentication a,
            @Valid @RequestBody ProfileRequest r
    ) {

        return s.ownerView(s.save(uid(a), r));
    }


    // =========================================
    // INTERESTS & HOBBIES
    // =========================================

    @GetMapping("/me/hobbies")
    public java.util.List<String> hobbies(Authentication a) {
        return s.getHobbies(uid(a));
    }

    @PutMapping("/me/hobbies")
    public Profile saveHobbies(
            Authentication a,
            @RequestBody HobbiesRequest request
    ) {
        return s.saveHobbies(uid(a), request);
    }


    // =========================================
    // DISCOVER / SEARCH
    // =========================================

    @GetMapping("/search")
    public Page<Profile> search(

            Authentication a,

            @RequestParam(required = false)
            String city,

            @RequestParam(required = false)
            String religion,

            @RequestParam(required = false)
            String profession,

            @RequestParam(defaultValue = "new")
            String type,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "12")
            int size

    ) {

        return s.search(
                uid(a),
                city,
                religion,
                profession,
                type,
                page,
                size
        );
    }


    // =========================================
    // VIEW PROFILE
    // =========================================

    @GetMapping("/{id}")
    public Profile byId(
            Authentication a,
            @PathVariable Long id
    ) {

        s.checkNotBlockedBy(id, uid(a));
        return s.get(id);
    }


    @GetMapping("/user/{userId}")
    public Profile byUser(
            Authentication a,
            @PathVariable Long userId
    ) {

        s.checkNotBlockedBy(userId, uid(a));
        return s.get(userId);
    }


    // =========================================
    // CONTACT NUMBERS (premium members only)
    // =========================================

    @GetMapping("/user/{userId}/contact")
    public ContactResponse contact(
            Authentication a,
            @PathVariable Long userId
    ) {

        return contacts.contact(uid(a), userId);
    }
    
    
 // =========================================
 // SEARCH PROFILE BY GOSWAMI ID
 // =========================================

 @GetMapping("/goswami/{goswamiId}")
 public Profile getByGoswamiId(
         Authentication a,
         @PathVariable String goswamiId
 ) {
     Profile profile = s.getByGoswamiId(goswamiId);
     s.checkNotBlockedBy(profile.getUser().getId(), uid(a));
     return profile;
 }
}