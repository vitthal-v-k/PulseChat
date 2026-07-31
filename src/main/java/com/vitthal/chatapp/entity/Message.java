package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a message sent in a chat.
 * Maps to the 'messages' table.
 */
@Entity
@Table(name = "messages", indexes = {
        @Index(name = "idx_msg_chat", columnList = "chat_id"),
        @Index(name = "idx_msg_sender", columnList = "sender_id"),
        @Index(name = "idx_msg_timestamp", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    /** Text content of the message (null for media-only messages) */
    @Column(columnDefinition = "TEXT")
    private String content;

    /** Type of message: TEXT, IMAGE, VIDEO, AUDIO, FILE, LOCATION */
    @Column(name = "message_type", length = 20)
    @Builder.Default
    private String messageType = "TEXT";

    /** Message being replied to */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Message replyTo;

    /** Original message if this was forwarded */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forwarded_from_id")
    private Message forwardedFrom;

    /** Serialized emoji reactions: {"👍":["userId1","userId2"]} */
    @Column(columnDefinition = "TEXT")
    private String reactions;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    /** True if deleted for all chat participants */
    @Column(name = "is_deleted_for_everyone", nullable = false)
    @Builder.Default
    private Boolean isDeletedForEveryone = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =========================================================
    //  Relationships
    // =========================================================

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<MessageStatusEntity> statuses = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<StarredMessage> starredBy = new ArrayList<>();
}
