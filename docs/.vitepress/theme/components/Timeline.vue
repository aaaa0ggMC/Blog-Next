<template>
  <div class="timeline-container">
    <slot />
  </div>
</template>

<style scoped>
.timeline-container {
  position: relative;
  margin: 20px 0 28px 4px;
  padding-left: 20px;
}

.timeline-container::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 6px;
  width: 2px;
  background: var(--vp-c-divider);
  border-radius: 1px;
}
</style>
