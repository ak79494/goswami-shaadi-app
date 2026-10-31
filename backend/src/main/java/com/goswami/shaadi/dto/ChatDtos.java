package com.goswami.shaadi.dto;

public class ChatDtos {

    public record ConversationSummary(
            Long userId,
            String name,
            String goswamiId,
            String lastMessage,
            String lastMessageTime,
            long unreadCount,
            String photoUrl,
            boolean online,
            String lastActiveAt
    ) {}
}
