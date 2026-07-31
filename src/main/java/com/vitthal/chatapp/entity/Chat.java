package com.vitthal.chatapp.entity;

import com.vitthal.chatapp.constants.ChatType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a chat conversation — either a private 1-on-1 chat or a group chat.
 * Maps to the 'chats' table.
 */
@Entity
@Table(name = "chats", indexes = {
        @Index(name = "idx_chat_type", columnList = "type"),
        @Index(name = "idx_chat_created_by", columnList = "created_by_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatType type;

    /** Only relevant for GROUP chats */
    @Column(length = 100)
    private String name;

    /** Group description */
    @Column(length = 300)
    private String description;

    /** Cloudinary URL for group picture */
    @Column(name = "group_picture")
    private String groupPicture;

    @Column(name = "group_picture_public_id")
    private String groupPicturePublicId;

    /** User who created this chat (for groups, the initial admin) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =========================================================
    //  Relationships
    // =========================================================

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ChatMember> members = new ArrayList<>();

    @OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();
}
