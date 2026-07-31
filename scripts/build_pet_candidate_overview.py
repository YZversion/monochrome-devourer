"""Validate Phase 0 pet candidates and build static/animated selection sheets."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1] / "assets" / "pet-candidates"
OUTPUT_DIR = ROOT / "qa"
FRAME_SIZE = (192, 208)
FRAME_COUNT = 6
GIF_DURATIONS_MS = [280, 110, 110, 140, 140, 320]
CARD_SIZE = (328, 252)
GRID_SIZE = (5, 2)

NAMES = {
    "01-momo": "MOMO / TUXEDO KITTEN",
    "02-taffy": "TAFFY / FLOPPY PUPPY",
    "03-yuki": "YUKI / FENNEC FOX",
    "04-nori": "NORI / BOBTAIL KITTEN",
    "05-pochi": "POCHI / CORGI PUPPY",
    "06-kumo": "KUMO / ARCTIC FOX",
    "07-sumi": "SUMI / LONGHAIR KITTEN",
    "08-bibi": "BIBI / SHIBA PUPPY",
    "09-ruru": "RURU / WOODLAND FOX",
    "10-lumi": "LUMI / MOON KITTEN",
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


def validate_frame(path: Path) -> Image.Image:
    image = Image.open(path).convert("RGBA")
    if image.size != FRAME_SIZE:
        raise ValueError(f"{path}: expected {FRAME_SIZE}, got {image.size}")

    pixels = (
        image.get_flattened_data()
        if hasattr(image, "get_flattened_data")
        else image.getdata()
    )
    for red, green, blue, alpha in pixels:
        if alpha == 0:
            continue
        if alpha != 255 or (red, green, blue) not in {(0, 0, 0), (255, 255, 255)}:
            raise ValueError(f"{path}: contains a non-binary pixel")
    return image


def load_candidates() -> list[tuple[str, list[Image.Image]]]:
    candidates: list[tuple[str, list[Image.Image]]] = []
    for slug in NAMES:
        frame_paths = sorted((ROOT / slug / "frames" / "idle").glob("*.png"))
        if len(frame_paths) != FRAME_COUNT:
            raise ValueError(f"{slug}: expected {FRAME_COUNT} idle frames, got {len(frame_paths)}")

        preview_path = ROOT / slug / "qa" / "previews" / "idle.gif"
        with Image.open(preview_path) as preview:
            if getattr(preview, "n_frames", 1) != FRAME_COUNT:
                raise ValueError(f"{slug}: idle.gif is not a six-frame animation")

        candidates.append((slug, [validate_frame(path) for path in frame_paths]))
    return candidates


def render_sheet(
    candidates: list[tuple[str, list[Image.Image]]],
    frame_index: int,
) -> Image.Image:
    width = CARD_SIZE[0] * GRID_SIZE[0]
    height = CARD_SIZE[1] * GRID_SIZE[1]
    sheet = Image.new("RGBA", (width, height), "white")
    draw = ImageDraw.Draw(sheet)
    title_font = load_font(16)
    hint_font = load_font(12)

    for index, (slug, frames) in enumerate(candidates):
        column = index % GRID_SIZE[0]
        row = index // GRID_SIZE[0]
        left = column * CARD_SIZE[0]
        top = row * CARD_SIZE[1]
        draw.rectangle(
            (left, top, left + CARD_SIZE[0] - 1, top + CARD_SIZE[1] - 1),
            outline="black",
            width=2,
        )
        draw.text((left + 12, top + 9), f"{index + 1:02d}", fill="black", font=title_font)
        draw.text((left + 48, top + 9), NAMES[slug], fill="black", font=hint_font)

        frame = frames[frame_index]
        sheet.alpha_composite(frame, (left + 12, top + 35))

        mini = frame.resize((96, 104), Image.Resampling.NEAREST)
        mini_left = left + 220
        mini_top = top + 76
        draw.rectangle(
            (mini_left - 4, mini_top - 4, mini_left + 99, mini_top + 107),
            outline="black",
            width=1,
        )
        sheet.alpha_composite(mini, (mini_left, mini_top))
        draw.text((mini_left + 2, mini_top + 112), "50% GAME CHECK", fill="black", font=hint_font)

    return sheet.convert("RGB")


def main() -> None:
    candidates = load_candidates()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sheets = [render_sheet(candidates, index) for index in range(FRAME_COUNT)]
    sheets[0].save(OUTPUT_DIR / "contact-sheet.png")
    sheets[0].save(
        OUTPUT_DIR / "contact-sheet.gif",
        save_all=True,
        append_images=sheets[1:],
        duration=GIF_DURATIONS_MS,
        loop=0,
        disposal=2,
        optimize=False,
    )

    print(
        f"validated {len(candidates)} candidates × {FRAME_COUNT} frames; "
        f"wrote {OUTPUT_DIR / 'contact-sheet.png'} and {OUTPUT_DIR / 'contact-sheet.gif'}"
    )


if __name__ == "__main__":
    main()
