package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.Go;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoRepository extends JpaRepository<Go, String> {
    /** Direct children of the given Go node. */
    List<Go> findByParentId(String parentId);
}

