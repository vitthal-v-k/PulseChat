package com.vitthal.chatapp.mapper;

import com.vitthal.chatapp.constants.ChatType;
import com.vitthal.chatapp.dto.response.ChatMemberResponse;
import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.ChatMember;
import com.vitthal.chatapp.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ChatMapper {

    private final UserMapper userMapper;

    public ChatResponse toResponse(Chat chat, User currentUser, ChatMember memberInfo) {
        if (chat == null) return null;

        List<ChatMemberResponse> memberResponses = chat.getMembers() != null ?
                chat.getMembers().stream()
                        .filter(m -> m.getLeftAt() == null)
                        .map(m -> ChatMemberResponse.builder()
                                .id(m.getUser().getId())
                                .username(m.getUser().getUsername())
                                .uniqueNumber(m.getUser().getUniqueNumber())
                                .fullName(m.getUser().getFullName())
                                .profilePicture(m.getUser().getProfilePicture())
                                .isOnline(m.getUser().getIsOnline())
                                .isAdmin(Boolean.TRUE.equals(m.getIsAdmin()))
                                .build())
                        .collect(Collectors.toList()) : Collections.emptyList();

        UserResponse otherUser = null;
        if (chat.getType() == ChatType.PRIVATE && currentUser != null && chat.getMembers() != null) {
            Optional<ChatMember> otherMember = chat.getMembers().stream()
                    .filter(m -> !m.getUser().getId().equals(currentUser.getId()))
                    .findFirst();
            if (otherMember.isPresent()) {
                otherUser = userMapper.toResponse(otherMember.get().getUser());
            }
        }

        ChatResponse.ChatResponseBuilder builder = ChatResponse.builder()
                .id(chat.getId())
                .type(chat.getType().name())
                .name(chat.getName())
                .description(chat.getDescription())
                .groupPicture(chat.getGroupPicture())
                .createdBy(userMapper.toResponse(chat.getCreatedBy()))
                .otherParticipant(otherUser)
                .members(memberResponses)
                .createdAt(chat.getCreatedAt())
                .updatedAt(chat.getUpdatedAt());

        if (memberInfo != null) {
            builder.isPinned(memberInfo.getIsPinned())
                   .isArchived(memberInfo.getIsArchived())
                   .isMuted(memberInfo.getIsMuted())
                   .isMarkedUnread(memberInfo.getIsMarkedUnread())
                   .unreadCount(memberInfo.getUnreadCount());
        }

        return builder.build();
    }
}
