package com.goswami.shaadi.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import java.util.List;
public class MessageDtos {
 public record SendMessageRequest(Long toUserId,@NotBlank @Size(max=4000) String content,Long replyToId){}
 public record DeleteMessagesRequest(@NotEmpty @Size(max=200) List<Long> ids,boolean forEveryone){}
 public record ChatMessage(Long conversationId,Long senderId,Long receiverId,String content,String createdAt){}
}
