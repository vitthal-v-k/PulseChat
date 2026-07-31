package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.response.FriendRequestResponse;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface FriendService {

    FriendRequestResponse sendFriendRequest(User currentUser, Long receiverId);

    FriendRequestResponse acceptFriendRequest(User currentUser, Long requestId);

    FriendRequestResponse rejectFriendRequest(User currentUser, Long requestId);

    void cancelFriendRequest(User currentUser, Long requestId);

    void removeFriend(User currentUser, Long friendId);

    void blockUser(User currentUser, Long targetUserId);

    void unblockUser(User currentUser, Long targetUserId);

    Page<UserResponse> getFriends(User currentUser, Pageable pageable);

    List<FriendRequestResponse> getPendingReceivedRequests(User currentUser);

    List<FriendRequestResponse> getPendingSentRequests(User currentUser);
}
