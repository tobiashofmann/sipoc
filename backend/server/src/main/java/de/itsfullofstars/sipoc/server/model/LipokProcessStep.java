package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * Join row attaching a {@link ProcessStep} to a {@link Lipok}, ordered via {@code position}. The
 * optional self-referential {@code predecessor} (another {@code LipokProcessStep} row on the same
 * Lipok) defines the step's place in the process chain independently of {@code position};
 * {@code null} marks the starting step.
 */
@Entity
@Table(name = "lipok_process_steps")
public class LipokProcessStep {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "process_step_id", nullable = false)
    private ProcessStep processStep;

    @Column(nullable = false)
    private Integer position;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "predecessor_id")
    private LipokProcessStep predecessor;

    public LipokProcessStep() {}
    public LipokProcessStep(Lipok lipok, ProcessStep processStep, Integer position) {
        this.lipok = lipok;
        this.processStep = processStep;
        this.position = position;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public ProcessStep getProcessStep() { return processStep; }
    public void setProcessStep(ProcessStep processStep) { this.processStep = processStep; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public LipokProcessStep getPredecessor() { return predecessor; }
    public void setPredecessor(LipokProcessStep predecessor) { this.predecessor = predecessor; }
}

