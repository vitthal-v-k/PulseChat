package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.ChatType;
import com.vitthal.chatapp.constants.NotificationType;
import com.vitthal.chatapp.dto.request.CreateGroupRequest;
import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.ChatMember;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.ChatMapper;
import com.vitthal.chatapp.repository.ChatMemberRepository;
import com.vitthal.chatapp.repository.ChatRepository;
import com.vitthal.chatapp.repository.UserRepository;
import com.vitthal.chatapp.service.CloudinaryService;
import com.vitthal.chatapp.service.GroupService;
import com.vitthal.chatapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final ChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final UserRepository userRepository;
    private final ChatMapper chatMapper;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public ChatResponse createGroup(User currentUser, CreateGroupRequest request, MultipartFile groupPicture) {
        String pictureUrl = null;
        String publicId = null;

        if (groupPicture != null && !groupPicture.isEmpty()) {
            Map upload = cloudinaryService.uploadImage(groupPicture, "groups");
            pictureUrl = (String) upload.get("secure_url");
            publicId = (String) upload.get("public_id");
        }

        Chat chat = Chat.builder()
                .type(ChatType.GROUP)
                .name(request.getName())
                .description(request.getDescription())
                .groupPicture(pictureUrl)
                .groupPicturePublicId(publicId)
                .createdBy(currentUser)
                .build();

        Chat savedChat = chatRepository.save(chat);

        List<ChatMember> members = new ArrayList<>();
        // Add creator as admin
        ChatMember creatorMember = ChatMember.builder()
                .chat(savedChat)
                .user(currentUser)
                .isAdmin(true)
                .build();
        members.add(chatMemberRepository.save(creatorMember));

        // Add requested members
        if (request.getMemberIds() != null) {
            for (Long id : request.getMemberIds()) {
                if (!id.equals(currentUser.getId())) {
                    userRepository.findById(id).ifPresent(user -> {
                        ChatMember m = ChatMember.builder()
                                .chat(savedChat)
                                .user(user)
                                .isAdmin(false)
                                .build();
                        members.add(chatMemberRepository.save(m));

                        notificationService.createNotification(
                                user, currentUser, NotificationType.GROUP,
                                "Added to Group",
                                currentUser.getFullName() + " added you to " + request.getName(),
                                savedChat.getId()
                        );
                    });
                }
            }
        }

        savedChat.setMembers(members);
        return chatMapper.toResponse(savedChat, currentUser, creatorMember);
    }

    @Override
    @Transactional
    public ChatResponse addMembers(User currentUser, Long groupId, List<Long> userIds) {
        Chat chat = getGroupAndCheckAdmin(currentUser, groupId);

        for (Long id : userIds) {
            User user = userRepository.findById(id).orElse(null);
            if (user != null && !chatMemberRepository.existsByChatAndUserAndLeftAtIsNull(chat, user)) {
                ChatMember m = ChatMember.builder()
                        .chat(chat)
                        .user(user)
                        .isAdmin(false)
                        .build();
                chatMemberRepository.save(m);

                notificationService.createNotification(
                        user, currentUser, NotificationType.GROUP,
                        "Added to Group",
                        currentUser.getFullName() + " added you to " + chat.getName(),
                        chat.getId()
                );
            }
        }

        ChatMember currentMember = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
        return chatMapper.toResponse(chat, currentUser, currentMember);
    }

    @Override
    @Transactional
    public ChatResponse removeMember(User currentUser, Long groupId, Long userIdToRemove) {
        Chat chat = getGroupAndCheckAdmin(currentUser, groupId);
        User toRemove = userRepository.findById(userIdToRemove)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userIdToRemove));

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, toRemove)
                .orElseThrow(() -> new BadRequestException("User is not a member of this group"));

        member.setLeftAt(LocalDateTime.now());
        chatMemberRepository.save(member);

        ChatMember currentMember = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
        return chatMapper.toResponse(chat, currentUser, currentMember);
    }

    @Override
    @Transactional
    public void leaveGroup(User currentUser, Long groupId) {
        Chat chat = chatRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", groupId));

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, currentUser)
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));

        member.setLeftAt(LocalDateTime.now());
        chatMemberRepository.save(member);
    }

    @Override
    @Transactional
    public ChatResponse promoteToAdmin(User currentUser, Long groupId, Long targetUserId) {
        Chat chat = getGroupAndCheckAdmin(currentUser, groupId);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, target)
                .orElseThrow(() -> new BadRequestException("User is not a member of this group"));

        member.setIsAdmin(true);
        chatMemberRepository.save(member);

        ChatMember currentMember = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
        return chatMapper.toResponse(chat, currentUser, currentMember);
    }

    @Override
    @Transactional
    public ChatResponse demoteAdmin(User currentUser, Long groupId, Long targetUserId) {
        Chat chat = getGroupAndCheckAdmin(currentUser, groupId);
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, target)
                .orElseThrow(() -> new BadRequestException("User is not a member of this group"));

        member.setIsAdmin(false);
        chatMemberRepository.save(member);

        ChatMember currentMember = chatMemberRepository.findByChatAndUser(chat, currentUser).orElse(null);
        return chatMapper.toResponse(chat, currentUser, currentMember);
    }

    @Override
    @Transactional
    public ChatResponse updateGroupInfo(User currentUser, Long groupId, String name, String description, MultipartFile groupPicture) {
        Chat chat = getGroupAndCheckAdmin(currentUser, groupId);

        if (name != null && !name.trim().isEmpty()) {
            chat.setName(name);
        }
        if (description != null) {
            chat.setDescription(description);
        }
        if (groupPicture != null && !groupPicture.isEmpty()) {
            if (chat.getGroupPicturePublicId() != null) {
                cloudinaryService.deleteFile(chat.getGroupPicturePublicId());
            }
            Map upload = cloudinaryService.uploadImage(groupPicture, "groups");
            chat.setGroupPicture((String) upload.get("secure_url"));
            chat.setGroupPicturePublicId((String) upload.get("public_id"));
        }

        Chat saved = chatRepository.save(chat);
        ChatMember currentMember = chatMemberRepository.findByChatAndUser(saved, currentUser).orElse(null);
        return chatMapper.toResponse(saved, currentUser, currentMember);
    }

    private Chat getGroupAndCheckAdmin(User user, Long groupId) {
        Chat chat = chatRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat", "id", groupId));

        if (chat.getType() != ChatType.GROUP) {
            throw new BadRequestException("This chat is not a group");
        }

        ChatMember member = chatMemberRepository.findByChatAndUser(chat, user)
                .orElseThrow(() -> new BadRequestException("You are not a member of this group"));

        if (!Boolean.TRUE.equals(member.getIsAdmin())) {
            throw new BadRequestException("Only group admins can perform this action");
        }

        return chat;
    }
}
