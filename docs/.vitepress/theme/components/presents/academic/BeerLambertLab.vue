<template>
  <div class="lab">
    <div class="lab-head">
      <span class="lab-tag">交互演示</span>
      <span class="lab-name">σ(s) → τ(s) → T(s)</span>
      <span class="lab-hint">拖动滑杆改变介质参数，鼠标在曲线上移动可读取累计值</span>
    </div>

    <!-- 介质密度 σ(s) -->
    <figure class="lab-figure">
      <figcaption>
        <b>σ(s)</b> 沿光线的密度分布
        <span class="lab-caption-sub">σ_base + σ_mist·e<sup>-k·s</sup></span>
      </figcaption>
      <svg class="lab-svg" :viewBox="`0 0 ${box.w} ${box.h}`" role="img"
           aria-label="沿光线的介质密度分布曲线">
        <rect class="lab-plot-bg" :x="box.padL" :y="box.padT"
              :width="box.w - box.padL - box.padR" :height="box.h - box.padT - box.padB" />
        <line v-for="g in 4" :key="'sg' + g" class="lab-grid"
              :x1="box.padL" :x2="box.w - box.padR"
              :y1="sy((sigmaMax * g) / 4)" :y2="sy((sigmaMax * g) / 4)" />
        <path class="lab-area-sigma" :d="sigmaArea" />
        <path class="lab-line lab-line-sigma" :d="sigmaPath" />
        <line class="lab-cursor" :x1="cursorX" :x2="cursorX" :y1="box.padT" :y2="box.h - box.padB" />
        <circle class="lab-dot lab-dot-sigma" :cx="cursorX" :cy="sy(densityNow, sigmaMax)" r="3.5" />
        <g class="lab-axis">
          <text :x="box.padL - 6" :y="box.padT + 9" text-anchor="end">{{ sigmaMax.toFixed(1) }}</text>
          <text :x="box.padL - 6" :y="box.h - box.padB" text-anchor="end">0</text>
          <text :x="box.padL" :y="box.h - 6">0</text>
          <text :x="sx(length)" :y="box.h - 6" text-anchor="end">{{ length.toFixed(1) }}</text>
          <text :x="(box.padL + box.w - box.padR) / 2" :y="box.h - 6" text-anchor="middle">沿光线距离 s</text>
        </g>
      </svg>
    </figure>

    <!-- 光学厚度 τ(s) 与透射率 T(s) -->
    <figure class="lab-figure">
      <figcaption>
        <b>τ(s)</b> 光学厚度（左轴）与 <b>T(s) = e<sup>-τ</sup></b>（右轴）
        <span class="lab-caption-sub">τ 单调累加，T 指数衰减</span>
      </figcaption>
      <svg class="lab-svg" :viewBox="`0 0 ${box.w} ${box.h}`" role="img"
           aria-label="光学厚度与透射率曲线">
        <rect class="lab-plot-bg" :x="box.padL" :y="box.padT"
              :width="box.w - box.padL - box.padR" :height="box.h - box.padT - box.padB" />
        <line v-for="g in 4" :key="'tg' + g" class="lab-grid"
              :x1="box.padL" :x2="box.w - box.padR"
              :y1="sy(g / 4)" :y2="sy(g / 4)" />
        <path class="lab-line lab-line-tau" :d="tauPath" />
        <path class="lab-line lab-line-t" :d="tPath" />
        <line class="lab-cursor" :x1="cursorX" :x2="cursorX" :y1="box.padT" :y2="box.h - box.padB" />
        <circle class="lab-dot lab-dot-tau" :cx="cursorX" :cy="sy(tauNow / tauMax)" r="3.5" />
        <circle class="lab-dot lab-dot-t" :cx="cursorX" :cy="sy(transNow)" r="3.5" />
        <g class="lab-axis">
          <text :x="box.padL - 6" :y="box.padT + 9" text-anchor="end">{{ tauMax.toFixed(1) }}</text>
          <text :x="box.padL - 6" :y="box.h - box.padB" text-anchor="end">0</text>
          <text :x="box.w - box.padR + 6" :y="box.padT + 9">1</text>
          <text :x="box.w - box.padR + 6" :y="box.h - box.padB">0</text>
          <text :x="box.padL" :y="box.h - 6">0</text>
          <text :x="sx(length)" :y="box.h - 6" text-anchor="end">{{ length.toFixed(1) }}</text>
        </g>
      </svg>
    </figure>

    <div class="lab-controls">
      <label class="lab-field">
        <span>σ_base <em>{{ fmt(sigmaBase, 2) }}</em></span>
        <input v-model.number="sigmaBase" type="range" min="0" max="2" step="0.02" />
      </label>
      <label class="lab-field">
        <span>σ_mist <em>{{ fmt(sigmaMist, 2) }}</em></span>
        <input v-model.number="sigmaMist" type="range" min="0" max="4" step="0.05" />
      </label>
      <label class="lab-field">
        <span>k <em>{{ fmt(k, 2) }}</em></span>
        <input v-model.number="k" type="range" min="0.05" max="6" step="0.05" />
      </label>
      <label class="lab-field">
        <span>光线长度 L <em>{{ fmt(length, 2) }}</em></span>
        <input v-model.number="length" type="range" min="0.5" max="4" step="0.1" />
      </label>
      <label class="lab-field">
        <span>采样点 s <em>{{ fmt(s0, 2) }}</em></span>
        <input v-model.number="s0" type="range" :min="0" :max="length" :step="length / 200" />
      </label>
    </div>

    <div class="lab-readout">
      <div class="lab-cell">
        <span class="lab-cell-label">σ(s₀)</span>
        <span class="lab-cell-value">{{ fmt(densityNow) }}</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">τ(s₀) = ∫₀ˢσ dx</span>
        <span class="lab-cell-value lab-v-tau">{{ fmt(tauNow) }}</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">T(s₀) = e<sup>-τ</sup></span>
        <span class="lab-cell-value lab-v-t">{{ (transNow * 100).toFixed(1) }}%</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">已被吸收</span>
        <span class="lab-cell-value">{{ ((1 - transNow) * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <p class="lab-note">
      解析式：τ(s) = σ_base·s + (σ_mist/k)·(1 − e<sup>−k·s</sup>)，
      当前 s₀ 处 τ = {{ fmt(tauNow) }}，与采样式积分的结果 {{ fmt(tauNumericNow) }} 一致。
      把 σ_mist 调成 0 就退化成均匀介质：τ 变成一条直线，T 变成标准的单指数衰减。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DEFAULT_BOX as box,
  densityAt,
  fmt,
  polyline,
  sample,
  sx,
  sy,
  tauAt,
  tauNumeric,
  transmittanceAt,
} from './medium'

const sigmaBase = ref(0.15)
const sigmaMist = ref(1.4)
const k = ref(1.8)
const length = ref(2)
const s0 = ref(1)

const params = computed(() => ({
  sigmaBase: sigmaBase.value,
  sigmaMist: sigmaMist.value,
  k: k.value,
}))

const sigmaMax = computed(() => Math.max(densityAt(0, params.value), 0.001) * 1.08)
const tauMax = computed(() => Math.max(tauAt(length.value, params.value), 0.001) * 1.05)

const sigmaPoints = computed(() => sample((s) => densityAt(s, params.value), 0, length.value))
const tauPoints = computed(() => sample((s) => tauAt(s, params.value), 0, length.value))
const tPoints = computed(() => sample((s) => transmittanceAt(s, params.value), 0, length.value))

const sigmaPath = computed(() => polyline(sigmaPoints.value, length.value, sigmaMax.value))
const sigmaArea = computed(
  () => `${sigmaPath.value} L${sx(length.value)},${sy(0, sigmaMax.value)} L${sx(0)},${sy(0, sigmaMax.value)} Z`,
)
const tauPath = computed(() =>
  polyline(
    tauPoints.value.map(([x, y]) => [x, y] as [number, number]),
    length.value,
    tauMax.value,
  ),
)
const tPath = computed(() => polyline(tPoints.value, length.value, 1))

const cursorX = computed(() => sx(Math.min(s0.value, length.value), length.value))
const densityNow = computed(() => densityAt(s0.value, params.value))
const tauNow = computed(() => tauAt(s0.value, params.value))
const transNow = computed(() => Math.exp(-tauAt(s0.value, params.value)))
const tauNumericNow = computed(() => tauNumeric(s0.value, params.value, 512))
</script>

<style scoped>
.lab {
  margin: 18px 0;
  padding: 14px 16px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.lab-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.lab-tag {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--vp-c-brand-1, var(--vp-c-brand));
  background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.14));
}

.lab-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
}

.lab-hint {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.lab-figure {
  margin: 0 0 10px;
}

.lab-figure figcaption {
  font-size: 12.5px;
  color: var(--vp-c-text-2);
  margin-bottom: 2px;
}

.lab-caption-sub {
  margin-left: 8px;
  color: var(--vp-c-text-3);
  font-size: 11.5px;
}

.lab-svg {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.lab-plot-bg {
  fill: var(--vp-c-bg);
  stroke: var(--vp-c-divider);
  stroke-width: 1;
}

.lab-grid {
  stroke: var(--vp-c-divider);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  opacity: 0.7;
}

.lab-axis text {
  font-size: 9px;
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.lab-area-sigma {
  fill: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.16));
  stroke: none;
}

.lab-line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
}

.lab-line-sigma {
  stroke: var(--vp-c-brand-1, var(--vp-c-brand));
}

.lab-line-tau {
  stroke: #d97706;
}

.lab-line-t {
  stroke: #0ea5e9;
}

.lab-cursor {
  stroke: var(--vp-c-text-3);
  stroke-width: 1;
  stroke-dasharray: 4 3;
}

.lab-dot-sigma {
  fill: var(--vp-c-brand-1, var(--vp-c-brand));
}

.lab-dot-tau {
  fill: #d97706;
}

.lab-dot-t {
  fill: #0ea5e9;
}

.lab-controls {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 6px 16px;
  margin: 10px 0 12px;
}

.lab-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--vp-c-text-2);
}

.lab-field em {
  font-style: normal;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.lab-field input[type='range'] {
  width: 100%;
  height: 4px;
  margin: 6px 0;
  appearance: none;
  border-radius: 999px;
  background: var(--vp-c-divider);
  cursor: pointer;
}

.lab-field input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--vp-c-brand-1, var(--vp-c-brand));
  border: 2px solid var(--vp-c-bg);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.lab-field input[type='range']::-moz-range-thumb {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--vp-c-brand-1, var(--vp-c-brand));
  border: 2px solid var(--vp-c-bg);
}

.lab-readout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.lab-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
}

.lab-cell-label {
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.lab-cell-value {
  font-size: 15px;
  font-weight: 600;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-1);
}

.lab-v-tau {
  color: #d97706;
}

.lab-v-t {
  color: #0ea5e9;
}

.lab-note {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}
</style>
