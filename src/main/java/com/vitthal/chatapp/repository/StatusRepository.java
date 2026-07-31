package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Status;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface StatusRepository extends JpaRepository<Status, Long> {

    /** Get all active (non-expired) statuses from a specific user */
    @Query("SELECT DISTINCT s FROM Status s LEFT JOIN FETCH s.mediaItems WHERE s.user.id = :#{#user.id} AND s.expiresAt > :now ORDER BY s.createdAt ASC")
    List<Status> findActiveStatusesByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /** Get statuses from all contacts of the current user */
    @Query("SELECT DISTINCT s FROM Status s LEFT JOIN FETCH s.mediaItems WHERE s.user.id IN " +
           "(SELECT CASE WHEN f.user1.id = :#{#user.id} THEN f.user2.id ELSE f.user1.id END FROM Friendship f " +
           "WHERE (f.user1.id = :#{#user.id} OR f.user2.id = :#{#user.id}) AND f.isBlocked = false) " +
           "AND s.expiresAt > :now ORDER BY s.user.id, s.createdAt ASC")
    List<Status> findContactStatuses(@Param("user") User user, @Param("now") LocalDateTime now);

    /** Delete expired statuses (called by scheduled task) */
    @Modifying
    @Query("DELETE FROM Status s WHERE s.expiresAt < :now")
    int deleteExpiredStatuses(@Param("now") LocalDateTime now);

    List<Status> findByUserOrderByCreatedAtAsc(User user);
}
