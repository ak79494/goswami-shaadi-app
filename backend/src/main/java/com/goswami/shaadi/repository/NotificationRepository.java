package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface NotificationRepository extends JpaRepository<Notification,Long>{ List<Notification> findByUserIdOrderByCreatedAtDesc(Long id); long countByUserIdAndReadFalse(Long id); }