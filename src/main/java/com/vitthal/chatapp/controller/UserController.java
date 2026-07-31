package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.request.ChangePasswordRequest;
import com.vitthal.chatapp.dto.request.UpdateProfileRequest;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Endpoints for profile management, search, and user settings")
public class UserController {

    private final UserService userService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.getCurrentUserProfile(currentUser));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Get public profile of a user by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getUserById(userId));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile information")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.updateProfile(currentUser, request));
    }

    @PostMapping(value = "/profile-picture", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload or update profile picture via Cloudinary")
    public ResponseEntity<UserResponse> uploadProfilePicture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(userService.uploadProfilePicture(currentUser, file));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password for authenticated user")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        userService.changePassword(currentUser, request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully!"));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by username or full name")
    public ResponseEntity<Page<UserResponse>> searchUsers(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("query") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(userService.searchUsers(query, currentUser, pageable));
    }
}
