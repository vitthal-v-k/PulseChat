package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a group chat member, including their admin status.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMemberResponse {

    private Long id;
    private String username;
    private String uniqueNumber;
    private String fullName;
    private String profilePicture;
    private Boolean isOnline;
    private String friendshipStatus;

    /** True if this member is a group admin */
    private Boolean isAdmin;
}
