package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Message;
import com.vitthal.chatapp.entity.StarredMessage;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StarredMessageRepository extends JpaRepository<StarredMessage, Long> {

    boolean existsByMessageAndUser(Message message, User user);

    Optional<StarredMessage> findByMessageAndUser(Message message, User user);
}
