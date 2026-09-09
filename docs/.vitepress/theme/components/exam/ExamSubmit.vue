<template>
  <div class="exam-submit-wrap">
    <button
      v-if="!isSubmitted"
      class="exam-submit-btn btn-primary"
      @click="handleSubmit"
    >
      <span class="btn-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span class="btn-text">
        <slot>提交试卷</slot>
      </span>
      <span v-if="stats.totalQuestions > 0" class="btn-badge">
        {{ stats.answeredCount }} / {{ stats.totalQuestions }}
      </span>
    </button>

    <button
      v-else
      class="exam-submit-btn btn-secondary"
      @click="handleReset"
    >
      <span class="btn-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 2v6h6"></path>
          <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
          <path d="M21 22v-6h-6"></path>
          <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
        </svg>
      </span>
      <span class="btn-text">重新作答</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getExamState, submitExam, resetExam, useExamStats } from '../../stores/examStore';

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

function handleSubmit() {
  submitExam(props.name);
}

function handleReset() {
  resetExam(props.name);
}
</script>

<style scoped>
.exam-submit-wrap {
  display: inline-flex;
  margin: 12px 0;
}

.exam-submit-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-icon {
  display: flex;
  align-items: center;
}

.btn-primary {
  color: #ffffff;
  background-color: var(--vp-c-brand-1, #3b82f6);
  border: 1px solid var(--vp-c-brand-1, #3b82f6);
  box-shadow: 0 2px 8px -1px color-mix(in srgb, var(--vp-c-brand-1, #3b82f6) 40%, transparent);
}

.btn-primary:hover {
  background-color: var(--vp-c-brand-2, #2563eb);
  transform: translateY(-1px);
}

.btn-secondary {
  color: var(--vp-c-text-1, #1e293b);
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, #cbd5e1);
}

.btn-secondary:hover {
  border-color: var(--vp-c-brand-1, #3b82f6);
  color: var(--vp-c-brand-1, #3b82f6);
  transform: translateY(-1px);
}

.btn-badge {
  font-size: 11.5px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 9999px;
  background-color: rgba(255, 255, 255, 0.2);
}
</style>
