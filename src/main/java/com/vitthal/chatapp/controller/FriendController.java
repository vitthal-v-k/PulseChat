package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.response.FriendRequestResponse;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.FriendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@Tag(name = "Friends", description = "Endpoints for friend requests, friendship management, and block lists")
public class FriendController {

    private final FriendService friendService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping("/request/{receiverId}")
    @Operation(summary = "Send a friend request")
    public ResponseEntity<FriendRequestResponse> sendFriendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long receiverId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(friendService.sendFriendRequest(currentUser, receiverId));
    }

    @PostMapping("/accept/{requestId}")
    @Operation(summary = "Accept an incoming friend request")
    public ResponseEntity<FriendRequestResponse> acceptFriendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long requestId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(friendService.acceptFriendRequest(currentUser, requestId));
    }

    @PostMapping("/reject/{requestId}")
    @Operation(summary = "Reject an incoming friend request")
    public ResponseEntity<FriendRequestResponse> rejectFriendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long requestId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(friendService.rejectFriendRequest(currentUser, requestId));
    }

    @DeleteMapping("/cancel/{requestId}")
    @Operation(summary = "Cancel a sent friend request")
    public ResponseEntity<Map<String, String>> cancelFriendRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long requestId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        friendService.cancelFriendRequest(currentUser, requestId);
        return ResponseEntity.ok(Map.of("message", "Friend request cancelled"));
    }

    @DeleteMapping("/remove/{friendId}")
    @Operation(summary = "Remove a friend")
    public ResponseEntity<Map<String, String>> removeFriend(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long friendId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        friendService.removeFriend(currentUser, friendId);
        return ResponseEntity.ok(Map.of("message", "Friend removed successfully"));
    }

    @PostMapping("/block/{targetUserId}")
    @Operation(summary = "Block a user")
    public ResponseEntity<Map<String, String>> blockUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long targetUserId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        friendService.blockUser(currentUser, targetUserId);
        return ResponseEntity.ok(Map.of("message", "User blocked successfully"));
    }

    @PostMapping("/unblock/{targetUserId}")
    @Operation(summary = "Unblock a user")
    public ResponseEntity<Map<String, String>> unblockUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long targetUserId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        friendService.unblockUser(currentUser, targetUserId);
        return ResponseEntity.ok(Map.of("message", "User unblocked successfully"));
    }

    @GetMapping
    @Operation(summary = "Get paginated friend list")
    public ResponseEntity<Page<UserResponse>> getFriends(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(friendService.getFriends(currentUser, pageable));
    }

    @GetMapping("/requests/received")
    @Operation(summary = "Get list of pending received friend requests")
    public ResponseEntity<List<FriendRequestResponse>> getPendingReceivedRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(friendService.getPendingReceivedRequests(currentUser));
    }

    @GetMapping("/requests/sent")
    @Operation(summary = "Get list of pending sent friend requests")
    public ResponseEntity<List<FriendRequestResponse>> getPendingSentRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(friendService.getPendingSentRequests(currentUser));
    }
}
