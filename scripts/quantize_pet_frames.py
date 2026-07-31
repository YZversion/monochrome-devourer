"""Normalize extracted pet frames to hard-edged pure black/white RGBA pixels."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def quantize_frame(path: Path, luminance_threshold: int, alpha_threshold: int) -> None:
    image = Image.open(path).convert("RGBA")
    normalized = Image.new("RGBA", image.size, (0, 0, 0, 0))
    source_pixels = image.load()
    target_pixels = normalized.load()

    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = source_pixels[x, y]
            if alpha < alpha_threshold:
                continue

            luminance = round(0.2126 * red + 0.7152 * green + 0.0722 * blue)
            value = 255 if luminance >= luminance_threshold else 0
            target_pixels[x, y] = (value, value, value, 255)

    normalized.save(path)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Quantize extracted RGBA pet frames to pure black and white.",
    )
    parser.add_argument("frames_dir", type=Path)
    parser.add_argument("--luminance-threshold", type=int, default=160)
    parser.add_argument("--alpha-threshold", type=int, default=128)
    args = parser.parse_args()

    frame_paths = sorted(args.frames_dir.rglob("*.png"))
    if not frame_paths:
        raise SystemExit(f"no PNG frames found under {args.frames_dir}")

    for frame_path in frame_paths:
        quantize_frame(
            frame_path,
            luminance_threshold=args.luminance_threshold,
            alpha_threshold=args.alpha_threshold,
        )

    print(
        json.dumps(
            {
                "ok": True,
                "frames": len(frame_paths),
                "palette": ["#000000", "#ffffff", "transparent"],
            },
            indent=2,
        ),
    )


if __name__ == "__main__":
    main()
