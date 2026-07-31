package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Status;
import com.vitthal.chatapp.entity.StatusMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusMediaRepository extends JpaRepository<StatusMedia, Long> {

    List<StatusMedia> findByStatus(Status status);
}
