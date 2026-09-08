package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.PushSubscription;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUser(User user);

    Optional<PushSubscription> findByUserAndEndpoint(User user, String endpoint);

    void deleteByEndpoint(String endpoint);
}
