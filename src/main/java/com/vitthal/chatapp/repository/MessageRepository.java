package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.Message;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Paginated messages for a chat (for infinite scroll), excluding globally deleted ones */
    @Query("SELECT DISTINCT m FROM Message m JOIN FETCH m.sender LEFT JOIN FETCH m.attachments WHERE m.chat = :chat AND m.isDeletedForEveryone = false " +
           "ORDER BY m.createdAt DESC")
    Page<Message> findByChatOrderByCreatedAtDesc(@Param("chat") Chat chat, Pageable pageable);

    /** Get the most recent non-deleted message in a chat (for sidebar preview) */
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.chat = :chat AND m.isDeletedForEveryone = false " +
           "ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLatestMessageByChat(@Param("chat") Chat chat);

    /** Search messages by text content in a chat */
    @Query("SELECT m FROM Message m JOIN FETCH m.sender WHERE m.chat = :chat AND m.isDeletedForEveryone = false " +
           "AND LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY m.createdAt DESC")
    Page<Message> searchMessagesInChat(@Param("chat") Chat chat,
                                       @Param("query") String query,
                                       Pageable pageable);

    /** Count undelivered messages in a chat for a user */
    @Query("SELECT COUNT(m) FROM Message m JOIN m.statuses s WHERE m.chat = :chat " +
           "AND s.user = :user AND s.status = 'SENT'")
    long countUnreadMessages(@Param("chat") Chat chat, @Param("user") User user);

    /** Starred messages for a user */
    @Query("SELECT m FROM Message m JOIN m.starredBy sb WHERE sb.user = :user " +
           "ORDER BY sb.starredAt DESC")
    Page<Message> findStarredMessagesByUser(@Param("user") User user, Pageable pageable);
}
