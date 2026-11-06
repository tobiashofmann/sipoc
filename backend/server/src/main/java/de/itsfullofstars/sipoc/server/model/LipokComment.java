// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

import jakarta.persistence.*;

/**
 * A free-text (Markdown) comment attached to a {@link Lipok}. Unlike the join entities below,
 * this is an owned child entity, not a join, and carries the standard audit fields. {@code number}
 * is 1-based and sequential per Lipok, assigned server-side as {@code max(existing) + 1} and never
 * reused even after a comment is deleted.
 */
@Entity
@Table(name = "lipok_comments")
public class LipokComment extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lipok_id", nullable = false)
    private Lipok lipok;

    @Column(nullable = false)
    private Integer number;

    @Column(nullable = false, length = 4000)
    private String content;

    public LipokComment() {}

    public LipokComment(Lipok lipok, Integer number, String content) {
        this.lipok = lipok;
        this.number = number;
        this.content = content;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Lipok getLipok() { return lipok; }
    public void setLipok(Lipok lipok) { this.lipok = lipok; }
    public Integer getNumber() { return number; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

