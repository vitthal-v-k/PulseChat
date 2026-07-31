package com.vitthal.chatapp.entity;

import com.vitthal.chatapp.constants.StatusPrivacyType;
import com.vitthal.chatapp.constants.StatusType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a user's story/status post (auto-deletes after 24 hours).
 * Maps to the 'status' table.
 */
@Entity
@Table(name = "status", indexes = {
        @Index(name = "idx_status_user", columnList = "user_id"),
        @Index(name = "idx_status_expires", columnList = "expires_at"),
        @Index(name = "idx_status_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusType type;

    /** Text content (for TEXT type or caption on IMAGE/VIDEO) */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** Background color for TEXT type status (hex code) */
    @Column(name = "background_color", length = 10)
    @Builder.Default
    private String backgroundColor = "#128C7E";

    /** Text color for TEXT type status (hex code) */
    @Column(name = "text_color", length = 10)
    @Builder.Default
    private String textColor = "#FFFFFF";

    @Enumerated(EnumType.STRING)
    @Column(name = "privacy_type")
    @Builder.Default
    private StatusPrivacyType privacyType = StatusPrivacyType.MY_CONTACTS;

    /** Total view count (denormalized for performance) */
    @Column(name = "view_count")
    @Builder.Default
    private Integer viewCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** Stories auto-delete after 24 hours */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // =========================================================
    //  Relationships
    // =========================================================

    @OneToMany(mappedBy = "status", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StatusMedia> mediaItems = new ArrayList<>();

    @OneToMany(mappedBy = "status", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StatusView> views = new ArrayList<>();

    @OneToMany(mappedBy = "status", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StatusReaction> reactions = new ArrayList<>();

    @OneToOne(mappedBy = "status", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StatusPrivacyConfig privacyConfig;
}
