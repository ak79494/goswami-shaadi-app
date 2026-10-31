package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.PartnerPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface PartnerPreferenceRepository extends JpaRepository<PartnerPreference,Long>{ Optional<PartnerPreference> findByUserId(Long userId); }