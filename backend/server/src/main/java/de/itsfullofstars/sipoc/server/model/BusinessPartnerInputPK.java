package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

/** Composite key of {@link BusinessPartnerInput}: (partnerId, inputId). */
@Embeddable
public class BusinessPartnerInputPK implements Serializable {
    @Column(name = "partner_id")
    public String partnerId;

    @Column(name = "input_id")
    public String inputId;

    public BusinessPartnerInputPK() {}
    public BusinessPartnerInputPK(String partnerId, String inputId) {
        this.partnerId = partnerId;
        this.inputId = inputId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BusinessPartnerInputPK)) return false;
        BusinessPartnerInputPK that = (BusinessPartnerInputPK) o;
        return partnerId.equals(that.partnerId) && inputId.equals(that.inputId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(partnerId, inputId);
    }
}

