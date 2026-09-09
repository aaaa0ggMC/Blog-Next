<template>
  <!-- 场景 A：作为小题 (Question) -->
  <div
    v-if="isQuestion"
    :id="questionId"
    class="exam-question-card"
    :class="{
      'is-submitted': isSubmitted,
      'is-correct': isSubmitted && isCorrect,
      'is-wrong': isSubmitted && !isCorrect
    }"
  >
    <!-- 题目头部 -->
    <div class="question-header">
      <div class="question-meta-left">
        <span class="question-type-badge">{{ questionTypeLabel }}</span>
        <span v-if="title" class="question-title-text">{{ title }}</span>
      </div>

      <div class="question-meta-right">
        <!-- 未交卷：展示该题分值 -->
        <span v-if="!isSubmitted" class="question-score-tag">
          {{ maxScore }} 分
        </span>
        <!-- 已交卷：展示得分情况 -->
        <span
          v-else
          class="question-score-tag"
          :class="isCorrect ? 'score-tag-correct' : 'score-tag-wrong'"
        >
          得分: {{ earnedScore }} / {{ maxScore }} 分
        </span>
      </div>
    </div>

    <!-- 题目主体（题干、选项、填空、解析插槽） -->
    <div class="question-body">
      <slot />
    </div>
  </div>

  <!-- 场景 B：作为章节/分组 (Section) -->
  <div v-else-if="isSection" class="exam-section-wrap">
    <div class="exam-section-header">
      <div class="section-title-wrap">
        <span class="section-decor-bar" />
        <h3 class="section-title">{{ title }}</h3>
      </div>
    </div>
    <div class="exam-section-body">
      <slot />
    </div>
  </div>

  <!-- 场景 C：作为试卷总容器 (Container / Root) -->
  <div v-else class="exam-container-wrap" :data-exam-name="activeExamName">
    <!-- 试卷标题栏（若提供了 title） -->
    <div v-if="title" class="exam-container-header">
      <div class="container-title-group">
        <span class="container-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        </span>
        <h2 class="container-title">{{ title }}</h2>
      </div>

      <div class="container-stats-badge">
        <span class="stats-total">满分 {{ examStats.totalScore }} 分</span>
        <span class="stats-count">{{ examStats.totalQuestions }} 题</span>
      </div>
    </div>

    <!-- 试卷正文内容插槽 -->
    <div class="exam-container-content">
      <slot />
    </div>

    <!-- 试卷底部自带提交与操作栏（可通过 :show-submit="false" 隐藏） -->
    <div v-if="showSubmitBar" class="exam-container-footer">
      <div class="footer-status-info">
        <span v-if="!isSubmitted">
          已作答 <strong class="num-highlight">{{ examStats.answeredCount }}</strong> / {{ examStats.totalQuestions }} 题
        </span>
        <span v-else class="footer-result-summary" :class="examStats.accuracy >= 60 ? 'text-correct' : 'text-wrong'">
          得分：{{ examStats.earnedScore }} / {{ examStats.totalScore }} 分（正确率 {{ examStats.accuracy }}%）
        </span>
      </div>

      <div class="footer-actions">
        <button
          v-if="!isSubmitted"
          class="exam-btn exam-btn-primary"
          @click="handleSubmit"
        >
          提交试卷
        </button>
        <button
          v-else
          class="exam-btn exam-btn-outline"
          @click="handleReset"
        >
          重新作答
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  inject,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch
} from 'vue';
import {
  getExamState,
  registerQuestion,
  unregisterQuestion,
  setQuestionSelection,
  setBlankAnswer as storeSetBlankAnswer,
  submitExam,
  resetExam,
  useExamStats,
  normalizeExpectedAnswers
} from '../../stores/examStore';
import type { BlankInfo, OptionInfo, QuestionData, QuestionType } from './types';

const props = withDefaults(
  defineProps<{
    name?: string;
    title?: string;
    score?: number | string;
    answer?: string | string[];
    type?: QuestionType;
    id?: string;
    showSubmit?: boolean;
  }>(),
  {
    showSubmit: true
  }
);

// 父级注入的 Exam 上下文（若有说明当前在嵌套组件内）
const parentExamContext = inject<any>('examContext', null);

// 判断当前 Exam 组件充当的角色：
// 1. 若显式传入 score 或 answer，或者显式指定为小题角色 -> Question
// 2. 若在父级 Exam 内部且没有 name，但有 title 且没有 score -> Section
// 3. 否则 -> Root Container
const isQuestion = computed(() => {
  return props.score !== undefined || props.answer !== undefined || (parentExamContext && !props.name && !props.title);
});

const isSection = computed(() => {
  return parentExamContext && !props.name && Boolean(props.title) && props.score === undefined;
});

// 计算当前小题所属的试卷名称
const activeExamName = computed(() => {
  if (props.name) return props.name;
  if (parentExamContext?.name?.value) return parentExamContext.name.value;
  return 'default';
});

// 根试卷的统计状态与交卷状态
const examStats = useExamStats(activeExamName.value);
const examState = computed(() => getExamState(activeExamName.value));
const isSubmitted = computed(() => examState.value.isSubmitted);

// 控制底部操作栏：仅根容器且允许展示时显示
const showSubmitBar = computed(() => {
  return !isQuestion.value && !isSection.value && props.showSubmit;
});

function handleSubmit() {
  submitExam(activeExamName.value);
}

function handleReset() {
  resetExam(activeExamName.value);
}

// -------------------------------------------------------------
// 若当前 Exam 组件充当小题 (Question) 的逻辑
// -------------------------------------------------------------
const autoQuestionId = 'q_' + (props.id || Math.random().toString(36).substring(2, 9));
const questionId = props.id || autoQuestionId;

const maxScore = computed(() => {
  const s = Number(props.score);
  return Number.isNaN(s) || s <= 0 ? 1 : s;
});

const registeredOptions = reactive<Record<string, OptionInfo>>({});
const registeredBlanks = reactive<Record<string, BlankInfo>>({});
const autoOptionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// 检测小题题型
const resolvedType = computed<QuestionType>(() => {
  if (props.type) return props.type;
  if (Object.keys(registeredBlanks).length > 0) return 'blank';
  const expAnswers = normalizeExpectedAnswers(props.answer, registeredOptions);
  if (expAnswers.length > 1) return 'multiple';
  return 'single';
});

const questionTypeLabel = computed(() => {
  if (resolvedType.value === 'blank') return '填空题';
  if (resolvedType.value === 'multiple') return '多选题';
  return '单选题';
});

// 当前题目的 store 数据
const questionStoreData = computed<QuestionData | undefined>(() => {
  return examState.value.questions[questionId];
});

const earnedScore = computed(() => questionStoreData.value?.earnedScore || 0);
const isCorrect = computed(() => questionStoreData.value?.isCorrect || false);
const userSelections = computed(() => questionStoreData.value?.userSelections || []);
const userBlankAnswers = computed(() => questionStoreData.value?.userBlankAnswers || {});
const expectedAnswerText = computed(() => questionStoreData.value?.expectedAnswerText || '');
const expectedAnswers = computed(() =>
  normalizeExpectedAnswers(props.answer, registeredOptions)
);

// 为子组件提供 Option/Blank 注册和交互接口
function registerOptionItem(opt: OptionInfo): string {
  let val = opt.value;
  if (!val) {
    const existingCount = Object.keys(registeredOptions).length;
    val = autoOptionLetters[existingCount] || `OPT${existingCount + 1}`;
  }
  registeredOptions[opt.id] = { ...opt, value: val };

  // 同步更新 store 中的题目配置
  syncQuestionToStore();
  return val;
}

function unregisterOptionItem(optId: string) {
  delete registeredOptions[optId];
  syncQuestionToStore();
}

function registerBlankItem(blank: BlankInfo) {
  registeredBlanks[blank.id] = blank;
  syncQuestionToStore();
}

function unregisterBlankItem(blankId: string) {
  delete registeredBlanks[blankId];
  syncQuestionToStore();
}

function selectOption(val: string) {
  const mode = resolvedType.value === 'multiple' ? 'multiple' : 'single';
  setQuestionSelection(activeExamName.value, questionId, val, mode);
}

function setBlankAnswer(blankId: string, val: string) {
  storeSetBlankAnswer(activeExamName.value, questionId, blankId, val);
}

function syncQuestionToStore() {
  const existing = examState.value.questions[questionId];
  registerQuestion(activeExamName.value, {
    id: questionId,
    title: props.title,
    score: maxScore.value,
    type: resolvedType.value,
    answerProp: props.answer,
    options: registeredOptions,
    blanks: registeredBlanks,
    userSelections: existing?.userSelections || [],
    userBlankAnswers: existing?.userBlankAnswers || {},
    earnedScore: existing?.earnedScore || 0,
    isCorrect: existing?.isCorrect || false,
    isAnswered: existing?.isAnswered || false,
    evaluated: existing?.evaluated || false,
    expectedAnswerText: existing?.expectedAnswerText
  });
}

// -------------------------------------------------------------
// 上下文注入与生命周期管理
// -------------------------------------------------------------

// 如果当前不是小题，向下注入 examContext
if (!isQuestion.value) {
  provide('examContext', {
    name: activeExamName,
    isSubmitted
  });
}

// 如果当前是小题，向下注入 examQuestionContext
if (isQuestion.value) {
  provide('examQuestionContext', {
    examName: activeExamName,
    questionId,
    score: maxScore,
    type: resolvedType,
    isSubmitted,
    isCorrect,
    earnedScore,
    expectedAnswerText,
    expectedAnswers,
    userSelections,
    userBlankAnswers,
    registerOption: registerOptionItem,
    unregisterOption: unregisterOptionItem,
    registerBlank: registerBlankItem,
    unregisterBlank: unregisterBlankItem,
    selectOption,
    setBlankAnswer
  });
}

onMounted(() => {
  if (isQuestion.value) {
    syncQuestionToStore();
  }
});

onUnmounted(() => {
  if (isQuestion.value) {
    unregisterQuestion(activeExamName.value, questionId);
  }
});

// 监听 props 变化
watch(
  () => [props.score, props.answer, props.type, props.title],
  () => {
    if (isQuestion.value) {
      syncQuestionToStore();
    }
  }
);
</script>

<style scoped>
/* 试卷总容器样式 */
.exam-container-wrap {
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg, #ffffff);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05);
}

.exam-container-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border-bottom: 1px solid var(--vp-c-divider, #e2e8f0);
}

.container-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.container-icon {
  display: flex;
  align-items: center;
  color: var(--vp-c-brand-1, #3b82f6);
}

.container-title {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  border-bottom: none !important;
  color: var(--vp-c-text-1, #1e293b);
}

.container-stats-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.stats-total {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: var(--vp-c-brand-1, #3b82f6);
  background-color: color-mix(in srgb, var(--vp-c-brand-1, #3b82f6) 10%, transparent);
}

.stats-count {
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 500;
  color: var(--vp-c-text-2, #64748b);
  background-color: var(--vp-c-bg-mute, #f1f5f9);
}

.exam-container-content {
  padding: 16px 20px;
}

/* 试卷底部栏 */
.exam-container-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border-top: 1px solid var(--vp-c-divider, #e2e8f0);
}

.footer-status-info {
  font-size: 13.5px;
  color: var(--vp-c-text-2, #64748b);
}

.num-highlight {
  color: var(--vp-c-brand-1, #3b82f6);
}

.footer-result-summary {
  font-weight: 600;
}

.text-correct {
  color: var(--vp-c-green-1, #10b981);
}

.text-wrong {
  color: var(--vp-c-red-1, #ef4444);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 章节/分组样式 */
.exam-section-wrap {
  margin: 20px 0 14px;
}

.exam-section-header {
  margin-bottom: 12px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-decor-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background-color: var(--vp-c-brand-1, #3b82f6);
}

.section-title {
  margin: 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  border-bottom: none !important;
  color: var(--vp-c-text-1, #1e293b);
}

/* 小题卡片样式 */
.exam-question-card {
  margin: 16px 0;
  padding: 14px 16px;
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  background-color: var(--vp-c-bg-soft, #f8fafc);
  border-radius: 8px;
  border-left: 4px solid var(--vp-c-divider, #cbd5e1);
  transition: all 0.25s ease;
}

.exam-question-card.is-submitted.is-correct {
  border-left-color: var(--vp-c-green-1, #10b981) !important;
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 3%, transparent);
}

.exam-question-card.is-submitted.is-wrong {
  border-left-color: var(--vp-c-red-1, #ef4444) !important;
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 3%, transparent);
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

.question-meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.question-type-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  color: var(--vp-c-brand-1, #3b82f6);
  background-color: color-mix(in srgb, var(--vp-c-brand-1, #3b82f6) 12%, transparent);
}

.question-title-text {
  font-weight: 600;
  color: var(--vp-c-text-1, #1e293b);
}

.question-score-tag {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, #e2e8f0);
  color: var(--vp-c-text-2, #64748b);
}

.score-tag-correct {
  color: var(--vp-c-green-1, #10b981);
  border-color: var(--vp-c-green-1, #10b981);
  background-color: color-mix(in srgb, var(--vp-c-green-1, #10b981) 10%, transparent);
}

.score-tag-wrong {
  color: var(--vp-c-red-1, #ef4444);
  border-color: var(--vp-c-red-1, #ef4444);
  background-color: color-mix(in srgb, var(--vp-c-red-1, #ef4444) 10%, transparent);
}

.question-body {
  font-size: 14.5px;
  line-height: 1.65;
  color: var(--vp-c-text-1, #1e293b);
}

/* 按钮通用 */
.exam-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  font-size: 13.5px;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.exam-btn-primary {
  color: #ffffff;
  background-color: var(--vp-c-brand-1, #3b82f6);
  border: 1px solid var(--vp-c-brand-1, #3b82f6);
}

.exam-btn-primary:hover {
  background-color: var(--vp-c-brand-2, #2563eb);
}

.exam-btn-outline {
  color: var(--vp-c-text-1, #1e293b);
  background-color: var(--vp-c-bg, #ffffff);
  border: 1px solid var(--vp-c-divider, #cbd5e1);
}

.exam-btn-outline:hover {
  border-color: var(--vp-c-brand-1, #3b82f6);
  color: var(--vp-c-brand-1, #3b82f6);
}
</style>
