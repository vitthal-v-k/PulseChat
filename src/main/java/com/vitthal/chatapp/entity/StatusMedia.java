package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a media item (image/video) within a status post.
 * A single status can contain multiple media items.
 * Maps to the 'status_media' table.
 */
@Entity
@Table(name = "status_media", indexes = {
        @Index(name = "idx_sm_status", columnList = "status_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    /** Cloudinary URL of the media */
    @Column(name = "media_url", nullable = false)
    private String mediaUrl;

    /** Cloudinary public_id for deletion */
    @Column(name = "public_id")
    private String publicId;

    /** IMAGE or VIDEO */
    @Column(name = "media_type", length = 20)
    private String mediaType;

    /** Duration in seconds for video media */
    private Integer duration;

    /** Thumbnail URL for video media */
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    /** Display order within the status */
    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
