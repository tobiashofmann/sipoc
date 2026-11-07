#!/usr/bin/env python3
# Copyright 2026 Tobias Hofmann
# SPDX-License-Identifier: Apache-2.0
"""Append a Cobertura coverage summary as a Markdown table to the GitHub job summary.

Usage: coverage_summary.py <title> <cobertura.xml>
Writes to $GITHUB_STEP_SUMMARY (or stdout when unset).
"""
import os
import sys
import xml.etree.ElementTree as ET


def pct(covered, valid):
    return f"{100 * covered / valid:.1f}%" if valid else "n/a"


def main():
    title, path = sys.argv[1], sys.argv[2]
    root = ET.parse(path).getroot()
    lines_valid = int(root.get("lines-valid", 0))
    lines_cov = int(root.get("lines-covered", 0))
    br_valid = int(root.get("branches-valid", 0))
    br_cov = int(root.get("branches-covered", 0))

    out = [
        f"### Coverage: {title}",
        "",
        "| Metric | Covered | Total | Rate |",
        "|---|---:|---:|---:|",
        f"| Lines | {lines_cov} | {lines_valid} | {pct(lines_cov, lines_valid)} |",
        f"| Branches | {br_cov} | {br_valid} | {pct(br_cov, br_valid)} |",
        "",
    ]
    text = "\n".join(out)
    target = os.environ.get("GITHUB_STEP_SUMMARY")
    if target:
        with open(target, "a", encoding="utf-8") as f:
            f.write(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
