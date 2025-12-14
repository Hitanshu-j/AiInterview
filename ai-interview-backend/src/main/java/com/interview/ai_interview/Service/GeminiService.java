package com.interview.ai_interview.Service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public String generateResponse(String userMessage, String context) {
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            String prompt = context;
            if (userMessage != null && !userMessage.trim().isEmpty()) {
                prompt += "\n\nCandidate: " + userMessage;
            }

            Map<String, Object> requestBody = new HashMap<>();
            List<Map<String, Object>> contents = new ArrayList<>();
            Map<String, Object> content = new HashMap<>();
            List<Map<String, String>> parts = new ArrayList<>();
            Map<String, String> part = new HashMap<>();

            part.put("text", prompt);
            parts.add(part);
            content.put("parts", parts);
            contents.add(content);
            requestBody.put("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);

            if (response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) body.get("candidates");

                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> respContent = (Map<String, Object>) candidate.get("content");
                    List<Map<String, String>> respParts = (List<Map<String, String>>) respContent.get("parts");

                    if (respParts != null && !respParts.isEmpty()) {
                        String aiResponse = respParts.get(0).get("text");
                        return aiResponse;
                    }
                }
            }

            return "Hello! Welcome to your interview. Could you introduce yourself?";

        } catch (Exception e) {
            e.printStackTrace();
            return "Hello! I'm your AI interviewer. Let's begin - tell me about yourself.";
        }
    }

    public String getInterviewContext(String position, String experience, String difficulty) {
        return String.format(
                "You are a professional AI interviewer for a %s position. " +
                        "The candidate has %s experience. Difficulty: %s. " +
                        "Ask ONE clear question at a time. Be encouraging and professional. " +
                        "Keep responses SHORT (2-3 sentences). Start with a warm greeting.",
                position, experience, difficulty
        );
    }
}