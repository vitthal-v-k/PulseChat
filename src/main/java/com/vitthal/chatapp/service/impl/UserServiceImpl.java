package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.FriendRequestStatus;
import com.vitthal.chatapp.dto.request.ChangePasswordRequest;
import com.vitthal.chatapp.dto.request.UpdateProfileRequest;
import com.vitthal.chatapp.dto.response.UserResponse;
import com.vitthal.chatapp.entity.FriendRequest;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.UserMapper;
import com.vitthal.chatapp.repository.FriendRequestRepository;
import com.vitthal.chatapp.repository.FriendshipRepository;
import com.vitthal.chatapp.repository.UserRepository;
import com.vitthal.chatapp.service.CloudinaryService;
import com.vitthal.chatapp.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final FriendshipRepository friendshipRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final UserMapper userMapper;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    @Transactional
    public void backfillUniqueNumbers() {
        try {
            List<User> users = userRepository.findAll();
            Random random = new Random();
            for (User u : users) {
                if (u.getUniqueNumber() == null || u.getUniqueNumber().isBlank() || u.getUniqueNumber().length() != 7) {
                    String num;
                    do {
                        int val = 1_000_000 + random.nextInt(9_000_000);
                        num = String.valueOf(val);
                    } while (userRepository.existsByUniqueNumber(num));
                    u.setUniqueNumber(num);
                    userRepository.save(u);
                }
            }
        } catch (Exception e) {
            // log error gracefully
        }
    }

    @Override
    public UserResponse getCurrentUserProfile(User currentUser) {
        if (currentUser.getUniqueNumber() == null || currentUser.getUniqueNumber().isBlank() || currentUser.getUniqueNumber().length() != 7) {
            Random random = new Random();
            String num;
            do {
                int val = 1_000_000 + random.nextInt(9_000_000);
                num = String.valueOf(val);
            } while (userRepository.existsByUniqueNumber(num));
            currentUser.setUniqueNumber(num);
            currentUser = userRepository.save(currentUser);
        }
        return userMapper.toResponse(currentUser);
    }

    @Override
    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return userMapper.toResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(User currentUser, UpdateProfileRequest request) {
        if (request.getUsername() != null && !request.getUsername().equals(currentUser.getUsername())) {
            if (userRepository.existsByUsername(request.getUsername())) {
                throw new BadRequestException("Username is already taken");
            }
            currentUser.setUsername(request.getUsername());
        }

        if (request.getFullName() != null) {
            currentUser.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            currentUser.setBio(request.getBio());
        }
        if (request.getLastSeenPrivacy() != null) {
            currentUser.setLastSeenPrivacy(request.getLastSeenPrivacy());
        }
        if (request.getProfilePhotoPrivacy() != null) {
            currentUser.setProfilePhotoPrivacy(request.getProfilePhotoPrivacy());
        }
        if (request.getGroupAddPrivacy() != null) {
            currentUser.setGroupAddPrivacy(request.getGroupAddPrivacy());
        }
        if (request.getNotificationEnabled() != null) {
            currentUser.setNotificationEnabled(request.getNotificationEnabled());
        }

        User updatedUser = userRepository.save(currentUser);
        return userMapper.toResponse(updatedUser);
    }

    @Override
    @Transactional
    public UserResponse uploadProfilePicture(User currentUser, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image file");
        }

        if (currentUser.getProfilePicturePublicId() != null) {
            cloudinaryService.deleteFile(currentUser.getProfilePicturePublicId());
        }

        Map uploadResult = cloudinaryService.uploadImage(file, "avatars");
        String url = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        currentUser.setProfilePicture(url);
        currentUser.setProfilePicturePublicId(publicId);

        User savedUser = userRepository.save(currentUser);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(User currentUser, ChangePasswordRequest request) {
        if (!passwordEncoder.matches(request.getCurrentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        currentUser.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> searchUsers(String query, User currentUser, Pageable pageable) {
        Page<User> users;
        // If the query is purely numeric, search by unique 10-digit number first, then DB ID
        if (query.matches("\\d+")) {
            users = userRepository.searchUsersByUniqueNumber(query, currentUser.getId(), pageable);
            if (users.isEmpty()) {
                try {
                    Long targetId = Long.parseLong(query);
                    users = userRepository.searchUsersById(targetId, currentUser.getId(), pageable);
                } catch (NumberFormatException e) {
                    users = userRepository.searchUsers(query, currentUser.getId(), pageable);
                }
            }
        } else {
            users = userRepository.searchUsers(query, currentUser.getId(), pageable);
        }
        return users.map(targetUser -> {
            UserResponse response = userMapper.toResponse(targetUser);

            if (friendshipRepository.areFriends(currentUser, targetUser)) {
                response.setFriendshipStatus("FRIEND");
            } else {
                Optional<FriendRequest> req = friendRequestRepository.findBetweenUsers(currentUser.getId(), targetUser.getId());
                if (req.isPresent() && req.get().getStatus() == FriendRequestStatus.PENDING) {
                    FriendRequest fr = req.get();
                    if (fr.getSender().getId().equals(currentUser.getId())) {
                        response.setFriendshipStatus("PENDING_SENT");
                    } else {
                        response.setFriendshipStatus("PENDING_RECEIVED");
                        response.setRequestId(fr.getId());
                    }
                } else {
                    response.setFriendshipStatus("NONE");
                }
            }
            return response;
        });
    }

    @Override
    @Transactional
    public void setUserOnlineStatus(User user, boolean isOnline) {
        userRepository.updateOnlineStatus(user.getId(), isOnline);
    }
}
