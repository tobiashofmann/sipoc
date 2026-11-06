// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * Join row attaching a {@link BusinessPartner} to a {@link Lipok} in the supplier role, ordered
 * via {@code position}. The same partner may also appear as a {@link LipokCustomer} on the same
 * Lipok â€” the two roles are not mutually exclusive.
 */
@Entity
@Table(name = "lipok_suppliers")
public class LipokSupplier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private BusinessPartner supplier;

    @Column(nullable = false)
    private Integer position;

    public LipokSupplier() {}
    public LipokSupplier(Lipok lipok, BusinessPartner supplier, Integer position) {
        this.lipok = lipok;
        this.supplier = supplier;
        this.position = position;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public BusinessPartner getSupplier() { return supplier; }
    public void setSupplier(BusinessPartner supplier) { this.supplier = supplier; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}

