package com.vitthal.chatapp.mapper;

import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        if (user == null) return null;

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .uniqueNumber(user.getUniqueNumber())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .bio(user.getBio())
                .profilePicture(user.getProfilePicture())
                .isOnline(user.getIsOnline())
                .lastSeen(user.getLastSeen())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .isEmailVerified(user.getIsEmailVerified())
                .lastSeenPrivacy(user.getLastSeenPrivacy())
                .profilePhotoPrivacy(user.getProfilePhotoPrivacy())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
