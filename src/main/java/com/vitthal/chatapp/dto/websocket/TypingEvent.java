package com.vitthal.chatapp.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * WebSocket DTO for broadcasting typing indicator events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TypingEvent {

    private Long chatId;
    private Long userId;
    private String username;
    private boolean isTyping;
}
