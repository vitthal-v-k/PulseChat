package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Chat;
import com.vitthal.chatapp.entity.ChatMember;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMemberRepository extends JpaRepository<ChatMember, Long> {

    Optional<ChatMember> findByChatAndUser(Chat chat, User user);

    List<ChatMember> findByChatAndLeftAtIsNull(Chat chat);

    boolean existsByChatAndUserAndLeftAtIsNull(Chat chat, User user);

    @Modifying
    @Query("UPDATE ChatMember cm SET cm.unreadCount = 0 WHERE cm.chat = :chat AND cm.user = :user")
    void resetUnreadCount(@Param("chat") Chat chat, @Param("user") User user);

    @Modifying
    @Query("UPDATE ChatMember cm SET cm.unreadCount = cm.unreadCount + 1 " +
           "WHERE cm.chat = :chat AND cm.user != :sender AND cm.leftAt IS NULL")
    void incrementUnreadCount(@Param("chat") Chat chat, @Param("sender") User sender);

    @Query("SELECT COUNT(cm) FROM ChatMember cm WHERE cm.chat = :chat AND cm.leftAt IS NULL")
    long countActiveMembers(@Param("chat") Chat chat);
}
