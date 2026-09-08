package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Stores a browser's Web Push subscription for a user.
 * Each browser/device creates its own subscription endpoint.
 */
@Entity
@Table(name = "push_subscriptions", indexes = {
        @Index(name = "idx_push_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The browser's unique push endpoint URL */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String endpoint;

    /** ECDH public key (p256dh) — base64url encoded */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String p256dh;

    /** Authentication secret — base64url encoded */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String auth;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
