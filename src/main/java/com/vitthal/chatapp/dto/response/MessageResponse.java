package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a chat message.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long chatId;
    private UserResponse sender;
    private String content;
    private String messageType;
    private String status;

    // Reply
    private Long replyToId;
    private String replyToContent;
    private String replyToSenderName;

    // Forward
    private Long forwardedFromId;

    // Attachments
    private List<AttachmentResponse> attachments;

    // State
    private Boolean isEdited;
    private Boolean isDeletedForEveryone;
    private Boolean isStarred;
    private String reactions;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
