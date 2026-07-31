package com.vitthal.chatapp.service.impl;

import com.vitthal.chatapp.constants.UserRole;
import com.vitthal.chatapp.dto.request.*;
import com.vitthal.chatapp.dto.response.AuthResponse;
import com.vitthal.chatapp.entity.User;
import com.vitthal.chatapp.exception.BadRequestException;
import com.vitthal.chatapp.exception.ResourceNotFoundException;
import com.vitthal.chatapp.repository.UserRepository;
import com.vitthal.chatapp.security.JwtTokenProvider;
import com.vitthal.chatapp.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email address is already in use!");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName() != null ? request.getFullName() : request.getUsername())
                .uniqueNumber(generateUniqueNumber())
                .role(UserRole.USER)
                .isEmailVerified(true)
                .isOnline(false)
                .build();

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromEmail(savedUser.getEmail());

        return AuthResponse.builder()
                .token(token)
                .userId(savedUser.getId())
                .username(savedUser.getUsername())
                .uniqueNumber(savedUser.getUniqueNumber())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .profilePicture(savedUser.getProfilePicture())
                .emailVerified(savedUser.getIsEmailVerified())
                .message("Registration successful!")
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        userRepository.updateOnlineStatus(user.getId(), true);

        String token = tokenProvider.generateToken(authentication, request.isRememberMe());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .uniqueNumber(user.getUniqueNumber())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .profilePicture(user.getProfilePicture())
                .emailVerified(user.getIsEmailVerified())
                .message("Login successful!")
                .build();
    }



    @Override
    @Transactional
    public void logout(String userEmail) {
        userRepository.findByEmail(userEmail).ifPresent(user -> {
            userRepository.updateOnlineStatus(user.getId(), false);
        });
    }

    /**
     * Generates a unique 7-digit numeric string (1,000,000 to 9,999,999).
     * Never starts with 0.
     */
    private String generateUniqueNumber() {
        Random random = new Random();
        String number;
        do {
            int val = 1_000_000 + random.nextInt(9_000_000);
            number = String.valueOf(val);
        } while (userRepository.existsByUniqueNumber(number));
        return number;
    }
}
