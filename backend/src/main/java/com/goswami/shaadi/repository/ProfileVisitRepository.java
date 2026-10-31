package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.ProfileVisit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileVisitRepository extends JpaRepository<ProfileVisit, Long> {

    List<ProfileVisit> findByProfileUserIdOrderByVisitedAtDesc(Long profileUserId);

    long countByProfileUserId(Long profileUserId);
}
