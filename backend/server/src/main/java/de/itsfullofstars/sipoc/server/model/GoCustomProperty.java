package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/** A single free-form {@code key}/{@code value} property attached to a {@link Go}; {@code key} is unique per Go. */
@Entity
@Table(name = "go_custom_properties",
        uniqueConstraints = @UniqueConstraint(columnNames = {"go_id", "prop_key"}))
public class GoCustomProperty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "go_id", nullable = false)
    private Go go;

    @Column(name = "prop_key", nullable = false)
    private String key;

    @Column(name = "prop_value", length = 2000)
    private String value;

    public GoCustomProperty() {}
    public GoCustomProperty(Go go, String key, String value) {
        this.go = go;
        this.key = key;
        this.value = value;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Go getGo() { return go; }
    public void setGo(Go go) { this.go = go; }
    public String getKey() { return key; }
    public String getValue() { return value; }
}

