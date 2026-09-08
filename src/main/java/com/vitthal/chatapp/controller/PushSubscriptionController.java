package com.vitthal.chatapp.controller;

import com.vitthal.chatapp.entity.PushSubscription;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.repository.PushSubscriptionRepository;
import com.vitthal.chatapp.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST endpoints for managing browser push subscriptions.
 *
 * POST   /api/push/subscribe      — save a browser subscription
 * DELETE /api/push/unsubscribe    — remove a browser subscription
 * GET    /api/push/vapid-public-key — return VAPID public key to frontend
 */
@Slf4j
@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.vapid.public-key}")
    private String vapidPublicKey;

    /** Returns the VAPID public key so the frontend can subscribe */
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> getVapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", vapidPublicKey));
    }

    /** Saves (or updates) a browser's push subscription for the logged-in user */
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody Map<String, Object> body
    ) {
        User currentUser = userDetailsService.loadUserEntityByEmail(userDetails.getUsername());

        String endpoint = (String) body.get("endpoint");
        @SuppressWarnings("unchecked")
        Map<String, String> keys = (Map<String, String>) body.get("keys");
        if (endpoint == null || keys == null) {
            return ResponseEntity.badRequest().build();
        }

        String p256dh = keys.get("p256dh");
        String auth   = keys.get("auth");

        // Upsert — update if same endpoint already saved
        pushSubscriptionRepository.findByUserAndEndpoint(currentUser, endpoint)
                .ifPresentOrElse(
                        existing -> {
                            existing.setP256dh(p256dh);
                            existing.setAuth(auth);
                            pushSubscriptionRepository.save(existing);
                        },
                        () -> pushSubscriptionRepository.save(
                                PushSubscription.builder()
                                        .user(currentUser)
                                        .endpoint(endpoint)
                                        .p256dh(p256dh)
                                        .auth(auth)
                                        .build()
                        )
                );

        log.info("Push subscription saved for user {}", currentUser.getUsername());
        return ResponseEntity.ok().build();
    }

    /** Removes a push subscription (called when user denies or logs out) */
    @DeleteMapping("/unsubscribe")
    public ResponseEntity<Void> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        if (endpoint != null) {
            pushSubscriptionRepository.deleteByEndpoint(endpoint);
        }
        return ResponseEntity.ok().build();
    }
}
