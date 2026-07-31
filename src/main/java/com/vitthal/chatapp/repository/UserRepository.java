package com.vitthal.chatapp.repository;

import com.vitthal.chatapp.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findByUniqueNumber(String uniqueNumber);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByUniqueNumber(String uniqueNumber);

    /** Search users by username or fullName (case-insensitive), excluding self */
    @Query("SELECT u FROM User u WHERE u.id != :currentUserId AND " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<User> searchUsers(@Param("query") String query,
                           @Param("currentUserId") Long currentUserId,
                           Pageable pageable);

    /** Search users by their numeric unique number (exact match), excluding self */
    @Query("SELECT u FROM User u WHERE u.id != :currentUserId AND u.uniqueNumber = :uniqueNumber")
    Page<User> searchUsersByUniqueNumber(@Param("uniqueNumber") String uniqueNumber,
                                         @Param("currentUserId") Long currentUserId,
                                         Pageable pageable);

    /** Search users by their numeric DB ID (exact match), excluding self */
    @Query("SELECT u FROM User u WHERE u.id != :currentUserId AND u.id = :userId")
    Page<User> searchUsersById(@Param("userId") Long userId,
                               @Param("currentUserId") Long currentUserId,
                               Pageable pageable);

    /** Update online status */
    @Modifying
    @Query("UPDATE User u SET u.isOnline = :isOnline, u.lastSeen = CURRENT_TIMESTAMP WHERE u.id = :userId")
    void updateOnlineStatus(@Param("userId") Long userId, @Param("isOnline") boolean isOnline);
}
