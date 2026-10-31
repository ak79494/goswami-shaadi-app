package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.ProfileReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProfileReportRepository extends JpaRepository<ProfileReport, Long> {
    List<ProfileReport> findByReporterIdOrderByCreatedAtDesc(Long reporterId);
}
