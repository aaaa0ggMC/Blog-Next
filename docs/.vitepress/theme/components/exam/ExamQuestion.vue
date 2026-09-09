<template>
  <Exam
    :score="score !== undefined ? score : 1"
    :answer="answer"
    :type="type"
    :title="title"
    :id="id"
  >
    <slot />
  </Exam>
</template>

<script setup lang="ts">
import Exam from './Exam.vue';
import type { QuestionType } from './types';

defineProps<{
  score?: number | string;
  answer?: string | string[];
  type?: QuestionType;
  title?: string;
  id?: string;
}>();
</script>
