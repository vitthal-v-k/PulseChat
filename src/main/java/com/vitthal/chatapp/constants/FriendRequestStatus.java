package com.vitthal.chatapp.constants;

/**
 * Status of a friend request between two users.
 */
public enum FriendRequestStatus {
    /** Request has been sent and is awaiting response */
    PENDING,
    /** Request has been accepted */
    ACCEPTED,
    /** Request has been rejected */
    REJECTED,
    /** Request was cancelled by the sender */
    CANCELLED
}
