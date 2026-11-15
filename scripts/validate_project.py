#!/usr/bin/env python3
"""Static validation for the MMS Sports Center project."""
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SKIP_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []
        self.ids: list[str] = []
        self.images_without_alt: list[str] = []
        self.controls: list[tuple[str, str | None, str | None]] = []
        self.labels_for: set[str] = set()
        self.label_depth = 0

    def handle_starttag(self, tag: str, attrs_list: list[tuple[str, str | None]]) -> None:
        attrs = dict(attrs_list)
        if tag == "label":
            self.label_depth += 1
        if attrs.get("id"):
            self.ids.append(attrs["id"] or "")
        for attr in ("href", "src"):
            if attrs.get(attr):
                self.refs.append((attr, attrs[attr] or ""))
        if tag == "img" and "alt" not in attrs:
            self.images_without_alt.append(attrs.get("src") or "<inline image>")
        if tag == "label" and attrs.get("for"):
            self.labels_for.add(attrs["for"] or "")
        if tag in {"input", "select", "textarea"}:
            input_type = (attrs.get("type") or "").lower()
            if input_type != "hidden":
                wrapped = "wrapped" if self.label_depth > 0 else None
                self.controls.append((tag, attrs.get("id"), attrs.get("aria-label") or wrapped))

    def handle_endtag(self, tag: str) -> None:
        if tag == "label" and self.label_depth > 0:
            self.label_depth -= 1


def local_target(page: Path, value: str) -> Path | None:
    value = value.strip()
    if not value or value.startswith("#") or value.startswith("//"):
        return None
    parts = urlsplit(value)
    if parts.scheme.lower() in SKIP_SCHEMES or parts.netloc:
        return None
    path = parts.path
    if not path:
        return None
    return (page.parent / path).resolve()


def main() -> int:
    problems: list[str] = []
    html_files = sorted(ROOT.rglob("*.html"))
    js_files = sorted(ROOT.rglob("*.js"))

    for page in html_files:
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
        except Exception as exc:
            problems.append(f"HTML parse failure: {page.relative_to(ROOT)}: {exc}")
            continue

        duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
        for item in duplicates:
            problems.append(f"Duplicate id '{item}' in {page.relative_to(ROOT)}")

        for attr, value in parser.refs:
            target = local_target(page, value)
            if target is not None and not target.exists():
                problems.append(f"Broken {attr} in {page.relative_to(ROOT)}: {value}")

        for source in parser.images_without_alt:
            problems.append(f"Image missing alt in {page.relative_to(ROOT)}: {source}")

        for tag, control_id, aria_label in parser.controls:
            if aria_label:
                continue
            if control_id and control_id in parser.labels_for:
                continue
            problems.append(
                f"Unlabelled {tag} in {page.relative_to(ROOT)}"
                + (f" (id={control_id})" if control_id else "")
            )

    node = shutil.which("node")
    if node:
        for script in js_files:
            result = subprocess.run([node, "--check", str(script)], capture_output=True, text=True)
            if result.returncode != 0:
                problems.append(f"JavaScript syntax: {script.relative_to(ROOT)}\n{result.stderr.strip()}")

    print(f"Checked {len(html_files)} HTML files and {len(js_files)} JavaScript files.")
    if problems:
        print(f"FAILED with {len(problems)} issue(s):")
        for issue in problems:
            print(f"- {issue}")
        return 1
    print("PASS: no broken local references, duplicate IDs, missing image alt attributes, unlabelled controls, or JavaScript syntax errors were detected.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
