package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.request.CreateGroupRequest;
import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Endpoints for creating and managing group chats and group members")
public class GroupController {

    private final GroupService groupService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Create a new group chat with optional avatar")
    public ResponseEntity<ChatResponse> createGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestPart("data") CreateGroupRequest request,
            @RequestPart(value = "groupPicture", required = false) MultipartFile groupPicture) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return new ResponseEntity<>(groupService.createGroup(currentUser, request, groupPicture), HttpStatus.CREATED);
    }

    @PostMapping("/{groupId}/add-members")
    @Operation(summary = "Add members to group (admin only)")
    public ResponseEntity<ChatResponse> addMembers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId,
            @RequestBody List<Long> userIds) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(groupService.addMembers(currentUser, groupId, userIds));
    }

    @DeleteMapping("/{groupId}/remove-member/{userId}")
    @Operation(summary = "Remove a member from group (admin only)")
    public ResponseEntity<ChatResponse> removeMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId,
            @PathVariable Long userId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(groupService.removeMember(currentUser, groupId, userId));
    }

    @PostMapping("/{groupId}/leave")
    @Operation(summary = "Leave a group chat")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        groupService.leaveGroup(currentUser, groupId);
        return ResponseEntity.ok(Map.of("message", "Left group successfully"));
    }

    @PutMapping("/{groupId}/promote/{targetUserId}")
    @Operation(summary = "Promote a member to group admin")
    public ResponseEntity<ChatResponse> promoteToAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId,
            @PathVariable Long targetUserId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(groupService.promoteToAdmin(currentUser, groupId, targetUserId));
    }

    @PutMapping("/{groupId}/demote/{targetUserId}")
    @Operation(summary = "Demote an admin to normal member")
    public ResponseEntity<ChatResponse> demoteAdmin(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId,
            @PathVariable Long targetUserId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(groupService.demoteAdmin(currentUser, groupId, targetUserId));
    }

    @PutMapping(value = "/{groupId}/info", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Update group name, description, or group picture")
    public ResponseEntity<ChatResponse> updateGroupInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long groupId,
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "description", required = false) String description,
            @RequestPart(value = "groupPicture", required = false) MultipartFile groupPicture) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(groupService.updateGroupInfo(currentUser, groupId, name, description, groupPicture));
    }
}
