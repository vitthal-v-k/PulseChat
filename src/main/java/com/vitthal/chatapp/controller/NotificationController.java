package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.response.NotificationResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.NotificationService;
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

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Endpoints for in-app notification retrieval and read status updates")
public class NotificationController {

    private final NotificationService notificationService;
    private final CustomUserDetailsService userDetailsService;

    @GetMapping
    @Operation(summary = "Get paginated in-app notifications")
    public ResponseEntity<Page<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser, pageable));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Get count of unread notifications")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(currentUser)));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        notificationService.markAsRead(currentUser, id);
        return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
    }

    @PutMapping("/read-all")
    @Operation(summary = "Mark all notifications as read")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
