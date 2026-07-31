package com.vitthal.chatapp.websocket;

import com.vitthal.chatapp.dto.websocket.OnlineStatusEvent;
import com.vitthal.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;
import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String email = principal.getName();
            log.info("User connected to WebSocket: {}", email);
            userRepository.findByEmail(email).ifPresent(user -> {
                userRepository.updateOnlineStatus(user.getId(), true);
                broadcastPresence(user.getId(), user.getUsername(), true);
            });
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal principal = headerAccessor.getUser();
        if (principal != null) {
            String email = principal.getName();
            log.info("User disconnected from WebSocket: {}", email);
            userRepository.findByEmail(email).ifPresent(user -> {
                userRepository.updateOnlineStatus(user.getId(), false);
                broadcastPresence(user.getId(), user.getUsername(), false);
            });
        }
    }

    private void broadcastPresence(Long userId, String username, boolean isOnline) {
        OnlineStatusEvent presence = OnlineStatusEvent.builder()
                .userId(userId)
                .username(username)
                .isOnline(isOnline)
                .lastSeen(LocalDateTime.now())
                .build();
        messagingTemplate.convertAndSend("/topic/presence", presence);
    }
}
