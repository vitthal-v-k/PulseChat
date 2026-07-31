package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.ChatType;
import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.dto.response.MessageResponse;
import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.ChatMember;
import com.vitthal.chatapp.entity.Message;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.ChatMapper;
import com.vitthal.chatapp.mapper.MessageMapper;
import com.vitthal.chatapp.repository.ChatMemberRepository;
import com.vitthal.chatapp.repository.ChatRepository;
import com.vitthal.chatapp.repository.MessageRepository;
import com.vitthal.chatapp.repository.UserRepository;
import com.vitthal.chatapp.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final ChatMapper chatMapper;
    private final MessageMapper messageMapper;

    @Override
    @Transactional
    public ChatResponse getOrCreatePrivateChat(User currentUser, Long otherUserId) {
        if (currentUser.getId().equals(otherUserId)) {
            throw new BadRequestException("You cannot create a chat with yourself");
        }

        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", otherUserId));

        Optional<Chat> existingChat = chatRepository.findPrivateChatBetween(currentUser, otherUser);
        if (existingChat.isPresent()) {
            Chat chat = existingChat.get();
            ChatMember memberInfo = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
            ChatResponse response = chatMapper.toResponse(chat, currentUser, memberInfo);
            attachLastMessage(response, chat, currentUser);
            return response;
        }

        Chat newChat = Chat.builder()
                .type(ChatType.PRIVATE)
                .createdBy(currentUser)
                .build();
        Chat savedChat = chatRepository.save(newChat);

        ChatMember m1 = ChatMember.builder().chat(savedChat).user(currentUser).isAdmin(false).build();
        ChatMember m2 = ChatMember.builder().chat(savedChat).user(otherUser).isAdmin(false).build();
        chatMemberRepository.save(m1);
        chatMemberRepository.save(m2);

        savedChat.setMembers(List.of(m1, m2));

        ChatResponse response = chatMapper.toResponse(savedChat, currentUser, m1);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public ChatResponse getChatById(User currentUser, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, currentUser)
                .orElseThrow(() -> new BadRequestException("You are not a member of this chat"));

        ChatResponse response = chatMapper.toResponse(chat, currentUser, member);
        attachLastMessage(response, chat, currentUser);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatResponse> getUserChats(User currentUser) {
        List<Chat> chats = chatRepository.findChatsForUser(currentUser);

        return chats.stream().map(chat -> {
            ChatMember memberInfo = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
            ChatResponse response = chatMapper.toResponse(chat, currentUser, memberInfo);
            attachLastMessage(response, chat, currentUser);
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void pinChat(User currentUser, Long chatId, boolean pin) {
        ChatMember member = getMember(currentUser, chatId);
        member.setIsPinned(pin);
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void archiveChat(User currentUser, Long chatId, boolean archive) {
        ChatMember member = getMember(currentUser, chatId);
        member.setIsArchived(archive);
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void muteChat(User currentUser, Long chatId, boolean mute) {
        ChatMember member = getMember(currentUser, chatId);
        member.setIsMuted(mute);
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void clearChatHistory(User currentUser, Long chatId) {
        ChatMember member = getMember(currentUser, chatId);
        member.setClearedAt(LocalDateTime.now());
        member.setUnreadCount(0);
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void deleteChat(User currentUser, Long chatId) {
        ChatMember member = getMember(currentUser, chatId);
        member.setDeletedAt(LocalDateTime.now());
        member.setUnreadCount(0);
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public void markChatAsUnread(User currentUser, Long chatId) {
        ChatMember member = getMember(currentUser, chatId);
        member.setIsMarkedUnread(true);
        chatMemberRepository.save(member);
    }

    private ChatMember getMember(User user, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", chatId));
        return chatMemberRepository.findByChatAndUser(chat, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this chat"));
    }

    private void attachLastMessage(ChatResponse response, Chat chat, User currentUser) {
        Optional<Message> latestMsg = messageRepository.findLatestMessageByChat(chat);
        latestMsg.ifPresent(msg -> response.setLastMessage(messageMapper.toResponse(msg, currentUser)));
    }
}
