package com.covid.api.rest.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.covid.api.rest.dto.AuthResponse;
import com.covid.api.rest.dto.LoginRequest;
import com.covid.api.rest.dto.SignUpRequest;
import com.covid.api.security.SecurityConfig;
import com.covid.api.user.DuplicatedUserInfoException;
import com.covid.api.user.User;
import com.covid.api.user.UserService;

import java.util.Optional;

@RequiredArgsConstructor
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/authenticate")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest) {
        Optional<User> userOptional = userService.validUsernameAndPassword(loginRequest.username(), loginRequest.password());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            return ResponseEntity.ok(new AuthResponse(user.getId(), user.getName(), user.getRole()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/signup")
    public AuthResponse signUp(@Valid @RequestBody SignUpRequest signUpRequest) {
        if (userService.hasUserWithUsername(signUpRequest.username())) {
            throw new DuplicatedUserInfoException(String.format("Username %s is already been used", signUpRequest.username()));
        }
        if (userService.hasUserWithEmail(signUpRequest.email())) {
            throw new DuplicatedUserInfoException(String.format("Email %s is already been used", signUpRequest.email()));
        }

        User user = userService.saveUser(this.mapSignUpRequestToUser(signUpRequest));
        return new AuthResponse(user.getId(), user.getName(), user.getRole());
    }

    private User mapSignUpRequestToUser(SignUpRequest signUpRequest) {
        User user = new User();
        user.setUsername(signUpRequest.username());
        user.setPassword(passwordEncoder.encode(signUpRequest.password()));
        user.setName(signUpRequest.name());
        user.setEmail(signUpRequest.email());
        user.setRole(SecurityConfig.USER);
        return user;
    }
}
