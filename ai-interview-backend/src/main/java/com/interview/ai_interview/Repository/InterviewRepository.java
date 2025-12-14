package com.interview.ai_interview.Repository;

import com.interview.ai_interview.Model.Interview;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface InterviewRepository extends MongoRepository<Interview, String> {
    List<Interview> findByUserId(String userId);
}