package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.constants.MessageStatus;
import com.vitthal.chatapp.entity.Message;
import com.vitthal.chatapp.entity.MessageStatusEntity;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageStatusRepository extends JpaRepository<MessageStatusEntity, Long> {

    Optional<MessageStatusEntity> findByMessageAndUser(Message message, User user);

    List<MessageStatusEntity> findByMessage(Message message);

    @Modifying
    @Query("UPDATE MessageStatusEntity ms SET ms.status = :status, ms.readAt = CURRENT_TIMESTAMP " +
           "WHERE ms.message.chat.id = :chatId AND ms.user = :user AND ms.status != 'READ'")
    void markMessagesAsReadInChat(@Param("chatId") Long chatId,
                                  @Param("user") User user,
                                  @Param("status") MessageStatus status);

    @Modifying
    @Query("UPDATE MessageStatusEntity ms SET ms.status = 'DELIVERED', ms.deliveredAt = CURRENT_TIMESTAMP " +
           "WHERE ms.user = :user AND ms.status = 'SENT'")
    void markAllDelivered(@Param("user") User user);
}
