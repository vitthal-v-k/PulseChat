package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.Friendship;
import com.vitthal.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("SELECT f FROM Friendship f JOIN FETCH f.user1 JOIN FETCH f.user2 WHERE " +
           "(f.user1.id = :u1 AND f.user2.id = :u2) OR " +
           "(f.user1.id = :u2 AND f.user2.id = :u1)")
    Optional<Friendship> findByUsersByIds(@Param("u1") Long u1, @Param("u2") Long u2);

    default boolean areFriends(User user1, User user2) {
        if (user1 == null || user2 == null) return false;
        Optional<Friendship> f = findByUsersByIds(user1.getId(), user2.getId());
        return f.isPresent() && !Boolean.TRUE.equals(f.get().getIsBlocked());
    }

    @Query("SELECT f FROM Friendship f JOIN FETCH f.user1 JOIN FETCH f.user2 WHERE (f.user1.id = :userId OR f.user2.id = :userId) AND (f.isBlocked = false OR f.isBlocked IS NULL)")
    List<Friendship> findAllFriendshipsByUserId(@Param("userId") Long userId);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM Friendship f WHERE " +
           "((f.user1.id = :blockerId AND f.user2.id = :blockedId) OR (f.user1.id = :blockedId AND f.user2.id = :blockerId)) " +
           "AND f.isBlocked = true AND f.blockedBy.id = :blockerId")
    boolean isBlockedBy(@Param("blockerId") Long blockerId, @Param("blockedId") Long blockedId);
}
