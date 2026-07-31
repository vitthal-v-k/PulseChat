package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing a user's public profile and optional friendship relationship.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String username;
    private String uniqueNumber;
    private String email;
    private String fullName;
    private String bio;
    private String profilePicture;
    private Boolean isOnline;
    private LocalDateTime lastSeen;
    private String role;
    private Boolean isEmailVerified;
    private String lastSeenPrivacy;
    private String profilePhotoPrivacy;
    private LocalDateTime createdAt;

    /** Relationship status relative to requesting user: NONE, FRIEND, PENDING_SENT, PENDING_RECEIVED */
    private String friendshipStatus;

    /** Pending request ID if PENDING_RECEIVED */
    private Long requestId;
}
