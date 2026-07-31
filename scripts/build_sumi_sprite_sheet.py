"""Validate Sumi frames and build the lossless runtime atlas plus QA previews."""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
PET_ROOT = PROJECT_ROOT / "assets" / "pet-candidates" / "07-sumi"
FRAMES_ROOT = PET_ROOT / "frames"
PREVIEW_ROOT = PET_ROOT / "qa" / "previews"
CONTACT_SHEET_PATH = PET_ROOT / "qa" / "contact-sheet.png"
VALIDATION_PATH = PET_ROOT / "qa" / "directional-validation.json"
ATLAS_PATH = PROJECT_ROOT / "src" / "assets" / "pets" / "sumi.png"

CELL_WIDTH = 192
CELL_HEIGHT = 208
ATLAS_COLUMNS = 8
STATES = {
    "idle": {
        "row": 0,
        "frames": 6,
        "durations": [280, 110, 110, 140, 140, 320],
    },
    "down": {"row": 1, "frames": 8, "durations": [120] * 7 + [220]},
    "up": {"row": 2, "frames": 8, "durations": [120] * 7 + [220]},
    "left": {"row": 3, "frames": 8, "durations": [120] * 7 + [220]},
    "right": {"row": 4, "frames": 8, "durations": [120] * 7 + [220]},
}


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = (
        Path("C:/Windows/Fonts/consola.ttf"),
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"),
    )
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default()


def frame_paths(state: str) -> list[Path]:
    return sorted((FRAMES_ROOT / state).glob("*.png"))


def validate_and_load() -> dict[str, list[Image.Image]]:
    loaded: dict[str, list[Image.Image]] = {}
    for state, spec in STATES.items():
        paths = frame_paths(state)
        expected = int(spec["frames"])
        if len(paths) != expected:
            raise ValueError(f"{state}: expected {expected} frames, found {len(paths)}")

        images: list[Image.Image] = []
        for path in paths:
            image = Image.open(path).convert("RGBA")
            if image.size != (CELL_WIDTH, CELL_HEIGHT):
                raise ValueError(
                    f"{path}: expected {(CELL_WIDTH, CELL_HEIGHT)}, got {image.size}"
                )
            pixels = (
                image.get_flattened_data()
                if hasattr(image, "get_flattened_data")
                else image.getdata()
            )
            for red, green, blue, alpha in pixels:
                if alpha == 0:
                    continue
                if alpha != 255 or (red, green, blue) not in {
                    (0, 0, 0),
                    (255, 255, 255),
                }:
                    raise ValueError(f"{path}: contains a non-binary visible pixel")
            if image.getbbox() is None:
                raise ValueError(f"{path}: frame is empty")
            images.append(image)
        loaded[state] = images
    return loaded


def build_atlas(frames: dict[str, list[Image.Image]]) -> Image.Image:
    atlas = Image.new(
        "RGBA",
        (ATLAS_COLUMNS * CELL_WIDTH, len(STATES) * CELL_HEIGHT),
        (0, 0, 0, 0),
    )
    for state, spec in STATES.items():
        row = int(spec["row"])
        for column, frame in enumerate(frames[state]):
            atlas.alpha_composite(frame, (column * CELL_WIDTH, row * CELL_HEIGHT))
    return atlas


def save_previews(frames: dict[str, list[Image.Image]]) -> None:
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    for state, images in frames.items():
        durations = STATES[state]["durations"]
        images[0].save(
            PREVIEW_ROOT / f"{state}.gif",
            save_all=True,
            append_images=images[1:],
            duration=durations,
            loop=0,
            disposal=2,
            optimize=False,
        )


def make_contact_sheet(frames: dict[str, list[Image.Image]]) -> Image.Image:
    label_width = 100
    sheet = Image.new(
        "RGBA",
        (label_width + ATLAS_COLUMNS * CELL_WIDTH, len(STATES) * CELL_HEIGHT),
        "white",
    )
    draw = ImageDraw.Draw(sheet)
    font = load_font(18)
    hint_font = load_font(12)
    for state, spec in STATES.items():
        row = int(spec["row"])
        top = row * CELL_HEIGHT
        draw.rectangle(
            (0, top, sheet.width - 1, top + CELL_HEIGHT - 1),
            outline="black",
            width=1,
        )
        draw.text((12, top + 76), state.upper(), fill="black", font=font)
        draw.text(
            (12, top + 104),
            f"{int(spec['frames'])} FRAMES",
            fill="black",
            font=hint_font,
        )
        for column, frame in enumerate(frames[state]):
            sheet.alpha_composite(frame, (label_width + column * CELL_WIDTH, top))
            draw.rectangle(
                (
                    label_width + column * CELL_WIDTH,
                    top,
                    label_width + (column + 1) * CELL_WIDTH - 1,
                    top + CELL_HEIGHT - 1,
                ),
                outline="black",
                width=1,
            )
    return sheet.convert("RGB")


def main() -> None:
    frames = validate_and_load()
    atlas = build_atlas(frames)
    ATLAS_PATH.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(ATLAS_PATH, optimize=True)

    save_previews(frames)
    CONTACT_SHEET_PATH.parent.mkdir(parents=True, exist_ok=True)
    make_contact_sheet(frames).save(CONTACT_SHEET_PATH, optimize=True)

    validation = {
        "ok": True,
        "atlas": str(ATLAS_PATH),
        "atlas_size": list(atlas.size),
        "cell_size": [CELL_WIDTH, CELL_HEIGHT],
        "palette": ["#000000", "#ffffff", "transparent"],
        "states": {
            state: {
                "row": int(spec["row"]),
                "frames": int(spec["frames"]),
                "preview": str(PREVIEW_ROOT / f"{state}.gif"),
            }
            for state, spec in STATES.items()
        },
    }
    VALIDATION_PATH.write_text(
        json.dumps(validation, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(validation, indent=2))


if __name__ == "__main__":
    main()
