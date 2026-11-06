#!/usr/bin/env python3
"""Add a short Apache-2.0 header (Copyright + SPDX) to source files. Idempotent."""
import argparse, datetime, os, re, subprocess, sys

SKIP_DIRS = {"node_modules", "dist", "target", ".angular", "documentation", ".git", "coverage", ".idea", ".vscode"}
SKIP_NAMES = {"mvnw", "mvnw.cmd", "package-lock.json"}
SPDX = "SPDX-License-Identifier: Apache-2.0"

# extension/name -> comment style
LINE_HASH, LINE_SLASH, BLOCK_CSS, HTML, REM, XML = "hash", "slash", "css", "html", "rem", "xml"
STYLES = {
    ".java": LINE_SLASH, ".ts": LINE_SLASH, ".css": BLOCK_CSS, ".html": HTML,
    ".sh": LINE_HASH, ".ps1": LINE_HASH, ".yml": LINE_HASH, ".yaml": LINE_HASH,
    ".properties": LINE_HASH, ".bat": REM, ".cmd": REM, ".xml": XML,
}
NAMES = {"Dockerfile": LINE_HASH}


def style_for(path):
    base = os.path.basename(path)
    if base in SKIP_NAMES or base.endswith(".d.ts"):
        return None
    if base in NAMES:
        return NAMES[base]
    return STYLES.get(os.path.splitext(base)[1])


def header_lines(style, year, owner):
    c, s = f"Copyright {year} {owner}", SPDX
    return {
        LINE_HASH: [f"# {c}", f"# {s}"],
        LINE_SLASH: [f"// {c}", f"// {s}"],
        BLOCK_CSS: ["/*", f" * {c}", f" * {s}", " */"],
        HTML: ["<!--", f"  {c}", f"  {s}", "-->"],
        REM: [f"REM {c}", f"REM {s}"],
        XML: ["<!--", f"  {c}", f"  {s}", "-->"],
    }[style]


def first_commit_year(path):
    try:
        out = subprocess.run(
            ["git", "log", "--diff-filter=A", "--follow", "--format=%ad", "--date=format:%Y", "--", path],
            capture_output=True, text=True, check=True).stdout.split()
        return out[-1] if out else None
    except Exception:
        return None


def process(path, owner, year, dry):
    style = style_for(path)
    if not style:
        return "skip"
    raw = open(path, "rb").read()
    if b"\0" in raw[:1024]:
        return "skip"
    bom = raw.startswith(b"\xef\xbb\xbf")
    text = raw[3:].decode("utf-8") if bom else raw.decode("utf-8")
    if SPDX.split(":")[0] in "\n".join(text.splitlines()[:15]):
        return "has-header"
    nl = "\r\n" if "\r\n" in text else "\n"
    lines = text.split(nl)
    y = year or first_commit_year(path) or str(datetime.date.today().year)
    hdr = header_lines(style, y, owner)

    # number of leading lines that must stay first
    keep = 0
    if lines and lines[0].startswith("#!"):
        keep = 1
    elif style == XML and lines and lines[0].lstrip().startswith("<?xml"):
        keep = 1
    elif style == REM and lines and re.match(r"@echo\s+off", lines[0], re.I):
        keep = 1
    elif os.path.basename(path) == "Dockerfile":
        while keep < len(lines) and re.match(r"#\s*(syntax|escape)\s*=", lines[keep], re.I):
            keep += 1
    elif style == HTML and lines and lines[0].lower().startswith("<!doctype"):
        keep = 1

    new = lines[:keep] + hdr + ([""] if style in (LINE_SLASH, BLOCK_CSS, HTML, XML) and lines[keep:keep+1] != [""] else []) + lines[keep:]
    if style in (LINE_HASH, REM) and keep == 0 and lines[0] != "":
        new = hdr + [""] + lines
    if not dry:
        data = nl.join(new).encode("utf-8")
        open(path, "wb").write((b"\xef\xbb\xbf" if bom else b"") + data)
    return "added"


def collect(paths):
    if not paths:
        out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True).stdout.split("\n")
        return [p for p in out if p and not set(p.split("/")) & SKIP_DIRS]
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, dirs, names in os.walk(p):
                dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
                files += [os.path.join(root, n) for n in names]
        else:
            files.append(p)
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--owner")
    ap.add_argument("--year")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    owner = a.owner or subprocess.run(["git", "config", "user.name"], capture_output=True, text=True).stdout.strip()
    if not owner:
        sys.exit("No owner: pass --owner")
    counts = {}
    for f in collect(a.paths):
        r = process(f, owner, a.year, a.dry_run)
        counts[r] = counts.get(r, 0) + 1
        if r == "added":
            print(("would add: " if a.dry_run else "added: ") + f)
    print(counts)


if __name__ == "__main__":
    main()
