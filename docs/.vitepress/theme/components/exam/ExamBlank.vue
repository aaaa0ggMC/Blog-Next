<template>
  <span class="exam-blank-wrap">
    <input
      ref="inputRef"
      type="text"
      class="exam-blank-input"
      :class="{
        'is-correct': isSubmitted && isThisBlankCorrect,
        'is-wrong': isSubmitted && !isThisBlankCorrect,
        'is-disabled': isSubmitted
      }"
      :style="{ width: computedWidth }"
      :placeholder="isSubmitted ? '' : (placeholder || '填空')"
      :value="currentVal"
      :disabled="isSubmitted"
      autocomplete="off"
      spellcheck="false"
      @input="handleInput"
    />

    <!-- 提交后状态指示与参考答案 -->
    <span v-if="isSubmitted" class="exam-blank-status">
      <span v-if="isThisBlankCorrect" class="blank-status-icon status-correct" title="回答正确">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </span>
      <span v-else class="blank-status-wrap">
        <span class="blank-status-icon status-wrong" title="回答错误">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </span>
        <span class="blank-expected-pill" title="参考答案">
          参考: {{ displayExpectedAnswer }}
        </span>
      </span>
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import type { BlankInfo } from './types';

const props = defineProps<{
  answer: string | string[];
  placeholder?: string;
  width?: string;
  caseSensitive?: boolean;
  trim?: boolean;
}>();

const questionContext = inject<any>('examQuestionContext', null);

const autoId = 'blank_' + Math.random().toString(36).substring(2, 9);
const inputRef = ref<HTMLInputElement | null>(null);

const currentVal = computed(() => {
  if (!questionContext) return '';
  return questionContext.userBlankAnswers?.value?.[autoId] || '';
});

const isSubmitted = computed(() => {
  return questionContext?.isSubmitted?.value || false;
});

const expectedAnswersList = computed(() => {
  if (Array.isArray(props.answer)) {
    return props.answer.map((a) => String(a).trim()).filter(Boolean);
  }
  if (typeof props.answer === 'string') {
    return props.answer
      .split(/[/|、]/)
      .map((a) => a.trim())
      .filter(Boolean);
  }
  return [];
});

const displayExpectedAnswer = computed(() => {
  return expectedAnswersList.value.join(' 或 ');
});

const isThisBlankCorrect = computed(() => {
  if (!isSubmitted.value) return false;
  const userVal = (currentVal.value || '').trim();
  if (!userVal) return false;

  return expectedAnswersList.value.some((exp) => {
    if (props.caseSensitive) {
      return props.trim !== false ? userVal === exp.trim() : userVal === exp;
    } else {
      return props.trim !== false
        ? userVal.toLowerCase() === exp.trim().toLowerCase()
        : userVal.toLowerCase() === exp.toLowerCase();
    }
  });
});

const computedWidth = computed(() => {
  if (props.width) return props.width;
  const maxLen = Math.max(
    displayExpectedAnswer.value.length,
    (placeholderText.value || '').length,
    6
  );
  return `${Math.min(Math.max(maxLen * 14 + 20, 80), 220)}px`;
});

const placeholderText = computed(() => props.placeholder || '填空');

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement;
  if (questionContext) {
    questionContext.setBlankAnswer(autoId, target.value);
  }
}

onMounted(() => {
  if (questionContext) {
    questionContext.registerBlank({
      id: autoId,
      answer: props.answer,
      caseSensitive: props.caseSensitive,
      trim: props.trim
    } as BlankInfo);
  }
});

onUnmounted(() => {
  if (questionContext) {
    questionContext.unregisterBlank(autoId);
  }
});
</script>

<style scoped>
.exam-blank-wrap {
  display: inline-flex;
  align-items: center;
  vertical-align: baseline;
  margin: 0 4px;
  position: relative;
}

.exam-blank-input {
  display: inline-block;
  height: 28px;
  padding: 2px 8px;
  font-size: 14px;
  line-height: 24px;
  color: var(--vp-c-text-1, #1e293b);
  background-color: var(--vp-c-bg-alt, #f1f5f9);
  border: 1.5px solid var(--vp-c-divider, #cbd5e1);
  border-radius: 6px;
  outline: none;
  font-family: var(--vp-font-family-mono, monospace);
  transition: all 0.2s ease;
  text-align: center;
}

.exam-blank-input:focus {
  border-color: var(--vp-c-brand-1, #3b82f6);
  background-color: var(--vp-c-bg, #ffffff);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--vp-c-brand-1, #3b82f6) 20%, transparent);
}

.exam-blank-input.is-disabled {
  cursor: default;
}

/* 提交后对错样式 */
.exam-blank-input.is-correct {
  border-color: var(--vp-c-green-1, #10b981) !important;
  color: var(--vp-c-green-1, #10b981) !important;
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 10%, transparent) !important;
  font-weight: 600;
}

.exam-blank-input.is-wrong {
  border-color: var(--vp-c-red-1, #ef4444) !important;
  color: var(--vp-c-red-1, #ef4444) !important;
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 10%, transparent) !important;
  text-decoration: line-through;
}

.exam-blank-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  font-size: 12px;
}

.blank-status-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
}

.status-correct {
  color: #ffffff;
  background-color: var(--vp-c-green-1, #10b981);
}

.status-wrong {
  color: #ffffff;
  background-color: var(--vp-c-red-1, #ef4444);
}

.blank-status-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.blank-expected-pill {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--vp-c-green-1, #10b981);
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 12%, transparent);
  border: 1px solid var(--vp-c-green-1, #10b981);
  border-radius: 4px;
  padding: 1px 6px;
  white-space: nowrap;
}
</style>
