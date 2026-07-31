package com.vitthal.chatapp.service;

import com.vitthal.chatapp.dto.request.*;
import com.vitthal.chatapp.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    void logout(String userEmail);
}
