package com.interview.ai_interview.Controller;

import com.interview.ai_interview.Model.Interview;
import com.interview.ai_interview.Service.InterviewService;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/interview")
@CrossOrigin(origins = "http://localhost:3000")
public class InterviewController {

    private final InterviewService interviewService;

    public InterviewController(InterviewService interviewService) {
        this.interviewService = interviewService;
    }

    @PostMapping("/start")
    public ResponseEntity<?> startInterview(@RequestBody Map<String, String> request) {
        Interview interview = interviewService.startInterview(
                request.get("userId"),
                request.get("position"),
                request.get("experience"),
                request.get("difficulty")
        );

        return ResponseEntity.ok(Map.of(
                "interviewId", interview.getId(),
                "message", "Interview started successfully"
        ));
    }

    @GetMapping("/{interviewId}")
    public ResponseEntity<?> getInterview(@PathVariable String interviewId) {
        Interview interview = interviewService.getInterview(interviewId);
        return interview != null ?
                ResponseEntity.ok(interview) :
                ResponseEntity.notFound().build();
    }
}
