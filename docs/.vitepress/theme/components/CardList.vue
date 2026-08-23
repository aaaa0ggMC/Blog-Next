<template>
  <div class="card-list">
    <slot />
  </div>
</template>

<style scoped>
.card-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin: 16px 0 24px;
}

@media (max-width: 640px) {
  .card-list {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}
</style>
