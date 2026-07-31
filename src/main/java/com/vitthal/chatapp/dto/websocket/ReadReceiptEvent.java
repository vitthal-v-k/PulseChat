package com.vitthal.chatapp.dto.websocket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * WebSocket DTO for broadcasting read receipt events.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptEvent {

    private Long chatId;
    private Long readerId;
    private String readerName;
    /** IDs of messages that have been marked as read */
    private List<Long> messageIds;
}
