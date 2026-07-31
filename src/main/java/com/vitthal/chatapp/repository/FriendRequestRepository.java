package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.constants.FriendRequestStatus;
import com.vitthal.chatapp.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {

    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE fr.receiver.id = :receiverId AND fr.status = :status")
    List<FriendRequest> findByReceiverIdAndStatus(@Param("receiverId") Long receiverId, @Param("status") FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE fr.sender.id = :senderId AND fr.status = :status")
    List<FriendRequest> findBySenderIdAndStatus(@Param("senderId") Long senderId, @Param("status") FriendRequestStatus status);

    @Query("SELECT fr FROM FriendRequest fr JOIN FETCH fr.sender JOIN FETCH fr.receiver WHERE (fr.sender.id = :u1 AND fr.receiver.id = :u2) OR (fr.sender.id = :u2 AND fr.receiver.id = :u1)")
    Optional<FriendRequest> findBetweenUsers(@Param("u1") Long u1, @Param("u2") Long u2);
}
