package com.goswami.shaadi.controller;

import com.goswami.shaadi.dto.ProfileDtos.*;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.service.ProfileService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    private final ProfileService s;

    public ProfileController(ProfileService s) {
        this.s = s;
    }


    private Long uid(Authentication a) {

        return (Long) a.getPrincipal();
    }


    // =========================================
    // MY PROFILE
    // =========================================

    @GetMapping("/me")
    public Profile me(Authentication a) {

        return s.get(uid(a));
    }


    // =========================================
    // SAVE PROFILE
    // =========================================

    @PutMapping("/me")
    public Profile save(
            Authentication a,
            @Valid @RequestBody ProfileRequest r
    ) {

        return s.save(uid(a), r);
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
            @PathVariable Long id
    ) {

        return s.get(id);
    }


    @GetMapping("/user/{userId}")
    public Profile byUser(
            @PathVariable Long userId
    ) {

        return s.get(userId);
    }
    
    
 // =========================================
 // SEARCH PROFILE BY GOSWAMI ID
 // =========================================

 @GetMapping("/goswami/{goswamiId}")
 public Profile getByGoswamiId(
         @PathVariable String goswamiId
 ) {
     return s.getByGoswamiId(goswamiId);
 }
}