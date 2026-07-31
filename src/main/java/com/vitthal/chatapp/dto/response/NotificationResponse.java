package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for an in-app notification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private UserResponse actor;
    private String type;
    private String title;
    private String body;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
