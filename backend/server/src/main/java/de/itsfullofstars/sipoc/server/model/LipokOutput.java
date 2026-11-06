// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Join row attaching an {@link Output} to a {@link Lipok}, ordered via {@code position}. The
 * optional {@code processStep} records which process step produced this output within this Lipok;
 * {@code customerLinks} records which {@link BusinessPartner}(s) receive it (via
 * {@link LipokOutputCustomer}, keyed off this join row rather than the raw Output).
 */
@Entity
@Table(name = "lipok_outputs")
public class LipokOutput {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "output_id", nullable = false)
    private Output output;

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_step_id")
    private ProcessStep processStep;

    @OneToMany(mappedBy = "output", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LipokOutputCustomer> customerLinks = new ArrayList<>();

    public LipokOutput() {}
    public LipokOutput(Lipok lipok, Output output, Integer position) {
        this.lipok = lipok;
        this.output = output;
        this.position = position;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public Output getOutput() { return output; }
    public void setOutput(Output output) { this.output = output; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public ProcessStep getProcessStep() { return processStep; }
    public void setProcessStep(ProcessStep processStep) { this.processStep = processStep; }
    public List<LipokOutputCustomer> getCustomerLinks() { return customerLinks; }
}

