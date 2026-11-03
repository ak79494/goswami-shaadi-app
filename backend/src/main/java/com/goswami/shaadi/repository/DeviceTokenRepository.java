package com.goswami.shaadi.repository;

import com.goswami.shaadi.model.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByToken(String token);

    @Query("select d.token from DeviceToken d where d.user.id = :userId")
    List<String> tokensOf(@Param("userId") Long userId);

    @Modifying @Transactional
    @Query("delete from DeviceToken d where d.token = :token")
    void removeToken(@Param("token") String token);

    @Modifying @Transactional
    @Query("delete from DeviceToken d where d.user.id = :userId")
    void removeAllOf(@Param("userId") Long userId);

    @Modifying @Transactional
    @Query("delete from DeviceToken d where d.token = :token and d.user.id = :userId")
    void removeTokenOf(@Param("userId") Long userId, @Param("token") String token);
}
