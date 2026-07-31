package com.vitthal.chatapp.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request DTO for updating a user's profile information.
 */
@Data
public class UpdateProfileRequest {

    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @Size(max = 100, message = "Full name must not exceed 100 characters")
    private String fullName;

    @Size(max = 200, message = "Bio must not exceed 200 characters")
    private String bio;

    // Privacy settings
    private String lastSeenPrivacy;
    private String profilePhotoPrivacy;
    private String groupAddPrivacy;
    private Boolean notificationEnabled;
}
