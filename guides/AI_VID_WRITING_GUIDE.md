# AI Videos 排版指南（写给 AI 看的）

> **给 AI 的任务说明**：用户会给你一份 AI Videos 系列的**粗稿**（可能中英混杂、格式随意、直接粘贴了终端输出）。你的工作是把它整理成符合本博客规范的 Markdown 文件，放到 `docs/keep_learning/ai_vid/` 下。**只做排版和结构化，不改写用户的观点。**
>
> 用户使用方式：把本文件和粗稿一起丢给 AI，说「按 guides/AI_VID_WRITING_GUIDE.md 排版」。
>
> 典型流程：做视频的模型先用 [AI_VID_SELF_REPORT_PROMPT.md](./AI_VID_SELF_REPORT_PROMPT.md) 交一张「交付卡」（含对话记录 + 自评）→ 你据此排出文章，**用户的部分留 TODO 占位** → 用户事后自己填评分、评价和 Fun Facts。

---

## 0. 铁律（违反任何一条都算失败）

1. **不编造数据。** 评分、耗时、额度、时长、模型名：粗稿里没有就**不写这个字段**，绝不估算、绝不补全。
2. **不改写用户的话。** 用户的评价、吐槽、Summary 原样保留，拼写错误也不改。不要把用户的英文翻成中文，也不要反过来。
3. **AI 交付报告逐字保留内容**，只允许改格式（见 §4）。不删句子、不总结、不润色。
4. **Prompt 逐字保留**，放进 ```` ```text ```` 代码块，连拼写错误和缩进都不动。
5. `length` 的值**必须加双引号**（`length: "5:01"`），否则 YAML 会把 `5:01` 解析成数字 301。
6. 你自己写的东西（`desc`、过渡句）要尽量少，并在回复里**明确告诉用户哪些句子是你写的**。

---

## 1. 文件命名与位置

* 路径：`docs/keep_learning/ai_vid/<vendor>_<序号>.md`，如 `claude_3.md`、`deepseek_2.md`。
* 序号 = 该厂商已有文件的最大序号 + 1（先 `ls` 看一下）。
* **不需要改 `index.md`**：索引页的 `<VidBoard />` 会自动收录新文章。

---

## 2. Frontmatter 字段

```yaml
---
title: Claude · Self Introduction       # 「厂商简称 · 题目」，侧边栏显示用，必须唯一
date: 2026-10-03                         # 粗稿里的日期；没有就用今天
tags: [AIVideos, Claude]                 # 固定 AIVideos + 厂商简称
desc: 卡通风格的五分钟自我介绍。          # 一句话简介，显示在索引卡片上（可由你起草，需告知用户）
model: Claude Opus 5.5                   # 完整模型名
vendor: claude                           # 见下表
task: Self Introduction                  # 题目名。同一道题必须完全一致（大小写也是），否则「同题」对比分不到一组
rating: 8 → 9.5                          # 见 §2.1（用户的评分）
self_rating: 7 → 8.5                     # 模型自评，只能来自交付卡，见 §6
verdict: Quite astonishing.              # 一句话评价，卡片大标题。取自用户原话，见 §2.2
cost: 38min20s + 13min21s                # AI 干活耗时，多轮用 + 连接
length: "5:01"                           # 成片时长，必须加引号！
rounds: 2                                # 对话轮次，只有 ≥2 时才写
stack: [Python + Cairo, Z-Image Turbo, IndexTTS, ffmpeg]   # 技术栈，从 AI 报告里提取工具名
usage: ["5h: 24 → 38 → 50", "Week: 74 → 76 → 78"]         # 见 §2.3
video: /imgs/ai_vids/xxx.mp4             # 可选：站内小视频（bvid 优先）
poster: /imgs/ai_vids/xxx.png            # 可选：video 的封面
---
```

**vendor 取值**：`claude` / `deepseek` / `openai` / `gemini` / `qwen` / `stepfun` / `local`（本地模型如 MiniMax H3 直出）。它决定主题色，写错会变成默认绿色。

**`task` 已有的题目**（新文章是同一道题时必须照抄）：

| task | 说明 |
| :--- | :--- |
| `Freestyle` | 自由发挥 |
| `Self Introduction` | 卡通风格自我介绍 |

### 2.1 rating

* 用户写 `Rate: 4/10` → `rating: 4`
* 用户写了多次评分（如改进后重评 `8/10` 然后 `9.5/10`）→ `rating: 8 → 9.5`，按时间顺序，最后一个是最终分。
* 没评分 → **整行不写**（页面会显示「待评」）。
* 评分后面带的括号说明（如 `8/10 (TTS is not good...)`）不要塞进 rating，放到正文对应版本下的 `::: ps` 里。

### 2.2 verdict

* 优先取用户 Summary / 评价里**最短、最有态度的一句**，原文原语言。
* 如果用户的评价太长（超过约 40 字），可以压缩成一句，但必须告诉用户「verdict 是我从你的 XX 压缩的」。
* 用户完全没写评价 → 不写这个字段。

### 2.3 usage

粗稿里通常长这样：

```text
# Usage
## Before
5h: 24
Week: 74
## After
5h: 38
Week: 76
## After Improving XXX
5h: 50
Week: 78
```

转换规则：**同一个标签的数值按时间顺序用 `→` 串起来**，一行一个标签：

```yaml
usage: ["5h: 24 → 38 → 50", "Week: 74 → 76 → 78"]
```

* Claude 的 `5h` / `Week` 是百分比，写纯数字即可（页面会画进度条）。
* 金额、带逗号的大数照抄（如 `"Balance: ¥85.68 → ¥80.12"`），页面只显示文字不画条。
* 「After」那栏是空的 → 用 `?` 占位：`"Balance: ¥85.68 → ?"`。
* 标签名里不能有英文冒号 `:`（它是分隔符）。

---

## 3. 正文结构（按顺序）

````markdown
# <题目> <span class='ps'><模型名或作品名></span>

<VidHero />

## 内嵌查看
<Bili bvid="BV1cFH863Efs" p="<分P序号>" />

## Prompt

<VidPrompt round="1">

```text
<第一轮 Prompt 原文>
```

</VidPrompt>

## 交付报告

<AI badge="<厂商> 交付报告" model="<模型名>">

<AI 报告，转成 Markdown，见 §4>

</AI>

## AI 自评          ← 仅当粗稿里有交付卡时才有，见 §6

<AI badge="<厂商> 自评" model="<模型名>">
...
</AI>

## 我的评价

::: tip <最终分> / 10
<用户的 Summary 原文>
:::
````

用户的评价还没写时，按 §6.3 放 TODO 占位，不要省略这一节。

### 3.1 多轮对话（用户改了需求、AI 重做）

把「交付报告」换成按版本分节，每节标题带 Badge：

````markdown
## 第一版 <Badge type="info" text="8 / 10 · 38min20s" />

<AI badge="Claude 交付报告 · v1" model="Claude Opus 5.5">
...
</AI>

::: ps
<用户对这一版的吐槽，原文>
:::

## 第二版 <Badge type="tip" text="9.5 / 10 · 13min21s" />

<VidPrompt round="2" follow>

```text
<第二轮追加指令原文>
```

</VidPrompt>

<AI badge="Claude 交付报告 · v2" model="Claude Opus 5.5">
...
</AI>
````

* 中间版本用 `type="info"`，最终版用 `type="tip"`。Badge 里只放该版的分数和耗时，粗稿没有的就省略那一项。
* 第一轮 Prompt 仍放在最前面的 `## Prompt` 里；后续轮次的 Prompt 放在各自版本节内，带 `follow`。

### 3.2 其他常见段落

| 粗稿里的东西 | 放法 |
| :--- | :--- |
| 「Fun Facts」/ 有趣的发现 | `## Fun Facts` + `<PointList>`，每条一个 `<PointItem num="1" title="短标题" tag="可选">正文</PointItem>`。`title` 可由你起草（需告知用户） |
| B 站视频（用户给了 iframe 代码） | 只取其中的 `bvid` 和 `p`，写成 `<Bili bvid="..." p="..." />`，放在 `## 内嵌查看` 里。**不要**粘原始 `<iframe>` |
| 截图 | `<Img content="/imgs/ai_vids/xxx.png" title="说明" />`，图片放在 `docs/public/res/imgs/ai_vids/` |
| 用户的旁白、小吐槽 | `::: ps` 容器 |
| 用户说「问了几个问题，此处省略」 | 写进 `<VidPrompt note="之后还被问了几个问题，此处省略">` |
| 重要提醒 / 坑 | `::: warning` |

`<PointItem>` 里放图片、多段文字时，开标签和闭标签前后**必须各空一行**，否则内部 Markdown 不渲染。`<AI>`、`<VidPrompt>` 同理。

---

## 4. AI 交付报告的格式转换

AI 的报告通常是终端里复制出来的纯文本。转换成 Markdown，**只动格式不动文字**：

| 原文样子 | 转成 |
| :--- | :--- |
| `- Clips: played at 0.45×...` 这种「短标签: 说明」 | `- **Clips:** played at 0.45×...`（标签加粗） |
| 单独一行的小标题 `How it was made:` | `**How it was made:**` |
| `1. Opening: ...` | `1. **Opening:** ...` |
| 文件路径、命令、文件名 `~/Videos/a.mp4`、`pnpm render`、`segments.py` | 用反引号包起来 |
| 用 `┌─┬─┐│` 画的字符表格 | 标准 Markdown 表格 |
| 段落之间 | 保留空行 |

**不要**把整份报告塞进代码块（那是旧写法，难看）。

---

## 5. 完整示例

### 输入（用户粗稿）

````text
claude 自我介绍 10/03
Rate 8/10 (TTS is not good)
9.5/10 after TTS fix

Prompt:
```
Generating a video to introduce yourself...
```
second prompt: ComfyUI TTS Workflow Plugin has been enhanced, maybe regenrate the audio?

Usage before 5h 24 week 74 / after 5h 38 week 76 / after tts 5h 50 week 78

time 38min20s
The video is ready: ~/Videos/claude_intro/Claude_Hello.mp4. It runs 4:59 ...
- Voice: 25 IndexTTS lines ...

time 13min21s
I regenerated all the narration ... 5:01 at 1080p ...

Summary: Quite astonishing.
````

### 输出（`docs/keep_learning/ai_vid/claude_2.md`）

````markdown
---
title: Claude · Self Introduction
date: 2026-10-03
tags: [AIVideos, Claude]
desc: 卡通风格的五分钟自我介绍。
model: Claude Opus 5.5
vendor: claude
task: Self Introduction
rating: 8 → 9.5
verdict: Quite astonishing.
cost: 38min20s + 13min21s
length: "5:01"
rounds: 2
stack: [IndexTTS, Whisper, ffmpeg]
usage: ["5h: 24 → 38 → 50", "Week: 74 → 76 → 78"]
---

# Self Introduction <span class='ps'>Claude Opus 5.5</span>

<VidHero />

## Prompt

<VidPrompt round="1">

```text
Generating a video to introduce yourself...
```

</VidPrompt>

## 第一版 <Badge type="info" text="8 / 10 · 38min20s" />

<AI badge="Claude 交付报告 · v1" model="Claude Opus 5.5">

The video is ready: `~/Videos/claude_intro/Claude_Hello.mp4`. It runs 4:59 ...

- **Voice:** 25 IndexTTS lines ...

</AI>

::: ps
TTS is not good
:::

## 第二版 <Badge type="tip" text="9.5 / 10 · 13min21s" />

<VidPrompt round="2" follow>

```text
ComfyUI TTS Workflow Plugin has been enhanced, maybe regenrate the audio?
```

</VidPrompt>

<AI badge="Claude 交付报告 · v2" model="Claude Opus 5.5">

I regenerated all the narration ... 5:01 at 1080p ...

</AI>

## 我的评价

::: tip 9.5 / 10
Quite astonishing.
:::
````

注意示例里的几个判断：

* 模型名粗稿只写了「claude」→ 去已有同厂商文章里查最近用的模型名；查不到就**问用户**，不要猜。
* `length` 取最终版报告里的 `5:01`，不是第一版的 `4:59`。
* `stack` 只列报告里真正出现的工具。

---

## 6. 交付卡（模型自评）

粗稿里出现 `<!-- AIVID-CARD -->` 代码块时，说明它是做视频的模型自己写的（由 [AI_VID_SELF_REPORT_PROMPT.md](./AI_VID_SELF_REPORT_PROMPT.md) 生成）。

### 6.1 字段去向

| 交付卡里的内容 | 放到哪 |
| :--- | :--- |
| `model` / `length` / `stack` | frontmatter 同名字段。粗稿正文里用户另写了的，**以用户为准** |
| `self_rating` | frontmatter `self_rating`。**绝不能**拿来填 `rating` |
| `files` | 不放进文章（本地路径对读者没意义），可以在回复里提一句 |
| `## 对话记录` 里每轮的 **Prompt** | 第 1 轮进 `## Prompt` 的 `<VidPrompt round="1">`；之后的轮次进各版本节的 `<VidPrompt round="N" follow>`（§3.1）。带 `[truncated by model]` 的保留这行标记，并用 `note="模型复述，可能有删节"` 标出 |
| `## 对话记录` 里每轮的 **What I did** | 粗稿另外贴了完整交付报告 → 丢弃（报告更全）；没贴报告 → 用它作为该轮 `<AI>` 交付报告的正文 |
| `## AI 自评` 整节 | 放进 `## AI 自评` 小节的 `<AI badge="<厂商> 自评" model="...">`，按 §4 只改格式 |

### 6.2 规则

* `self_rating` 和 AI 自评正文是**模型写的**，不是用户写的，不要混进「我的评价」。
* 用户在粗稿里注明「自评前已看到我的评分」时，给 `## AI 自评` 下面加一行 `::: ps` 写「本次自评是在模型看到我的评分之后给出的」。
* 交付卡写了 `unknown` 的字段 → 当作缺失，不写。

### 6.3 给用户留的 TODO

用户的流程是**先让你排好，再自己补**。所以用户部分缺失时，不要整节省略，而是留下显眼、易搜索的占位（统一用 `TODO(用户)`，方便用户 Ctrl+F）：

```yaml
# rating: TODO(用户)  例：8 或 8 → 9.5
# verdict: TODO(用户)  一句话评价
# cost: TODO(用户)  例：38min20s
# usage: TODO(用户)  例：["5h: 24 → 38", "Week: 74 → 76"]
```

frontmatter 里的占位必须**注释掉**（行首 `#`），否则页面会把 `TODO` 当成真实值显示。正文里：

```markdown
## 我的评价

<!-- TODO(用户): 写你的评价；frontmatter 里的 rating 也记得填 -->

::: tip TODO / 10
TODO(用户)
:::

<!-- TODO(用户): 有 Fun Facts 的话取消下面的注释
## Fun Facts

<PointList>
<PointItem num="1" title="短标题">

正文

</PointItem>
</PointList>
-->
```

---

## 7. 交付前自检清单

- [ ] 文件名序号没和已有文件冲突
- [ ] `title` 在 `ai_vid/` 下唯一
- [ ] `task` 和已有同题文章**一字不差**
- [ ] `length` 加了双引号
- [ ] 没有任何编造的数字；粗稿缺失的字段直接省略（用户的评分/评价/额度/耗时按 §6.3 留注释掉的 TODO）
- [ ] `self_rating` 只来自交付卡，没有被填进 `rating`
- [ ] Prompt、AI 报告、用户评价都是原文
- [ ] 每个 `<AI>` / `<VidPrompt>` / `<PointItem>` 的开闭标签前后都有空行
- [ ] 图片路径以 `/imgs/ai_vids/` 开头，且文件确实存在于 `docs/public/res/imgs/ai_vids/`
- [ ] （能跑命令的话）`pnpm build` 通过
- [ ] 回复用户时列出：①你写的句子（desc / verdict 压缩 / PointItem 标题）②粗稿里缺失、需要用户补的字段（即所有 `TODO(用户)` 的位置）
