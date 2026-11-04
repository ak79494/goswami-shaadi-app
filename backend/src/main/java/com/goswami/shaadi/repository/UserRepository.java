package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface UserRepository extends JpaRepository<User,Long>{ Optional<User> findByEmail(String email); Optional<User> findByPhone(String phone);
Optional<User> findByGoswamiId(String goswamiId);
java.util.List<User> findByRole(com.goswami.shaadi.model.Role role);
boolean existsByIdAndEnabledTrue(Long id);
}