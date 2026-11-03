package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.Gender;
import com.goswami.shaadi.model.HiddenProfile;
import com.goswami.shaadi.model.Profile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProfileRepository extends JpaRepository<Profile, Long> {

    // Both searches leave out profiles the member declined in the last few days
    // (InteractionService.DECLINE_PAUSE_DAYS); after that they come back into their matches.
    // Blocking hides two members from each other, whichever of them did it.

    Optional<Profile> findByUserId(Long userId);

    @Query("""
            select p
            from Profile p
            where p.profileVisible = true
              and p.user.id <> :uid
              and p.user.gender = :gender
              and not exists (select h.id from HiddenProfile h where h.user.id = :uid and h.hiddenUser.id = p.user.id)
              and not exists (select b.id from Block b
                              where (b.user.id = :uid and b.blockedUser.id = p.user.id)
                                 or (b.user.id = p.user.id and b.blockedUser.id = :uid))
              and not exists (select r.id from InterestRequest r
                              where r.receiver.id = :uid and r.sender.id = p.user.id
                                and r.status = com.goswami.shaadi.model.RequestStatus.REJECTED
                                and r.respondedAt > :declinedSince)
              and (:city is null or lower(p.city) = lower(:city))
              and (:religion is null or lower(p.religion) = lower(:religion))
              and (:profession is null
                   or lower(p.profession) like lower(concat('%', :profession, '%')))
            order by p.user.createdAt desc
            """)
    Page<Profile> searchNew(
            @Param("uid") Long uid,
            @Param("gender") Gender gender,
            @Param("city") String city,
            @Param("religion") String religion,
            @Param("profession") String profession,
            @Param("declinedSince") java.time.LocalDateTime declinedSince,
            Pageable pageable
    );

    // ============================
    // ACTIVE PROFILES
    // ============================

    @Query("""
            select p
            from Profile p
            where p.profileVisible = true
              and p.user.id <> :uid
              and p.user.gender = :gender
              and not exists (select h.id from HiddenProfile h where h.user.id = :uid and h.hiddenUser.id = p.user.id)
              and not exists (select b.id from Block b
                              where (b.user.id = :uid and b.blockedUser.id = p.user.id)
                                 or (b.user.id = p.user.id and b.blockedUser.id = :uid))
              and not exists (select r.id from InterestRequest r
                              where r.receiver.id = :uid and r.sender.id = p.user.id
                                and r.status = com.goswami.shaadi.model.RequestStatus.REJECTED
                                and r.respondedAt > :declinedSince)
              and (:city is null or lower(p.city) = lower(:city))
              and (:religion is null or lower(p.religion) = lower(:religion))
              and (:profession is null
                   or lower(p.profession) like lower(concat('%', :profession, '%')))
            order by p.user.lastActiveAt desc
            """)
    Page<Profile> searchActive(
            @Param("uid") Long uid,
            @Param("gender") Gender gender,
            @Param("city") String city,
            @Param("religion") String religion,
            @Param("profession") String profession,
            @Param("declinedSince") java.time.LocalDateTime declinedSince,
            Pageable pageable
    );
}
