# AI Videos 收尾 Prompt（让做视频的模型自己交卡）

> **用法**：视频做完、**你还没告诉它你打几分之前**，在同一个会话里把下面整段发给做视频的那个模型。它会吐出一个「交付卡」代码块，你直接粘进粗稿，再按 [AI_VID_WRITING_GUIDE.md](./AI_VID_WRITING_GUIDE.md) 交给排版 AI。
>
> **为什么一定要先自评？** 模型看到你的分数后再自评，会不自觉往你的分数靠（锚定效应），「AI 自评 vs 你的评分」这组数据就废了。同理，也不要在这个会话里提别的模型拿了几分。
>
> **它填什么、你填什么：**
>
> | 模型填（它能查证） | 你填（它看不到或不可信） |
> | :--- | :--- |
> | 对话记录、成片时长、技术栈、文件路径、自评 | 你的评分、一句话评价、额度消耗、耗时 |

---

## 复制下面这段

````text
The video is done. Before I tell you my own score, please write a delivery card for my blog series "AI Videos". Output ONE fenced code block (```markdown) and nothing else.

Rules:
- Only state facts you can verify from this session (files you wrote, commands you ran, ffprobe output, etc.). If you don't know something, write "unknown". Do NOT guess usage, cost, or elapsed time.
- Copy my prompts VERBATIM from this conversation (keep typos and indentation). If a prompt is too long to reproduce exactly, write it as far as you can and append the line "[truncated by model]". Never paraphrase silently.
- Self-rate honestly on the scale below. You have not seen my score and should not try to guess it. List at least two concrete flaws, including things you could not check yourself (e.g. you cannot hear audio or watch the video in real time).

Scale (0–10, one decimal allowed):
- 10: I would post it publicly as-is; viewers would not guess it was AI-made without being told.
- 8: Clearly good. Strong idea and execution, minor flaws a casual viewer might notice.
- 6: Watchable start to finish, but obvious weak spots (stiff motion, bad voice, pacing).
- 4: Interesting idea, weak execution; most viewers would stop halfway.
- 2: Technically a video, but broken or off-brief.
Weigh: idea/story, visuals & motion, audio (voice, music, mix), technical polish, how well it followed my brief.

Output exactly this template, filled in:

```markdown
<!-- AIVID-CARD -->
model: <your exact model name>
length: "<m:ss of the final file>"
stack: [<tools actually used, comma separated>]
self_rating: <score for the final version; if there were several versions, chain them like 6 → 8>
files:
  - <path of the final video, with resolution / size>

## 对话记录

### Round 1
**Prompt:**
<my first prompt, verbatim>

**What I did:** <3–6 bullet points>

### Round 2
<repeat for every later round; delete this section if there was only one round>

## AI 自评

**Self-rating: <score> / 10**

**What worked**
- ...

**What didn't**
- ...

**Not verified** (things I couldn't check myself)
- ...

**If I did it again**
- ...

**Worth watching** (timestamps for the reviewer)
- 0:00 — ...
```
````

---

## 拿到之后

* 把整个代码块原样粘进粗稿，额度 Before/After 和耗时能顺手记就记上，直接交给排版 AI。你的评分、评价和 Fun Facts 可以之后再补：排版 AI 会在这些位置留注释好的 `TODO(用户)`，Ctrl+F 就能找到。
* 粗稿里有了 `<!-- AIVID-CARD -->`，排版 AI 就会按指南 §6 处理：用对话记录生成 Prompt 小节，`self_rating` 写进 frontmatter，自评放进「AI 自评」小节。
* 如果你在会话里已经说过分数了，也可以照样让它写，但请在粗稿里注明「自评前已看到我的评分」，排版时会在页面上标出来。
