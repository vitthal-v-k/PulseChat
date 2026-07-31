package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a chat conversation (sidebar item + full chat info).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {

    private Long id;
    private String type;
    private String name;
    private String description;
    private String groupPicture;
    private UserResponse createdBy;

    // For private chats — the other participant
    private UserResponse otherParticipant;

    // Last message preview for sidebar
    private MessageResponse lastMessage;

    // Per-user state
    private Boolean isPinned;
    private Boolean isArchived;
    private Boolean isMuted;
    private Boolean isMarkedUnread;
    private Integer unreadCount;

    private List<UserResponse> members;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
