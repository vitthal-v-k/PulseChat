package com.vitthal.chatapp.entity;

import com.vitthal.chatapp.constants.UserRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Represents a registered user in the ChatApp system.
 * Maps to the 'users' table.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_username", columnList = "username"),
        @Index(name = "idx_user_unique_number", columnList = "unique_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(min = 3, max = 50)
    @Column(unique = true, nullable = false, length = 50)
    private String username;

    /** Unique 10-digit numeric ID (like a phone number) for easy contact discovery */
    @Column(name = "unique_number", unique = true, length = 15)
    private String uniqueNumber;

    @NotBlank
    @Email
    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @NotBlank
    @Column(nullable = false)
    private String password;

    @Size(max = 100)
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Size(max = 200)
    @Column(length = 200)
    private String bio;

    @Column(name = "profile_picture")
    private String profilePicture;

    @Column(name = "profile_picture_public_id")
    private String profilePicturePublicId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private UserRole role = UserRole.USER;

    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "is_online", nullable = false)
    @Builder.Default
    private Boolean isOnline = false;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    /** Privacy: who can see last seen - ALL, CONTACTS, NOBODY */
    @Column(name = "last_seen_privacy", length = 20)
    @Builder.Default
    private String lastSeenPrivacy = "ALL";

    /** Privacy: who can see profile photo - ALL, CONTACTS, NOBODY */
    @Column(name = "profile_photo_privacy", length = 20)
    @Builder.Default
    private String profilePhotoPrivacy = "ALL";

    /** Privacy: who can add user to groups - ALL, CONTACTS, NOBODY */
    @Column(name = "group_add_privacy", length = 20)
    @Builder.Default
    private String groupAddPrivacy = "ALL";

    @Column(name = "notification_enabled")
    @Builder.Default
    private Boolean notificationEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =========================================================
    //  Relationships
    // =========================================================

    @OneToMany(mappedBy = "sender", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<FriendRequest> sentFriendRequests = new HashSet<>();

    @OneToMany(mappedBy = "receiver", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<FriendRequest> receivedFriendRequests = new HashSet<>();
}
