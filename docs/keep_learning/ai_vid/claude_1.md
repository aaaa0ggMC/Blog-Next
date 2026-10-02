---
title: Claude · Merry Christmas Mr.Lawrence 可视化
date: 2026-10-03
tags: [AIVideos, Claude]
desc: 自由发挥：798 个钢琴音符变成 798 片雪花。
model: Claude Opus 5.5 Medium
vendor: claude
task: Freestyle
rating: 4
verdict: ComfyUI 带来了真实感，却也吃掉了画面的“运动感”。
cost: 44min34s
length: "4:46"
stack: [Remotion, Z-Image Turbo, MiniMax H3, librosa, ffmpeg]
usage: ["5h: 15 → 23", "Week: 73 → 74"]
---

# Merry Christmas Mr.Lawrence <span class='ps'>「一音一雪」</span>

<VidHero />

## 内嵌查看
<Bili bvid="BV1cFH863Efs" p="1" />

## Prompt

<VidPrompt round="1">

```text
make a video with ur unique idea (like render with pnpm libraries or whatever, choose the one you've mastered), here are the assets I can provide for u
  The length of the video is 5min ballpark

  1. Audio
     /home/aaaa0ggmc/Music/CloudMusic/ has over 2k songs for u to pick
     u can also generate sound effects urself
  2. Image / PresetVideos
      http://127.0.0.1:8188 ComfyUI provides u with the way to generate some pieces
     The root folder is ~/Apps/ComfyUI
     Image models are Z-Image, QwenImage...
     Video Models are MinimaxH3(use the int8conv version)
     do remind to free the VRAM cause I have 8GB only

  It is suggested to generate a piece of video with length lower than 5s and solution less than 0.4.
  Generating a pre-built video is costing in my computer.
```

</VidPrompt>

## 交付报告

<AI badge="Claude 交付报告" model="Claude Opus 5.5">

The video is finished: 「一音一雪」Every Note a Snowflake, 4:46 at 1080p30 with a letterboxed picture. I checked the finished file (duration, audio streams and levels, sampled frames from every chapter, and the credits) but haven't watched it straight through.

- `~/CChaos/snowfall/out/snowfall.mp4`: the master (783 MB)
- `~/CChaos/snowfall/out/snowfall_share.mp4`: a re-encode tuned for grain, but still 405 MB. The film grain is what keeps both files big.

**The idea:** the soundtrack is Sakamoto's Merry Christmas Mr. Lawrence. I detected every piano note in the recording (798 of them), and each one becomes a snowflake on screen at the moment it's played:

- **When it appears:** the flake appears exactly on its note.
- **Where:** pitch decides its horizontal position, so higher notes lean right.
- **How big:** how hard the key was struck sets its size and the ripple when it lands. The strongest notes draw a six-armed crystal.
- **Constellations:** notes played one after another are joined by faint lines, so the melody draws shapes across the sky.
- **Climax (2:52):** a white flash, and from there to 3:42 the notes turn into warm embers that rise with the sky lanterns instead of falling. After that they're snow again, and gold at dawn.

**The story:** a deep-blue snowy world with one red light carried through it, in seven chapters (Field → Station → Letter → Forest → Way Back → A Thousand Lights → Window → dawn). Each chapter has a title card and short poetic lines I wrote in Chinese and English. The top and bottom black bars carry a strip showing the whole song's notes with a moving playhead, plus a running count of flakes so far (e.g. ❄ 451 / 798).

**How it was made:**

| Part | Tool | Cost |
| :--- | :--- | :--- |
| 14 keyframes, 1920×1088 | Z-Image Turbo (nvfp4) | about 18 s each |
| 6 motion clips, 864×480, about 4.5 s | MiniMax H3 int8 convrot image-to-video, 8-step turbo LoRA | about 200 s each |
| Note detection | librosa | — |
| Composition and render | Remotion with pnpm | 8 min for the full render |

- **Clips:** played at 0.45× speed, so each fills about 10 s as a slow-motion shot.
- **Images:** slow pan-and-zoom moves, with crossfades between shots.
- **Look:** the picture brightens slightly with the music's loudness, plus film grain, a vignette, and drifting background snow.
- **Sound:** a soft wind bed I synthesized with ffmpeg plays under the intro and the ending.
- **VRAM:** I freed it after every ComfyUI job; it's back to about 0.6 GB.

**Re-editing:** the shot list, chapters and poem lines are in `src/timeline.ts`. Run `pnpm studio` to preview and `pnpm render` to re-render.

The one visual weakness is that the motion clips are 480p scaled up to 1080p, so they look a little softer than the stills. The grain hides most of it, but it shows on a big screen.

</AI>

## 我的评价

::: tip 4 / 10
Claude Opus 5.5 frequently uses ComfyUI to generate the video which introduces reality but also reduces the "movement" of the video.
:::

::: ps
44min34s 里有一大半是在等 ComfyUI。
:::
