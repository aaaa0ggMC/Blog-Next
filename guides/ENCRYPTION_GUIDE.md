# 博客内容加密标签与使用规范指南

> 💡 **提示**：本文档仅供本地写作参考，已在 `docs/.vitepress/config.mts` 中通过 `srcExclude` 排除，不会被打包进静态博客网页，亦不会出现在侧边栏中。

---

## 一、 快速使用：3 个密钥等级与支持的标签

写作时，你可以在 Markdown 中**直接书写自然语言明文**。在执行 `git commit` 时，Git `pre-commit` 钩子会自动读取密钥并将明文转换为 Base64 密文。

### 1. 普通密钥 (Normal Key)
- **对应环境变量**：`BLOG_GPG_KEY`（或前端设置中的“普通密钥” / `gpg_key`）
- **适用场景**：人名、地点、学校、微隐私内容（向可信朋友公开）。
- **支持标签形式**：
  ```html
  <!-- 形式 1: 简写标签 (推荐) -->
  <ec>张三</ec>

  <!-- 形式 2: class 形式 (span 或任意 HTML 标签如 p, div 等) -->
  <span class="e">张三</span>
  <span class="encrypt">张三</span>
  <p class="ins encrypt">这一整段话都需要加密</p>
  ```

---

### 2. 私密密钥 (Sec / Private Key)
- **对应环境变量**：`BLOG_SEC_KEY`（或前端设置中的“SecKey” / `sec_key`）
- **适用场景**：最核心的私人日记、绝密内容（一般仅自己知道）。
- **支持标签形式**：
  ```html
  <!-- 形式 1: 简写标签 (推荐) -->
  <ecp>绝密日记片段</ecp>

  <!-- 形式 2: class 形式 -->
  <span class="e+">绝密日记片段</span>
  <span class="encpp">绝密日记片段</span>
  <div class="encpp">多行私密内容</div>
  ```

---

### 3. 教师密钥 (Teacher Key)
- **对应环境变量**：`BLOG_TEACHER_KEY`（或前端设置中的“教师密钥” / `teacher_key`）
- **适用场景**：专供老师或长辈查看的学习/评语相关内容。
- **支持标签形式**：
  ```html
  <!-- 形式 1: 简写标签 (推荐) -->
  <tc>关于教学的思考</tc>

  <!-- 形式 2: class 形式 -->
  <span class="eteacher">关于教学的思考</span>
  ```

---

## 二、 图片加密标签 (`<Img />`)

通过给 `<Img />` 添加 `encrypt` 属性或 `level="..."` 属性，Git `pre-commit` 钩子会在提交时自动把明文图片路径加密为 Base64 密文：

```html
<!-- 1. 普通等级加密图片（使用普通密钥 BLOG_GPG_KEY 加密） -->
<Img encrypt content="/imgs/walk_alone/secret.jpg" title="私密照片" />

<!-- 2. 私密等级加密图片（使用 SecKey BLOG_SEC_KEY 加密） -->
<Img level="priv" content="/imgs/private/diary.jpg" />

<!-- 3. 教师等级加密图片（使用 TeacherKey BLOG_TEACHER_KEY 加密） -->
<Img level="teacher" content="/imgs/study/homework.jpg" />

<!-- 4. 公开图片（不加 encrypt / level，直接明文访问，不触发加密） -->
<Img content="/imgs/3c3u/sayonara/welcome.png" />
```

> 🔍 **自动加密与解密机制**：
> - **写作时**：直接写明文路径 `<Img encrypt content="/imgs/photo.jpg" />`。
> - **Git 提交时**：`pre-commit` 自动识别 `encrypt` 属性，并将 `content` 加密为 Base64 密文。
> - **前端访问时**：`Img.vue` 会在客户端使用 AES-256-GCM 自动解密，若解密失败自动展示占位 fallback 灰阶图；解密成功则流式加载真实图片。
> - **本地批量解密**：运行 `pnpm decrypt:base64` 可还原为明文路径方便预览与修改。

---

## 三、 常用辅助属性

所有加密标签均支持以下扩展属性：

### 1. `fallback="..."` (解密失败时的占位文案)
未输入密钥或密钥错误时，页面将显示 fallback 内容：
```html
<ec fallback="某位好友">张三</ec>
<span class='encrypt' fallback='他叫做XXX'>张三</span>
```

### 2. `changeTitle` (动态替换网页标题)
用于文章的一级标题 `#` 中。未解密前显示大纲/默认标题，解密成功后自动把浏览器标签页的 Title 替换为解密后的标题：
```markdown
# <ec changeTitle>2025年秘密随笔</ec>
# <span class='encrypt' changeTitle>2025年秘密随笔</span>
```

---

## 四、 本地开发与 Git 提交流程

1. **配置本地密钥**（只需配置一次，加入 `.gitignore`，绝不上传）：
   在项目根目录创建 `.env.local`：
   ```ini
   BLOG_GPG_KEY=你的普通密码
   BLOG_SEC_KEY=你的私密密码
   BLOG_TEACHER_KEY=你的教师密码
   ```

2. **日常写作**：
   直接在 Markdown 文件中书写明文：
   ```markdown
   今天我和 <ec>张三</ec> 去了 <ecp>岳麓山</ecp>。
   ```

3. **提交代码**：
   ```bash
   git add .
   git commit -m "add new post"
   ```
   - **自动加密**：Git `pre-commit` 会自动将 `<ec>`、`<ecp>` 等标签内的明文转换为 Base64 密文并重新暂存。
   - **防泄露拦截**：若未配置密钥环境变量，Git 会**直接拦截拒绝提交 (exit 1)**，防止明文推送到 GitHub。
   - **自动跳过**：已加密的 Base64 字段不会被二次加密。

---

## 五、 CLI 常用脚本命令速查

| 指令 | 说明 |
| :--- | :--- |
| `pnpm decrypt:base64` | 批量将全站 Base64 密文还原为本地明文 |
| `pnpm encrypt:base64` | 批量将全站明文重新加密为 Base64 密文 |
| `pnpm decrypt:hex` | （迁移用）扫描并将旧 Hex 密文还原为明文 |
| `pnpm encrypt:hex` | （备用）将明文加密为旧 Hex 密文 |
| `pnpm hook:install` | 重新安装 Git pre-commit 钩子 |
