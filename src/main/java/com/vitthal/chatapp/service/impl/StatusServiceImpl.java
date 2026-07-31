package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.NotificationType;
import com.vitthal.chatapp.constants.StatusPrivacyType;
import com.vitthal.chatapp.constants.StatusType;
import com.vitthal.chatapp.dto.request.CreateStatusRequest;
import com.vitthal.chatapp.dto.response.StatusResponse;
import com.vitthal.chatapp.dto.response.StatusViewResponse;
import com.vitthal.chatapp.entity.*;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.StatusMapper;
import com.vitthal.chatapp.repository.*;
import com.vitthal.chatapp.service.CloudinaryService;
import com.vitthal.chatapp.service.NotificationService;
import com.vitthal.chatapp.service.StatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StatusServiceImpl implements StatusService {

    private final StatusRepository statusRepository;
    private final StatusMediaRepository statusMediaRepository;
    private final StatusViewRepository statusViewRepository;
    private final StatusReactionRepository statusReactionRepository;
    private final StatusMapper statusMapper;
    private final CloudinaryService cloudinaryService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public StatusResponse createStatus(User currentUser, CreateStatusRequest request, List<MultipartFile> mediaFiles) {
        StatusType statusType = StatusType.valueOf(request.getType());
        StatusPrivacyType privacy = request.getPrivacyType() != null ?
                StatusPrivacyType.valueOf(request.getPrivacyType()) : StatusPrivacyType.MY_CONTACTS;

        Status status = Status.builder()
                .user(currentUser)
                .type(statusType)
                .content(request.getContent())
                .backgroundColor(request.getBackgroundColor() != null ? request.getBackgroundColor() : "#128C7E")
                .textColor(request.getTextColor() != null ? request.getTextColor() : "#FFFFFF")
                .privacyType(privacy)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();

        Status savedStatus = statusRepository.save(status);

        if (mediaFiles != null && !mediaFiles.isEmpty()) {
            int order = 0;
            for (MultipartFile file : mediaFiles) {
                if (file != null && !file.isEmpty()) {
                    boolean isVideo = file.getContentType() != null && file.getContentType().startsWith("video/");
                    Map upload = isVideo ? cloudinaryService.uploadVideo(file, "statuses") : cloudinaryService.uploadImage(file, "statuses");

                    StatusMedia media = StatusMedia.builder()
                            .status(savedStatus)
                            .mediaUrl((String) upload.get("secure_url"))
                            .publicId((String) upload.get("public_id"))
                            .mediaType(isVideo ? "VIDEO" : "IMAGE")
                            .displayOrder(order++)
                            .build();

                    statusMediaRepository.save(media);
                    if (savedStatus.getMediaItems() == null) {
                        savedStatus.setMediaItems(new java.util.ArrayList<>());
                    }
                    savedStatus.getMediaItems().add(media);
                }
            }
        }

        return statusMapper.toResponse(savedStatus, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StatusResponse> getContactStatuses(User currentUser) {
        List<Status> statuses = statusRepository.findContactStatuses(currentUser, LocalDateTime.now());
        return statuses.stream().map(s -> statusMapper.toResponse(s, currentUser)).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StatusResponse> getMyStatuses(User currentUser) {
        List<Status> statuses = statusRepository.findActiveStatusesByUser(currentUser, LocalDateTime.now());
        return statuses.stream().map(s -> statusMapper.toResponse(s, currentUser)).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public StatusViewResponse viewStatus(User currentUser, Long statusId, String replyText) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status", "id", statusId));

        if (status.getUser().getId().equals(currentUser.getId())) {
            // Viewing own status
            return null;
        }

        Optional<StatusView> existingView = statusViewRepository.findByStatusAndViewer(status, currentUser);
        StatusView view;
        if (existingView.isPresent()) {
            view = existingView.get();
            if (replyText != null) {
                view.setReplyText(replyText);
                view = statusViewRepository.save(view);
            }
        } else {
            view = StatusView.builder()
                    .status(status)
                    .viewer(currentUser)
                    .replyText(replyText)
                    .build();
            view = statusViewRepository.save(view);

            status.setViewCount(status.getViewCount() + 1);
            statusRepository.save(status);

            notificationService.createNotification(
                    status.getUser(), currentUser, NotificationType.STORY,
                    "Story Viewed",
                    currentUser.getFullName() + " viewed your story.",
                    status.getId()
            );
        }

        return statusMapper.toViewResponse(view);
    }

    @Override
    @Transactional
    public StatusResponse reactToStatus(User currentUser, Long statusId, String emoji) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status", "id", statusId));

        Optional<StatusReaction> existing = statusReactionRepository.findByStatusAndReactor(status, currentUser);
        if (existing.isPresent()) {
            StatusReaction reaction = existing.get();
            reaction.setEmoji(emoji);
            statusReactionRepository.save(reaction);
        } else {
            StatusReaction reaction = StatusReaction.builder()
                    .status(status)
                    .reactor(currentUser)
                    .emoji(emoji)
                    .build();
            statusReactionRepository.save(reaction);
        }

        return statusMapper.toResponse(status, currentUser);
    }

    @Override
    @Transactional
    public void deleteStatus(User currentUser, Long statusId) {
        Status status = statusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("Status", "id", statusId));

        if (!status.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only delete your own status");
        }

        for (StatusMedia media : status.getMediaItems()) {
            if (media.getPublicId() != null) {
                cloudinaryService.deleteFile(media.getPublicId());
            }
        }

        statusRepository.delete(status);
    }

    @Override
    @Scheduled(cron = "0 */15 * * * *") // Run every 15 minutes
    @Transactional
    public void autoDeleteExpiredStatuses() {
        int deleted = statusRepository.deleteExpiredStatuses(LocalDateTime.now());
        if (deleted > 0) {
            log.info("Auto-deleted {} expired statuses", deleted);
        }
    }
}
