package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.request.EditMessageRequest;
import com.vitthal.chatapp.dto.request.SendMessageRequest;
import com.vitthal.chatapp.dto.response.MessageResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Endpoints for sending, editing, deleting, starring, searching, and reacting to messages")
public class MessageController {

    private final MessageService messageService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping(value = "/send", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Send a chat message with optional media attachments")
    public ResponseEntity<MessageResponse> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestPart("data") SendMessageRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return new ResponseEntity<>(messageService.sendMessage(currentUser, request, files), HttpStatus.CREATED);
    }

    @PutMapping("/edit")
    @Operation(summary = "Edit message text content")
    public ResponseEntity<MessageResponse> editMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody EditMessageRequest request) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(messageService.editMessage(currentUser, request));
    }

    @DeleteMapping("/{messageId}/me")
    @Operation(summary = "Delete message for current user only")
    public ResponseEntity<Map<String, String>> deleteForMe(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        messageService.deleteForMe(currentUser, messageId);
        return ResponseEntity.ok(Map.of("message", "Message deleted for you"));
    }

    @DeleteMapping("/{messageId}/everyone")
    @Operation(summary = "Delete message for everyone in the chat")
    public ResponseEntity<Map<String, String>> deleteForEveryone(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        messageService.deleteForEveryone(currentUser, messageId);
        return ResponseEntity.ok(Map.of("message", "Message deleted for everyone"));
    }

    @GetMapping("/chat/{chatId}")
    @Operation(summary = "Get paginated message thread for a chat (infinite scroll)")
    public ResponseEntity<Page<MessageResponse>> getChatMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "30") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageService.getChatMessages(currentUser, chatId, pageable));
    }

    @GetMapping("/chat/{chatId}/search")
    @Operation(summary = "Search message history within a specific chat")
    public ResponseEntity<Page<MessageResponse>> searchMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId,
            @RequestParam("query") String query,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageService.searchMessages(currentUser, chatId, query, pageable));
    }

    @PostMapping("/{messageId}/star")
    @Operation(summary = "Toggle star/bookmark on a message")
    public ResponseEntity<Map<String, String>> toggleStar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        messageService.toggleStarMessage(currentUser, messageId);
        return ResponseEntity.ok(Map.of("message", "Starred status updated"));
    }

    @GetMapping("/starred")
    @Operation(summary = "Get all starred messages for current user")
    public ResponseEntity<Page<MessageResponse>> getStarredMessages(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(messageService.getStarredMessages(currentUser, pageable));
    }

    @PostMapping("/{messageId}/forward/{targetChatId}")
    @Operation(summary = "Forward a message to another chat")
    public ResponseEntity<MessageResponse> forwardMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId,
            @PathVariable Long targetChatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(messageService.forwardMessage(currentUser, messageId, targetChatId));
    }

    @PostMapping("/{messageId}/react")
    @Operation(summary = "Add or remove emoji reaction on a message")
    public ResponseEntity<MessageResponse> addReaction(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long messageId,
            @RequestParam("emoji") String emoji) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(messageService.addReaction(currentUser, messageId, emoji));
    }

    @PostMapping("/chat/{chatId}/read")
    @Operation(summary = "Mark all messages in a chat as read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        messageService.markMessagesAsRead(currentUser, chatId);
        return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
    }
}
