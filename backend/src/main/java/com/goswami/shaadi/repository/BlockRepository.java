package com.goswami.shaadi.repository;
import com.goswami.shaadi.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface BlockRepository extends JpaRepository<Block,Long>{ Optional<Block> findByUserIdAndBlockedUserId(Long u,Long b); List<Block> findByUserId(Long u); List<Block> findByBlockedUserId(Long b); }