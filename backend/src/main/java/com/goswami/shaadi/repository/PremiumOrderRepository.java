package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.PremiumOrder;
import com.goswami.shaadi.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PremiumOrderRepository extends JpaRepository<PremiumOrder, Long> {
    Optional<PremiumOrder> findByIdAndUserId(Long id, Long userId);
    boolean existsByTransactionId(String transactionId);
    Optional<PremiumOrder> findTopByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PaymentStatus status);
    Optional<PremiumOrder> findTopByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, java.util.Collection<PaymentStatus> statuses);
    java.util.List<PremiumOrder> findByStatusOrderByCreatedAtAsc(PaymentStatus status);
    java.util.List<PremiumOrder> findTop50ByStatusInOrderByCreatedAtDesc(java.util.Collection<PaymentStatus> statuses);
}
