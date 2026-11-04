package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
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

    @Query("select distinct m.sender.id from Message m where m.deliveredAt is null and m.sender.id <> :uid "
            + "and (m.conversation.user1.id = :uid or m.conversation.user2.id = :uid)")
    List<Long> sendersWaitingOnDelivery(@Param("uid") Long uid);

    @Modifying
    @Query("update Message m set m.deliveredAt = :now where m.deliveredAt is null and m.sender.id <> :uid "
            + "and m.conversation.id in (select c.id from Conversation c where c.user1.id = :uid or c.user2.id = :uid)")
    int markDelivered(@Param("uid") Long uid, @Param("now") LocalDateTime now);

    @Modifying
    @Query("update Message m set m.replyToText = :text where m.replyToId = :id")
    int updateQuotes(@Param("id") Long id, @Param("text") String text);
}