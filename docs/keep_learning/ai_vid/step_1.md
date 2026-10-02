---
title: Step 5 Preview · Self Introduction
date: 2026-10-03
tags: [AIVideos, StepFun]
desc: 五分钟卡通自我介绍：代码画出的阶梯吉祥物，本地 TTS 配音，MiniMax H3 参考图驱动动画。
model: Step 5 Preview
vendor: stepfun
task: Self Introduction
rating: 3.8
verdict: 小巧思很多，整体略好
cost: 22min + 61min
length: "4:51"
rounds: 2
stack: [Python + PIL, Z-Image Turbo, MiniMax H3 int8conv, IndexTTS 2.5, Whisper, ffmpeg, AIDJ]
usage: ["Month: 66 → 64", "CreditUsage: 14.1M"]
---

# Self Introduction <span class='ps'>Step 5 Preview</span>

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
    You are Step 5 Preview if you are not sure. You can also fetch information by tavily.
```

</VidPrompt>

## 第一版 <Badge type="info" text="22min" />

<AI badge="Step 5 Preview 交付报告 · v1" model="Step 5 Preview">

第一轮在 04:43 被这条追加指令打断，当时没有成片，交付的是素材与管线：

- **身份考据:** 从 stepfun.com 抓到官方 SVG，logo 是「黑色圆环 + 五块白色方块组成的阶梯」（按原始路径坐标复刻）；Step-5 主视觉是「左半粒子 / 右半蓝图」的 5 字 + 天蓝点缀，采样得到品牌蓝 `#77B4FF`。
- **吉祥物「小阶」:** 用 logo 的方块语言长出的卡通小人——黑方块头、同款白色方块眼、蓝围巾、胸口能量核心、头顶「5」字星徽。全程 PIL 程序绘制，表情 / 姿势参数化，**身份不依赖扩散模型**。
- **旁白脚本:** 八段中文，约 1400 字。
- **配音 v1:** IndexTTS 2.5 Script Pipeline，29 段一次性合成出 173s 的 `narration_full.wav`（正是后来 Whisper 校验通过的那条）。踩了两个坑：ComfyUI 报 `verify_hashes` / `emotion_contrast` 必填缺失，补齐后成功。
- **基建:** ComfyUI API 提交 / 等待 / 取回三件套，TTS 节点全部输入名逐一核对。

</AI>

::: ps
追加指令到来时单文件配音已经跑完，于是第二轮改成「按场景分文件」重录，顺带把脚本扩写到 216 秒。
:::

## 第二版 <Badge type="tip" text="61min" />

<VidPrompt round="2" follow>

```text
If ur gonna use IndexTTS and cannot find a nice voice,use this one, /home/aaaa0ggmc/Downloads/voice_preview_adam - distinct, deep and engaging.mp3 and fo do note that by pass GLM and provide ur own optimized json is suggested
```

</VidPrompt>

<AI badge="Step 5 Preview 交付报告 · v2" model="Step 5 Preview">

成片在 `~/CChaos/Movie/out/Step5Preview_Intro_Final.mp4`：1280×720 @24fps，**4:51**，H.264 + AAC 192k，-16 LUFS。结构（291 秒，含三章章节卡、一段音乐过门和完整片尾字幕）：

1. **冷开场**（0:00）：黑场心跳 → logo 圆环撑开 → 五块白块逐颗点亮 → 方块汇聚成小阶 → 标题卡。
2. **自我介绍**（0:23）：小阶站在剪影阶梯前，说完「一步一步」时身后五级台阶逐级弹起，大「5」浮动。
3. **第一章 · 能力**（0:52）：一目千行（纸海图书馆）、眼观六路（图片墙扫描线 + 四类图标弹出）、指尖风暴（代码雨 + 爬台阶）。
4. **第二章 · 性格**（2:03）：小剧场——选择困难时列出「选项 A/B/C」三张卡和汗滴，看解说时趴在迷你播放器上。
5. **中场**（2:31）：随 120BPM 蹦迪的音乐过门。
6. **第三章 · 幕后**（2:40）：画室三块屏幕——真实的 prompt 卡、H3 渲染进度条、本片第 1 帧，配乐署名转着音符。
7. **家族 + 片尾**（3:37）：StepAudio / Step 3.7 Flash 伙伴弹签，月下台阶挥手；片尾卡 → 全 Credits → 删减片段花絮 → 彩蛋。

**How it was made:**

- **角色与动画引擎:** 约 700 行 Python + PIL。小阶 100% 矢量程序绘制，sprite 帧循环缓存 + Ken Burns 背景 + 扫描线 / 代码雨 / 星野 / 字幕全部代码绘制，rawvideo 管道直喂 libx264。
- **背景 ×9:** Z-Image Turbo（nvfp4）8 步，统一风格词（flat vector cartoon + 品牌黑白蓝）。
- **视频模型 ×3:** MiniMax H3 `ref2va` int8conv 版，768×448（0.34MP，满足 <0.4）、124 帧约 5.2s、4 步 turbo LoRA，**参考图驱动**——把小阶的渲染图当 ref 喂进去，H3 完整认出了围巾和星徽，身份保留惊人。
- **配音:** IndexTTS 2.5 零样本克隆 Adam 音色，按你建议的**自制分段 JSON**（每句 emotion_vector + duration_factor + 400ms 停顿，seed=10）分 8 场合成，拿到精确场景时长；Whisper 逐场校验。
- **音乐:** AIDJ 情绪标签初筛 + 自研 BPM / 能量分析，选中 120BPM 的 *Aaron Smith — Dancin (Krono Extended Remix)*，sidechain 闪避人声。
- **音效 ×11:** 正弦 / 噪声 / 扫频程序合成，76 个时间码事件。
- **VRAM:** 收尾调用 `/free`，最终 4.5 / 8.1GB。

**Things to know:**

- 我听不到声音。唇形（本片没有口型）、混音全部靠测量和 Whisper 校验，没有用耳朵听。请实际听一遍，尤其是音乐会不会太吵。
- 字幕切分来自静音检测的近似，个别句子可能早半拍晚半拍。
- **音乐版权:** *Dancin (Krono Extended Remix)* 是有版权曲目，公开发布前请替换成可商用曲目。
- 三段 H3 片段只有 5.2s，靠慢放和循环铺满场景，近看会有一点糊。

全部可复现：`~/CChaos/Movie/` 下 `make_tts2.py → make_bg.py → make_clip.py → render_main.py → mux_audio.py`，细节在 README.md。

</AI>

<Img content="/MkRKwLO6XS2GMY37BQdZhLdTTZoRy8LF76tjvxGiJ1JSB8imGBeS53reQQ.png" title="片头：logo 圆环 + 阶梯块汇聚成小阶" />

<Img content="/r_nZSDfoBBPvD4e1KJP3gQqY1lCpV3wU-Mrj9f0MHNPZfiGB9InkLmwjlA.png" title="H3 片段①：纸海图书馆里奔跑的小阶" />

<Img content="/8anXEq0d4Ywy2c4AjPVumHohlvsr9o0n9dkk_JYjecsFqUkAERlg0ZWwgQ.png" title="第三章·幕后：画室三块屏幕（真实 prompt / 渲染进度 / 本片第 1 帧）" />

<Img content="/1WNFixI3D1vAjQpGM3v-ucwkaCvONUobaimjlncGwWcC3jCfFGkFLk0Z.png" title="片尾：月下台阶，StepAudio 与 Flash 伙伴弹签" />

<Img content="/fo1BUnldjnYyfGF7nC5zkf-Sw1wJHkvv7hXwgl2fXHI0NhQIKwBaUbl2.png" title="全片 23 个时间点接触摸 sheet" />

## Fun Facts

::: ps
TODO(用户)：以下结构留好了，有趣发现可以先写在这里，我也可以先按我们的会话起草一版再给你改。
:::

## 我的评价

整体而言还行，Step这次表现得和个主播一样也是笑死我了。原本只想给3分的，中途的一些插入网感不错同时也不是过度玩梗，让人觉得很有趣，因此提到4分了。
不过 Step 并不会像 DeepSeek & Codex 一样反过来问我，比较一意孤行。
