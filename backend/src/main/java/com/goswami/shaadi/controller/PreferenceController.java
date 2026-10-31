package com.goswami.shaadi.controller;
import com.goswami.shaadi.dto.ProfileDtos.*;
import com.goswami.shaadi.model.PartnerPreference;
import com.goswami.shaadi.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController @RequestMapping("/api/preferences")
public class PreferenceController {
 private final ProfileService s; public PreferenceController(ProfileService s){this.s=s;}
 private Long uid(Authentication a){return (Long)a.getPrincipal();}
 @GetMapping public PartnerPreference get(Authentication a){return s.getPreference(uid(a));}
 @PutMapping public PartnerPreference save(Authentication a,@Valid @RequestBody PreferenceRequest r){return s.savePreference(uid(a),r);}
 
 @GetMapping("/match/{userId}")
 public PreferenceMatchResponse match(
         Authentication a,
         @PathVariable Long userId
 ) {
     return s.calculatePreferenceMatch(
             uid(a),
             userId
     );
 }
}
