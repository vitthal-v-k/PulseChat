package com.vitthal.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for editing an existing message.
 */
@Data
public class EditMessageRequest {

    @NotNull(message = "Message ID is required")
    private Long messageId;

    @NotBlank(message = "New content is required")
    private String newContent;
}
