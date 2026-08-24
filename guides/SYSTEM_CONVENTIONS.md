# 博客系统级约定与架构全景手册 (System Conventions & Architecture)

> 💡 **提示**：本文档详细整理了博客系统的核心设计约定（Conventions），涵盖资源路径前缀、加密与直传白名单、多媒体与二进制分发、域名与 CDN 拓扑、以及解密通知生命周期。写作与开发维护时请遵循本规范。

---

## 一、 资源路径与前缀规范 (Path Prefix Conventions)

在 Markdown 文章或 Vue 组件中引用图片、多媒体或文件时，系统根据前缀约定采取不同的处理流水线：

| 路径前缀格式 | 示例 | 构建期处理 | R2 远端形态 | 最终访问行为 | 适用场景 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`/imgs/...` (默认)** | `/imgs/world/hello.jpg` | **自动哈希混淆**（编译为 R2 Key） | 密文哈希 Key（如 `zSWtFt6i...png`） | 前端通过密钥动态解密拉取，防爬虫防扫盘 | **普通文章插图、日记照片、私密配图** |
| **`@/imgs/...` (裸传)** | `@/imgs/banner.png` | **去除 `@` 保持明文**，不混淆 | 原始明文 Key（`/imgs/banner.png`） | 任何人可通过原始 CDN URL 直接访问 | **需要向外公开、直链分享的免加密资源** |
| **`~/...` (本地站点)** | `~/favicon.ico` 或 `~/res/...` | **本地静态挂载** | 不上传 R2，位于本地构建产物中 | 随网站静态文件一同分发 | **站标、默认头像、前端内嵌离线资源** |
| **`https://...` (外链)** | `https://cdn.example.com/pic.jpg` | **原生透传** | 不处理 | 原生第三方 CDN 访问 | **外部公共图床、公共引用外链** |

---

## 二、 标签属性约定 (Tag & Prop Conventions)

### 1. 图片组件 `<Img />`
```html
<!-- 1. 默认自动加密混淆 (推荐大多数文章插图) -->
<Img content="/imgs/travel/mountain.jpg" title="登山纪实" />

<!-- 2. 方式 A: 使用 prop 显式声明裸传 (不加密、不混淆) -->
<Img no-mangle content="/imgs/banner.png" />
<Img no_mangle content="/imgs/banner.png" />
<Img raw content="/imgs/banner.png" />

<!-- 3. 方式 B: 使用 @/ 路径前缀声明裸传 (效果同上) -->
<Img content="@/imgs/banner.png" />

<!-- 4. 敏感图片加密 (本地 git commit 时自动将 content 加密为 Base64 密文) -->
<Img encrypt content="/imgs/private/secret.png" />
<Img level="priv" content="/imgs/private/diary.png" />
<Img level="teacher" content="/imgs/study/score.png" />

<!-- 5. 尺寸与排版控制 -->
<Img content="/imgs/photo.jpg" width="400" height="300" fit="cover" />
```

### 2. 文本与超链接加密标签
```html
<!-- 普通密钥加密 (Normal Key: BLOG_GPG_KEY) -->
<ec>向好友公开的内容，或 [私密网盘链接](https://pan.example.com/s/123)</ec>

<!-- 私密密钥加密 (SecKey: BLOG_SEC_KEY) -->
<ecp>核心私密日记内容，仅自己持有密钥可见</ecp>

<!-- 教师密钥加密 (TeacherKey: BLOG_TEACHER_KEY) -->
<tc>供长辈或教师审阅的教学评价</tc>
```

### 3. 音频与视频多媒体
将原生 HTML5 标签放入 `<ec>` / `<ecp>` 中，客户端解密后自动挂载并支持流式播放：
```html
<ec>
<audio controls>
  <source src="https://res.yslwd.eu.org/audios/record.mp3" type="audio/mpeg">
</audio>
</ec>

<ecp>
<video controls width="100%" style="border-radius: 8px;">
  <source src="https://res.yslwd.eu.org/videos/diary.mp4" type="video/mp4">
</video>
</ecp>
```

---

## 三、 R2 存储同步与 `ignore_files` 白名单规范

所有资源存放在本地 `docs/public/res/` 中，通过 `scripts/res-sync.mjs` 同步到 Cloudflare R2。

### 1. `docs/public/res/ignore_files` 规则书写规范
为防止根目录的白名单误伤深层子目录的敏感资源，`ignore_files` 规则遵循**严格的根路径锚定约定**：

```text
# 1. 扩展名全局通配（所有 GPG 二进制加密文件保持直传）
*.gpg

# 2. 根目录专用目录（必须以 / 开头，/ 结尾）
/fonts/

# 3. 根目录专用公共文件（必须以 / 开头）
/favicon.ico
/fallback.png
/logo.png
```

> [!WARNING]
> **严禁在 `ignore_files` 中写无斜杠的裸文件名（例如写 `logo.png`）**！
> 写 `logo.png` 会导致 `imgs/bingyan-MiniNginx/logo.png` 这类子目录敏感图片也被误判为白名单而脱敏裸传。必须写 `/logo.png` 严格限定根目录。

### 2. 凭据配置与双协议兼容规范 (S3 原生协议与 REST 降级)

同步脚本 `scripts/res-sync.mjs` 支持**双协议自动识别与平滑降级**：

- **标准推荐配置（S3 协议 —— 开启云端 0 流量秒级 Copy 与重命名）**：
  在 `.env.local` 中配置 R2 API 令牌与 S3 凭证：
  ```ini
  R2_ACCOUNT_ID="你的AccountID"
  R2_BUCKET="blog-picbackend"
  R2_PUBLIC_DOMAIN="https://res.yslwd.eu.org"
  R2_PATH_SECRET="你的路径混淆密钥"

  # S3 凭据（在 Cloudflare R2 > Manage R2 API Tokens 中创建获得）
  R2_ACCESS_KEY_ID="你的Access_Key_ID"
  R2_SECRET_ACCESS_KEY="你的Secret_Access_Key"
  ```
  - **特性**：使用 S3 原生接口（`ListObjectsV2` / `CopyObject` / `PutObject` / `DeleteObject`）。
  - **优势**：当进行**密钥轮换 (Key Rotation)** 或 **文件重命名/移动** 时，脚本通过 SHA-256 Hash 比对识别后直接在 Cloudflare 云端内部执行服务端秒级拷贝，**本地 0 上传网络消耗，秒级完成全库重命名**。

- **旧版 API Token 兼容模式（自动降级）**：
  若 `.env.local` 中未配置 S3 的 AccessKey/SecretKey，仅配置了 `R2_API_TOKEN`：
  - **完全向下兼容**：脚本自动平滑降级为 Cloudflare REST API 模式；
  - **智能清理**：依然具备 SHA-256 Hash 比对能力，在上传新 Key 后会自动清理旧 Key，避免产生孤儿文件；
  - **清单自愈**：依托本地 `.res_manifest.json` 维持精准状态追踪。

---

## 四、 域名、CDN 与网络拓扑架构

```mermaid
graph TD
    User["访客浏览器"]
    CF["Cloudflare DNS (yslwd.eu.org)"]
    GH["GitHub Pages (aaaa0ggmc.github.io)"]
    R2["Cloudflare R2 CDN (res.yslwd.eu.org)"]

    User -->|访问博客页面| CF
    CF -->|CNAME Flattening 扁平化| GH
    GH -->|分发 VitePress 静态 HTML/JS (base: '/')| User
    User -->|请求图片/字体/音视频| R2
```

1. **博客主域名 (`yslwd.eu.org`)**：
   - DNS 记录：`@` (`yslwd.eu.org`) CNAME 指向 `aaaa0ggmc.github.io`（代理状态：DNS only）。
   - Cloudflare 自动启用 **CNAME Flattening**，对外解析为 GitHub 官方 4 组 A 记录。
   - `docs/public/CNAME` 文件写入 `yslwd.eu.org`，防止部署后自定义域名掉线。
2. **子域名 (`www.yslwd.eu.org`)**：
   - DNS 记录：`www` CNAME 指向 `aaaa0ggmc.github.io`，由 GitHub Pages 自动处理 www 互转与 Let's Encrypt 证书验证。
3. **资源与图床域名 (`res.yslwd.eu.org`)**：
   - DNS 记录：`res` CNAME 指向 `public.r2.dev`（Cloudflare R2 Bucket 自定义域名绑定）。
4. **VitePress 构建 Base 约定**：
   - `docs/.vitepress/scripts/Data.ts` 中的 `base` 约定为 `"/"`。

---

## 五、 解密运行生命周期与通知规范 (Decryption Lifecycle)

1. **自动防抖（Debounce）**：
   - 页面首次挂载、路由切换、子组件（时间轴/随记卡片）渲染时，100ms 内触发的所有解密请求自动合并为**唯一一次执行**，防止并发定时器堆叠。
2. **通知签名去重（Signature Deduplication）**：
   - 系统记录当前的 `url:success/total` 状态签名。
   - 同一页面下若解密结果未发生变化，**坚决不弹重复通知**骚扰用户。
   - 仅在切换路由、解密数量产生实质变动、或用户在设置页手动提交新密钥时，弹出汇总统计 Toast。
3. **环境差异隔离**：
   - **本地开发环境 (`DEV`)**：未加密明文自动识别，显示明文就绪提示；
   - **线上网络环境 (`PROD`)**：纯密文模式，若未配置密钥静默展示占位符或提示未解锁条目。

---

## 六、 常用 CLI 命令汇总

| 常用命令 | 作用 |
| :--- | :--- |
| `./fastpush.sh "commit message"` | 一键执行：本地 R2 增量同步 + Markdown 路径安全转换 + 推送到 GitHub main 触发自动部署 |
| `pnpm sync:res` | 仅执行本地资源库到 Cloudflare R2 的增量同步 |
| `pnpm decrypt:base64` | 批量将全站 Markdown 的 Base64 密文还原为本地可读明文 |
| `pnpm encrypt:base64` | 批量将全站 Markdown 的明文加密为 Base64 密文 |
| `pnpm build` | 本地构建测试（验证静态资源生成与打包无误） |
