<template>
  <footer class="footer-stats no-print">
    <div class="footer-container">
      <div class="footer-left">
        <span class="footer-author">Developed by aaaa0ggmc</span>
      </div>
      <div class="footer-divider" aria-hidden="true"></div>
      <div class="footer-right">
        <span class="stat-item" title="全站总浏览量 (PV)">
          <svg class="stat-icon" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span class="stat-label">总访问量</span>
          <span class="stat-val">{{ formattedSitePv }}</span>
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBusuanzi } from '../utils/busuanzi'

const { sitePv, siteUv } = useBusuanzi()

const formattedSitePv = computed(() => {
  if (sitePv.value === null) return '--'
  return sitePv.value.toLocaleString()
})

const formattedSiteUv = computed(() => {
  if (siteUv.value === null) return '--'
  return siteUv.value.toLocaleString()
})
</script>

<style scoped>
.footer-stats {
  padding: 24px 24px 36px;
  border-top: 1px solid var(--vp-c-gutter);
  background-color: var(--vp-c-bg);
  font-size: 13px;
  color: var(--vp-c-text-2);
  transition: border-color 0.3s ease, background-color 0.3s ease;
}

.footer-container {
  max-width: var(--vp-layout-max-width, 1440px);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.footer-author {
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.footer-divider {
  width: 1px;
  height: 12px;
  background-color: var(--vp-c-divider);
}

.footer-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.stat-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.stat-icon {
  color: var(--vp-c-text-3);
}

.stat-label {
  color: var(--vp-c-text-2);
}

.stat-val {
  font-weight: 600;
  color: var(--vp-c-brand-1, var(--vp-c-brand));
}

.stat-dot {
  color: var(--vp-c-text-3);
  user-select: none;
}

@media (max-width: 640px) {
  .footer-stats {
    padding: 20px 16px 30px;
  }
  .footer-container {
    flex-direction: column;
    gap: 8px;
  }
  .footer-divider {
    display: none;
  }
}
</style>
