package com.goswami.shaadi.controller;
import com.goswami.shaadi.model.Notification;
import com.goswami.shaadi.repository.NotificationRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController @RequestMapping("/api/notifications")
public class NotificationController {
 private final NotificationRepository n; public NotificationController(NotificationRepository n){this.n=n;}
 private Long uid(Authentication a){return (Long)a.getPrincipal();}
 @GetMapping public List<Notification> list(Authentication a){return n.findByUserIdOrderByCreatedAtDesc(uid(a));}
 @GetMapping("/unread-count") public long count(Authentication a){return n.countByUserIdAndReadFalse(uid(a));}
 @PatchMapping("/{id}/read") public void read(Authentication a,@PathVariable Long id){Notification x=n.findById(id).orElseThrow();if(!x.getUser().getId().equals(uid(a)))throw new IllegalArgumentException("Not allowed");x.setRead(true);n.save(x);}
}
