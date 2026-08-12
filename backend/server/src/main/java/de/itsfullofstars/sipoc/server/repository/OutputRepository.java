package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.Output;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OutputRepository extends JpaRepository<Output, String> {
}

