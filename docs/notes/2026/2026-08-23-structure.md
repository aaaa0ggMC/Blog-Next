---
title: 博客目前的架构
date: 2026-08-23
tags: [博客,技术,AI-Generated]
---

这里不想复述了，直接AI生成：

<AI fallback>


前文只是简略讲了讲架构，其实整个博客的核心哲学就是“吃百家饭”：不买任何一台云服务器，不租任何一个数据库，纯靠把各大平台的免费层 (Free Tier) 和客户端算力拼装组合，实现真正的 Serverless + Costless：

<PointList>
  <PointItem
    num="1"
    title="GitHub 全家桶：代码托管 + 静态分发 + 自动化 CI/CD"
    k="白嫖全球最稳定的开源基础设施"
  >

博客的源码管理、历史版本追溯全部放在 GitHub 仓库；每次提交后由 GitHub Actions 自动化流水线负责构建并部署到 GitHub Pages，享受全球 CDN 静态分发。如果以后有打包出的较大二进制程序需要分发，还可以直接走 GitHub Packages。一分钱不花，直接省去了购买云服务器 (VPS) 和维护 Nginx 的开销。

  </PointItem>

  <PointItem
    num="2"
    title="Cloudflare R2：零出口流量费用的高可用图床"
    k="解决对象存储流量被刷破产的终极方案"
    o="国内传统云厂商（如阿里云 OSS、腾讯云 COS、七牛云等）虽然存储便宜，但按量出网流量是个不可控的无底洞；如果直接用 GitHub 仓库当图床，既有封号风险，也无法防范目录被全量遍历。"
  >

将图片和媒体资产全部迁移至 Cloudflare R2。这里不仅提供每月 10GB 免费存储和 1000 万次免费读取，最关键的是出网流量完全免费。再配合本地编写的增量同步与路径加密脚本，既免去了流量被刷的后顾之忧，又做到了可逆解密还原。

  </PointItem>

  <PointItem
    num="3"
    title="Giscus + GitHub Discussions：0 成本的评论系统"
    k="无需任何自建后端与数据库的互动体系"
  >

绝大多数博客为了加个评论区，往往需要用 Docker 自建 Waline / Twikoo / Artalk，或者去买云数据库与云函数服务。本站直接接入 Giscus，把每一篇文章的评论区映射到 GitHub Discussions 中。访客使用 GitHub 账号登录留言，防刷、通知提醒、审核管理全部白嫖 GitHub 的现成生态，服务器与维护成本为零。

  </PointItem>

  <PointItem
    num="4"
    title="客户端 Web Crypto：用访客和本地算力取代鉴权后端"
    k="算力全部下沉至客户端，消灭后端服务器"
  >

常规的私密博客系统通常需要用户注册、登录态 Token、权限网关以及后端解密服务。这里直接将所有计算推给终端：写作提交时由本地 Node.js 脚本批量执行 PBKDF2 + AES-256-GCM 内容与路径加密；读者访问时由浏览器原生 Web Crypto API 就地解密渲染。没有后端接口，自然也没有服务器运行成本。

  </PointItem>

  <PointItem
    num="5"
    title="开源前端与 CDN 生态：VitePress + KaTeX + 字体切片"
    k="白嫖公共 CDN 与现代前端编译链"
  >

静态编译引擎由 VitePress 强力驱动，数学公式渲染通过公共 CDN 引入 KaTeX，中文字体借助分包切片技术实现浏览器按需加载。完全无需为大文件带宽和静态资源分发单独买单。

  </PointItem>
</PointList>

这样一套“百家饭”拼图下来，整个博客运行起来不仅速度极快、隐私可靠，而且每个月的账单都稳稳保持在 0 元。


</AI>

::: leave
Cheers! <br/>
2026/08/23
:::

