# Initial Pet Candidates

Status: candidate 07, Sumi, was selected and integrated into the Phase 0 runtime.

All candidates are original black-and-white pixel designs. External references are
used only to study animation structure, silhouette readability, and cute proportions;
no third-party character artwork is copied.

## Shared production contract

- Six-frame looping `idle` strip, following the Codex pet timing contract.
- Compact whole-body sprite readable near the Codex pet's approximate 112 px display
  size.
- Pure black and pure white only; no gray, gradients, shadows, blur, text, or props.
- Gray impression may come only from deliberate black/white dithering.
- Flat `#ff00ff` chroma background during generation, removed for final GIFs.
- Subtle breathing, blink, ear movement, and tail movement; no walking during idle.
- Final chosen pet will receive `up`, `down`, `left`, and `right` movement loops before
  integration into the game.

## Candidate set

| ID | Name | Species | Distinguishing silhouette |
| --- | --- | --- | --- |
| 01 | Momo | Tuxedo kitten | Round head, black ear hood, white muzzle, curled tail |
| 02 | Taffy | Floppy puppy | Long floppy ears, oval nose, tiny wagging tail |
| 03 | Yuki | Fennec fox kit | Oversized ears, tiny body, black ear tips, brush tail |
| 04 | Nori | Bobtail kitten | Square cheeks, asymmetric eye patch, tiny bobtail |
| 05 | Pochi | Corgi puppy | Huge upright ears, low body, white blaze, round rump |
| 06 | Kumo | Arctic fox kit | Fluffy white ruff, compact mask, enormous plume tail |
| 07 | Sumi | Longhair kitten | Soft mane, forehead diamond, fluffy drooping tail |
| 08 | Bibi | Shiba puppy | Round cheeks, triangular ears, black saddle, donut tail |
| 09 | Ruru | Woodland fox kit | Slim paws, alert face, black socks, tail wrapped forward |
| 10 | Lumi | Moon kitten | Crescent forehead mark, split face patch, puff tail |

## Selection artifacts

- [Animated overview](qa/contact-sheet.gif)
- [Static overview with 50% game-size checks](qa/contact-sheet.png)

Each candidate also has an individual six-frame idle preview:

| ID | Preview |
| --- | --- |
| 01 | [Momo](01-momo/qa/previews/idle.gif) |
| 02 | [Taffy](02-taffy/qa/previews/idle.gif) |
| 03 | [Yuki](03-yuki/qa/previews/idle.gif) |
| 04 | [Nori](04-nori/qa/previews/idle.gif) |
| 05 | [Pochi](05-pochi/qa/previews/idle.gif) |
| 06 | [Kumo](06-kumo/qa/previews/idle.gif) |
| 07 | [Sumi](07-sumi/qa/previews/idle.gif) |
| 08 | [Bibi](08-bibi/qa/previews/idle.gif) |
| 09 | [Ruru](09-ruru/qa/previews/idle.gif) |
| 10 | [Lumi](10-lumi/qa/previews/idle.gif) |

## Selected character: 07 Sumi

Sumi's final game-specific previews:

| State | Preview |
| --- | --- |
| Idle | [6-frame idle](07-sumi/qa/previews/idle.gif) |
| W / Up | [8-frame up](07-sumi/qa/previews/up.gif) |
| A / Left | [8-frame left](07-sumi/qa/previews/left.gif) |
| S / Down | [8-frame down](07-sumi/qa/previews/down.gif) |
| D / Right | [8-frame right](07-sumi/qa/previews/right.gif) |

The five-state [contact sheet](07-sumi/qa/contact-sheet.png) and
[validation report](07-sumi/qa/directional-validation.json) are the authoritative
art QA artifacts. The runtime atlas is generated at `src/assets/pets/sumi.png`.

Automated validation confirms that all 60 source frames are 192×208 RGBA images
whose visible pixels use only `#000000` and `#ffffff`. Independent visual QA passed
all ten idle loops at both source size and the 50% game-size preview. The missing
non-idle rows reported by the generic Codex-pet inspector are intentional until the
user selects one design.

## Reference findings

- Codex pets use an 8×9 atlas of 192×208 cells; idle is a six-frame row and is the
  most visible personality state.
- Community Codex pet galleries consistently present animated idle previews at about
  88–112 px, so the face and silhouette must survive aggressive downscaling.
- Mature top-down pet packs commonly use a small idle loop plus four-direction
  movement loops, usually with 8-frame directional cadence.

Sources:

- https://github.com/openai/codex/issues/20863
- https://github.com/openai/codex/issues/20808
- https://github.com/gennadi-kuzmin/awesome-codex-pets
- https://github.com/crafter-station/petdex
- https://pixelfight.itch.io/birdcat
- https://stcrbcn.itch.io/freedogcatmousesprites
- https://kinetic-kitsune.itch.io/animated-pixel-art-fox-character
