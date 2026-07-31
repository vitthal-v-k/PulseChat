package com.vitthal.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Stores privacy configuration for a status post.
 * Controls which users can or cannot see the status.
 * Maps to the 'status_privacy' table.
 */
@Entity
@Table(name = "status_privacy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusPrivacyConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private Status status;

    /**
     * User IDs hidden from this status (used with MY_CONTACTS_EXCEPT privacy).
     * Stored as comma-separated user IDs.
     */
    @Column(name = "hidden_from_user_ids", columnDefinition = "TEXT")
    private String hiddenFromUserIds;

    /**
     * User IDs who can see this status (used with ONLY_SHARE_WITH privacy).
     * Stored as comma-separated user IDs.
     */
    @Column(name = "visible_to_user_ids", columnDefinition = "TEXT")
    private String visibleToUserIds;
}
