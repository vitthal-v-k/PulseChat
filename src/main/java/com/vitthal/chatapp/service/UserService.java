package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.request.ChangePasswordRequest;
import com.vitthal.chatapp.dto.request.UpdateProfileRequest;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {

    UserResponse getCurrentUserProfile(User currentUser);

    UserResponse getUserById(Long userId);

    UserResponse updateProfile(User currentUser, UpdateProfileRequest request);

    UserResponse uploadProfilePicture(User currentUser, MultipartFile file);

    void changePassword(User currentUser, ChangePasswordRequest request);

    Page<UserResponse> searchUsers(String query, User currentUser, Pageable pageable);

    void setUserOnlineStatus(User user, boolean isOnline);
}
