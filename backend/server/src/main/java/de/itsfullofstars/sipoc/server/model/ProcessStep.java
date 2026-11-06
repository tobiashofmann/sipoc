// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;

/** Master data for a SIPOC "Process" step. Unrelated to {@link Go} despite the similar domain vocabulary. */
@Entity
@Table(name = "process_steps")
public class ProcessStep extends Auditable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    public ProcessStep() {}

    @jakarta.persistence.PrePersist
    public void ensureId() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}

