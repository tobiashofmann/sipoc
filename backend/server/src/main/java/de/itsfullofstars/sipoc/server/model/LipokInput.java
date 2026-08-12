package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * Join row attaching an {@link Input} to a {@link Lipok}, ordered via {@code position}. The
 * optional {@code supplier}/{@code processStep} record which supplier delivers, and/or which
 * process step consumes, this input within this Lipok specifically; the service layer requires
 * both to already be attached to the same Lipok (as {@link LipokSupplier}/{@link LipokProcessStep})
 * before they can be linked here.
 */
@Entity
@Table(name = "lipok_inputs")
public class LipokInput {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "input_id", nullable = false)
    private Input input;

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private BusinessPartner supplier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_step_id")
    private ProcessStep processStep;

    public LipokInput() {}
    public LipokInput(Lipok lipok, Input input, Integer position) {
        this.lipok = lipok;
        this.input = input;
        this.position = position;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public Input getInput() { return input; }
    public void setInput(Input input) { this.input = input; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public BusinessPartner getSupplier() { return supplier; }
    public void setSupplier(BusinessPartner supplier) { this.supplier = supplier; }
    public ProcessStep getProcessStep() { return processStep; }
    public void setProcessStep(ProcessStep processStep) { this.processStep = processStep; }
}

