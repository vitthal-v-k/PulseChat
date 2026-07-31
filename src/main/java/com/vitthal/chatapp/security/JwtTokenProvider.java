package com.vitthal.chatapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * Utility component for generating and validating JWT tokens.
 * Uses HMAC-SHA256 signing with a secret key from application.properties.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    @Value("${app.jwt.remember-me-expiration}")
    private long rememberMeExpiration;

    // =========================================================
    //  Token Generation
    // =========================================================

    /**
     * Generate a JWT token from an authenticated user principal.
     *
     * @param authentication Spring Security authentication object
     * @param rememberMe     if true, uses the extended (7-day) expiry
     * @return signed JWT string
     */
    public String generateToken(Authentication authentication, boolean rememberMe) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        long expiry = rememberMe ? rememberMeExpiration : jwtExpiration;
        return buildToken(userPrincipal.getUsername(), expiry);
    }

    /**
     * Generate a JWT token directly from an email (used after email verification).
     */
    public String generateTokenFromEmail(String email) {
        return buildToken(email, jwtExpiration);
    }

    private String buildToken(String subject, long expiryMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expiryMs);

        return Jwts.builder()
                .subject(subject)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    // =========================================================
    //  Token Parsing
    // =========================================================

    /**
     * Extract the email/subject from a JWT token.
     */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Validate the JWT token: signature + expiry.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;
    }

    // =========================================================
    //  Private Helpers
    // =========================================================

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
