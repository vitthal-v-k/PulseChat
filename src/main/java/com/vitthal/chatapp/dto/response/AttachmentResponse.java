package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for a file attachment.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {

    private Long id;
    private String type;
    private String url;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private Integer duration;
    private String thumbnailUrl;
    private Integer width;
    private Integer height;
}
