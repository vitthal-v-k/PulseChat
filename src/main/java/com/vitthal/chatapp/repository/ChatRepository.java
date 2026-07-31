package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.constants.ChatType;
import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {

    /** Find existing private chat between two specific users */
    @Query("SELECT c FROM Chat c JOIN c.members m1 JOIN c.members m2 " +
           "WHERE c.type = 'PRIVATE' AND m1.user = :user1 AND m2.user = :user2 " +
           "AND m1.leftAt IS NULL AND m2.leftAt IS NULL")
    Optional<Chat> findPrivateChatBetween(@Param("user1") User user1, @Param("user2") User user2);

    /** Find all chats for a user (not deleted, ordered by last message time) */
    @Query("SELECT c FROM Chat c JOIN c.members m WHERE m.user = :user " +
           "AND m.leftAt IS NULL AND m.deletedAt IS NULL " +
           "ORDER BY c.updatedAt DESC NULLS LAST")
    List<Chat> findChatsForUser(@Param("user") User user);

    List<Chat> findByTypeAndCreatedBy(ChatType type, User createdBy);
}
