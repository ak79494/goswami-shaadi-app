package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.InterestRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterestRequestRepository
        extends JpaRepository<InterestRequest, Long> {

    Optional<InterestRequest> findBySenderIdAndReceiverId(
            Long senderId,
            Long receiverId
    );

    List<InterestRequest> findByReceiverIdOrderByCreatedAtDesc(
            Long receiverId
    );

    List<InterestRequest> findBySenderIdOrderByCreatedAtDesc(
            Long senderId
    );
}