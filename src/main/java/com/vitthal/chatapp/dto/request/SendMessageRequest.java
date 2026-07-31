package com.vitthal.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO for sending a chat message.
 */
@Data
public class SendMessageRequest {

    @NotNull(message = "Chat ID is required")
    private Long chatId;

    /** Text content (null for pure media messages) */
    private String content;

    /** Message type: TEXT, IMAGE, VIDEO, AUDIO, FILE */
    @NotBlank(message = "Message type is required")
    private String messageType;

    /** ID of the message being replied to (null if not a reply) */
    private Long replyToId;
}
