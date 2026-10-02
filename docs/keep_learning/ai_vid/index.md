---
title: AI Videos
tags: []
desc: AI 视频生成探索。
---
# AI Videos <span class='ps'>只靠 Diffusion，目前似乎不太够</span>

::: ins
Claude Opus 5.5 在社区的表现属实惊人，加上我额度属实用不完（比较无聊说是），因此我便打算使用目前支持多模态的 AI 来生成一些好玩的视频。当然自己调的比如 MinimaxH3 生成的视频也会放这里。
:::

## 答卷

<VidBoard />

::: ps
评分纯主观，满分理论 10 分，未来可能超出 10 分。
:::

## 考场环境

| 角色 | 配置 |
| :--- | :--- |
| LLM | Claude Pro Subscription |
| LLM | DeepSeek Official API |
| 本地算力 | PC with RTX 5060 Laptop（8GB VRAM，跑 ComfyUI） |

## 通用素材说明

每道题都会附带下面这段素材说明（各篇 Prompt 里保留了原文）。

<VidPrompt label="Assets" note="所有题目共用">

```text
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

快速让AI回填：
```text
Fill (~/Projs/Blog/docs/keep_learning/ai_vid/) with our turns and timecost, see ~/Projs/Blog/guides/AI_VID_WRITING_GUIDE.md for some instructions.
```

</VidPrompt>
