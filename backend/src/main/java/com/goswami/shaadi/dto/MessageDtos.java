package com.goswami.shaadi.dto;
import jakarta.validation.constraints.NotBlank;
public class MessageDtos {
 public record SendMessageRequest(Long toUserId,@NotBlank String content){}
 public record ChatMessage(Long conversationId,Long senderId,Long receiverId,String content,String createdAt){}
}
