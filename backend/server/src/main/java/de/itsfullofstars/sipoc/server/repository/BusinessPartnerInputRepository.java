// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.BusinessPartnerInput;
import de.itsfullofstars.sipoc.server.model.BusinessPartnerInputPK;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BusinessPartnerInputRepository extends JpaRepository<BusinessPartnerInput, BusinessPartnerInputPK> {
    List<BusinessPartnerInput> findByPartnerId(String partnerId);
    List<BusinessPartnerInput> findByInputId(String inputId);
}


