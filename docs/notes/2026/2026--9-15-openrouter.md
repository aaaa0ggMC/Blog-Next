---
title: OpenRouter 体会
date: 2026-09-15
tags: [AI]
---

# OpenRouter 体会
## 概况

OpenRouter 作为不那么野鸡的 API 聚合平台，严格受到了上游 *Terms Of Service* 的限制，主要便体现在支付系统上。在 OpenRouter ，只要有过一次支付相关的行为暴露了你属于限制地区（比如中国大陆），包括但不限于绑卡、绑过卡，那么你整个账号将被永久标记，访问那些模型将会一直收到 "The request is prohibited due to a violation of provider Terms Of Service".

我有两个账号：
- Google大号注册的，找淘宝商家充了 5 usd，之后人在新加坡（说明IP没问题啊）手残绑了 ICBC 信用卡，之后就一直无法使用了。
- 昨晚发现 OR 支持 GPay 于是绑定的，点开后会向谷歌发起 0 美元认证，这个倒没啥。结合谷歌会让你完善 Payment Method Information，主要就是填写地区啥的，我直接把我的虚拟信用卡上的地址填上去了，就在我以为不会过要泡汤时，竟然过了哈哈。GPay 系统还是如此迷之强大<span class="ps">（我 ChatGPT Plus 也是这么购买的，直接 bypass OpenAI 的限制顺便给我 22 play points）</span>。 **总而言之，这个号理论上是可以正常访问的**。 

## 小测试
因此我就好奇我能不能在 OR 上使用较为开放的 Grok 以及封闭三人组 Gemini、GPT、Claude。主要就是看裸IP能不能访问，换上转发过的网络环境啥的。

## 测试内容
### 1. Grok 系列 (`x-ai/grok-4.5`)
* **国内裸 IP**：正常调用
* **受限账号 + 国内裸 IP**：依然正常调用，对地区和账号状态基本不设卡。

### 2. Anthropic 系列 (`anthropic/claude-5.0-sonnet` 等)
* **受限账号 + 国内裸 IP**：直接提示 `Not supported in your region`。
* **受限账号 + 开启代理**：依然提示 `Not supported in your region`。
* **受限账号 + 纯净代理 IP**：报错变为 `The request is prohibited due to a violation of provider Terms Of Service`，直接证实了是账号层面的支付记录违规导致全局封禁。
* **正常账号的调用情况**：
  * 国内裸 IP 直接连接失败，且一旦失败后立即开启代理也可能继续无法连接。
  * 换到另一台电脑连接却一切正常，说明 OR 存在特殊的设备指纹或短期的会话锁定机制；原机器等待一段时间（推测等待类似 Session/风控 Cache 过期）后也可恢复访问。
  * **运营商差异**：代理环境下，中国移动频繁报错 `Region not supported`，换到中国联通则一切顺畅。

## 三、 OR 请求与判定机制推断
推测的请求过滤链路大致如下：
`OR 入口判断地区` -> `ZDR 协议校验` -> `OR 校验账号资质与支付记录` -> `转发至上游 Provider`

* **关于 IP 转发**：从测试结果猜测，OR 大概率不像普通反向代理那样透传用户的原始客户端 IP 给上游，主要的区域拦截发生在 OR 自身的风控边缘节点。

## 四、 总结与后续打算
* **风控特征**：OR 对单次 API 请求的容忍度其实相对宽容，关键还是看节点 IP 的纯净度。如果不小心用脏 IP 触发了拦截，不要连续重试，静置一会儿（等待临时风控会话过期）通常就能恢复。
* **为什么准备主力转用 OR**：
  * 模型覆盖全面，价格基本对齐官方，Prompt Caching 命中率也还不错。
  * 最爽的一点是**支持 ZDR（Zero Data Retention，零数据保留）**，哪怕可用 Provider 可能会少一点，但隐私保障提升非常大。
* **当前过渡**：目前暂时先把 Google AI Studio 里剩下的 22 USD 消耗完（AI Studio 预充值的 credit 只有一年有效期，对个人不支持 ZDR 且 IP 限制还多），用完之后基本就打算全面迁往 OR 了。