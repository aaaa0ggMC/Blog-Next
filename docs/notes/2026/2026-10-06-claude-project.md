---
title: Claude Project 使用体验
date: 2026-10-06
tags: [Claude]
---

# Claude Project 使用体验

昨天晚上 Claude 也是邀请我使用其最新的 Projects 系统，简而言之便是类似 Grok Bot / Dots 这种可以并行云端处理你的各种仓库的玩意儿，他具备比较完整的云端环境因此可以只用 Claude 网页 + Claude App 就能完成大部分开发的活计，换句话便是开发软件你甚至都不需要有电脑了。

Claude 也是送了我临时的 100usd 赠金，我连着蹬 5h 左右给用光光了，直接从头到脚使用Opus 5.5，下面就是我的一些体验：

1. 用起来真的丝滑，我的项目要同时服务于手机和电脑，目前主要在做移动端兼容，传统做法是我在 Claude Code 里开启 Remote Control 然后躺床上进行指挥。现在我电脑都不需要开，直接找出问题让其修改就行，不需要偶尔下床看看电脑那边的情况，同时你的电脑也是绝对安全的（虽然 Claude Code 在排除 Anthropic 的各种阴招后其实本身安全做得很好）。

2. 启动一个 Thread 具有一个起步价，而且还不小。我大致估摸了一下，一个 thread 会吃掉你 5%-6% 的五小时额度。因此实际上你使用 Pro 订阅来跑这个 Projects 的话使用速度还是非常快的，这不，我就用了半个小时5h额度就用了 70% 从而触顶了。

<Img content="/CKSjIwnyVvz9RijLQYwysU0GQzy8dOJERkCGbYrAak84P5cIsT89QA.png" alt="触顶" />

所以我抛开赠金外还是觉得能用 cc 就用 cc，这个 Projects 虽然体验不错但是额度也如同奶油般化开。

总之，这就是我的使用体验，也是封号前疯狂使用好吧。

BTW，我估摸着算了算，昨晚 100usd 让 AI 自己高强度干了 4h (一直多线程干活)。今天让其干了半小时作用用了周额度 7% ，掐指一算周额度大概价值 178usd 的 API？有点离谱哈哈，我这个毕竟是按照时间计算的，图一乐。

最后看看从昨天到目前用了多少 Token:
<Img content="/0NXIfQuf4nIBZkNtEy92OYYxHJlw-8LANWAKOSA_9kTE6W398vDtjw.png" alt="限制" />
<Img content="/yv4nDqxg0CNvGyCWbYOrxRKB2tfidYE-jGrB2MFmA19ZaLjurANp9A.png" alt="使用2" />

300M😱，Usage界面告诉我缓存命中率为98% ，算下来便是高达如果缓存用的是 5 分钟版本那么换算到 API 花销为 99.1usd ， 如果是 1h 版本的缓存换算到 API 花销为 113.5usd。 考虑到A畜送都送了也没必要去计较这几usd因此我更加倾向于 113.5usd。 那反而其实还真和我前面推算的 178 差不多（我前面推算多一点是因为我说了 thread 启动也有大致 6% 5h额度开销）。

那要是额度触顶了怎么办？ Claude 会在 5h 额度恢复的时候自动 resume，因此总体而言还是爽死我了。

::: leave
Cheers! <br/>
2026/10/06
:::