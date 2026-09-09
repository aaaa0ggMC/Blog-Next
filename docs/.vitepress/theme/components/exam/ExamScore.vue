<template>
  <div
    class="exam-score-banner"
    :class="[
      `format-${format || 'banner'}`,
      isSubmitted ? (stats.accuracy >= 60 ? 'is-passed' : 'is-failed') : 'is-pending'
    ]"
    role="status"
    :title="isSubmitted ? '点击查看试卷详情' : '试卷待作答'"
    @click="scrollToExam"
  >
    <div class="score-banner-inner">
      <!-- 左侧图标与标识 -->
      <div class="score-meta-left">
        <span class="score-icon" aria-hidden="true">
          <!-- 已提交且及格/优秀：对勾图标 -->
          <svg
            v-if="isSubmitted && stats.accuracy >= 60"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <!-- 已提交且不及格：警告/错误图标 -->
          <svg
            v-else-if="isSubmitted"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <!-- 未提交：试卷文档图标 -->
          <svg
            v-else
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>

        <span class="score-exam-label">
          {{ label || (name && name !== 'default' ? `试卷 [${name}]` : '试卷测评') }}
        </span>
      </div>

      <!-- 右侧分数与状态 -->
      <div class="score-meta-right">
        <!-- 未交卷状态 -->
        <template v-if="!isSubmitted">
          <span class="score-text score-text-pending">
            试卷总分：<strong class="score-val">{{ isClientMounted ? stats.totalScore : '--' }}</strong> 分
          </span>
          <span class="score-status-badge badge-pending">待交卷</span>
        </template>

        <!-- 已交卷状态 -->
        <template v-else>
          <span class="score-text score-text-submitted">
            得分：<strong class="score-val" :class="stats.accuracy >= 60 ? 'val-green' : 'val-red'">{{ stats.earnedScore }}</strong> / {{ stats.totalScore }} 分
          </span>
          <span
            class="score-status-badge"
            :class="stats.accuracy >= 60 ? 'badge-green' : 'badge-red'"
          >
            正确率 {{ stats.accuracy }}%
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getExamState, useExamStats } from '../../stores/examStore';

const props = withDefaults(
  defineProps<{
    name?: string;
    label?: string;
    format?: 'banner' | 'badge' | 'card';
  }>(),
  {
    name: 'default',
    format: 'banner'
  }
);

const isClientMounted = ref(false);

const stats = useExamStats(props.name);
const examState = computed(() => getExamState(props.name));
const isSubmitted = computed(() => isClientMounted.value && examState.value.isSubmitted);

onMounted(() => {
  isClientMounted.value = true;
});

function scrollToExam() {
  if (typeof document === 'undefined') return;
  const target = document.querySelector(`[data-exam-name="${props.name}"]`);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style scoped>
.exam-score-banner {
  display: inline-block;
  width: 100%;
  margin: 14px 0;
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg-soft, #f8fafc);
  transition: all 0.25s ease;
  user-select: none;
  cursor: pointer;
}

.exam-score-banner:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.06);
}

.score-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 10px 16px;
}

.score-meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-exam-label {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--vp-c-text-1, #1e293b);
}

.score-meta-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-text {
  font-size: 13.5px;
  color: var(--vp-c-text-2, #64748b);
}

.score-val {
  font-size: 15px;
  font-family: var(--vp-font-family-mono, monospace);
}

.val-green {
  color: var(--vp-c-green-1, #10b981);
}

.val-red {
  color: var(--vp-c-red-1, #ef4444);
}

.score-status-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 状态主题色彩 */
.exam-score-banner.is-pending {
  border-color: var(--vp-c-divider, #cbd5e1);
}
.exam-score-banner.is-pending .score-icon {
  color: var(--vp-c-brand-1, #3b82f6);
}
.badge-pending {
  color: var(--vp-c-text-2, #64748b);
  background-color: var(--vp-c-bg-mute, #e2e8f0);
}

.exam-score-banner.is-passed {
  border-color: var(--vp-c-green-1, #10b981);
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 5%, transparent);
}
.exam-score-banner.is-passed .score-icon {
  color: var(--vp-c-green-1, #10b981);
}
.badge-green {
  color: #ffffff;
  background-color: var(--vp-c-green-1, #10b981);
}

.exam-score-banner.is-failed {
  border-color: var(--vp-c-red-1, #ef4444);
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 5%, transparent);
}
.exam-score-banner.is-failed .score-icon {
  color: var(--vp-c-red-1, #ef4444);
}
.badge-red {
  color: #ffffff;
  background-color: var(--vp-c-red-1, #ef4444);
}

/* 徽章紧凑模式 */
.exam-score-banner.format-badge {
  width: auto;
  display: inline-flex;
  margin: 6px 4px;
}
.exam-score-banner.format-badge .score-banner-inner {
  padding: 6px 12px;
}
</style>
