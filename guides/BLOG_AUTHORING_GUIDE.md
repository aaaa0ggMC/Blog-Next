# 博客全套操作与写作开发手册 (Blog Authoring & Development Guide)

> **提示**：本文档为本地写作与开发维护手册，汇总了「如何写新文章」、「如何注册与配置新 Category」、「标签与归档运作机制」、「加密标签规范」以及「内置 UI 组件库」的完整规范。

---

## 一、 如何撰写并发布一篇新文章

在博客中写文章极其简单，无需手动在各个目录页中拼接时间轴链接，系统会自动识别与聚合。

### 1. 新建文件与目录推荐

根据文章所属领域，在 `docs/` 对应的子目录下新建 `.md` 文件：

* **随笔年鉴**：`docs/writings/essays/2026/my_post.md`
* **诗歌与随感**：`docs/writings/poems/my_poem.md`
* **梦境纪实**：`docs/writings/dreams/my_dream.md`
* **C/C++ 与技术学习**：`docs/keep_learning/programming/c_cpp/my_article.md`
* **探险与旅行**：`docs/exploration/my_travel.md`
* **游戏历程**：`docs/gaming_life/my_game.md`

---

### 2. Frontmatter 元数据规范 (推荐)

在 Markdown 文件最顶部添加 YAML 格式的元数据（Frontmatter）：

```yaml
---
title: 电子稿限制了我的想象力
date: 2026-04-28
tags: [思考, 创作]
desc: 探讨从纸笔到电子墨水屏再到全数字输入时的思考阻滞与心流变化
highlight: true
category: essays # 可选：若目录结构规范可省略，系统会自动推导
---
```

#### 各字段说明：

| 字段 | 类型 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- | :--- |
| `title` | `string` | 否 | 文章标题。若未提供，系统会自动抓取正文中的第一个 `# H1` 一级标题 | `title: "我的第一篇博客"` |
| `date` | `string` | 否 | 发布日期。若未提供，系统会尝试从文件路径（如 `2026/`）中推断，缺省为 `2026/01/01` | `date: 2026-08-22` |
| `tags` | `string[]` | 否 | 文章微观标签。归档页支持按标签即时筛选与聚合 | `tags: [C++, 算法, Linux]` |
| `category` | `string` | 否 | 宏观分类 ID。若省略，系统会根据文件路径自动命中对应的 Category | `category: coding` |
| `desc` | `string` | 否 | 文章一句话摘要。在归档页和卡片列表中展示 | `desc: "阶段性总结与思考"` |
| `highlight` | `boolean` | 否 | 是否在归档时间轴上高亮展示（彩色渐变与发光节点） | `highlight: true` |

---

### 3. 极简零配置写作流

如果您不想手动写 Frontmatter，只需直接写 Markdown：

```markdown
# 这里写你的文章标题

这里是正文内容...
```

* 系统会自动提取 `# 一级标题` 作为文章标题（包括加密标题）；
* 系统会根据文件所在目录自动归入对应 Category（如 `writings/essays` $\to$ 随笔年鉴）；
* Git `pre-commit` 钩子会在提交时自动把 `<ec>SBXchr72p4uwM03nyx0kS7cR9t6u2bVhUrt7fnKwIGOjtA523KP51VhkfhPIKk9vMIIhi/qVfG8=</ec>` 加密为密文。

---

## 二、 如何注册并新增一个 Category (分类)

当您想为博客开辟一个全新的大类（例如：新增 `ai_notes`（AI 学习笔记）或 `hardware`（硬件折腾））时，遵循以下 3 步即可完成全站闭环注册：

### 第一步：在常量配置中注册分类与路径规则

打开 [docs/.vitepress/theme/constants/categories.ts](file:///home/aaaa0ggmc/Projs/Blog/docs/.vitepress/theme/constants/categories.ts)：

1. 在 `CATEGORY_MAP` 中添加中文显示名称：
   ```typescript
   export const CATEGORY_MAP: Record<string, string> = {
     // ... 已有分类
     ai_notes: 'AI 学习笔记', // [NEW] 新增分类 ID 与显示名称
   }
   ```
2. 在 `PATH_CATEGORY_RULES` 中添加目录路径匹配规则：
   ```typescript
   export const PATH_CATEGORY_RULES: Array<{ pattern: string; id: string }> = [
     // ... 已有规则
     { pattern: 'keep_learning/ai', id: 'ai_notes' }, // [NEW] 路径中包含此片段时自动识别
   ]
   ```

---

### 第二步：在侧边栏配置中注册目录映射

打开 [docs/.vitepress/scripts/sidebar.ts](file:///home/aaaa0ggmc/Projs/Blog/docs/.vitepress/scripts/sidebar.ts)：

1. 在 `dirTitleMap` 中添加目录对应的侧边栏分组标题：
   ```typescript
   const dirTitleMap: Record<string, string> = {
     // ... 已有映射
     ai: 'AI 学习笔记', // [NEW]
   }
   ```
2. （可选）如果这是一个一级顶级专栏目录（如 `docs/ai/`），在 `autoSidebar` 的 `sections` 数组中追加该目录名：
   ```typescript
   export function autoSidebar(sections = [..., 'ai']): Record<string, SidebarItem[]>
   ```

---

### 第三步：在页面中使用 `<FrontmatterExpansion />` 自动展开

在你的专栏概览页（如 `docs/keep_learning/index.md`）中，只需一行组件标签，即可自动聚合并渲染出该分类的时间轴：

```markdown
## AI 学习专栏
<FrontmatterExpansion category="ai_notes" />
```

> **效果**：所有 `category: ai_notes`（或存放在 `keep_learning/ai/` 目录下）的文章都会自动按日期从新到旧排版在此处，无需任何手动列表维护！

---

## 三、 全功能文章归档体系 (`/archives`)

全站归档页面位于 [docs/archives/index.md](file:///home/aaaa0ggmc/Projs/Blog/docs/archives/index.md)，挂载了 `<FrontmatterExpansion mode="archive" />`。

### 归档功能特性：
1. **即时关键词搜索**：输入标题、标签或描述关键词，毫秒级模糊匹配；
2. **Category 分类 Tab 切换**：一键切换只看「随笔年鉴」、「诗歌」、「编程学习」等分类；
3. **Tag 标签云多维筛选**：点击任意 `#标签`，快速过滤拥有该标签的所有文章；
4. **年份节点自动折叠**：跨年份（2026、2025...）自动插入年份节点并统计篇数；
5. **加密标题原生解密**：包含密文的标题会在客户端自动解出明文。

---

## 四、 隐私与内容加密规范速查

在本地写作时，可以直接书写中文明文，Git `pre-commit` 会在 `git commit` 时自动加密为密文。

### 3 级加密标签：

```html
<!-- 1. 普通密钥 (Normal Key: GPG / GPG_KEY) -->
<ec>张三</ec>
<span class="e">张三</span>

<!-- 2. 私密密钥 (SecKey: SEC / SEC_KEY) -->
<ecp>极其私密的日记</ecp>
<span class="e+">极其私密的日记</span>

<!-- 3. 教师密钥 (TeacherKey: TEACHER / TEACHER_KEY) -->
<tc>供老师阅读的内容</tc>
<span class="eteacher">供老师阅读的内容</span>

<!-- 4. 图片路径加密 (CDN / 图床) -->
<Img encrypt content="/imgs/secret_photo.png" title="私密照片" />
```

### 本地批量加解密工具命令：
* **解密工作区（方便阅读与编辑）**：
  ```bash
  pnpm decrypt:base64
  ```
* **重新加密工作区**：
  ```bash
  pnpm encrypt:base64
  ```
* **可视化调试与密钥验证工具**：
  浏览器访问 `/Blog/debug.enc` 或通过「杂项 $\to$ 调试功能 $\to$ 加密解密调试」打开在线调试台。

---

## 五、 全局 UI 组件使用清单

在编写 Markdown 文档时，可直接在正文中使用的内置 Vue 组件：

| 组件名 | 适用场景 | 示例代码 |
| :--- | :--- | :--- |
| `<FrontmatterExpansion />` | 自动时间轴聚合与全站归档 | `<FrontmatterExpansion category="essays" />` 或 `<FrontmatterExpansion mode="archive" />` |
| `<FriendLinks />` | 友链卡片网格展示 | `<FriendLinks />`（自动呈现卡片与社交链接） |
| `<Card />` / `<CardList />` | 导航卡片盒与外部/内部链接 | `<Card href="/style" tag="展示" desc="排版示范">MathJax 公式展示</Card>` |
| `<Timeline />` / `<TimelineItem />` | 手工定制时间轴 | `<TimelineItem date="2026/08/22" highlight>文章标题</TimelineItem>` |
| `<PointList />` / `<PointItem />` | 结构化分点/灵感卡片盒 | `<PointList><PointItem num="1" title="想法" k="核心要点" /></PointList>` |
| `<Img />` | 自适应暗色/加密图片 | `<Img content="/imgs/cover.png" />` |
| `<Video />` | 自适应视频播放器（支持CDN/加密/骨架屏） | `<Video content="/imgs/demo.mp4" title="演示视频" />` |
| `<CryptoDebugger />` | 加密解密调测沙盒 | `<CryptoDebugger />` |

### Markdown 快捷自定义容器语法糖 (推荐替代 raw HTML)：

无需繁琐的手写 `<p class="...">`，现在直接使用标准 Markdown 容器：

```markdown
::: ins
这里是首行缩进两字符的正文段落，保持纯粹的写作心流...
:::

::: ps
这里是浅灰色居中小注与随想旁白。
:::

::: hl
这里是高亮强调框。
:::

::: leave
Cheers! <br/>
2026/08/22 · 长沙
:::
```

---

## 六、 VS Code 快捷代码片段 (Snippets 速查)

在编辑 `.md` 文件时，只需输入简短前缀并按 <kbd>Tab</kbd> 或 <kbd>Enter</kbd> 即可一键展开模板：

| 前缀 (Prefix) | 展开内容 | 说明 |
| :--- | :--- | :--- |
| `post` / `fm` | 完整 Frontmatter 模板（标题、日期、标签、分类、描述） | 新建文章一键生成 |
| `ec` | `<ec>WWvWMzjRCYeYEGm1ap4m4UlhSBGyocVSFMkaS0HJawJIIILioERKEmnlWd5w7A==</ec>` | 普通密钥加密标签 |
| `ec-fb` | `<ec fallback="替代文本">O2Bf48r316rwZ9tPiTKgiJ18y+qy417qkTJlsnZ2YiBvOxpQkxZZOxuqhLDZ4REg4gg=</ec>` | 带失败替代文本的加密标签 |
| `ecp` | `<ecp>xW8HI5xaQdyVDb3A+sSkX50Qsh8C3M8E/PuzgfVXz4Jms9ldkDX2QgPOU//OLQ==</ecp>` | 私密密钥加密标签 |
| `tc` | `<tc>9YItWFG663z0OLp6ISWDHbtR6+Y57/d8xHSJeq9x6Uuf8tJCkmCK7VYuyFUqow==</tc>` | 教师密钥加密标签 |
| `img` | `<Img content="/imgs/..." alt="..." />` | 自适应暗色图片 |
| `video` / `bvideo` | `<Video content="/imgs/..." title="..." />` | 自适应视频播放器 |
| `evideo` / `video-enc` | `<Video encrypt content="/imgs/..." title="..." />` | 加密视频组件 |
| `card` | `<Card href="..." tag="..." desc="...">...</Card>` | 导航卡片 |
| `cardlist` | `<CardList><Card .../></CardList>` | 卡片网格列表 |
| `points` / `pointlist` | `<PointList><PointItem ... /></PointList>` | 结构化分点/灵感列表容器 |
| `point` | `<PointItem num="1" title="..." k="..." />` | 单个分点/灵感卡片组件 |
| `point-full` | `<PointItem num="1" title="..." o="..." k="..." eg="..." q="..." act="..." btw="..." />` | 完整字段分点卡片组件 |
| `expansion` | `<FrontmatterExpansion category="..." />` | 分类时间轴聚合 |
| `archive` | `<FrontmatterExpansion mode="archive" />` | 全站归档检索组件 |
| `friends` | `<FriendLinks />` | 友链组件 |
| `ps` | `::: ps ... :::` | 浅灰小注容器 |
| `leave` | `::: leave ... :::` | 右对齐落款容器 |
| `ins` | `::: ins ... :::` | 段首缩进容器 |
| `hl` | `::: hl ... :::` | 高亮容器 |
| `rhl` | `<span class="hl">...</span>` | 行内高亮文本 span |
| `rps` | `<span class="ps">...</span>` | 行内浅灰小注 span |
| `rins` | `<span class="ins">...</span>` | 行内缩进文本 span |
| `rtit` | `<span class="tit">...</span>` | 行内标题色文本 span |
| `rspan` / `span` | `<span class="...">...</span>` | 自定义 class 行内 span |


---

## 七、 常用命令行指令 (CLI Commands)

```bash
# 启动本地实时开发预览服务器
pnpm dev

# 执行静态生产打包（验证构建与类型无误）
pnpm build

# 预览生产打包产物
pnpm preview

# 全站工作区批量解密为明文
pnpm decrypt:base64

# 全站工作区批量重新加密
pnpm encrypt:base64
```
