package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import com.vitthal.chatapp.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Tag(name = "Chats", description = "Endpoints for chat creation, retrieval, pinning, archiving, and muting")
public class ChatController {

    private final ChatService chatService;
    private final CustomUserDetailsService userDetailsService;

    @PostMapping("/private/{otherUserId}")
    @Operation(summary = "Get or create a 1-on-1 private chat")
    public ResponseEntity<ChatResponse> getOrCreatePrivateChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long otherUserId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getOrCreatePrivateChat(currentUser, otherUserId));
    }

    @GetMapping
    @Operation(summary = "Get all chats for current user (ordered by latest message)")
    public ResponseEntity<List<ChatResponse>> getUserChats(@AuthenticationPrincipal UserDetails userDetails) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getUserChats(currentUser));
    }

    @GetMapping("/{chatId}")
    @Operation(summary = "Get chat by ID")
    public ResponseEntity<ChatResponse> getChatById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        return ResponseEntity.ok(chatService.getChatById(currentUser, chatId));
    }

    @PutMapping("/{chatId}/pin")
    @Operation(summary = "Pin or unpin a chat")
    public ResponseEntity<Map<String, String>> pinChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId,
            @RequestParam("pin") boolean pin) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.pinChat(currentUser, chatId, pin);
        return ResponseEntity.ok(Map.of("message", pin ? "Chat pinned" : "Chat unpinned"));
    }

    @PutMapping("/{chatId}/archive")
    @Operation(summary = "Archive or unarchive a chat")
    public ResponseEntity<Map<String, String>> archiveChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId,
            @RequestParam("archive") boolean archive) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.archiveChat(currentUser, chatId, archive);
        return ResponseEntity.ok(Map.of("message", archive ? "Chat archived" : "Chat unarchived"));
    }

    @PutMapping("/{chatId}/mute")
    @Operation(summary = "Mute or unmute notifications for a chat")
    public ResponseEntity<Map<String, String>> muteChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId,
            @RequestParam("mute") boolean mute) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.muteChat(currentUser, chatId, mute);
        return ResponseEntity.ok(Map.of("message", mute ? "Chat muted" : "Chat unmuted"));
    }

    @DeleteMapping("/{chatId}/clear")
    @Operation(summary = "Clear chat history for current user")
    public ResponseEntity<Map<String, String>> clearChatHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.clearChatHistory(currentUser, chatId);
        return ResponseEntity.ok(Map.of("message", "Chat history cleared"));
    }

    @DeleteMapping("/{chatId}")
    @Operation(summary = "Delete chat for current user")
    public ResponseEntity<Map<String, String>> deleteChat(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.deleteChat(currentUser, chatId);
        return ResponseEntity.ok(Map.of("message", "Chat deleted"));
    }

    @PutMapping("/{chatId}/unread")
    @Operation(summary = "Mark chat as unread")
    public ResponseEntity<Map<String, String>> markAsUnread(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long chatId) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());
        chatService.markChatAsUnread(currentUser, chatId);
        return ResponseEntity.ok(Map.of("message", "Marked as unread"));
    }
}
