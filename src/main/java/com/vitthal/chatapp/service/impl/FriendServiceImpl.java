package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.FriendRequestStatus;
import com.vitthal.chatapp.constants.NotificationType;
import com.vitthal.chatapp.dto.response.FriendRequestResponse;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.FriendRequest;
import com.vitthal.chatapp.entity.Friendship;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.UserMapper;
import com.vitthal.chatapp.repository.FriendRequestRepository;
import com.vitthal.chatapp.repository.FriendshipRepository;
import com.vitthal.chatapp.repository.UserRepository;
import com.vitthal.chatapp.service.FriendService;
import com.vitthal.chatapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendServiceImpl implements FriendService {

    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public FriendRequestResponse sendFriendRequest(User currentUser, Long receiverId) {
        if (currentUser.getId().equals(receiverId)) {
            throw new BadRequestException("You cannot send a friend request to yourself");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", receiverId));

        if (friendshipRepository.areFriends(currentUser, receiver)) {
            throw new BadRequestException("You are already friends with this user");
        }

        Optional<FriendRequest> existingRequest = friendRequestRepository.findBetweenUsers(currentUser.getId(), receiverId);
        if (existingRequest.isPresent()) {
            FriendRequest fr = existingRequest.get();
            if (fr.getStatus() == FriendRequestStatus.PENDING) {
                if (fr.getSender().getId().equals(currentUser.getId())) {
                    throw new BadRequestException("Friend request already sent");
                } else {
                    throw new BadRequestException("This user has already sent you a friend request. Please check your Friend Requests tab to accept it!");
                }
            } else {
                // Reuse existing row to avoid duplicate key constraints in MySQL
                fr.setSender(currentUser);
                fr.setReceiver(receiver);
                fr.setStatus(FriendRequestStatus.PENDING);
                fr.setRespondedAt(null);
                FriendRequest saved = friendRequestRepository.save(fr);
                notifyReceiver(receiver, currentUser, saved.getId());
                return toResponse(saved);
            }
        }

        FriendRequest request = FriendRequest.builder()
                .sender(currentUser)
                .receiver(receiver)
                .status(FriendRequestStatus.PENDING)
                .build();

        FriendRequest saved = friendRequestRepository.save(request);
        notifyReceiver(receiver, currentUser, saved.getId());

        return toResponse(saved);
    }

    private void notifyReceiver(User receiver, User currentUser, Long requestId) {
        notificationService.createNotification(
                receiver,
                currentUser,
                NotificationType.FRIEND_REQUEST,
                "New Friend Request",
                currentUser.getFullName() + " sent you a friend request.",
                requestId
        );
    }

    @Override
    @Transactional
    public FriendRequestResponse acceptFriendRequest(User currentUser, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot accept a friend request that was not sent to you");
        }

        if (request.getStatus() != FriendRequestStatus.PENDING) {
            throw new BadRequestException("Friend request is no longer pending");
        }

        request.setStatus(FriendRequestStatus.ACCEPTED);
        request.setRespondedAt(LocalDateTime.now());
        FriendRequest saved = friendRequestRepository.save(request);

        User user1 = request.getSender().getId() < request.getReceiver().getId() ? request.getSender() : request.getReceiver();
        User user2 = request.getSender().getId() < request.getReceiver().getId() ? request.getReceiver() : request.getSender();

        Friendship friendship = Friendship.builder()
                .user1(user1)
                .user2(user2)
                .isBlocked(false)
                .build();
        friendshipRepository.save(friendship);

        notificationService.createNotification(
                request.getSender(),
                currentUser,
                NotificationType.FRIEND_REQUEST,
                "Friend Request Accepted",
                currentUser.getFullName() + " accepted your friend request.",
                saved.getId()
        );

        return toResponse(saved);
    }

    @Override
    @Transactional
    public FriendRequestResponse rejectFriendRequest(User currentUser, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot reject a friend request that was not sent to you");
        }

        request.setStatus(FriendRequestStatus.REJECTED);
        request.setRespondedAt(LocalDateTime.now());
        return toResponse(friendRequestRepository.save(request));
    }

    @Override
    @Transactional
    public void cancelFriendRequest(User currentUser, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("FriendRequest", "id", requestId));

        if (!request.getSender().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only cancel requests sent by yourself");
        }

        request.setStatus(FriendRequestStatus.CANCELLED);
        friendRequestRepository.save(request);
    }

    @Override
    @Transactional
    public void removeFriend(User currentUser, Long friendId) {
        friendshipRepository.findByUsersByIds(currentUser.getId(), friendId).ifPresent(friendshipRepository::delete);
        friendRequestRepository.findBetweenUsers(currentUser.getId(), friendId).ifPresent(friendRequestRepository::delete);
    }

    @Override
    @Transactional
    public void blockUser(User currentUser, Long targetUserId) {
        if (currentUser.getId().equals(targetUserId)) {
            throw new BadRequestException("You cannot block yourself");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        User user1 = currentUser.getId() < targetUserId ? currentUser : targetUser;
        User user2 = currentUser.getId() < targetUserId ? targetUser : currentUser;

        Friendship friendship = friendshipRepository.findByUsersByIds(currentUser.getId(), targetUserId)
                .orElseGet(() -> Friendship.builder()
                        .user1(user1)
                        .user2(user2)
                        .build());

        friendship.setIsBlocked(true);
        friendship.setBlockedBy(currentUser);
        friendship.setBlockedAt(LocalDateTime.now());
        friendshipRepository.save(friendship);
    }

    @Override
    @Transactional
    public void unblockUser(User currentUser, Long targetUserId) {
        Friendship friendship = friendshipRepository.findByUsersByIds(currentUser.getId(), targetUserId)
                .orElseThrow(() -> new BadRequestException("No friendship or block record found"));

        if (!Boolean.TRUE.equals(friendship.getIsBlocked()) || !currentUser.getId().equals(friendship.getBlockedBy().getId())) {
            throw new BadRequestException("You have not blocked this user");
        }

        friendship.setIsBlocked(false);
        friendship.setBlockedBy(null);
        friendship.setBlockedAt(null);
        friendshipRepository.save(friendship);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> getFriends(User currentUser, Pageable pageable) {
        List<Friendship> friendships = friendshipRepository.findAllFriendshipsByUserId(currentUser.getId());
        List<UserResponse> friendResponses = friendships.stream()
                .map(f -> f.getUser1().getId().equals(currentUser.getId()) ? f.getUser2() : f.getUser1())
                .map(userMapper::toResponse)
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), friendResponses.size());
        List<UserResponse> subList = (start <= friendResponses.size()) ? friendResponses.subList(start, end) : Collections.emptyList();

        return new PageImpl<>(subList, pageable, friendResponses.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getPendingReceivedRequests(User currentUser) {
        return friendRequestRepository.findByReceiverIdAndStatus(currentUser.getId(), FriendRequestStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<FriendRequestResponse> getPendingSentRequests(User currentUser) {
        return friendRequestRepository.findBySenderIdAndStatus(currentUser.getId(), FriendRequestStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    private FriendRequestResponse toResponse(FriendRequest request) {
        return FriendRequestResponse.builder()
                .id(request.getId())
                .sender(userMapper.toResponse(request.getSender()))
                .receiver(userMapper.toResponse(request.getReceiver()))
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .respondedAt(request.getRespondedAt())
                .build();
    }
}
