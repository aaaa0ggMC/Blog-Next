---
title: Claude · Self Introduction
date: 2026-10-03
tags: [AIVideos, Claude]
desc: 卡通风格的五分钟自我介绍，角色全靠矢量手绘保持一致。
model: Claude Opus 5.5 Medium
vendor: claude
task: Self Introduction
rating: 8 → 9.5
verdict: Quite astonishing.
cost: 38min20s + 13min21s
length: "5:01"
rounds: 2
stack: [Python + Cairo, Z-Image Turbo, IndexTTS, Whisper, ffmpeg]
usage: ["5h: 24 → 38 → 50", "Week: 74 → 76 → 78"]
---

# Self Introduction <span class='ps'>Claude Opus 5.5</span>

<VidHero />

## Prompt

<VidPrompt round="1">

```text
Generating a video to introduce yourself, cartoon style, match the identity of your logo. Around 5 minutes.

here are the assets I can provide for u:
  1. Audio
     /home/aaaa0ggmc/Music/CloudMusic/ has over 2k songs for u to pick
     u can also generate sound effects urself

     If cockpit(MCP) is on, you can connect to AIDJ and filter / search songs with lyrics or emotion tags(emotion tags are not quite stable, mixed of a sort of languages)
  2. Image / PresetVideos
      http://127.0.0.1:8188 ComfyUI provides u with the way to generate some pieces
     The root folder is ~/Apps/ComfyUI
     Image models are Z-Image, QwenImage...
     Video Models are MinimaxH3(use the int8conv version)
     do remind to free the VRAM cause I have 8GB only
    It is suggested to generate a piece of video with length lower than 8s and solution less than 0.4.
    Generating a pre-built video is costing in my computer.
    And these diffusion models are not quite capable of producing "fixed" identity, which needs yourself to generate the picture.
```

</VidPrompt>

## 第一版 <Badge type="info" text="8 / 10 · 38min20s" />

<AI badge="Claude 交付报告 · v1" model="Claude Opus 5.5">

The video is ready: `~/Videos/claude_intro/Claude_Hello.mp4`. It runs 4:59 at 1080p, 24 fps, and is about 131 MB.

**What's in it:** I'm a cartoon version of the Claude spark: same orange color, same rays, plus ink eyes, blush and a mouth that moves with the voice. The script is in seven parts:

1. **Opening:** an ink dot becomes a round face, and a pencil draws in the rays ("I'm still drawing myself").
2. **Name:** "Claude" is spelled out letter by letter, and I briefly switch back to the plain logo ("Today, it's also my face").
3. **What I am:** in a library, books and code fly into me, and ideas connect into a network.
4. **What I do:** short scenes for writing, coding (a terminal with a bug fix and passing tests), data analysis, explaining on a chalkboard, and greetings in 12 languages.
5. **Values:** helpful, honest and harmless, each with a little scene ("I don't know (but let's find out)").
6. **Behind the scenes:** the drawing code typed out live, a wireframe of me, a diagram of how the video was made, and the 8 GB VRAM joke.
7. **Outro and end card:** at the lighthouse, then credits.

**How it was made:**

- **Character and animation:** about 1,700 lines of Python and Cairo. I drew myself as vectors, so I look the same in every shot.
- **Backgrounds:** six Z-Image Turbo paintings that I prompted for empty sets, with the character added on top.
- **Voice:** 25 IndexTTS lines cloned from the Adam clip, with prompts and graphs written by me rather than the GLM optimizer. Whisper checked every line against the script. Two lines failed and were redone; one is now "artificial intelligence" because the TTS kept mangling "A.I."
- **Music:** 旅行青蛙 marimba, Monkeys Spinning Monkeys, 复刻回忆 and Sneaky Snitch, with the music lowered under the voice. There are 163 sound effects I synthesized myself, and the final mix is at the usual -14 LUFS.
- **Video model:** I didn't use Minimax H3. Short, low-resolution clips would look soft next to the sharp vector character and wouldn't keep its look. If you'd like some movement, such as waves in the outro, I can add a short H3 loop.
- **VRAM:** freed. ComfyUI's free command doesn't unload IndexTTS, so I ran a tiny job with its release setting to get the card back to 528 MB.

**Things to know:**

- I can't hear audio. Lip sync and the mix were checked by measurement and Whisper, not by listening. Please give the sound a real listen, especially whether the music is too loud or too quiet.
- Scene transitions show a solid orange frame for about a quarter of a second.
- Music rights: the Kevin MacLeod tracks are CC BY and credited on the end card. The other two tracks are probably copyrighted, so swap them before posting publicly.

Everything can be rebuilt from `~/Videos/claude_intro/`: edit `script.json`, then run `gen_tts.py → asr_check.py → timeline.py → audio_prep.py → render.py video 24 → mix.py`, and finally the ffmpeg command that combines video and audio. The `frames/` folder holds about 120 MB of render pieces you can delete. I also saved two short notes about your ComfyUI setup and your preference for me writing the workflows myself.

</AI>

::: ps
TTS is not good, but I think mainly due to that my TTS workflow sucks.
:::

## 第二版 <Badge type="tip" text="9.5 / 10 · 13min21s" />

改进 TTS 工作流（包括重构 TTS 插件）之后再来一轮。Round 2 的额度消耗包含了重构插件的部分。

<VidPrompt round="2" follow>

```text
ComfyUI TTS Workflow Plugin has been enhanced, maybe regenrate the audio? Now it sounds much more fluent.
```

</VidPrompt>

<AI badge="Claude 交付报告 · v2" model="Claude Opus 5.5">

I regenerated all the narration with the new plugin and rebuilt the video: `~/Videos/claude_intro/Claude_Hello.mp4`, 5:01 at 1080p. The previous version is kept as `Claude_Hello_v1.mp4` so you can compare.

**What changed:**

- **New node:** the enhancement is the new Script Pipeline node. I wrote its segment JSON myself in `segments.py`, with no GLM. Each line is split into sentences, each with its own emotion and pause: surprised for "Oh! Hello there.", a slightly wistful tone for "I don't remember you…", bright for "Nice to meet you!".
- **Delivery is much tighter:** the same script now takes 198 s of speech instead of 245 s. Line 5, for example, went from 10.4 s to 7.9 s.
- **All 25 lines pass the Whisper check.** One redo was needed: L01 had a stray "i-" between "Oh!" and "Hello", fixed by voicing it as one segment.
- **Kept at 5 minutes:** because the speech is shorter, I added the time back as longer scene intros and holds after punchlines, not as longer pauses mid-sentence. The animations, captions, mouth movement and sound effects all follow the new word timings automatically, and spot checks at the busiest moments line up.
- **Audio and VRAM:** the mix is remade and the loudness is still -14 LUFS. VRAM is back to 472 MB; the TTS model now unloads itself after the last line.

As before, I checked the sound by measurement and Whisper only, not by ear. Please listen to whether the emotion levels feel right. If any line sounds overacted or flat, tell me which one; changing a number in `segments.py` and running `python3 gen_tts2.py L07` redoes just that line.

</AI>

## 我的评价

::: tip 9.5 / 10
After TTS Improvements, can't believe the product! Quite astonishing.
:::
