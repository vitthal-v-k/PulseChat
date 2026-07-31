package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Attachment;
import com.vitthal.chatapp.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {

    List<Attachment> findByMessage(Message message);
}
