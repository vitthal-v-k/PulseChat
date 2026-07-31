package com.vitthal.chatapp.constants;

/**
 * Type of in-app notification.
 */
public enum NotificationType {
    /** New chat message */
    MESSAGE,
    /** Incoming friend request */
    FRIEND_REQUEST,
    /** New story posted by a contact */
    STORY,
    /** Group-related events (add, remove, promote) */
    GROUP
}
