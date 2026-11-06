// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Master data for a SIPOC "Input" (e.g. a document or piece of information a process step
 * consumes). {@code partners} lists which {@link BusinessPartner}s can generally supply this
 * input, independent of any specific {@link Lipok} (see {@link BusinessPartnerInput}).
 */
@Entity
@Table(name = "inputs")
public class Input extends Auditable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DocumentableType type;

    @Column(length = 2000)
    private String linkUrl;

    @OneToMany(mappedBy = "input")
    private List<BusinessPartnerInput> partners = new ArrayList<>();

    public Input() {}

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
    public DocumentableType getType() { return type; }
    public void setType(DocumentableType type) { this.type = type; }
    public String getLinkUrl() { return linkUrl; }
    public void setLinkUrl(String linkUrl) { this.linkUrl = linkUrl; }
    public List<BusinessPartnerInput> getPartners() { return partners; }
}
