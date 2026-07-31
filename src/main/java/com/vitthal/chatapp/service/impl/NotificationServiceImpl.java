package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.NotificationType;
import com.vitthal.chatapp.dto.response.NotificationResponse;
import com.vitthal.chatapp.entity.Notification;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.mapper.UserMapper;
import com.vitthal.chatapp.repository.NotificationRepository;
import com.vitthal.chatapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserMapper userMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void createNotification(User recipient, User actor, NotificationType type, String title, String body, Long referenceId) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .type(type)
                .title(title)
                .body(body)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);

        // Push real-time notification over STOMP WebSocket: /user/{email}/queue/notifications
        NotificationResponse response = toResponse(saved);
        messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", response);
    }

    @Override
    public Page<NotificationResponse> getUserNotifications(User currentUser, Pageable pageable) {
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser, pageable)
                .map(this::toResponse);
    }

    @Override
    public long getUnreadCount(User currentUser) {
        return notificationRepository.countByRecipientAndIsReadFalse(currentUser);
    }

    @Override
    @Transactional
    public void markAsRead(User currentUser, Long notificationId) {
        notificationRepository.markAsRead(notificationId);
    }

    @Override
    @Transactional
    public void markAllAsRead(User currentUser) {
        notificationRepository.markAllAsRead(currentUser);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .actor(userMapper.toResponse(n.getActor()))
                .type(n.getType() != null ? n.getType().name() : null)
                .title(n.getTitle())
                .body(n.getBody())
                .referenceId(n.getReferenceId())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
