package com.vitthal.chatapp.websocket;

import com.vitthal.chatapp.dto.websocket.ReadReceiptEvent;
import com.vitthal.chatapp.dto.websocket.TypingEvent;
import com.vitthal.chatapp.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingEvent event) {
        // Broadcast typing indicator to /topic/chat/{chatId}/typing
        messagingTemplate.convertAndSend("/topic/chat/" + event.getChatId() + "/typing", event);
    }

    @MessageMapping("/chat.read")
    public void handleReadReceipt(@Payload ReadReceiptEvent event) {
        // Broadcast read receipt to /topic/chat/{chatId}/read
        messagingTemplate.convertAndSend("/topic/chat/" + event.getChatId() + "/read", event);
    }
}
