package com.vitthal.chatapp.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vitthal.chatapp.constants.AttachmentType;
import com.vitthal.chatapp.constants.MessageStatus;
import com.vitthal.chatapp.dto.request.EditMessageRequest;
import com.vitthal.chatapp.dto.request.SendMessageRequest;
import com.vitthal.chatapp.dto.response.MessageResponse;
import com.vitthal.chatapp.dto.websocket.ChatMessage;
import com.vitthal.chatapp.entity.*;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.MessageMapper;
import com.vitthal.chatapp.repository.*;
import com.vitthal.chatapp.service.CloudinaryService;
import com.vitthal.chatapp.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final MessageStatusRepository messageStatusRepository;
    private final AttachmentRepository attachmentRepository;
    private final StarredMessageRepository starredMessageRepository;
    private final UserRepository userRepository;
    private final MessageMapper messageMapper;
    private final CloudinaryService cloudinaryService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional
    public MessageResponse sendMessage(User currentUser, SendMessageRequest request, List<MultipartFile> files) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", request.getChatId()));

        if (!chatMemberRepository.existsByChatAndUserAndLeftAtIsNull(chat, currentUser)) {
            throw new BadRequestException("You are not an active member of this chat");
        }

        Message replyTo = null;
        if (request.getReplyToId() != null) {
            replyTo = messageRepository.findById(request.getReplyToId()).orElse(null);
        }

        Message message = Message.builder()
                .chat(chat)
                .sender(currentUser)
                .content(request.getContent())
                .messageType(request.getMessageType() != null ? request.getMessageType() : "TEXT")
                .replyTo(replyTo)
                .isEdited(false)
                .isDeletedForEveryone(false)
                .build();

        Message savedMessage = messageRepository.save(message);

        // Upload attachments if present
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    Map upload = cloudinaryService.uploadFile(file, "attachments");
                    String url = (String) upload.get("secure_url");
                    String publicId = (String) upload.get("public_id");

                    AttachmentType attachType = determineAttachmentType(file.getContentType(), file.getOriginalFilename());

                    Attachment attachment = Attachment.builder()
                            .message(savedMessage)
                            .type(attachType)
                            .url(url)
                            .publicId(publicId)
                            .fileName(file.getOriginalFilename())
                            .fileSize(file.getSize())
                            .mimeType(file.getContentType())
                            .build();

                    attachmentRepository.save(attachment);
                    savedMessage.getAttachments().add(attachment);
                }
            }
        }

        // Initialize status records & increment unread counts
        List<ChatMember> members = chatMemberRepository.findByChatAndLeftAtIsNull(chat);
        for (ChatMember member : members) {
            if (!member.getUser().getId().equals(currentUser.getId())) {
                MessageStatusEntity statusEntity = MessageStatusEntity.builder()
                        .message(savedMessage)
                        .user(member.getUser())
                        .status(MessageStatus.SENT)
                        .build();
                messageStatusRepository.save(statusEntity);
            }
        }

        chatMemberRepository.incrementUnreadCount(chat, currentUser);
        chat.setUpdatedAt(LocalDateTime.now());
        chatRepository.save(chat);

        MessageResponse response = messageMapper.toResponse(savedMessage, currentUser);

        // Broadcast message over WebSocket to /topic/chat/{chatId}
        broadcastMessage(chat.getId(), savedMessage, currentUser);

        return response;
    }

    @Override
    @Transactional
    public MessageResponse editMessage(User currentUser, EditMessageRequest request) {
        Message message = messageRepository.findById(request.getMessageId())
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", request.getMessageId()));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only edit your own messages");
        }

        message.setContent(request.getNewContent());
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());

        Message saved = messageRepository.save(message);
        MessageResponse response = messageMapper.toResponse(saved, currentUser);

        broadcastMessage(message.getChat().getId(), saved, currentUser);
        return response;
    }

    @Override
    @Transactional
    public void deleteForMe(User currentUser, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        messageStatusRepository.findByMessageAndUser(message, currentUser)
                .ifPresent(messageStatusRepository::delete);
    }

    @Override
    @Transactional
    public void deleteForEveryone(User currentUser, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        if (!message.getSender().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only delete your own messages for everyone");
        }

        message.setIsDeletedForEveryone(true);
        message.setContent("This message was deleted.");
        Message saved = messageRepository.save(message);

        broadcastMessage(message.getChat().getId(), saved, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getChatMessages(User currentUser, Long chatId, Pageable pageable) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        Page<Message> messages = messageRepository.findByChatOrderByCreatedAtDesc(chat, pageable);
        return messages.map(m -> messageMapper.toResponse(m, currentUser));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> searchMessages(User currentUser, Long chatId, String query, Pageable pageable) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        Page<Message> messages = messageRepository.searchMessagesInChat(chat, query, pageable);
        return messages.map(m -> messageMapper.toResponse(m, currentUser));
    }

    @Override
    @Transactional
    public void toggleStarMessage(User currentUser, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        Optional<StarredMessage> existing = starredMessageRepository.findByMessageAndUser(message, currentUser);
        if (existing.isPresent()) {
            starredMessageRepository.delete(existing.get());
        } else {
            StarredMessage starred = StarredMessage.builder()
                    .message(message)
                    .user(currentUser)
                    .build();
            starredMessageRepository.save(starred);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MessageResponse> getStarredMessages(User currentUser, Pageable pageable) {
        return messageRepository.findStarredMessagesByUser(currentUser, pageable)
                .map(m -> messageMapper.toResponse(m, currentUser));
    }

    @Override
    @Transactional
    public MessageResponse forwardMessage(User currentUser, Long messageId, Long targetChatId) {
        Message originalMessage = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        Chat targetChat = chatRepository.findById(targetChatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", targetChatId));

        Message forwarded = Message.builder()
                .chat(targetChat)
                .sender(currentUser)
                .content(originalMessage.getContent())
                .messageType(originalMessage.getMessageType())
                .forwardedFrom(originalMessage)
                .isEdited(false)
                .isDeletedForEveryone(false)
                .build();

        Message saved = messageRepository.save(forwarded);
        return messageMapper.toResponse(saved, currentUser);
    }

    @Override
    @Transactional
    public MessageResponse addReaction(User currentUser, Long messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        Map<String, List<String>> reactionMap = new HashMap<>();
        if (message.getReactions() != null && !message.getReactions().isEmpty()) {
            try {
                reactionMap = objectMapper.readValue(message.getReactions(), new TypeReference<>() {});
            } catch (JsonProcessingException e) {
                log.error("Failed to parse reactions JSON", e);
            }
        }

        List<String> users = reactionMap.computeIfAbsent(emoji, k -> new ArrayList<>());
        String userIdStr = currentUser.getId().toString();
        if (users.contains(userIdStr)) {
            users.remove(userIdStr);
        } else {
            users.add(userIdStr);
        }

        if (users.isEmpty()) {
            reactionMap.remove(emoji);
        }

        try {
            message.setReactions(objectMapper.writeValueAsString(reactionMap));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize reactions", e);
        }

        Message saved = messageRepository.save(message);
        MessageResponse response = messageMapper.toResponse(saved, currentUser);

        broadcastMessage(message.getChat().getId(), saved, currentUser);
        return response;
    }

    @Override
    @Transactional
    public void markMessagesAsRead(User currentUser, Long chatId) {
        messageStatusRepository.markMessagesAsReadInChat(chatId, currentUser, MessageStatus.READ);
        Chat chat = chatRepository.findById(chatId).orElse(null);
        if (chat != null) {
            chatMemberRepository.resetUnreadCount(chat, currentUser);
        }
    }

    private void broadcastMessage(Long chatId, Message message, User sender) {
        MessageResponse response = messageMapper.toResponse(message, sender);
        messagingTemplate.convertAndSend("/topic/chat/" + chatId, response);
    }

    private AttachmentType determineAttachmentType(String mimeType, String fileName) {
        String mime = mimeType != null ? mimeType.toLowerCase() : "";
        String name = fileName != null ? fileName.toLowerCase() : "";

        if (mime.startsWith("image/") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png") || name.endsWith(".gif") || name.endsWith(".webp")) {
            return AttachmentType.IMAGE;
        }
        if (mime.startsWith("video/") || name.endsWith(".mp4") || name.endsWith(".mkv") || name.endsWith(".avi") || name.endsWith(".mov")) {
            return AttachmentType.VIDEO;
        }
        if (mime.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".ogg") || name.endsWith(".m4a")) {
            return AttachmentType.AUDIO;
        }
        if (mime.contains("pdf") || name.endsWith(".pdf")) {
            return AttachmentType.PDF;
        }
        if (mime.contains("word") || name.endsWith(".doc") || name.endsWith(".docx")) {
            return AttachmentType.DOCX;
        }
        if (mime.contains("zip") || mime.contains("rar") || name.endsWith(".zip") || name.endsWith(".rar") || name.endsWith(".7z")) {
            return AttachmentType.ZIP;
        }
        return AttachmentType.FILE;
    }
}
