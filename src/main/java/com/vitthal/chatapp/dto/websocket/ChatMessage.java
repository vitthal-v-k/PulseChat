package com.vitthal.chatapp.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket DTO for real-time chat messages sent/received via STOMP.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    private Long id;
    private Long chatId;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private String content;
    private String messageType;
    private String status;

    // Reply
    private Long replyToId;
    private String replyToContent;

    // Forwarded
    private Long forwardedFromId;

    private String reactions;
    private Boolean isEdited;

    private LocalDateTime createdAt;
}
