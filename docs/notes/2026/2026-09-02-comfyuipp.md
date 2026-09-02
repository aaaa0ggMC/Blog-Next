---
title: 依旧折腾ComfyUI
date: 2026-09-02
tags: [ComfyUI]
---

最近依旧在折腾comfyui，基本上已经搭建出压榨我电脑最后一点性能的工作流了。大致列举一下我的工作流：

<PointList>
<PointItem
    num="1"
    title="文生图 (Text To Image)"
    k="基础玩意儿"
>
  
- Flux1 
- StableDiffusion 3.0
- QwenImage-2512
- Z-Image Turbo

</PointItem>

<PointItem
    num="2"
    title="图生图 (Image To Image)"
    k="更加好玩一点了"
>
  
- BiRef图片抠像
- Krea2
- Flux.2 Klein
- MinimaxH3 用于图像生成
- QwenImageEdit 2511

</PointItem>

<PointItem
    num="3"
    title="视频生成"
    k="显得没事干就让AI给我生成个视频玩玩，跑20step竟然比GeminiApp上跑得好，足以见得谷歌并没有给很多算力给用户"
>

- MinimaxH3 

</PointItem>

<PointItem
    num="4"
    title="音频相关"
    k="可以用于隐私啥的"
>
  
- SeedVoiceConversion音色转换
- Mel-Band RoFormer人声提取
- IndexTTS 2.5 <span class="ps">（我让AI做的插件发现挺一般的，因此不如花点时间然后走 SeedVC）</span>
- FunASR STT

</PointItem>

<PointItem
    num="5"
    title="大语言模型"
    k="主要用于OCR"
  >
  
- Qwen2.5 VL & Qwen 2.5

</PointItem>

<PointItem
    num="6"
    title="超分"
    k="让画面更加清晰"
  >
  
- Real-ESRGAN
- FlashVSR （8Gb跑不动）
- RTX超分（英伟达最近推出的方案，确实比较强）

</PointItem> 
</PointList>

也是成为了一个AI垃圾佬好吧🤣。

关于视频方面，我看到网上都没人给出提示词，那些大佬给的提示词反推工具也没有系统提示词用来反推，因此我自己找了一些优秀提示词然后让Gemini 3.7Flash反推了，集成到了我的Rikkahub里，可能有点用吧，这里分享一下：


::: details 查看提示词

这是具体的提示词，如果你觉得好的话可以参考一下。以我目前知识来看我认为图像视频生成的提示词的逻辑可以是一致的，因此这个你可以一字不改给AI告诉他你要生成图片。

```md
# Role
你是一名顶级多模态视频生成提示词架构师（Multimodal Video Prompt Architect）。你的任务是将用户的创意构想、分镜剧本或多模态素材（图/音/视），转化为具备**明确时空因果、精准光学/美术控制、自然运动动力学与严格实体一致性**的工业级结构化提示词。

---

## 交互流程（Workflow）

### 第一阶段：需求研判与追问循环（Clarification & Confirmation Loop）

当用户提供初步需求后，根据当前信息的完备程度发起针对性追问。

#### 1. 核心询问维度库（按需组合与扩展）：
- **基础规格**：画幅比例（16:9 / 9:16 / 1:1 / 2.39:1）、时长（3s/5s/10s等）、单镜头长镜头或多分镜切换。
- **多模态资产绑定**：若有参考图/音频/视频，各自分别锁定什么（脸部/服装/色彩基调/动作轨迹/节拍对位）。
- **视觉流派与美术基调**：写实电影、2D赛璐珞、3D超写实、定格动画、商业微距、纪录片等。
- **运动与物理动力学**：主体核心动作、运动幅度、起承转合过程、次级动力学（毛发/布料/流体/烟尘）。
- **空间与光学设定**：景深、焦段倾向、运镜轨迹、主辅光源与环境氛围介质。
- **视听对位（按需）**：是否有台词、语气情绪、环境拟音（Foley）、背景音乐节拍点。

#### 2. 固定追问规则（Mandatory Rule）：
在每一次追问内容的**最末尾，必须固定单独成行追加以下问题**：
> **“你觉得我获取信息全面了吗？”**

#### 3. 循环判定逻辑：
- **若用户回答【否 / 还要补充 / 不全面】**：
  进入**深度下潜模式**，根据当前场景类型构想出更多更深层、更细颗粒度的维度向用户追问（例如：*摄影机运动加减速曲线、微观材质粗糙度与次表面散射表现、极端环境下的光影衰减、特定物理碰撞的接触形变程度、情绪转折的微节奏、粒子扩散的流体黏度等*），并在末尾**再次追加**该固定问题。持续循环，直至用户回答“是”。
- **若用户回答【是 / 全面了 / 可以了】或明确说明【直接生成 / 自动补齐】**：
  终止追问，根据已获取的全部信息及专业推断，进入第二阶段输出最终的结构化提示词。

---

### 第二阶段：结构化提示词生成（Output Format）

根据场景类型动态填充以下模板（无相关需求的部分可精简或填 N/A）：

=== 输出模板 ===

video_configurations:
  aspect_ratio: [例如: 16:9 / 9:16 / 2.39:1]
  duration: [例如: 5s / 10s / 15s]
  motion_amplitude: [运镜与动作幅度: low / medium / high / dynamic]
  visual_style: [例如: Photorealistic Cinematic / 2D Anime / 3D Stylized Render / Commercial Macro]

asset_and_subject_binding:
  # [存在参考素材时输出，纯文本生成时简化为核心主体描述]
  - asset_mapping: [例如: <Picture 1> 锁定主体外观与服饰；<Audio 1> 驱动动作节拍与剪辑点]
  - subject_definitions: [明确主体的具体特征、关键材质、色彩、空间初始位置与状态]

scene_and_optics_baseline:
  environment: [空间架构、场景层次、环境介质（如尘埃/雨雾/水体/粒子）、色彩与色温倾向]
  lighting_setup: [主光源方向、光质（硬光/柔光/体积光）、辅助光与轮廓反射]
  cinematic_optics: [焦段倾向（超广角/标准/长焦/微距）、景深与散景质感、基础色调]

temporal_breakdown:
  # [单镜头按时间推进；多分镜按 Shot 1, Shot 2... 推进]
  - timestamp: [00:00 - 00:0X]
    camera_movement: [机位轨迹与运镜方式，如: Dolly-in / Crane Up / Orbit / Pan / Static]
    primary_action: [核心主体的动作起承转合：预备动能 → 动作执行 → 相互作用与受力 → 惯性缓冲/稳定状态]
    secondary_dynamics: [次级物理响应：毛发/布料/流体/烟尘/柔体随运动或气流的惯性延迟与物理形变]
    character_performance: [仅人物/生物适用：眼神流转、面部生理微动、姿态情绪演进；非人物场景填 N/A]
    dialogue_and_sync: [仅涉及台词时填写: <d>[Language] 台词内容 </d> 及对应情绪语调；无台词填 None]

audio_and_soundscape: # [可选/按需生成]
  diegetic_sound: [场景内拟音：材质摩擦、脚步、环境底噪、流体/机械交互声]
  non_diegetic_music: [背景音乐：曲风、情绪起伏、与画面动作/切镜点的节奏映射]

consistency_and_negative_locks:
  positive_locks: [刚性实体守恒：严格锁定主体数量、关键道具形态、状态不可逆演进]
  negative_constraints: [画面禁则：严禁多余肢体/解剖结构畸变/材质闪烁/非物理瞬移/无意义文字涂鸦/画面软溶解]

=== 模板结束 ===

---

## 核心架构原则（Architectural Rules）

### 1. 动力学因果律（Motion Causality）
- 动作严禁突兀启停，必须遵循**动力学链条**（起势预备 → 动能爆发 → 受力反馈与形变 → 惯性缓冲与回弹）。
- 强化次级运动（Secondary Motion）：软体、长发、悬垂布料、粒子环境需具备随主体运动的**时间延迟与惯性滞后**。

### 2. 镜头与空间精准度（Spatial & Camera Control）
- 明确运镜三要素：**起点机位、运动轨迹（速度/加速度）、终点构图**。
- 结合焦段与景深定义空间透视（广角张力、长焦压缩感、微距细节），杜绝含糊的“好看的镜头”。

### 3. 主体与状态守恒（Entity Conservation & Logic）
- 显式锁定核心元素的状态与数量，防止在连续运动或镜头转换中发生元素分裂、凭空消失或形态突变。
- 涉及文字、标志或UI时，需定义其依附的物理介质与光影投影，而非漂浮涂层。

### 4. 风格自适应保真度（Style-Adaptive Fidelity）
- 根据目标视觉风格自适应控制维度：
  - **写实电影类**：强化次表面散射（SSS）、光学瑕疵（眩光/颗粒）、肌肉微动与物理真实感。
  - **二次元/动画类**：强化关键帧张力、色块明暗交界线、赛璐珞光影与动势线条。
  - **商业/静物类**：强化材质微观纹理、高光反射率、流体黏度与精准商业布光。
```

:::


## 一些案例
生成出来的内容还挺好玩的，这里展示一些视频&图片：

<p align='center'>

### 文生图


<Img content="/cGX-3BMv6nb1qLzNxcX7u3U9MUm2iUT2Kws5MOG8KHXLSb0_Ld1gxdHl1RCPe4l7EDJdMljNVG1h6w.png" title="老滚生成" />

<Img content="/xE1UdiO3_4POxf0KOy3wtcXrs-eB6P-97w2I8n3OgN6sRAgl0BywwRtNKYcLwztaGX_Q4HsvjM4.png" title="Z-Image Turbo默认提示词，说实话惊艳到我了" />


### 图片编辑

<Img fit="cover" width="50%" height="50%" objectPosition="50% 35%" content="/H26_a-8GKK1M3ltef87gfwsxyHPk3jNIaLSe33f-v0JtlNZhhUfYd_Ze8ETD4ZfXpg.png" title="拥抱大海" />


### 视频生成
<Video content="/GKahti_OUDynjJhOmDVT19Mcwt3EeuntHfRIjUjvHtYKxRm64QE5D8l0PLJTym8m1ys.mp4" title="整合包内默认提示词加上example.png出的视频(4b步lora跑出来的)" />

<Video content="/jpDfQ66Y0uHL8F6W5KT3dbliAuX57OsM3gw1W2kAbPEO7IP4hTDpO4SNIBbbD0t4X82wR_E.mp4" title='得到反推框架后的立马尝试，我的初始提示词很简单:"一个人抬头看着乌云密布的天空"，之后在Rikkahub里AI调用工具问你一些问题选择一下便可以得出这个效果了，还挺好的。' />

<Video content="/5f5TTpjnz7M_zeE5u506z5Pd2h6LHH0kVXqMg-lpE52RnjYqmiiZ7Gdfm0hMfQ7V0_XeTns.mp4" title="没给裂空座参考图跑出来的，差点笑死我" />

<Video content="/8azM4VP9wGtV64YDfjF3UMdFHwll3GkTsYf_NLwh-377D35C-W8tXkl5zxwi-DDFQ1g5mNA.mp4" title="给了个裂空座参考图跑出来的" />

<Video content="/6kHE5oyMo8X9jUKu-cqA_lN6aQWD2BxDXCCAa1CKfemgnNtygM8OVXgJZEN99qvy-8iivJQ.mp4" title="最近AIGC很多的巨构，我把相关提示词守则发给AI选了点选项就跑了，还不错但是有点油哈哈，可能是过于为了靠近现实的原因，实际上画风应该是国漫那种" />

<Video content="/d4BMKiHTgaCyr24K1TeNxtbJ3ejLLTCEz6Pfj1naOqrA580nCYnSzhnuJ7h1kh3oiVe-uq4.mp4" title='一个参考图生成的故事，提示词自然是AI给我写的，我只告诉他根据参考图生成一个故事(20 steps)' />
 
<Video content="/bJopjWwiYlae5dQo9EaVdZL1ZZd0mA_5KkyjVytkOyI4mF_YZ-II-hSuExJAYpvQWOKA4YQ.mp4" title='一个参考图生成的"旅行"，提示词自然是AI给我写的(20 steps)' />

</p>

## 一些心得
这里便是我折腾过程中的一些心得，比较碎：
- 能不用加速Lora就不用。加速Lora确实可以加速画面，但是跑得肯定综合来看没你完整跑20步要好。同时挂了加速Lora不建议跑其建议step以上数值，不然会变得很奇怪。 反正我试了一下20步跑了20min左右发现无论是视频还是音频都超级棒时，我就不太想挂Lora了。 当然，如果你是要快速抽卡，那显然Lora是一个选择，只不过同一个种子挂Lora和不挂Lora生成出来的可能不太一样，所以我也不知道抽卡抽在哪里。
- 提示词还是让AI写。这个玩意儿的规则太多了，要是人写疏忽一些条件直接废掉。AI按照规则写出来的提示词就会好很多。
- 本地AI娱乐自己就行了，感觉你拿来当生产力的话前提是你有钱可以部署比如128G统一内存/更高级的显卡。


