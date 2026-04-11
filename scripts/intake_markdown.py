#!/usr/bin/env python3
"""Fast document intake helper.

Uses MarkItDown when available, otherwise falls back to plain text or bytes-safe
best effort decoding. Intended for local scouting and analysis prep.
"""

from __future__ import annotations

import argparse
from pathlib import Path


def convert_with_markitdown(path: Path) -> str:
    try:
        from markitdown import MarkItDown
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(f"MarkItDown unavailable: {exc}") from exc

    md = MarkItDown()
    result = md.convert(str(path))
    text = getattr(result, "text_content", None) or getattr(result, "text", None) or ""
    return text


def fallback_text(path: Path) -> str:
    data = path.read_bytes()
    for encoding in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return data.decode(encoding)
        except Exception:
            pass
    return data.decode("utf-8", errors="replace")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    args = ap.parse_args()
    path = Path(args.path)
    if not path.exists():
        raise SystemExit(f"missing file: {path}")

    try:
        text = convert_with_markitdown(path)
    except Exception:
        text = fallback_text(path)

    print(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
