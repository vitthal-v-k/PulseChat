package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Tracks which users have viewed a status/story.
 * Maps to the 'status_views' table.
 */
@Entity
@Table(name = "status_views",
        uniqueConstraints = @UniqueConstraint(columnNames = {"status_id", "viewer_id"}),
        indexes = {
                @Index(name = "idx_sv_status", columnList = "status_id"),
                @Index(name = "idx_sv_viewer", columnList = "viewer_id")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viewer_id", nullable = false)
    private User viewer;

    @CreationTimestamp
    @Column(name = "viewed_at", nullable = false, updatable = false)
    private LocalDateTime viewedAt;

    /** Reply text left by the viewer on this status */
    @Column(name = "reply_text", columnDefinition = "TEXT")
    private String replyText;
}
