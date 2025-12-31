package com.interview.ai_interview.Model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data

@Document(collection = "interviews")
public class Interview {

    @Id
    private String id;

    private String userId;

    private String position;

    private String experience;

    private String difficulty;

    private boolean active;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private List<ChatMessage> chatHistory = new ArrayList<>();
}