package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * Join row attaching a {@link BusinessPartner} to a {@link Lipok} in the customer role, ordered
 * via {@code position}. The same partner may also appear as a {@link LipokSupplier} on the same
 * Lipok â€” the two roles are not mutually exclusive.
 */
@Entity
@Table(name = "lipok_customers")
public class LipokCustomer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private BusinessPartner customer;

    @Column(nullable = false)
    private Integer position;

    public LipokCustomer() {}
    public LipokCustomer(Lipok lipok, BusinessPartner customer, Integer position) {
        this.lipok = lipok;
        this.customer = customer;
        this.position = position;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public BusinessPartner getCustomer() { return customer; }
    public void setCustomer(BusinessPartner customer) { this.customer = customer; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}

