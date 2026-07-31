package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a confirmed friendship between two users.
 * Maps to the 'friendships' table.
 * Also tracks blocking status.
 */
@Entity
@Table(name = "friendships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user1_id", "user2_id"}),
        indexes = {
                @Index(name = "idx_friendship_user1", columnList = "user1_id"),
                @Index(name = "idx_friendship_user2", columnList = "user2_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Friendship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** user1_id is always the smaller user id to prevent duplicate pairs */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user1_id", nullable = false)
    private User user1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user2_id", nullable = false)
    private User user2;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Whether one user has blocked the other */
    @Column(name = "is_blocked", nullable = false)
    @Builder.Default
    private Boolean isBlocked = false;

    /** The user who performed the block */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_by_id")
    private User blockedBy;

    @Column(name = "blocked_at")
    private LocalDateTime blockedAt;
}
