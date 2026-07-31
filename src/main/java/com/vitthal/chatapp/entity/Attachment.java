package com.vitthal.chatapp.entity;

import com.vitthal.chatapp.constants.AttachmentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a file attachment linked to a message.
 * Maps to the 'attachments' table.
 */
@Entity
@Table(name = "attachments", indexes = {
        @Index(name = "idx_attach_message", columnList = "message_id"),
        @Index(name = "idx_attach_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttachmentType type;

    /** Cloudinary secure URL */
    @Column(nullable = false)
    private String url;

    /** Cloudinary public_id for deletion */
    @Column(name = "public_id")
    private String publicId;

    @Column(name = "file_name", length = 255)
    private String fileName;

    /** File size in bytes */
    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    /** Duration in seconds for audio/video attachments */
    private Integer duration;

    /** Thumbnail URL for video attachments */
    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    /** Width of image/video in pixels */
    private Integer width;

    /** Height of image/video in pixels */
    private Integer height;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
