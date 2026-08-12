package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * General master-data capability: this business partner can (generally, outside of any specific
 * Lipok) supply this Input. Independent of {@link LipokSupplier}/{@link LipokInput}, which capture
 * the same relationship scoped to one particular Lipok.
 */
@Entity
@Table(name = "business_partner_inputs")
public class BusinessPartnerInput {
    @EmbeddedId
    private BusinessPartnerInputPK id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("partnerId")
    @JoinColumn(name = "partner_id")
    private BusinessPartner partner;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("inputId")
    @JoinColumn(name = "input_id")
    private Input input;

    public BusinessPartnerInput() {}
    public BusinessPartnerInput(BusinessPartner partner, Input input) {
        this.partner = partner;
        this.input = input;
        this.id = new BusinessPartnerInputPK(partner.getId(), input.getId());
    }

    public BusinessPartnerInputPK getId() { return id; }
    public void setId(BusinessPartnerInputPK id) { this.id = id; }
    public BusinessPartner getPartner() { return partner; }
    public Input getInput() { return input; }
    public void setInput(Input input) { this.input = input; }
}

