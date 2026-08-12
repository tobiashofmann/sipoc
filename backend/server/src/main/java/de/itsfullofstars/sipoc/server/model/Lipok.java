package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A single SIPOC instance ("LIPOK": Lieferant/Input/Prozess/Output/Kunde). The five SIPOC columns
 * ({@code suppliers}, {@code inputs}, {@code processSteps}, {@code outputs}, {@code customers}) are
 * flat, position-ordered lists of join rows; {@code gos} tags the Lipok with {@link Go} taxonomy
 * nodes; {@code comments} are free-text, sequentially numbered notes. See SCHEMA.md for the full
 * join-entity model, including the optional fine-grained links layered on top of these lists.
 */
@Entity
@Table(name = "lipoks")
public class Lipok extends Auditable {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(length = 2000)
    private String description;

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LipokGo> gos = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<LipokSupplier> suppliers = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<LipokInput> inputs = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<LipokProcessStep> processSteps = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<LipokOutput> outputs = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<LipokCustomer> customers = new ArrayList<>();

    @OneToMany(mappedBy = "lipok", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("number ASC")
    private List<LipokComment> comments = new ArrayList<>();

    public Lipok() {}

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
    public List<LipokGo> getGos() { return gos; }
    public List<LipokSupplier> getSuppliers() { return suppliers; }
    public List<LipokInput> getInputs() { return inputs; }
    public void setInputs(List<LipokInput> inputs) { this.inputs = inputs; }
    public List<LipokProcessStep> getProcessSteps() { return processSteps; }
    public List<LipokOutput> getOutputs() { return outputs; }
    public List<LipokCustomer> getCustomers() { return customers; }
    public List<LipokComment> getComments() { return comments; }
}

