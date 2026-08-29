<script setup lang="ts">
import { useData } from 'vitepress'
const { frontmatter, page } = useData()
</script>
<template>
  <div class="vp-content">
    <slot />
    <footer class="vp-footnote" v-if="frontmatter.created_at || frontmatter.transcribed_at || page.lastUpdated">
      <hr />
      <p>
        <span v-if="frontmatter.created_at"><strong>Created:</strong> {{ frontmatter.created_at }}</span>
        <span v-if="frontmatter.transcribed_at"> | <strong>Transcribed:</strong> {{ frontmatter.transcribed_at }}</span>
        <span v-if="page.lastUpdated"> | <strong>Last updated:</strong> {{ page.lastUpdated }}</span>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.vp-footnote {
  margin-top: 2rem;
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
}
</style>
