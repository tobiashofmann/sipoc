// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Objects;

/** Composite key of {@link LipokGo}: (lipokId, goId). */
@Embeddable
public class LipokGoPK implements Serializable {
    @Column(name = "lipok_id")
    public String lipokId;

    @Column(name = "go_id")
    public String goId;

    public LipokGoPK() {}
    public LipokGoPK(String lipokId, String goId) {
        this.lipokId = lipokId;
        this.goId = goId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LipokGoPK)) return false;
        LipokGoPK that = (LipokGoPK) o;
        return lipokId.equals(that.lipokId) && goId.equals(that.goId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(lipokId, goId);
    }
}

