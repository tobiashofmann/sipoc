// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A "GeschÃ¤ftsobjekt" (business object) taxonomy node â€” a hierarchical, parent/child classification
 * (contracts, BOMs, master data, ...) that can be tagged onto a {@link Lipok} via {@link LipokGo}.
 * Despite the similar-sounding name, a {@code Go} is unrelated to {@link ProcessStep}. {@code parent}
 * is {@code null} for top-level nodes; {@code children} is populated via that back-reference.
 */
@Entity
@Table(name = "gos")
public class Go extends Auditable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    private String category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Go parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Go> children = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private BoType type;

    @Enumerated(EnumType.STRING)
    private Importance importance;

    @Enumerated(EnumType.STRING)
    private Criticality criticality;

    @OneToMany(mappedBy = "go", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<GoCustomProperty> customProperties = new ArrayList<>();

    public Go() {}

    @PrePersist
    public void ensureId() {
        if (this.id == null) this.id = UUID.randomUUID().toString();
    }

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Go getParent() { return parent; }
    public void setParent(Go parent) { this.parent = parent; }
    public List<Go> getChildren() { return children; }
    public BoType getType() { return type; }
    public void setType(BoType type) { this.type = type; }
    public Importance getImportance() { return importance; }
    public void setImportance(Importance importance) { this.importance = importance; }
    public Criticality getCriticality() { return criticality; }
    public void setCriticality(Criticality criticality) { this.criticality = criticality; }
    public List<GoCustomProperty> getCustomProperties() { return customProperties; }
}

