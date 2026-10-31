package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository
        extends JpaRepository<Message, Long> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId);

    List<Message> findByConversationIdAndSenderIdAndReadFalse(
            Long conversationId,
            Long senderId
    );

    long countByConversationIdAndSenderIdAndReadFalse(
            Long conversationId,
            Long senderId
    );
}