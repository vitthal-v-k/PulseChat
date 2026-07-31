package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Status;
import com.vitthal.chatapp.entity.StatusView;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StatusViewRepository extends JpaRepository<StatusView, Long> {

    boolean existsByStatusAndViewer(Status status, User viewer);

    Optional<StatusView> findByStatusAndViewer(Status status, User viewer);

    List<StatusView> findByStatusOrderByViewedAtDesc(Status status);

    long countByStatus(Status status);
}
