<template>
  <div v-if="isSubmitted" class="exam-result-card" :class="stats.accuracy >= 60 ? 'is-pass' : 'is-fail'">
    <div class="result-header">
      <div class="result-title-group">
        <span class="result-icon" aria-hidden="true">
          <svg v-if="stats.accuracy >= 60" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </span>
        <h3 class="result-title">测验结果</h3>
      </div>

      <div class="result-grade-tag" :class="gradeClass">
        {{ gradeLabel }}
      </div>
    </div>

    <!-- 成绩数据网格 -->
    <div class="result-grid">
      <div class="stat-box">
        <div class="stat-label">总得分</div>
        <div class="stat-value" :class="stats.accuracy >= 60 ? 'text-green' : 'text-red'">
          {{ stats.earnedScore }} <span class="stat-unit">/ {{ stats.totalScore }} 分</span>
        </div>
      </div>

      <div class="stat-box">
        <div class="stat-label">正确率</div>
        <div class="stat-value text-brand">
          {{ stats.accuracy }}<span class="stat-unit">%</span>
        </div>
      </div>

      <div class="stat-box">
        <div class="stat-label">答对题数</div>
        <div class="stat-value text-green">
          {{ stats.correctCount }} <span class="stat-unit">题</span>
        </div>
      </div>

      <div class="stat-box">
        <div class="stat-label">答错题数</div>
        <div class="stat-value text-red">
          {{ stats.wrongCount }} <span class="stat-unit">题</span>
        </div>
      </div>
    </div>

    <!-- 底部操作区 -->
    <div class="result-actions">
      <button class="result-reset-btn" @click="handleReset">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v6h6"></path>
          <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
          <path d="M21 22v-6h-6"></path>
          <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
        </svg>
        重新作答
      </button>
    </div>
  </div>

  <div v-else class="exam-result-placeholder">
    <span class="placeholder-text">
      试卷尚未提交，交卷后在此查看完整测评成绩与统计。
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getExamState, resetExam, useExamStats } from '../../stores/examStore';

const props = withDefaults(
  defineProps<{
    name?: string;
  }>(),
  {
    name: 'default'
  }
);

const examState = computed(() => getExamState(props.name));
const isSubmitted = computed(() => examState.value.isSubmitted);
const stats = useExamStats(props.name);

const gradeLabel = computed(() => {
  const acc = stats.accuracy.value;
  if (acc === 100) return '满分通过';
  if (acc >= 90) return '优秀';
  if (acc >= 80) return '良好';
  if (acc >= 60) return '及格';
  return '未通过';
});

const gradeClass = computed(() => {
  const acc = stats.accuracy.value;
  if (acc >= 80) return 'grade-excellent';
  if (acc >= 60) return 'grade-pass';
  return 'grade-fail';
});

function handleReset() {
  resetExam(props.name);
}
</script>

<style scoped>
.exam-result-card {
  margin: 18px 0;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1.5px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg, #ffffff);
  box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.05);
  animation: resultSlideDown 0.35s ease-out;
}

@keyframes resultSlideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.exam-result-card.is-pass {
  border-color: var(--vp-c-green-1, #10b981);
}

.exam-result-card.is-fail {
  border-color: var(--vp-c-red-1, #ef4444);
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.result-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-icon {
  display: flex;
  align-items: center;
}

.is-pass .result-icon {
  color: var(--vp-c-green-1, #10b981);
}

.is-fail .result-icon {
  color: var(--vp-c-red-1, #ef4444);
}

.result-title {
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-bottom: none !important;
  color: var(--vp-c-text-1, #1e293b);
}

.result-grade-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
}

.grade-excellent {
  color: #ffffff;
  background-color: var(--vp-c-green-1, #10b981);
}

.grade-pass {
  color: #ffffff;
  background-color: var(--vp-c-brand-1, #3b82f6);
}

.grade-fail {
  color: #ffffff;
  background-color: var(--vp-c-red-1, #ef4444);
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.stat-box {
  padding: 10px 12px;
  border-radius: 8px;
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: var(--vp-c-text-2, #64748b);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  font-family: var(--vp-font-family-mono, monospace);
}

.stat-unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--vp-c-text-2, #64748b);
}

.text-green {
  color: var(--vp-c-green-1, #10b981);
}

.text-red {
  color: var(--vp-c-red-1, #ef4444);
}

.text-brand {
  color: var(--vp-c-brand-1, #3b82f6);
}

.result-actions {
  display: flex;
  justify-content: flex-end;
}

.result-reset-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid var(--vp-c-divider, #cbd5e1);
  background-color: var(--vp-c-bg, #ffffff);
  color: var(--vp-c-text-1, #1e293b);
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-reset-btn:hover {
  border-color: var(--vp-c-brand-1, #3b82f6);
  color: var(--vp-c-brand-1, #3b82f6);
}

.exam-result-placeholder {
  margin: 14px 0;
  padding: 12px 16px;
  border: 1px dashed var(--vp-c-divider, #cbd5e1);
  border-radius: 8px;
  font-size: 13px;
  color: var(--vp-c-text-2, #64748b);
  background-color: var(--vp-c-bg-soft, #f8fafc);
  text-align: center;
}
</style>
