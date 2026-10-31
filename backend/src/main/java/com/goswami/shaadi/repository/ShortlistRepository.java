package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ShortlistRepository extends JpaRepository<Shortlist,Long>{ Optional<Shortlist> findByUserIdAndTargetUserId(Long u,Long t); List<Shortlist> findByUserIdOrderByCreatedAtDesc(Long u); }