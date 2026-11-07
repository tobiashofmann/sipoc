#!/usr/bin/env python3
# Copyright 2026 Tobias Hofmann
# SPDX-License-Identifier: Apache-2.0
"""Convert a JaCoCo XML report to Cobertura XML (line + branch coverage).

GitHub Code Quality ingests Cobertura XML only, while JaCoCo's native XML is a different format.

Usage: jacoco_to_cobertura.py <jacoco.xml> <cobertura.xml> --source-root <dir> [--repo-root <dir>]
  --source-root  directory holding the Java sources, relative to the repo root
                 (e.g. backend/server/src/main/java); used to build repo-relative filenames.
"""
import argparse
import os
import xml.etree.ElementTree as ET


def rate(covered, valid):
    return f"{(covered / valid) if valid else 1.0:.4f}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("jacoco")
    ap.add_argument("cobertura")
    ap.add_argument("--source-root", required=True)
    ap.add_argument("--repo-root", default=".")
    a = ap.parse_args()

    # The JaCoCo DTD is not available offline; ElementTree never fetches it, so this is safe.
    report = ET.parse(a.jacoco).getroot()

    root = ET.Element("coverage", version="1", timestamp="0")
    ET.SubElement(ET.SubElement(root, "sources"), "source").text = os.path.abspath(a.repo_root)
    packages_el = ET.SubElement(root, "packages")

    tot_lines = tot_cov = tot_br = tot_brcov = 0
    for pkg in report.findall("package"):
        classes_el = ET.Element("classes")
        p_lines = p_cov = p_br = p_brcov = 0
        for sf in pkg.findall("sourcefile"):
            filename = f"{a.source_root.rstrip('/')}/{pkg.get('name')}/{sf.get('name')}"
            class_el = ET.SubElement(
                classes_el, "class",
                name=f"{pkg.get('name').replace('/', '.')}.{os.path.splitext(sf.get('name'))[0]}",
                filename=filename,
            )
            ET.SubElement(class_el, "methods")
            lines_el = ET.SubElement(class_el, "lines")
            l_cov = l_valid = b_cov = b_valid = 0
            for line in sf.findall("line"):
                ci, mi = int(line.get("ci")), int(line.get("mi"))
                cb, mb = int(line.get("cb")), int(line.get("mb"))
                l_valid += 1
                l_cov += 1 if ci > 0 else 0
                attrs = {"number": line.get("nr"), "hits": "1" if ci > 0 else "0"}
                if cb + mb > 0:
                    attrs["branch"] = "true"
                    attrs["condition-coverage"] = f"{100 * cb // (cb + mb)}% ({cb}/{cb + mb})"
                    b_valid += cb + mb
                    b_cov += cb
                else:
                    attrs["branch"] = "false"
                ET.SubElement(lines_el, "line", **attrs)
            class_el.set("line-rate", rate(l_cov, l_valid))
            class_el.set("branch-rate", rate(b_cov, b_valid))
            class_el.set("complexity", "0")
            p_lines += l_valid; p_cov += l_cov; p_br += b_valid; p_brcov += b_cov
        pkg_el = ET.SubElement(
            packages_el, "package", name=pkg.get("name").replace("/", "."),
            **{"line-rate": rate(p_cov, p_lines), "branch-rate": rate(p_brcov, p_br), "complexity": "0"},
        )
        pkg_el.append(classes_el)
        tot_lines += p_lines; tot_cov += p_cov; tot_br += p_br; tot_brcov += p_brcov

    root.set("lines-valid", str(tot_lines))
    root.set("lines-covered", str(tot_cov))
    root.set("line-rate", rate(tot_cov, tot_lines))
    root.set("branches-valid", str(tot_br))
    root.set("branches-covered", str(tot_brcov))
    root.set("branch-rate", rate(tot_brcov, tot_br))
    ET.indent(root)
    ET.ElementTree(root).write(a.cobertura, encoding="utf-8", xml_declaration=True)
    print(f"{a.cobertura}: lines {tot_cov}/{tot_lines}, branches {tot_brcov}/{tot_br}")


if __name__ == "__main__":
    main()
