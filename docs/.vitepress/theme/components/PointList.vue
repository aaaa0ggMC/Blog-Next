<template>
  <div class="point-list-container">
    <slot />
  </div>
</template>

<script setup lang="ts">
// 通用结构化分点/灵感盒列表容器
</script>

<style scoped>
.point-list-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 18px 0 26px;
  width: 100%;
}
</style>
