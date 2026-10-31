package com.goswami.shaadi.controller;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.*;
import java.util.*;

@RestController @RequestMapping("/api/photos")
public class PhotoController {
 private final ProfilePhotoRepository photos; private final UserRepository users;
 private final Path uploadDir;
 public PhotoController(ProfilePhotoRepository p,UserRepository u,@Value("${app.upload-dir}")String dir){photos=p;users=u;uploadDir = Paths.get(dir).toAbsolutePath().normalize();}
 private Long uid(Authentication a){return (Long)a.getPrincipal();}
 @GetMapping public List<ProfilePhoto> list(Authentication a){return photos.findByUserIdOrderBySortOrderAsc(uid(a));}
 @GetMapping("/user/{userId}")
 public List<ProfilePhoto> listUserPhotos(@PathVariable Long userId) {
     return photos.findByUserIdOrderBySortOrderAsc(userId);
 }
 @PostMapping(consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 public ProfilePhoto upload(Authentication a,@RequestPart("file") MultipartFile file) throws Exception {
   Long uid=uid(a); if(photos.countByUserId(uid)>=10) throw new IllegalArgumentException("Maximum 10 photos allowed");
   if(file.isEmpty() || file.getContentType()==null || !file.getContentType().startsWith("image/")) throw new IllegalArgumentException("Only image files are allowed");
   Files.createDirectories(uploadDir);
   String safe=UUID.randomUUID()+"-"+Objects.requireNonNull(file.getOriginalFilename()).replaceAll("[^a-zA-Z0-9._-]","_");
   Files.copy(file.getInputStream(),uploadDir.resolve(safe),StandardCopyOption.REPLACE_EXISTING);
   ProfilePhoto p=new ProfilePhoto();p.setUser(users.findById(uid).orElseThrow());p.setFileName(safe);p.setUrl("/uploads/"+safe);p.setSortOrder((int)photos.countByUserId(uid));p.setPrimaryPhoto(p.getSortOrder()==0);return photos.save(p);
 }
 @DeleteMapping("/{id}") public void delete(Authentication a,@PathVariable Long id) throws Exception {ProfilePhoto p=photos.findById(id).orElseThrow();if(!p.getUser().getId().equals(uid(a)))throw new IllegalArgumentException("Not allowed");Files.deleteIfExists(uploadDir.resolve(p.getFileName()));photos.delete(p);}
 @PatchMapping("/{id}/primary") public void primary(Authentication a,@PathVariable Long id){List<ProfilePhoto> all=photos.findByUserIdOrderBySortOrderAsc(uid(a));for(ProfilePhoto p:all)p.setPrimaryPhoto(p.getId().equals(id));photos.saveAll(all);}
}
