package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.BusinessPartner;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessPartnerRepository extends JpaRepository<BusinessPartner, String> {
}

