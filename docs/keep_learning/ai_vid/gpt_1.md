---
title: GPT · Self Introduction
date: 2026-10-03
tags: [AIVideos, GPT]
desc: 用标志启发的卡通角色、英文旁白和原创配乐完成五分钟自我介绍。
model: gpt-6-astra medium
vendor: openai
task: Self Introduction
cost: 5min33.350s
length: "5:00"
rounds: 2
stack: [Python, Pillow, NumPy, ImageGen, Edge TTS, FFmpeg]
rating: 5
verdict: 中规中矩，没啥特点，像在念PPT
usage: ["5h(Plus): 100 → 35", "week(Plus): 100 → 90"]
---

# Self Introduction <span class='ps'>gpt-6-astra</span>

<VidHero />

## 内嵌查看
<Bili bvid="BV1cFH863Efs" p="5" />

## Prompt

<VidPrompt round="1">

```text
work in Folder Movie_Astra

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

## 耗时

本节依据本会话日志中的时间戳整理，时间均为 2026-10-03（Asia/Shanghai，UTC+8）。

| 记录点 | 时间 |
| :--- | :--- |
| 视频制作任务开始（task_started） | 06:58:26.329 |
| 第一条视频需求入日志 | 06:58:27.312 |
| 用户补充可使用 ImageGen | 06:58:57.089 |
| 最终交付回复入日志 | 07:03:59.593 |
| 视频制作任务完成（task_complete） | 07:03:59.679 |

`cost` 取任务开始到任务完成的墙钟时间：**5min33.350s**。这包含制作中的补充指令；没有第二版重做，不拆成两笔相加，也不包含本次博客整理。它不是 GPU 渲染耗时或模型推理净耗时。

## 制作过程与补充指令

以下按时间顺序保留面向用户的文字回复；工具调用、工具输出和生成图片不作为文字对话重复收录。

### 06:58:31.666 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

I’ll work in `Movie_Astra` and build a roughly five-minute cartoon introduction around the OpenAI knot logo, using a consistent character and lightweight animation. I’ll first check the available rendering tools, ComfyUI setup, and audio library, then create and render the video with your 8 GB VRAM limit in mind.

</AI>

### 06:58:43.167 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

I’m using the OpenAI Docs skill to keep the introduction accurate. The visual direction is a friendly knot-inspired cartoon guide, with expressive eyes, simple hands, and a teal, cream, and charcoal palette.

</AI>

### 06:58:57.089 · 补充指令

<VidPrompt round="2" follow>

```text
You can also use your own image gen skills

```

</VidPrompt>

### 06:59:00.716 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

I’ll use the imagegen skill to create a character reference, then animate a reusable version so its identity stays consistent throughout the film. I’m planning an English voiceover with subtitles, an original gentle electronic score, and a story that shows how I help turn an idea into a finished project.

</AI>

### 07:00:32.938 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

The character is ready: a mint-colored knot with a friendly face and oversized sneakers. ComfyUI is available, but I can animate this character on the CPU, keeping the film visually consistent without loading a video model into your GPU. I’m now building the narrated scenes, moving props, subtitles, and soundtrack.

</AI>

### 07:02:35.776 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

The voiceover and all 15 scenes are built. The story follows a recipe-app idea through planning, coding, debugging, and delivery, then introduces creative work and the importance of checking my answers. I’m checking the artwork and pacing before the full five-minute render.

</AI>

### 07:03:28.092 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

The full render is underway. It will be a five-minute, 720p cartoon motion-graphics film with synthetic narration, on-screen captions, and an original score. I’m also saving the script, artwork, audio, and renderer in `Movie_Astra` so you can revise it later.

</AI>

### 07:03:51.264 · GPT

<AI badge="GPT 制作进度" model="gpt-6-astra">

The video has rendered at exactly 5:00. The captions fit within the frame, the audio has headroom without clipping, and the export is 1280 × 720 at 24 fps. I’m checking the finished file for decoding errors and opening it for you.

</AI>

## 交付报告

<AI badge="GPT 交付报告" model="gpt-6-astra">

Created [Meet Codex.mp4](/home/aaaa0ggmc/CChaos/Codex/Movie_Astra/Meet_Codex.mp4) — **5 minutes, 720p**, with a logo-inspired cartoon character, English narration, subtitles, and original music.

The complete video passed decoding checks. Editable sources, artwork, and audio are saved in [Movie_Astra](/home/aaaa0ggmc/CChaos/Codex/Movie_Astra/README.md). Rendering used no GPU VRAM.

</AI>

## 我的评价

还行吧，但是没啥特点，同时做得和 PPT 一样，不过速度确实很快，看得出来适合快速产生 PPT，打工人严选属于是......

不过它还看不上我的 ComfyUI 以及本地曲库，所有东西都自己搓，我的资源给了和没给没啥区别，感觉还是 OpenAI 对版权太在意了？