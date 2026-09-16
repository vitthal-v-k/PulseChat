package com.vitthal.chatapp.websocket;

import com.vitthal.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Resets stale online-status flags on every server startup.
 *
 * Railway (and most cloud platforms) can kill the process abruptly, which means
 * SessionDisconnectEvent never fires for connected users. Without this reset,
 * those users remain marked isOnline=true indefinitely.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PresenceResetOnStartup {

    private final UserRepository userRepository;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void resetStalePresence() {
        int count = userRepository.resetAllUsersOffline();
        if (count > 0) {
            log.info("PresenceReset: marked {} stale-online user(s) as offline on startup.", count);
        }
    }
}
