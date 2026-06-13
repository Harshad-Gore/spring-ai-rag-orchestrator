package com.harshad.orchestrator.notebook;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, UUID> {
	List<Tag> findByUserId(UUID userId);
}
