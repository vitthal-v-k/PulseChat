package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a user's membership in a chat.
 * Tracks per-user chat preferences (pin, archive, mute) and group admin status.
 * Maps to the 'chat_members' table.
 */
@Entity
@Table(name = "chat_members",
        uniqueConstraints = @UniqueConstraint(columnNames = {"chat_id", "user_id"}),
        indexes = {
                @Index(name = "idx_cm_chat", columnList = "chat_id"),
                @Index(name = "idx_cm_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Whether this member is an admin (group chats only) */
    @Column(name = "is_admin", nullable = false)
    @Builder.Default
    private Boolean isAdmin = false;

    /** Whether this chat is pinned for this user */
    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    /** Whether this chat is archived for this user */
    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    /** Whether notifications are muted for this user */
    @Column(name = "is_muted", nullable = false)
    @Builder.Default
    private Boolean isMuted = false;

    /** Whether the chat is marked as unread */
    @Column(name = "is_marked_unread", nullable = false)
    @Builder.Default
    private Boolean isMarkedUnread = false;

    /** Timestamp when user deleted/cleared this chat (messages before this are hidden) */
    @Column(name = "cleared_at")
    private LocalDateTime clearedAt;

    /** Timestamp when user deleted this chat */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    /** When the member left the group (null means still member) */
    @Column(name = "left_at")
    private LocalDateTime leftAt;

    /** Count of unread messages for this member */
    @Column(name = "unread_count")
    @Builder.Default
    private Integer unreadCount = 0;
}
