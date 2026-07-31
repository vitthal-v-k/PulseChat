package com.vitthal.chatapp.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for a status emoji reaction.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatusReactionResponse {

    private Long id;
    private UserResponse reactor;
    private String emoji;
    private LocalDateTime reactedAt;
}
