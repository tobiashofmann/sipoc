// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A real-world business partner (e.g. a company or department). A single BusinessPartner can play
 * the supplier role in one Lipok and the customer role in another â€” or both roles in the same
 * Lipok (e.g. a purchasing department is the supplier of a purchase request and the customer of
 * its confirmation). The role is per-Lipok (see LipokSupplier/LipokCustomer), not a fixed
 * attribute of the partner itself.
 */
@Entity
@Table(name = "business_partners")
public class BusinessPartner extends Auditable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @OneToMany(mappedBy = "partner", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BusinessPartnerInput> inputs = new ArrayList<>();

    public BusinessPartner() {}

    @PrePersist
    public void ensureId() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<BusinessPartnerInput> getInputs() { return inputs; }
    public void setInputs(List<BusinessPartnerInput> inputs) { this.inputs = inputs; }
}

