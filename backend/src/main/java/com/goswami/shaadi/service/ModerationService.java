package com.goswami.shaadi.service;

import com.goswami.shaadi.model.ProfileReport;
import com.goswami.shaadi.model.User;
import com.goswami.shaadi.repository.DeviceTokenRepository;
import com.goswami.shaadi.repository.ProfileReportRepository;
import com.goswami.shaadi.repository.ProfileRepository;
import com.goswami.shaadi.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/** Lets the team act on reported members: Google requires ongoing moderation, not just a report button. */
@Service
public class ModerationService {

    public static final String OPEN = "OPEN";
    public static final String DISMISSED = "DISMISSED";
    public static final String SUSPENDED = "SUSPENDED";

    public record ReportView(Long id, Long reportedUserId, String reportedName, String reportedGoswamiId, boolean reportedEnabled,
                             String reporterName, String reporterGoswamiId, String reason, String details, String evidencePath,
                             String status, LocalDateTime createdAt) {}

    private final ProfileReportRepository reports;
    private final UserRepository users;
    private final ProfileRepository profiles;
    private final DeviceTokenRepository devices;

    public ModerationService(ProfileReportRepository reports, UserRepository users, ProfileRepository profiles, DeviceTokenRepository devices) {
        this.reports = reports;
        this.users = users;
        this.profiles = profiles;
        this.devices = devices;
    }

    @Transactional(readOnly = true)
    public List<ReportView> recent() {
        return reports.findTop100ByOrderByCreatedAtDesc().stream().map(this::view).toList();
    }

    @Transactional
    public ReportView dismiss(Long reportId) {
        ProfileReport report = report(reportId);
        report.setStatus(DISMISSED);
        report.setReviewedAt(LocalDateTime.now());
        return view(reports.save(report));
    }

    /** Suspends the reported member, which signs them out and hides them, and closes every open report about them. */
    @Transactional
    public ReportView suspend(Long reportId) {
        ProfileReport report = report(reportId);
        User member = report.getReportedUser();
        member.setEnabled(false);
        users.save(member);
        devices.removeAllOf(member.getId());
        for (ProfileReport r : reports.findByReportedUserId(member.getId())) {
            if (isOpen(r)) {
                r.setStatus(SUSPENDED);
                r.setReviewedAt(LocalDateTime.now());
            }
        }
        return view(report);
    }

    @Transactional
    public ReportView restore(Long reportId) {
        ProfileReport report = report(reportId);
        report.getReportedUser().setEnabled(true);
        users.save(report.getReportedUser());
        return view(report);
    }

    private boolean isOpen(ProfileReport r) {
        return r.getStatus() == null || OPEN.equals(r.getStatus());
    }

    private ProfileReport report(Long id) {
        return reports.findById(id).orElseThrow(() -> new IllegalArgumentException("Report not found"));
    }

    private ReportView view(ProfileReport r) {
        User reported = r.getReportedUser();
        User reporter = r.getReporter();
        return new ReportView(r.getId(), reported.getId(), label(reported), reported.getGoswamiId(), reported.isEnabled(),
            label(reporter), reporter.getGoswamiId(), r.getReason(), r.getDetails(), r.getEvidencePath(),
            isOpen(r) ? OPEN : r.getStatus(), r.getCreatedAt());
    }

    private String label(User u) {
        return profiles.findByUserId(u.getId())
            .map(p -> p.getLastName() == null ? p.getFirstName() : p.getFirstName() + " " + p.getLastName())
            .orElse(u.getGoswamiId());
    }
}
