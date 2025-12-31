package com.interview.ai_interview.WebSocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.ai_interview.Model.Interview;
import com.interview.ai_interview.Service.GeminiService;
import com.interview.ai_interview.Service.InterviewService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@AllArgsConstructor

@Component
public class InterviewWebSocketHandler extends TextWebSocketHandler {

    private final InterviewService interviewService;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String interviewId = extractInterviewId(session);
        sessions.put(interviewId, session);

        // Send initial greeting
        Interview interview = interviewService.getInterview(interviewId);
        if (interview != null && !interview.getChatHistory().isEmpty()) {
            String greeting = interview.getChatHistory().get(interview.getChatHistory().size() - 1).getMessage();
            sendMessage(session, greeting);
        }
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String interviewId = extractInterviewId(session);
        Map<String, String> payload = objectMapper.readValue(message.getPayload(), Map.class);
        String userMessage = payload.get("message");

        // Save user message
        interviewService.addMessage(interviewId, "user", userMessage);

        // Generate AI response
        Interview interview = interviewService.getInterview(interviewId);
        String context = geminiService.getInterviewContext(
                interview.getPosition(),
                interview.getExperience(),
                interview.getDifficulty()
        );

        // Build conversation history
        StringBuilder conversationHistory = new StringBuilder(context + "\n\n");
        for (var msg : interview.getChatHistory()) {
            conversationHistory.append(msg.getRole()).append(": ").append(msg.getMessage()).append("\n");
        }

        String aiResponse = geminiService.generateResponse(userMessage, conversationHistory.toString());

        // Save AI response
        interviewService.addMessage(interviewId, "ai", aiResponse);

        // Send response back
        sendMessage(session, aiResponse);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String interviewId = extractInterviewId(session);
        sessions.remove(interviewId);
        interviewService.endInterview(interviewId);
    }

    private String extractInterviewId(WebSocketSession session) {
        String path = session.getUri().getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    private void sendMessage(WebSocketSession session, String message) throws Exception {
        Map<String, String> response = Map.of("message", message);
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(response)));
    }
}
