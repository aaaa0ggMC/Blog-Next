---
title: 风格与排版展示
head:
  - - link
    - rel: stylesheet
      href: https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.5.1/katex.min.css
---

# 风格与排版展示

<p class="hl ins">
本页面是全站排版规范、LaTeX / MathJax 科学公式渲染、常用定制组件以及矢量动效的完整展示基准页。用于验证不同主题模式下的渲染效果、字体间距与排版兼容性。
</p>

---

## 一、 LaTeX / MathJax 科学公式排版

### 1. 基础运算与极限

行内公式混排测试：设质能关系为 $E = mc^2$，在实数域内 $\forall x \in \mathbb{R}$，恒有 $e^{i\pi} + 1 = 0$。欧拉常数 $\gamma \approx 0.577215$。

$$
\lim_{x \to 0} \frac{\sin x}{x} = 1, \quad \lim_{n \to \infty} \left( 1 + \frac{1}{n} \right)^n = e
$$

$$
\sqrt[n]{\frac{a^n + b^n}{2}} \ge \frac{a + b}{2}, \quad (a, b > 0, n \in \mathbb{N}^+)
$$

### 2. 微积分与积分变换

**高斯积分 (Gaussian Integral)** 与 **欧拉-泊松积分**：

$$
\int_{-\infty}^{+\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

**连续傅里叶变换 (Continuous Fourier Transform)** 与反变换：

$$
\mathcal{F}\{f(t)\} = F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} \, dt
$$

$$
f(t) = \frac{1}{2\pi} \int_{-\infty}^{\infty} F(\omega) e^{i\omega t} \, d\omega
$$

**柯西积分公式 (Cauchy's Integral Formula)**：

$$
f^{(n)}(z_0) = \frac{n!}{2\pi i} \oint_{\Gamma} \frac{f(z)}{(z - z_0)^{n+1}} \, dz
$$

### 3. 经典物理场方程

**麦克斯韦方程组 (Maxwell's Equations - 微分形式)**：

$$
\begin{cases}
\nabla \cdot \mathbf{E} = \dfrac{\rho}{\varepsilon_0} & \text{(高斯定律)} \\[2ex]
\nabla \cdot \mathbf{B} = 0 & \text{(高斯磁定律)} \\[2ex]
\nabla \times \mathbf{E} = -\dfrac{\partial \mathbf{B}}{\partial t} & \text{(法拉第电磁感应定律)} \\[2ex]
\nabla \times \mathbf{B} = \mu_0 \mathbf{J} + \mu_0 \varepsilon_0 \dfrac{\partial \mathbf{E}}{\partial t} & \text{(安培-麦克斯韦定律)}
\end{cases}
$$

**定态薛定谔方程 (Time-Independent Schrödinger Equation)**：

$$
\left[ -\frac{\hbar^2}{2m} \nabla^2 + V(\mathbf{r}) \right] \psi(\mathbf{r}) = E \psi(\mathbf{r})
$$

### 4. 线性代数与复杂矩阵

**分块矩阵与特征值分解**：

$$
\mathbf{A} = \begin{bmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{bmatrix}, \quad
\det(\mathbf{A} - \lambda \mathbf{I}) = \begin{vmatrix}
a_{11} - \lambda & a_{12} \\
a_{21} & a_{22} - \lambda
\end{vmatrix} = 0
$$

**奇异值分解 (Singular Value Decomposition)**：

$$
\mathbf{A}_{m \times n} = \mathbf{U}_{m \times m} \mathbf{\Sigma}_{m \times n} \mathbf{V}^T_{n \times n} = \sum_{i=1}^{r} \sigma_i \mathbf{u}_i \mathbf{v}_i^T
$$

### 5. 概率论与统计推断

**一维正态分布概率密度函数 (Normal Distribution)**：

$$
f(x; \mu, \sigma^2) = \frac{1}{\sqrt{2\pi \sigma^2}} \exp\left( -\frac{(x - \mu)^2}{2\sigma^2} \right)
$$

**贝叶斯定理 (Bayes' Theorem)**：

$$
P(A_i \mid B) = \frac{P(B \mid A_i) P(A_i)}{\sum_{j=1}^{n} P(B \mid A_j) P(A_j)}
$$

### 6. 多行推导与等式对齐

$$
\begin{aligned}
\ln(1 + x) &= \sum_{n=1}^{\infty} (-1)^{n-1} \frac{x^n}{n} \\
&= x - \frac{x^2}{2} + \frac{x^3}{3} - \frac{x^4}{4} + \mathcal{O}(x^5) \quad (|x| < 1)
\end{aligned}
$$

$$
\begin{aligned}
\left( \int_{-\infty}^\infty e^{-x^2} dx \right)^2 &= \int_{-\infty}^\infty e^{-x^2} dx \int_{-\infty}^\infty e^{-y^2} dy \\
&= \int_{-\infty}^\infty \int_{-\infty}^\infty e^{-(x^2+y^2)} dx\,dy \\
&= \int_0^{2\pi} d\theta \int_0^\infty e^{-r^2} r\,dr \\
&= 2\pi \left[ -\frac{1}{2} e^{-r^2} \right]_0^\infty = \pi
\end{aligned}
$$

### 7. 化学方程式与反应表示

$$
\ce{2H2 + O2 -> 2H2O} \quad \Delta H = -571.6\text{ kJ/mol}
$$

$$
\ce{C6H12O6 + 6O2 ->[\text{酶}] 6CO2 + 6H2O}
$$

$$
\ce{Cu + 4HNO3(浓) -> Cu(NO3)2 + 2NO2 ^ + 2H2O}
$$

---

## 二、 代码高亮与工程语法

### 1. C++20 (概念约束与静态反射)

```cpp
#include <iostream>
#include <concepts>
#include <string_view>

template <typename T>
concept Printable = requires(T t) {
    { std::cout << t } -> std::same_as<std::ostream&>;
};

template <Printable T>
void logValue(std::string_view label, const T& val) {
    std::cout << "[LOG] " << label << ": " << val << '\n';
}

int main() {
    logValue("Answer", 42);
    logValue("Status", "Operational");
    return 0;
}
```

### 2. TypeScript / Web Crypto

```typescript
// Web Crypto API 派生密钥实现
async function deriveAesGcmKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100_000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}
```

### 3. Rust (异步并发与模式匹配)

```rust
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug, Clone)]
pub struct ThreadSafeCounter {
    value: Arc<Mutex<i64>>,
}

impl ThreadSafeCounter {
    pub fn new() -> Self {
        Self {
            value: Arc::new(Mutex::new(0)),
        }
    }

    pub async fn increment(&self) -> i64 {
        let mut lock = self.value.lock().await;
        *lock += 1;
        *lock
    }
}
```

---

## 三、 Markdown 排版容器与特殊格式

### 1. 提示容器块 (Callout Containers)

::: info 信息提示
本站由 VitePress 驱动构建，采用前端按需加解密流水线。
:::

::: tip 最佳实践
在编写长篇数学推导时，建议使用 `\begin{aligned}` 环境保持等号居中对齐，以便于多行公式的阅读。
:::

::: warning 注意事项
加密密钥属于私有配置，请勿直接明文硬编码于公开的 Markdown 源文件中。
:::

::: danger 风险告警
重置浏览器本地缓存（`localStorage.clear()`）将会清除所有已配置的阅读密钥与个性化偏好。
:::

### 2. 结构化数据表格

| 算法 / 规范 | 密钥派生 | 迭代轮数 | 密文封装 | 完整性校验 |
| :--- | :--- | :--- | :--- | :--- |
| **AES-256-GCM** | PBKDF2 (SHA-256) | 100,000 次 | Base64 编码 | GMAC 认证标签 (16B) |
| **ChaCha20-Poly1305** | HKDF (SHA-256) | 单轮流加密 | Base64 编码 | Poly1305 鉴别码 (16B) |
| **AES-256-CFB (历史)** | Direct Utf8 | - | Hex 编码 | 无独立校验 |

### 3. 任务列表与按键提示

- [x] 搭建自动化 CI/CD 静态构建流程
- [x] 实现 PBKDF2 + AES-256-GCM 前端加密与解密
- [x] 适配暗色与亮色模式的 MathJax 公式排版
- [ ] 扩展基于 WebAssembly 的全文字符串检索

快捷键提示：使用 <kbd>Ctrl</kbd> + <kbd>K</kbd> 或 <kbd>⌘</kbd> + <kbd>K</kbd> 呼出站内快速全局检索窗口。

---

## 四、 站内定制组件展示

### 1. 卡片列表组件 (`<CardList>` & `<Card>`)

<CardList>
<Card href="/style" tag="渲染展示" date="2026/08" highlight desc="LaTeX / MathJax 科学公式、SVG 矢量动效展示">风格与排版展示</Card>
<Card href="/debug.enc" tag="调试工具" date="2026/08" desc="PBKDF2 + AES-256-GCM 字符串加解密调试工具">加密解密调试</Card>
<Card href="/others/nicknames" tag="生活杂项" desc="初中与高中时期的班级外号集合">外号大全</Card>
<Card href="/others/sports" tag="生活杂项" desc="日常运动锻炼与体能训练日志">运动日志</Card>
</CardList>

### 2. 时间轴组件 (`<Timeline>` & `<TimelineItem>`)

<Timeline>
<TimelineItem year="2026 年" />
<TimelineItem date="2026/08/22" tag="功能更新" highlight>优化调试功能分区与 debug.enc 交互界面</TimelineItem>
<TimelineItem date="2026/07/16" tag="随笔">完成 AIDJ 创作与生成式音频探索</TimelineItem>
<TimelineItem year="2025 年" />
<TimelineItem date="2025/12/21" tag="随笔">童年回忆与生活感悟随笔</TimelineItem>
<TimelineItem date="2025/08/11" tag="归档">个人自传与学业轨迹梳理</TimelineItem>
</Timeline>

### 3. 隐私加密标签规范 (写作语法)

写作时可直接在 Markdown 中书写对应等级的标签（在 `git commit` 时由预提交钩子自动处理加密，或在调试页生成）：

- **普通密钥等级**：` <ec fallback="占位提示">QHY/g2t2woywSJqWORDiD/CJ+lrNAiNMcYtSkR7foq35iW9ReJj1wOBn8U+JGuP/neTFN6/Uzt0=</ec> ` 或 ` <span class="encrypt">Ula9R3dNGaB1b47QX8ix7vJ6hwmlOezAgIV3Ix7MM4AeNc5v6rhDZER4f+G35OhdIcQ=</span> `
- **私密密钥等级**：` <ecp fallback="占位提示">2OaQ3QA85tHsuZaZ/c4FFohriqCPTiAGW8/nA6rVIhNi6UY3diB6MkO6jcraRqETgXB9wIz626o=</ecp> ` 或 ` <span class="encpp">UQjnzVe97qDp98uCD4A5yLee8mExxq9dhozm5VXdKgxh0VR9dpEybid3z3H52awdQqE=</span> `
- **教师密钥等级**：` <tc fallback="占位提示">cwCFI7fVDCMmIxAt1aGSrHuUw7CrZ24KiN6ftDCGtDwKTv3PIdagAJDLkNB15SZz02AScjmfBH8=</tc> ` 或 ` <span class="eteacher">xVx967Xi33p2XDXqYXEEJpdzl2h9pTY8pe1++YPnTrdWUrXdaxlLRI7bxn9UAFuMWiE=</span> `
- **加密图片组件**：` <Img content="/TJWcHCekdB1Y-tydWA4nIGmNuw56QYBuGxI.jpg" level="sec" /> `
- **标题动态替换**：在文章 `#` 一级标题中添加 `changeTitle` 属性，解密后动态替换浏览器标签页 Title。

---

## 五、 SVG 矢量图表与交互动效

### 1. 动态正弦波形与直角坐标系

<div style="text-align: center; margin: 20px 0; overflow-x: auto;">
<svg width="600" height="260" viewBox="0 0 600 260" xmlns="http://www.w3.org/2000/svg" style="max-width: 100%; border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft);">
  <defs>
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="50%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="var(--vp-c-divider)" stroke-width="0.5" stroke-opacity="0.4"/>
    </pattern>
  </defs>

  <!-- 网格背景 -->
  <rect width="600" height="260" fill="url(#grid)" />

  <!-- 坐标轴 -->
  <line x1="40" y1="130" x2="570" y2="130" stroke="var(--vp-c-text-2)" stroke-width="1.5" />
  <line x1="300" y1="20" x2="300" y2="240" stroke="var(--vp-c-text-2)" stroke-width="1.5" />

  <!-- 箭头 -->
  <polygon points="570,126 580,130 570,134" fill="var(--vp-c-text-2)" />
  <polygon points="296,20 300,10 304,20" fill="var(--vp-c-text-2)" />

  <!-- 轴标签 -->
  <text x="575" y="150" font-size="12" fill="var(--vp-c-text-2)" font-family="sans-serif">x</text>
  <text x="312" y="24" font-size="12" fill="var(--vp-c-text-2)" font-family="sans-serif">y = A·sin(ωt + φ)</text>
  <text x="285" y="146" font-size="11" fill="var(--vp-c-text-3)" font-family="sans-serif">O</text>

  <!-- 动态波动曲线 -->
  <path fill="none" stroke="url(#waveGrad)" stroke-width="3" stroke-linecap="round">
    <animate
      attributeName="d"
      dur="4s"
      repeatCount="indefinite"
      values="
        M 40 130 C 105 50, 170 50, 235 130 S 365 210, 430 130 S 560 50, 570 65;
        M 40 130 C 105 210, 170 210, 235 130 S 365 50, 430 130 S 560 210, 570 195;
        M 40 130 C 105 50, 170 50, 235 130 S 365 210, 430 130 S 560 50, 570 65
      "
    />
  </path>
</svg>
</div>

### 2. 有机分子结构与离域电子模型

<div style="text-align: center; margin: 20px 0; display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
  <!-- 苯环结构 -->
  <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); padding: 10px;">
    <!-- 苯环六边形 -->
    <polygon
      points="90,20 145,52 145,116 90,148 35,116 35,52"
      fill="none"
      stroke="var(--vp-c-text-1)"
      stroke-width="3"
      stroke-linejoin="round"
    />
    <!-- 内部共轭大π键圆环 -->
    <circle
      cx="90"
      cy="84"
      r="32"
      fill="none"
      stroke="var(--vp-c-brand)"
      stroke-width="2.5"
      stroke-dasharray="6,4"
    />
    <text x="90" y="172" text-anchor="middle" font-size="12" fill="var(--vp-c-text-2)" font-family="sans-serif">苯 (C₆H₆) 凯库勒/离域模型</text>
  </svg>

  <!-- 雷达扫描动效 -->
  <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid var(--vp-c-divider); border-radius: 8px; background: var(--vp-c-bg-soft); padding: 10px;">
    <circle cx="90" cy="84" r="60" fill="none" stroke="var(--vp-c-divider)" stroke-width="1" />
    <circle cx="90" cy="84" r="40" fill="none" stroke="var(--vp-c-divider)" stroke-width="1" />
    <circle cx="90" cy="84" r="20" fill="none" stroke="var(--vp-c-divider)" stroke-width="1" />
    <line x1="30" y1="84" x2="150" y2="84" stroke="var(--vp-c-divider)" stroke-width="1" />
    <line x1="90" y1="24" x2="90" y2="144" stroke="var(--vp-c-divider)" stroke-width="1" />
    
    <!-- 旋转扫描指针 -->
    <line x1="90" y1="84" x2="90" y2="24" stroke="var(--vp-c-brand)" stroke-width="2" stroke-linecap="round">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 90 84"
        to="360 90 84"
        dur="3s"
        repeatCount="indefinite"
      />
    </line>
    <!-- 扫描点 -->
    <circle cx="115" cy="60" r="3" fill="#10b981">
      <animate attributeName="opacity" values="1;0.2;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
    <text x="90" y="172" text-anchor="middle" font-size="12" fill="var(--vp-c-text-2)" font-family="sans-serif">雷达扫描矢量模型</text>
  </svg>
</div>

---

## 十一、 互动测验组件 (Exam Suite)

支持单选题、多选题、行内填空题与小题分数自动汇总。提交后自动展开参考解析，绿色代表回答正确，红色代表回答错误。

### 1. 前置得分指示栏 (支持任意位置放置)

即使放置在正文开头，也能在页面加载后自动统计后续试卷的小题总分：

<ExamScore name="demo-exam" />

### 2. 试卷正文与交互

<Exam name="demo-exam" title="现代前端与 Vue 3 基础能力测验">

  <!-- 单选题：支持直接在正确选项上标注 correct -->
  <Exam score="2">
    1. 【单选题】Vue 3 内部实现响应式数据拦截的核心技术是：
    <Selection value="A">Object.defineProperty 属性劫持</Selection>
    <Selection value="B" correct>ES6 Proxy 代理对象</Selection>
    <Selection value="C">脏值检查 (Dirty Checking)</Selection>
    <Selection value="D">发布-订阅模式的事件总线</Selection>
    <ExamAnswer>
      Vue 3 使用 ES6 的 <code>Proxy</code> 对对象进行代理，解决了 Vue 2 中 <code>Object.defineProperty</code> 无法原生检测属性添加、删除以及数组索引直接修改的局限。
    </ExamAnswer>
  </Exam>

  <!-- 行内填空题：完美嵌入正文 -->
  <Exam score="3">
    2. 【填空题】在 Vue 3 Composition API 中，声明基本数据类型的响应式变量使用 <ExamBlank answer="ref" />，而为复杂对象创建响应式副本则使用 <ExamBlank answer="reactive" />。
    <ExamAnswer>
      <code>ref</code> 接受内部值并返回响应式且可变的 ref 对象（访问需 <code>.value</code>），<code>reactive</code> 返回对象的响应式副本。
    </ExamAnswer>
  </Exam>

  <!-- 多选题：指定 answer 或多个 correct 选项 -->
  <Exam score="5" answer="A,C">
    3. 【多选题】下列关于 Vite 构建工具特性的描述中，正确的有：
    <Selection value="A">在开发环境中基于原生 ES 模块实现极速冷启动</Selection>
    <Selection value="B">开发环境依然使用 Webpack 预先全量打包 bundle</Selection>
    <Selection value="C">基于 esbuild 预构建依赖，极大提升了构建性能</Selection>
    <Selection value="D">只支持 Vue 框架，无法用于 React 或 Svelte</Selection>
    <ExamAnswer>
      Vite 开发服务器利用浏览器原生 ESM 特性，不需要全量打包；依赖预构建采用 Go 编写的 <code>esbuild</code>。Vite 属于框架无关的通用前端工具链。
    </ExamAnswer>
  </Exam>

</Exam>

### 3. 独立交卷与测评面板

<ExamSubmit name="demo-exam">提交测验</ExamSubmit>

<ExamResult name="demo-exam" />

<div id='page_id'>style</div>
