package com.vitthal.chatapp.websocket;

import com.vitthal.chatapp.dto.websocket.OnlineStatusEvent;
import com.vitthal.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Slf4j
@Controller
@RequiredArgsConstructor
public class OnlineStatusWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/user.online")
    public void handleUserOnline(@Payload OnlineStatusEvent event) {
        event.setOnline(true);
        event.setLastSeen(LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/presence", event);
    }

    @MessageMapping("/user.offline")
    public void handleUserOffline(@Payload OnlineStatusEvent event) {
        event.setOnline(false);
        event.setLastSeen(LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/presence", event);
    }
}
