package com.vitthal.chatapp.constants;

/**
 * Privacy setting for who can view a user's status.
 */
public enum StatusPrivacyType {
    /** Visible to all contacts */
    EVERYONE,
    /** Visible only to selected contacts */
    MY_CONTACTS,
    /** Visible only to selected contacts, excluding some */
    MY_CONTACTS_EXCEPT,
    /** Visible only to selected users */
    ONLY_SHARE_WITH
}
