# 博客指南与操作手册目录 (Blog Documentation & Manuals)

本目录为博客开发、写作与维护的本地操作指南索引：

1. **[博客写作与分类注册开发手册 (BLOG_AUTHORING_GUIDE.md)](./BLOG_AUTHORING_GUIDE.md)**
   * 如何写一篇新文章（目录选择、Frontmatter 元数据规范、零配置极简写法）；
   * 如何注册并新增一个 Category（常量注册、侧边栏映射、`<FrontmatterExpansion />` 自动展开）；
   * 全功能归档系统（`/archives`）的使用与检索；
   * 全局常用 UI 组件与排版样式清单；
   * 常用 CLI 命令速查。

2. **[内容加密标签与规范手册 (ENCRYPTION_GUIDE.md)](./ENCRYPTION_GUIDE.md)**
   * 3 级密钥体系（普通密钥 `GPG`、私密密钥 `SEC`、教师密钥 `TEACHER`）；
   * 支持的标签与语法（`<ec>`, `<ecp>`, `<tc>`, `<Img>`）；
   * Git `pre-commit` 自动加密流水线；
   * 本地批量解密与加密操作流程。

3. **[系统级约定与架构全景手册 (SYSTEM_CONVENTIONS.md)](./SYSTEM_CONVENTIONS.md)**
   * 资源路径与前缀规范（默认混淆 `/imgs/...`、裸传 `@/imgs/...`、内嵌 `~/...`、外链 `https://...`）；
   * 标签属性约定（`<Img no-mangle>` / `<Img raw>` / `encrypt`）；
   * 多媒体与全类型加密（文本、图片、音视频、PDF、GPG 压缩包）；
   * Cloudflare R2 `.ignore` 根路径严格锚定规范（`/fonts/`, `/logo.png` 等）；
   * 域名、CDN 与网络拓扑（Cloudflare CNAME 扁平化、GitHub Pages、R2）；
   * 前端解密生命周期、防抖与通知去重机制。
