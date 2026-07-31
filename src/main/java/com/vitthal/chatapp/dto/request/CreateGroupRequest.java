package com.vitthal.chatapp.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * Request DTO for creating a new group chat.
 */
@Data
public class CreateGroupRequest {

    @NotBlank(message = "Group name is required")
    @Size(min = 2, max = 100, message = "Group name must be between 2 and 100 characters")
    private String name;

    @Size(max = 300, message = "Description must not exceed 300 characters")
    private String description;

    /** IDs of users to add as initial members (besides the creator) */
    @NotEmpty(message = "At least one member is required")
    private List<Long> memberIds;
}
