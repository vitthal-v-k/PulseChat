package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents an emoji reaction on a status/story.
 * Maps to the 'status_reactions' table.
 */
@Entity
@Table(name = "status_reactions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"status_id", "reactor_id"}),
        indexes = {
                @Index(name = "idx_sr_status", columnList = "status_id"),
                @Index(name = "idx_sr_reactor", columnList = "reactor_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reactor_id", nullable = false)
    private User reactor;

    /** Emoji character (e.g., "❤️", "😂") */
    @Column(nullable = false, length = 10)
    private String emoji;

    @CreationTimestamp
    @Column(name = "reacted_at", nullable = false, updatable = false)
    private LocalDateTime reactedAt;
}
