---
title: Step 5 Preview, 区完了！
date: 2026-09-22
tags: [StepFun, AI]
---

# Step 5 Preview, 区完了！

我发誓，我目前做过最后悔的就是没去购买 80rmb 左右的小米 Mimo Plan 而是选择了 9.99usd 的 Step Plus Plan。

前几天发现 Step-5-Preview 出了，据说都能吊打 Kimi K3了，虽然我不太相信，但是各个方面的 Benchmark 可信度还是不错的，加上 DeepSeek 不出Plan太贵了， GPT 的那个五小时额度和纸糊的一样一下就没了，周额度也是比较小气（<span class="ps">也许可以用GPT 5.5，但是从我个人暴论来看，Sol 5.6甚至都不太打得过 Deepseek 4.1</span>），因此我决定尝试一下这个 9.99usd 的 Plan. 

显然这个 Plan 还挺著名，才过了一两天，国际版的竟然都 out of stoke了。

<Img content="/v4-ZDHxrVM3IVl8kDBBJNzXOVnhbOilSckfbSYOMBfY-zc7ZvP0SxLkJLPi9h3Q.png" title="可怕的DeepSeek使用量（我还是配合 Antigravity做的，没放开用）" />

<Img width="50%" content="/AHbztM4F6j0kXXu8zUsoeofeOmyCYJRYlOJGrEhGEMvbgVJ1qdNzxuIwp0oHk-_U96HbH9V-.png" alt="这样的模型都能卖光？还是太便宜了。。。" />
<Img width="50%" content="/lOs_kvEAP59zRzj8gcUGx2y8YGKzCFhSNIFaLqeyaReZ3s4A1tEcwA.png" alt="我甚至只是proxy到Rikkahub聊了会儿天额度就不够了......" />

总而言之，这个Plan我已经尝试了3天左右了，感受就三个字： 区完了。

## 响应速度堪比老奶奶过马路

可能是人用的太多/服务器垃圾，我用的都是海外节点，照理来讲白天的响应应该要快，结果还是给我普遍30s才响应，到了晚上更不用说了，甚至可以2分钟才响应。

不过响应后的tps还行，20左右。

总之这让你开发大部分时间在等待空气，让人很无聊。


## 模型长文本记忆检索比DeepSeek还垃圾

昨天和模型聊一些数学知识，Rikkahub注入了大概 16k tokens的系统提示词，包含基础系统提示词、内置工具、4个MCP（课表查询，Memory，学校查询，Bilibili视频检索）。基础系统提示词如下：

```txt
You are a helpful assistant.

注意当Schedule MCP 和 School MCP同时出现的时候，优先选择 Schedule MCP来查看课程信息。
```

由于Step5Preview响应太慢，当时正和DeepSeek聊，聊到上下文约 100k 的时候，我问它：

```txt
这门科目什么时候考试？
```

DeepSeek竟然直接忘了有MCP这档事，反而用Ask User工具问我，我让它自己去查结果其优先选择了 School MCP. 这种记忆力让我顿时觉得有点难受。

于是我开了多个Fork打算看看 Step 是不是能吊打 DeepSeek。 诶，您猜怎么着，Step也和DeepSeek一样反过来问我时间，我依旧说自己去查，结果这玩意儿竟然和我说：“考试日期查不到，也不猜......” 当时我顿时觉得自己是不是被骗了，我后面说“你难道不知道MCP吗？”它才知道去查询MCP，然后依旧先查询 School MCP，我直接终止了。

不信邪的我又Fork了一下用 GPT 6 Astra去问，开始它也是不主动查询，说“大概率来得及”。我反问“你不查一下吗”它竟然真的找到MCP工具然后优先发起 Schedule MCP（也并发了一个 School MCP Exam），最后给我了结果。

果然，模型的高低从这件小事上便能看出来。

这让我觉得Step是不是专注于刷分/降智了......

<hr/>

还有很多没说，主要是我还没有体验完毕，总而言之还是挺垃圾的，希望一个月能值回票价。

::: leave
Cheers! <br/>
2026/09/22
:::