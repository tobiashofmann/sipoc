// Copyright 2026 Tobias Hofmann
// SPDX-License-Identifier: Apache-2.0

package de.itsfullofstars.sipoc.server.model;

/** Confidentiality classification of a {@link Go}, from most to least widely shareable. */
public enum Criticality {
    PUBLIC, INTERNAL, PRIVATE, CONFIDENTIAL
}

