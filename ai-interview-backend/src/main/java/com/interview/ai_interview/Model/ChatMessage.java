package com.interview.ai_interview.Model;

import lombok.*;

import java.time.LocalDateTime;

@Data

public class ChatMessage {
    private String role; // "user" or "ai"
    private String message;
    private LocalDateTime timestamp;

    public ChatMessage(String role, String message) {
        this.role = role;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

}
