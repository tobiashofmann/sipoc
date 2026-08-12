package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/** Unordered many-to-many join tagging a {@link Go} taxonomy node onto a {@link Lipok}. */
@Entity
@Table(name = "lipok_gos")
public class LipokGo {
    @EmbeddedId
    private LipokGoPK id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("lipokId")
    @JoinColumn(name = "lipok_id")
    private Lipok lipok;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("goId")
    @JoinColumn(name = "go_id")
    private Go go;

    public LipokGo() {}
    public LipokGo(Lipok lipok, Go go) {
        this.lipok = lipok;
        this.go = go;
        this.id = new LipokGoPK(lipok.getId(), go.getId());
    }

    public LipokGoPK getId() { return id; }
    public void setId(LipokGoPK id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public Go getGo() { return go; }
    public void setGo(Go go) { this.go = go; }
}

