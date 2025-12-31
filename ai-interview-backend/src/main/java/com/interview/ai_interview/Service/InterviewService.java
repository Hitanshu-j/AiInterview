package com.interview.ai_interview.Service;

import com.interview.ai_interview.Model.ChatMessage;
import com.interview.ai_interview.Model.Interview;
import com.interview.ai_interview.Repository.InterviewRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@AllArgsConstructor

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final GeminiService geminiService;

    public Interview startInterview(String userId, String position, String experience, String difficulty) {
        Interview interview = new Interview();
        interview.setUserId(userId);
        interview.setPosition(position);
        interview.setExperience(experience);
        interview.setDifficulty(difficulty);
        interview.setActive(true);
        interview.setStartTime(LocalDateTime.now());

        Interview saved = interviewRepository.save(interview);

        // Generate initial greeting
        String context = geminiService.getInterviewContext(position, experience, difficulty);
        String greeting = geminiService.generateResponse("", context);
        saved.getChatHistory().add(new ChatMessage("ai", greeting));
        interviewRepository.save(saved);

        return saved;
    }

    public Interview getInterview(String interviewId) {
        return interviewRepository.findById(interviewId).orElse(null);
    }

    public void addMessage(String interviewId, String role, String message) {
        Interview interview = interviewRepository.findById(interviewId).orElse(null);
        if (interview != null) {
            interview.getChatHistory().add(new ChatMessage(role, message));
            interviewRepository.save(interview);
        }
    }

    public void endInterview(String interviewId) {
        Interview interview = interviewRepository.findById(interviewId).orElse(null);
        if (interview != null) {
            interview.setActive(false);
            interview.setEndTime(LocalDateTime.now());
            interviewRepository.save(interview);
        }
    }
}
