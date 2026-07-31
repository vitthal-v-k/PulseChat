package com.vitthal.chatapp.service;

import com.vitthal.chatapp.constants.NotificationType;
import com.vitthal.chatapp.dto.response.NotificationResponse;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    void createNotification(User recipient, User actor, NotificationType type, String title, String body, Long referenceId);

    Page<NotificationResponse> getUserNotifications(User currentUser, Pageable pageable);

    long getUnreadCount(User currentUser);

    void markAsRead(User currentUser, Long notificationId);

    void markAllAsRead(User currentUser);
}
