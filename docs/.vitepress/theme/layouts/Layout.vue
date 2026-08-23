<!-- .vitepress/theme/Layout.vue -->
<template>
  <HomePage v-if="isHomePage" />
  <div v-else>
    <Layout>
      <template #doc-footer-before></template>

      <template #doc-before>
        <ArticleMeta />
      </template>

      <template #doc-after>
        <div class="giscus-content" style="margin-top: 24px">
          <Giscus
            :key="page.filePath"
            repo="aaaa0ggMC/Blog"
            repo-id="R_kgDONx0ynQ"
            category="Announcements"
            category-id="DIC_kwDONx0ync4CmgXp"
            mapping="specific"
            :term="page.filePath"
            strict="1"
            reactions-enabled="1"
            emit-metadata="0"
            input-position="top"
            lang="zh-CN"
            loading="lazy"
            crossorigin="anonymous"
            :theme="isDark ? 'dark' : 'light'"
          />
        </div>
      </template>
    </Layout>
  </div>
  <ImageViewer />
</template>

<script lang="ts" setup>
import Giscus from "@giscus/vue";
import DefaultTheme from "vitepress/theme-without-fonts";
import { watch, computed } from "vue";
import { inBrowser, useData, useRouter } from "vitepress";
import { base } from '../../scripts/Data';
import ArticleMeta from "../components/ArticleMeta.vue";
import HomePage from "./HomePage.vue";
import ImageViewer from "../components/ImageViewer.vue";

const { isDark, page } = useData();
const router = useRouter();
const { Layout } = DefaultTheme;

const isHomePage = computed(() => {
  return router.route.path === base
});

watch(isDark, (dark) => {
  if (!inBrowser) return;

  const iframe = document
    .querySelector("giscus-widget")
    ?.shadowRoot?.querySelector("iframe");

  if (iframe) {
    iframe.contentWindow?.postMessage(
      { giscus: { setConfig: { theme: dark ? "dark" : "light" } } },
      "https://giscus.app"
    );
  } else {
    console.warn("Giscus iframe not found");
  }
});
</script>

<style>
</style>
