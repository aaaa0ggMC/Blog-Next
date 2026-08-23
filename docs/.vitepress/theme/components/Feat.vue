<template>
  <div class="feat">
    <div v-if="title" class="feat-tit">{{ title }}</div>
    <div class="feat-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<style scoped>
.feat {
  margin: 14px 0;
  padding: 14px 18px;
  border: 1px solid var(--vp-c-divider);
  border-left: 4px solid coral;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}

.feat-tit {
  font-weight: 700;
  margin-bottom: 6px;
  color: var(--vp-c-text-1);
}

.feat-body > :first-child {
  margin-top: 0;
}

.feat-body > :last-child {
  margin-bottom: 0;
}

.feat-body p {
  text-indent: 1em;
}
</style>
