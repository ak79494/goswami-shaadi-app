package com.goswami.shaadi.service;

import com.goswami.shaadi.dto.ProfileDtos.ContactResponse;
import com.goswami.shaadi.model.*;
import com.goswami.shaadi.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.goswami.shaadi.dto.ProfileDtos.CONTACT_CONNECTED;
import static com.goswami.shaadi.dto.ProfileDtos.CONTACT_HIDDEN;

/**
 * Decides whether one member may see another member's mobile (also their WhatsApp) number.
 * Only active premium members can, and only when the other member's privacy setting allows it.
 */
@Service
public class ContactService {

    private final UserRepository users;
    private final ProfileRepository profiles;
    private final BlockRepository blocks;
    private final InterestRequestRepository requests;
    private final PremiumService premium;

    public ContactService(
            UserRepository users,
            ProfileRepository profiles,
            BlockRepository blocks,
            InterestRequestRepository requests,
            PremiumService premium
    ) {
        this.users = users;
        this.profiles = profiles;
        this.blocks = blocks;
        this.requests = requests;
        this.premium = premium;
    }

    @Transactional(readOnly = true)
    public ContactResponse contact(Long viewerId, Long targetUserId) {
        User target = users.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        Profile profile = profiles.findByUserId(targetUserId).orElse(null);

        String phone = profile != null && profile.getMobileNumber() != null
                ? profile.getMobileNumber()
                : target.getPhone();
        // One number per member: the same number is used for calls and WhatsApp.
        String whatsapp = phone;

        if (viewerId.equals(targetUserId)) {
            return new ContactResponse(true, null, phone, whatsapp);
        }
        if (blocks.findByUserIdAndBlockedUserId(viewerId, targetUserId).isPresent()
                || blocks.findByUserIdAndBlockedUserId(targetUserId, viewerId).isPresent()) {
            return locked("BLOCKED");
        }

        // No setting yet (profiles saved before it existed) means the default: all premium members.
        String option = profile == null ? null : profile.getContactDisplayOption();
        if (CONTACT_HIDDEN.equals(option)) {
            return locked("HIDDEN");
        }

        User viewer = users.findById(viewerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!premium.isActive(viewer)) {
            return locked("PREMIUM_REQUIRED");
        }
        if (CONTACT_CONNECTED.equals(option) && !accepted(viewerId, targetUserId)) {
            return locked("CONNECT_FIRST");
        }
        if (phone == null || phone.isBlank()) {
            return locked("NO_NUMBER");
        }
        return new ContactResponse(true, null, phone, whatsapp);
    }

    private boolean accepted(Long a, Long b) {
        return requests.findBySenderIdAndReceiverId(a, b)
                .map(r -> r.getStatus() == RequestStatus.ACCEPTED).orElse(false)
                || requests.findBySenderIdAndReceiverId(b, a)
                .map(r -> r.getStatus() == RequestStatus.ACCEPTED).orElse(false);
    }

    private ContactResponse locked(String reason) {
        return new ContactResponse(false, reason, null, null);
    }
}
