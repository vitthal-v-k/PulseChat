package com.vitthal.chatapp.mapper;

import com.vitthal.chatapp.dto.response.MessageResponse;
import com.vitthal.chatapp.entity.Message;
import com.vitthal.chatapp.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class MessageMapper {

    private final UserMapper userMapper;
    private final AttachmentMapper attachmentMapper;

    public MessageResponse toResponse(Message message, User currentUser) {
        if (message == null) return null;

        MessageResponse.MessageResponseBuilder builder = MessageResponse.builder()
                .id(message.getId())
                .chatId(message.getChat() != null ? message.getChat().getId() : null)
                .sender(userMapper.toResponse(message.getSender()))
                .content(Boolean.TRUE.equals(message.getIsDeletedForEveryone()) ? "This message was deleted." : message.getContent())
                .messageType(message.getMessageType())
                .isEdited(message.getIsEdited())
                .isDeletedForEveryone(message.getIsDeletedForEveryone())
                .reactions(message.getReactions())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt());

        if (message.getReplyTo() != null) {
            builder.replyToId(message.getReplyTo().getId())
                   .replyToContent(message.getReplyTo().getContent())
                   .replyToSenderName(message.getReplyTo().getSender() != null ? message.getReplyTo().getSender().getFullName() : null);
        }

        if (message.getForwardedFrom() != null) {
            builder.forwardedFromId(message.getForwardedFrom().getId());
        }

        if (message.getAttachments() != null && !message.getAttachments().isEmpty()) {
            builder.attachments(attachmentMapper.toResponseList(message.getAttachments()));
        } else {
            builder.attachments(Collections.emptyList());
        }

        if (currentUser != null && message.getStarredBy() != null) {
            boolean isStarred = message.getStarredBy().stream()
                    .anyMatch(sm -> sm.getUser().getId().equals(currentUser.getId()));
            builder.isStarred(isStarred);
        } else {
            builder.isStarred(false);
        }

        String computedStatus = "SENT";
        if (message.getStatuses() != null && !message.getStatuses().isEmpty()) {
            boolean anyRead = message.getStatuses().stream()
                    .anyMatch(s -> s.getStatus() == com.vitthal.chatapp.constants.MessageStatus.READ);
            boolean anyDelivered = message.getStatuses().stream()
                    .anyMatch(s -> s.getStatus() == com.vitthal.chatapp.constants.MessageStatus.DELIVERED);
            if (anyRead) {
                computedStatus = "READ";
            } else if (anyDelivered) {
                computedStatus = "DELIVERED";
            }
        }
        builder.status(computedStatus);

        return builder.build();
    }

    public List<MessageResponse> toResponseList(List<Message> messages, User currentUser) {
        if (messages == null) return Collections.emptyList();
        return messages.stream().map(msg -> toResponse(msg, currentUser)).collect(Collectors.toList());
    }
}
