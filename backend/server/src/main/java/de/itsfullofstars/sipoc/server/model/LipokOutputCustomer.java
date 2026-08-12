package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * Links one specific {@link LipokOutput} row (not the raw {@link Output}) to a
 * {@link BusinessPartner} receiving it. The service layer requires that partner to already be
 * attached to the same Lipok via {@link LipokCustomer}.
 */
@Entity
@Table(name = "lipok_output_customers")
public class LipokOutputCustomer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_output_id", nullable = false)
    private LipokOutput output;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private BusinessPartner customer;

    public LipokOutputCustomer() {}
    public LipokOutputCustomer(LipokOutput output, BusinessPartner customer) {
        this.output = output;
        this.customer = customer;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LipokOutput getOutput() { return output; }
    public void setOutput(LipokOutput output) { this.output = output; }
    public BusinessPartner getCustomer() { return customer; }
    public void setCustomer(BusinessPartner customer) { this.customer = customer; }
}

