package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.ProfilePhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProfilePhotoRepository extends JpaRepository<ProfilePhoto,Long>{ List<ProfilePhoto> findByUserIdOrderBySortOrderAsc(Long userId); long countByUserId(Long userId); }