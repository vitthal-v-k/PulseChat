package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.constants.ChatType;
import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.Message;
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

    /**
     * PERF FIX: Replaces findChatsForUser + N findByChatAndUser calls.
     * Returns [Chat, ChatMember] pairs -- the user's ChatMember is fetched in one round-trip.
     */
    @Query("SELECT c, cm FROM Chat c JOIN c.members cm " +
           "WHERE cm.user = :user AND cm.leftAt IS NULL AND cm.deletedAt IS NULL " +
           "ORDER BY c.updatedAt DESC NULLS LAST")
    List<Object[]> findChatsWithMemberForUser(@Param("user") User user);

    /**
     * PERF FIX: Fetches the latest non-deleted message for ALL given chat IDs in ONE query.
     * Uses MAX(id) GROUP BY to replace N findLatestMessageByChat() calls.
     */
    @Query("SELECT m FROM Message m JOIN FETCH m.sender " +
           "WHERE m.id IN (" +
           "  SELECT MAX(m2.id) FROM Message m2 " +
           "  WHERE m2.chat.id IN :chatIds AND m2.isDeletedForEveryone = false " +
           "  GROUP BY m2.chat.id" +
           ")")
    List<Message> findLatestMessagesForChats(@Param("chatIds") List<Long> chatIds);

    List<Chat> findByTypeAndCreatedBy(ChatType type, User createdBy);
}
