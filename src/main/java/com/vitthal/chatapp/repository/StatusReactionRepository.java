package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Status;
import com.vitthal.chatapp.entity.StatusReaction;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatusReactionRepository extends JpaRepository<StatusReaction, Long> {

    Optional<StatusReaction> findByStatusAndReactor(Status status, User reactor);

    boolean existsByStatusAndReactor(Status status, User reactor);

    List<StatusReaction> findByStatus(Status status);
}
