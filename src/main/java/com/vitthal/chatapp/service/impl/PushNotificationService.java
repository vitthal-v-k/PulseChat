package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.entity.PushSubscription;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.repository.PushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.jose4j.lang.JoseException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;
import java.util.concurrent.ExecutionException;

/**
 * Sends Web Push notifications to browsers using VAPID authentication.
 * Uses the nl.martijndwars:web-push library.
 */
@Slf4j
@Service
public class PushNotificationService {

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${app.vapid.private-key}")
    private String vapidPrivateKey;

    @Value("${app.vapid.subject}")
    private String vapidSubject;

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private PushService pushService;

    public PushNotificationService(PushSubscriptionRepository pushSubscriptionRepository) {
        this.pushSubscriptionRepository = pushSubscriptionRepository;
    }

    @PostConstruct
    public void init() {
        // Register BouncyCastle for elliptic curve crypto
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        try {
            pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
        } catch (Exception e) {
            log.error("Failed to initialize PushService", e);
        }
    }

    /**
     * Sends a push notification to all subscribed devices of a user.
     * Runs asynchronously so it doesn't block the message response.
     *
     * @param recipient  The user to notify
     * @param title      Notification title (e.g. sender name)
     * @param body       Notification body (e.g. message preview)
     * @param chatId     Chat ID — used by service worker to navigate on click
     */
    @Async
    public void sendToUser(User recipient, String title, String body, Long chatId) {
        if (pushService == null) return;

        List<PushSubscription> subscriptions = pushSubscriptionRepository.findByUser(recipient);
        if (subscriptions.isEmpty()) return;

        // Build JSON payload
        String payload = String.format(
                "{\"title\":\"%s\",\"body\":\"%s\",\"chatId\":%d,\"icon\":\"/logo.svg\"}",
                escapeJson(title), escapeJson(body), chatId
        );

        for (PushSubscription sub : subscriptions) {
            try {
                Subscription subscription = new Subscription(
                        sub.getEndpoint(),
                        new Subscription.Keys(sub.getP256dh(), sub.getAuth())
                );
                Notification notification = new Notification(subscription, payload);
                pushService.send(notification);
                log.debug("Push sent to user {} endpoint {}", recipient.getUsername(), sub.getEndpoint());
            } catch (Exception e) {
                log.warn("Failed to send push to endpoint {}: {}", sub.getEndpoint(), e.getMessage());
                // Remove dead subscriptions (410 Gone)
                if (e.getMessage() != null && e.getMessage().contains("410")) {
                    pushSubscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                }
            }
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r");
    }
}
