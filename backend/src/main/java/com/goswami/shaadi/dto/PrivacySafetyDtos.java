package com.goswami.shaadi.dto;

import java.time.LocalDateTime;

public final class PrivacySafetyDtos {
    private PrivacySafetyDtos() {}

    public record ProfileActionItem(Long targetUserId, LocalDateTime createdAt) {}

    public record BlockedMember(
            Long targetUserId,
            LocalDateTime createdAt,
            String name,
            String goswamiId,
            String photoUrl
    ) {}

    public record ReportItem(
            Long id,
            Long reportedUserId,
            String reason,
            String details,
            String evidencePath,
            LocalDateTime createdAt
    ) {}
}
