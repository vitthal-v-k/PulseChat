package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a friend request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestResponse {

    private Long id;
    private UserResponse sender;
    private UserResponse receiver;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime respondedAt;
}
