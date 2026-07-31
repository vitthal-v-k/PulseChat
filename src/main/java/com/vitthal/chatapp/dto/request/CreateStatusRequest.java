package com.vitthal.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for creating a new status/story post.
 */
@Data
public class CreateStatusRequest {

    @NotBlank(message = "Status type is required (IMAGE, VIDEO, TEXT)")
    private String type;

    /** Caption text or full text content (for TEXT type) */
    private String content;

    /** Background color for TEXT type (hex) */
    private String backgroundColor;

    /** Text color for TEXT type (hex) */
    private String textColor;

    /** Privacy type: EVERYONE, MY_CONTACTS, MY_CONTACTS_EXCEPT, ONLY_SHARE_WITH */
    private String privacyType;
}
