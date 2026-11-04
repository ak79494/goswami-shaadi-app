package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.HelpRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HelpRequestRepository extends JpaRepository<HelpRequest, Long> {
    List<HelpRequest> findTop100ByOrderByCreatedAtDesc();
}
