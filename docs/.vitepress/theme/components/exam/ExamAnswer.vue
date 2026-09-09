<template>
  <div v-if="isSubmitted" class="exam-answer-wrap">
    <div
      class="exam-answer-card"
      :class="isCorrect ? 'is-correct' : 'is-wrong'"
    >
      <!-- 答案解析头部栏 -->
      <div class="answer-header" @click="isExpanded = !isExpanded">
        <div class="answer-status-pill" :class="isCorrect ? 'pill-correct' : 'pill-wrong'">
          <span class="status-icon">
            <svg
              v-if="isCorrect"
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <svg
              v-else
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </span>
          <span class="status-text">
            {{ isCorrect ? `回答正确 +${earnedScore}分` : `回答错误 0/${maxScore}分` }}
          </span>
        </div>

        <div v-if="!isCorrect && expectedAnswerText" class="expected-answer-text">
          参考答案：<strong class="expected-bold">{{ expectedAnswerText }}</strong>
        </div>

        <div class="expand-indicator" :class="{ 'is-rotated': !isExpanded }">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      <!-- 解析正文（折叠/展开区域） -->
      <div v-show="isExpanded" class="answer-body">
        <div class="answer-body-label">参考解析：</div>
        <div class="answer-content">
          <slot>暂无详细解析内容。</slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue';

const questionContext = inject<any>('examQuestionContext', null);

const isExpanded = ref(true);

const isSubmitted = computed(() => {
  return questionContext?.isSubmitted?.value || false;
});

const isCorrect = computed(() => {
  return questionContext?.isCorrect?.value || false;
});

const earnedScore = computed(() => {
  return questionContext?.earnedScore?.value || 0;
});

const maxScore = computed(() => {
  return questionContext?.score?.value || 0;
});

const expectedAnswerText = computed(() => {
  return questionContext?.expectedAnswerText?.value || '';
});
</script>

<style scoped>
.exam-answer-wrap {
  margin-top: 14px;
  animation: answerFadeIn 0.35s ease-out;
}

@keyframes answerFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.exam-answer-card {
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg, #ffffff);
  overflow: hidden;
  transition: all 0.2s ease;
}

.exam-answer-card.is-correct {
  border-color: var(--vp-c-green-1, #10b981);
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 4%, transparent);
}

.exam-answer-card.is-wrong {
  border-color: var(--vp-c-red-1, #ef4444);
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 4%, transparent);
}

.answer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
}

.answer-status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
}

.pill-correct {
  color: #ffffff;
  background-color: var(--vp-c-green-1, #10b981);
}

.pill-wrong {
  color: #ffffff;
  background-color: var(--vp-c-red-1, #ef4444);
}

.status-icon {
  display: inline-flex;
  align-items: center;
}

.expected-answer-text {
  font-size: 13px;
  color: var(--vp-c-text-1, #1e293b);
}

.expected-bold {
  color: var(--vp-c-green-1, #10b981);
  font-family: var(--vp-font-family-mono, monospace);
  font-size: 13.5px;
}

.expand-indicator {
  display: flex;
  align-items: center;
  color: var(--vp-c-text-2, #64748b);
  transition: transform 0.2s ease;
  margin-left: auto;
}

.expand-indicator.is-rotated {
  transform: rotate(-90deg);
}

.answer-body {
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--vp-c-text-1, #1e293b);
}

.answer-body-label {
  font-weight: 600;
  font-size: 12.5px;
  color: var(--vp-c-text-2, #64748b);
  margin-bottom: 6px;
}

.answer-content :deep(p) {
  margin: 6px 0;
}
</style>
