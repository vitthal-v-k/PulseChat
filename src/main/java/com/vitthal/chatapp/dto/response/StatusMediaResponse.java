package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a status media item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusMediaResponse {

    private Long id;
    private String mediaUrl;
    private String mediaType;
    private Integer duration;
    private String thumbnailUrl;
    private Integer displayOrder;
}
