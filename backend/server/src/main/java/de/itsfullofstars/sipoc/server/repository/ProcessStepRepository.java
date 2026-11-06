// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.repository;

import de.itsfullofstars.sipoc.server.model.ProcessStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessStepRepository extends JpaRepository<ProcessStep, String> {
}

