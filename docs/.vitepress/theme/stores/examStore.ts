import { reactive, computed } from 'vue';
import type { ExamInstance, QuestionData, BlankInfo, OptionInfo } from '../components/exam/types';

const exams = reactive<Record<string, ExamInstance>>({});

export function getExamState(name: string = 'default'): ExamInstance {
  const examName = name || 'default';
  if (!exams[examName]) {
    exams[examName] = {
      id: examName,
      title: '',
      questions: {},
      isSubmitted: false
    };
  }
  return exams[examName];
}

/**
 * 规范化正确答案列表
 */
export function normalizeExpectedAnswers(
  answerProp?: string | string[],
  options?: Record<string, OptionInfo>
): string[] {
  if (answerProp !== undefined && answerProp !== null && answerProp !== '') {
    if (Array.isArray(answerProp)) {
      return answerProp.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    }
    const str = String(answerProp).trim();
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const parsed = JSON.parse(str);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
        }
      } catch {
        // fallback to split
      }
    }
    return str
      .split(/[,，/、|]/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }

  if (options) {
    const list: string[] = [];
    for (const key of Object.keys(options)) {
      if (options[key]?.isCorrect) {
        list.push(String(options[key].value || key).trim().toUpperCase());
      }
    }
    return list;
  }

  return [];
}

/**
 * 评定单个题目的得分与正确性
 */
export function evaluateQuestion(q: QuestionData) {
  const maxScore = Number(q.score) || 0;
  let earnedScore = 0;
  let isCorrect = false;
  let isAnswered = false;
  let expectedText = '';

  const blankKeys = Object.keys(q.blanks);
  const optionKeys = Object.keys(q.options);

  if (blankKeys.length > 0) {
    // === 填空题 ===
    let correctBlanksCount = 0;
    const blankCount = blankKeys.length;
    const scorePerBlank = blankCount > 0 ? maxScore / blankCount : 0;
    const expectedParts: string[] = [];

    blankKeys.forEach((key, index) => {
      const blank = q.blanks[key];
      const userVal = (q.userBlankAnswers[key] ?? '').trim();
      if (userVal) isAnswered = true;

      // 支持数组、逗号、斜杠、竖线分隔的多种可接受答案
      let expectedList: string[] = [];
      if (Array.isArray(blank.answer)) {
        expectedList = blank.answer.map((a) => String(a).trim());
      } else if (typeof blank.answer === 'string') {
        expectedList = blank.answer
          .split(/[/|、]/)
          .map((a) => a.trim())
          .filter(Boolean);
      }

      expectedParts.push(expectedList.join(' 或 '));

      const match = expectedList.some((exp) => {
        if (blank.caseSensitive) {
          return blank.trim !== false ? userVal === exp.trim() : userVal === exp;
        } else {
          return blank.trim !== false
            ? userVal.toLowerCase() === exp.trim().toLowerCase()
            : userVal.toLowerCase() === exp.toLowerCase();
        }
      });

      if (match) {
        correctBlanksCount++;
      }
    });

    if (correctBlanksCount === blankCount && blankCount > 0) {
      isCorrect = true;
      earnedScore = maxScore;
    } else {
      earnedScore = Math.round(correctBlanksCount * scorePerBlank * 10) / 10;
      isCorrect = false;
    }

    expectedText = expectedParts.join('；');
  } else if (optionKeys.length > 0 || q.answerProp) {
    // === 选择题 ===
    const expected = normalizeExpectedAnswers(q.answerProp, q.options);
    const userSelected = (q.userSelections || []).map((s) => s.trim().toUpperCase());

    if (userSelected.length > 0) {
      isAnswered = true;
    }

    expectedText = expected.join(', ');

    const sortedExp = [...expected].sort();
    const sortedUser = [...userSelected].sort();

    const isMatch =
      sortedExp.length === sortedUser.length &&
      sortedExp.every((val, idx) => val === sortedUser[idx]);

    if (isMatch) {
      isCorrect = true;
      earnedScore = maxScore;
    } else {
      // 多选题漏选酌情分判断：选出的全是对的且无错误项
      if (expected.length > 1 && userSelected.length > 0) {
        const hasWrong = userSelected.some((u) => !expected.includes(u));
        if (!hasWrong && userSelected.length < expected.length) {
          earnedScore = Math.round((userSelected.length / expected.length) * maxScore * 10) / 10;
        }
      }
      isCorrect = false;
    }
  } else {
    // 无选项无填空自定义题
    isAnswered = (q.userSelections || []).length > 0;
    expectedText = String(q.answerProp || '');
  }

  q.earnedScore = earnedScore;
  q.isCorrect = isCorrect;
  q.isAnswered = isAnswered;
  q.evaluated = true;
  q.expectedAnswerText = expectedText;
}

export function registerQuestion(examName: string, question: QuestionData) {
  const exam = getExamState(examName);
  exam.questions[question.id] = question;
}

export function unregisterQuestion(examName: string, questionId: string) {
  const exam = getExamState(examName);
  delete exam.questions[questionId];
}

export function setQuestionSelection(
  examName: string,
  questionId: string,
  val: string,
  mode: 'single' | 'multiple'
) {
  const exam = getExamState(examName);
  const q = exam.questions[questionId];
  if (!q || exam.isSubmitted) return;

  const upperVal = val.trim().toUpperCase();
  if (mode === 'single') {
    q.userSelections = [upperVal];
  } else {
    const idx = q.userSelections.indexOf(upperVal);
    if (idx >= 0) {
      q.userSelections.splice(idx, 1);
    } else {
      q.userSelections.push(upperVal);
    }
  }
  q.isAnswered = q.userSelections.length > 0;
}

export function setBlankAnswer(
  examName: string,
  questionId: string,
  blankId: string,
  value: string
) {
  const exam = getExamState(examName);
  const q = exam.questions[questionId];
  if (!q || exam.isSubmitted) return;

  q.userBlankAnswers[blankId] = value;
  q.isAnswered = Object.values(q.userBlankAnswers).some((v) => (v || '').trim().length > 0);
}

export function submitExam(examName: string = 'default') {
  const exam = getExamState(examName);
  for (const id of Object.keys(exam.questions)) {
    evaluateQuestion(exam.questions[id]);
  }
  exam.isSubmitted = true;
  exam.submitTime = Date.now();
}

export function resetExam(examName: string = 'default') {
  const exam = getExamState(examName);
  for (const id of Object.keys(exam.questions)) {
    const q = exam.questions[id];
    q.userSelections = [];
    q.userBlankAnswers = {};
    q.earnedScore = 0;
    q.isCorrect = false;
    q.isAnswered = false;
    q.evaluated = false;
  }
  exam.isSubmitted = false;
  exam.submitTime = undefined;
}

export function useExamStats(examName: string = 'default') {
  const exam = getExamState(examName);

  const totalScore = computed(() => {
    return Object.values(exam.questions).reduce(
      (sum, q) => sum + (Number(q.score) || 0),
      0
    );
  });

  const earnedScore = computed(() => {
    return Object.values(exam.questions).reduce(
      (sum, q) => sum + (Number(q.earnedScore) || 0),
      0
    );
  });

  const totalQuestions = computed(() => Object.keys(exam.questions).length);

  const answeredCount = computed(() => {
    return Object.values(exam.questions).filter((q) => q.isAnswered).length;
  });

  const correctCount = computed(() => {
    return Object.values(exam.questions).filter((q) => q.isCorrect).length;
  });

  const wrongCount = computed(() => {
    return Object.values(exam.questions).filter((q) => q.isAnswered && !q.isCorrect).length;
  });

  const unansweredCount = computed(() => {
    return Object.values(exam.questions).filter((q) => !q.isAnswered).length;
  });

  const accuracy = computed(() => {
    if (totalScore.value <= 0) return 0;
    return Math.round((earnedScore.value / totalScore.value) * 100);
  });

  return {
    exam,
    totalScore,
    earnedScore,
    totalQuestions,
    answeredCount,
    correctCount,
    wrongCount,
    unansweredCount,
    accuracy
  };
}
