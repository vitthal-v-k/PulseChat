package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.request.EditMessageRequest;
import com.vitthal.chatapp.dto.request.SendMessageRequest;
import com.vitthal.chatapp.dto.response.MessageResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface MessageService {

    MessageResponse sendMessage(User currentUser, SendMessageRequest request, List<MultipartFile> attachments);

    MessageResponse editMessage(User currentUser, EditMessageRequest request);

    void deleteForMe(User currentUser, Long messageId);

    void deleteForEveryone(User currentUser, Long messageId);

    Page<MessageResponse> getChatMessages(User currentUser, Long chatId, Pageable pageable);

    Page<MessageResponse> searchMessages(User currentUser, Long chatId, String query, Pageable pageable);

    void toggleStarMessage(User currentUser, Long messageId);

    Page<MessageResponse> getStarredMessages(User currentUser, Pageable pageable);

    MessageResponse forwardMessage(User currentUser, Long messageId, Long targetChatId);

    MessageResponse addReaction(User currentUser, Long messageId, String emoji);

    void markMessagesAsRead(User currentUser, Long chatId);
}
