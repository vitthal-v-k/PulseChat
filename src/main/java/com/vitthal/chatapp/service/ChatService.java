package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.entity.User;

import java.util.List;

public interface ChatService {

    ChatResponse getOrCreatePrivateChat(User currentUser, Long otherUserId);

    ChatResponse getChatById(User currentUser, Long chatId);

    List<ChatResponse> getUserChats(User currentUser);

    void pinChat(User currentUser, Long chatId, boolean pin);

    void archiveChat(User currentUser, Long chatId, boolean archive);

    void muteChat(User currentUser, Long chatId, boolean mute);

    void clearChatHistory(User currentUser, Long chatId);

    void deleteChat(User currentUser, Long chatId);

    void markChatAsUnread(User currentUser, Long chatId);
}
