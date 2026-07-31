package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.request.CreateStatusRequest;
import com.vitthal.chatapp.dto.response.StatusResponse;
import com.vitthal.chatapp.dto.response.StatusViewResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.StatusService;
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
@RequestMapping("/api/status")
@RequiredArgsConstructor
@Tag(name = "Stories / Status", description = "Endpoints for 24-hour status stories, media upload, view tracking, and reactions")
public class StatusController {

    private final StatusService statusService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a text, image, or video status story")
    public ResponseEntity<StatusResponse> createStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestPart("data") CreateStatusRequest request,
            @RequestPart(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return new ResponseEntity<>(statusService.createStatus(currentUser, request, mediaFiles), HttpStatus.CREATED);
    }

    @GetMapping("/contacts")
    @Operation(summary = "Get active stories from contacts")
    public ResponseEntity<List<StatusResponse>> getContactStatuses(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(statusService.getContactStatuses(currentUser));
    }

    @GetMapping("/me")
    @Operation(summary = "Get my active status stories")
    public ResponseEntity<List<StatusResponse>> getMyStatuses(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(statusService.getMyStatuses(currentUser));
    }

    @PostMapping("/{statusId}/view")
    @Operation(summary = "Record a view or reply on a status story")
    public ResponseEntity<StatusViewResponse> viewStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long statusId,
            @RequestParam(value = "replyText", required = false) String replyText) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(statusService.viewStatus(currentUser, statusId, replyText));
    }

    @PostMapping("/{statusId}/react")
    @Operation(summary = "React with an emoji to a status story")
    public ResponseEntity<StatusResponse> reactToStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long statusId,
            @RequestParam("emoji") String emoji) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(statusService.reactToStatus(currentUser, statusId, emoji));
    }

    @DeleteMapping("/{statusId}")
    @Operation(summary = "Delete my status story")
    public ResponseEntity<Map<String, String>> deleteStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long statusId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        statusService.deleteStatus(currentUser, statusId);
        return ResponseEntity.ok(Map.of("message", "Status deleted"));
    }
}
