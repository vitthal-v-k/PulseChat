package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for a status/story post.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusResponse {

    private Long id;
    private UserResponse user;
    private String type;
    private String content;
    private String backgroundColor;
    private String textColor;
    private String privacyType;
    private Integer viewCount;
    private Boolean isViewed;           // Has the current user viewed this status?
    private List<StatusMediaResponse> mediaItems;
    private List<StatusViewResponse> viewers;
    private List<StatusReactionResponse> reactions;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
