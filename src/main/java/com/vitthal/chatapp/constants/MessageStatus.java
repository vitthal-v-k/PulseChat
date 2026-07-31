package com.vitthal.chatapp.constants;

/**
 * Represents the delivery status of a chat message.
 */
public enum MessageStatus {
    /** Message has been sent to the server */
    SENT,
    /** Message has been delivered to the recipient's device */
    DELIVERED,
    /** Message has been read by the recipient */
    READ
}
