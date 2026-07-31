package com.vitthal.chatapp.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WebSocket DTO for broadcasting user online/offline status changes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OnlineStatusEvent {

    private Long userId;
    private String username;
    private boolean isOnline;
    private LocalDateTime lastSeen;
}
