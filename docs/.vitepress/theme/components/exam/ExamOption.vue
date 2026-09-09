<template>
  <div
    class="exam-option"
    :class="[
      `is-${questionType}`,
      {
        'is-selected': isSelected,
        'is-correct-chosen': isSubmitted && isSelected && isThisOptionCorrect,
        'is-wrong-chosen': isSubmitted && isSelected && !isThisOptionCorrect,
        'is-missed-correct': isSubmitted && !isSelected && isThisOptionCorrect,
        'is-disabled': isSubmitted
      }
    ]"
    role="button"
    :tabindex="isSubmitted ? -1 : 0"
    :aria-disabled="isSubmitted"
    @click="handleClick"
    @keydown.enter.space.prevent="handleClick"
  >
    <!-- 左侧选择指示器 (Radio / Checkbox) -->
    <div class="option-indicator" aria-hidden="true">
      <span class="indicator-icon">
        <!-- 提交后的对勾 -->
        <svg
          v-if="isSubmitted && isThisOptionCorrect"
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
        <!-- 提交后选错的叉叉 -->
        <svg
          v-else-if="isSubmitted && isSelected && !isThisOptionCorrect"
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
        <!-- 未提交时：选中的圆点或对勾 -->
        <span v-else-if="isSelected && questionType === 'single'" class="radio-dot" />
        <svg
          v-else-if="isSelected && questionType === 'multiple'"
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <!-- 未选中时：显示选项标识 A/B/C/D 或空 -->
        <span v-else class="option-letter">{{ resolvedValue }}</span>
      </span>
    </div>

    <!-- 选项正文 -->
    <div class="option-content">
      <slot>{{ label || resolvedValue }}</slot>
    </div>

    <!-- 提交后右侧状态反馈标签 -->
    <div v-if="isSubmitted" class="option-feedback-tag">
      <span v-if="isSelected && isThisOptionCorrect" class="feedback-badge badge-correct">
        正确选择
      </span>
      <span v-else-if="isSelected && !isThisOptionCorrect" class="feedback-badge badge-wrong">
        你的选择
      </span>
      <span v-else-if="!isSelected && isThisOptionCorrect" class="feedback-badge badge-missed">
        参考答案
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import type { OptionInfo } from './types';

const props = defineProps<{
  value?: string;
  correct?: boolean;
  label?: string;
}>();

const questionContext = inject<any>('examQuestionContext', null);

const autoId = 'opt_' + Math.random().toString(36).substring(2, 9);
const registeredKey = ref<string>('');

const resolvedValue = computed(() => {
  if (props.value !== undefined && props.value !== '') {
    return String(props.value).trim().toUpperCase();
  }
  return registeredKey.value || '•';
});

const questionType = computed(() => {
  return questionContext?.type?.value || 'single';
});

const isSubmitted = computed(() => {
  return questionContext?.isSubmitted?.value || false;
});

const isSelected = computed(() => {
  if (!questionContext?.userSelections?.value) return false;
  return questionContext.userSelections.value.includes(resolvedValue.value);
});

const isThisOptionCorrect = computed(() => {
  if (props.correct) return true;
  if (!questionContext) return false;
  const expected = questionContext.expectedAnswers?.value || [];
  return expected.includes(resolvedValue.value);
});

function handleClick() {
  if (isSubmitted.value) return;
  if (questionContext && resolvedValue.value) {
    questionContext.selectOption(resolvedValue.value);
  }
}

onMounted(() => {
  if (questionContext) {
    const val = props.value !== undefined ? String(props.value).trim().toUpperCase() : '';
    const key = questionContext.registerOption({
      id: autoId,
      value: val,
      isCorrect: Boolean(props.correct),
      label: props.label
    } as OptionInfo);
    registeredKey.value = key;
  }
});

onUnmounted(() => {
  if (questionContext) {
    questionContext.unregisterOption(autoId);
  }
});
</script>

<style scoped>
.exam-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin: 7px 0;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.exam-option:hover:not(.is-disabled) {
  border-color: var(--vp-c-brand-1, #3b82f6);
  background-color: var(--vp-c-bg-mute, #f1f5f9);
  transform: translateY(-1px);
}

.exam-option:focus-visible {
  outline: 2px solid var(--vp-c-brand-1, #3b82f6);
  outline-offset: 2px;
}

/* 选中态 */
.exam-option.is-selected {
  border-color: var(--vp-c-brand-1, #3b82f6);
  background-color: color-mix(in srgb, var(--vp-c-brand-1, #3b82f6) 10%, transparent);
}

/* 选项指示器样式 */
.option-indicator {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--vp-c-divider, #cbd5e1);
  background-color: var(--vp-c-bg, #ffffff);
  color: var(--vp-c-text-2, #64748b);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.exam-option.is-multiple .option-indicator {
  border-radius: 6px;
}

.exam-option.is-selected .option-indicator {
  border-color: var(--vp-c-brand-1, #3b82f6);
  background-color: var(--vp-c-brand-1, #3b82f6);
  color: #ffffff;
}

.indicator-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #ffffff;
}

.option-letter {
  font-size: 12px;
  font-family: var(--vp-font-family-mono, monospace);
}

/* 选项文本 */
.option-content {
  flex: 1;
  font-size: 14.5px;
  line-height: 1.5;
  color: var(--vp-c-text-1, #1e293b);
  word-break: break-word;
}

/* 提交后样式状态 */
.exam-option.is-disabled {
  cursor: default;
  pointer-events: none;
}

.exam-option.is-correct-chosen {
  border-color: var(--vp-c-green-1, #10b981) !important;
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 12%, transparent) !important;
}
.exam-option.is-correct-chosen .option-indicator {
  border-color: var(--vp-c-green-1, #10b981);
  background-color: var(--vp-c-green-1, #10b981);
  color: #ffffff;
}

.exam-option.is-wrong-chosen {
  border-color: var(--vp-c-red-1, #ef4444) !important;
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 12%, transparent) !important;
}
.exam-option.is-wrong-chosen .option-indicator {
  border-color: var(--vp-c-red-1, #ef4444);
  background-color: var(--vp-c-red-1, #ef4444);
  color: #ffffff;
}

.exam-option.is-missed-correct {
  border: 1.5px dashed var(--vp-c-green-1, #10b981) !important;
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 6%, transparent) !important;
}
.exam-option.is-missed-correct .option-indicator {
  border-color: var(--vp-c-green-1, #10b981);
  color: var(--vp-c-green-1, #10b981);
}

/* 状态徽章 */
.option-feedback-tag {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.feedback-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 9999px;
  white-space: nowrap;
}

.badge-correct {
  color: var(--vp-c-green-1, #10b981);
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 15%, transparent);
}

.badge-wrong {
  color: var(--vp-c-red-1, #ef4444);
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 15%, transparent);
}

.badge-missed {
  color: var(--vp-c-green-1, #10b981);
  border: 1px solid var(--vp-c-green-1, #10b981);
  background-color: transparent;
}
</style>
