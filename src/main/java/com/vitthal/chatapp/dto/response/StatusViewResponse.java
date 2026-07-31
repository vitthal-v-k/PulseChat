package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a status view record.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusViewResponse {

    private Long id;
    private UserResponse viewer;
    private LocalDateTime viewedAt;
    private String replyText;
}
