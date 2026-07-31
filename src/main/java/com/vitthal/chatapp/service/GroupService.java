package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.request.CreateGroupRequest;
import com.vitthal.chatapp.dto.response.ChatResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface GroupService {

    ChatResponse createGroup(User currentUser, CreateGroupRequest request, MultipartFile groupPicture);

    ChatResponse addMembers(User currentUser, Long groupId, List<Long> userIds);

    ChatResponse removeMember(User currentUser, Long groupId, Long userIdToRemove);

    void leaveGroup(User currentUser, Long groupId);

    ChatResponse promoteToAdmin(User currentUser, Long groupId, Long targetUserId);

    ChatResponse demoteAdmin(User currentUser, Long groupId, Long targetUserId);

    ChatResponse updateGroupInfo(User currentUser, Long groupId, String name, String description, MultipartFile groupPicture);
}
