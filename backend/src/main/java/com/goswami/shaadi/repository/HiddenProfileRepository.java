package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.HiddenProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface HiddenProfileRepository extends JpaRepository<HiddenProfile, Long> {
    Optional<HiddenProfile> findByUserIdAndHiddenUserId(Long userId, Long hiddenUserId);
    List<HiddenProfile> findByUserIdOrderByCreatedAtDesc(Long userId);
}
