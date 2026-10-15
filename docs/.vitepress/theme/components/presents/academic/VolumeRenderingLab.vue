<template>
  <div class="lab">
    <div class="lab-head">
      <span class="lab-tag">交互演示</span>
      <span class="lab-name">I = ∫ C(t)·T(t)·σ(t) dt</span>
      <span class="lab-hint">沿光线步进累加，观察步长对结果的影响</span>
    </div>

    <!-- 透射率与介质自发光 -->
    <figure class="lab-figure">
      <figcaption>
        <b>T(t)</b> 透射率与 <b>C(t)</b> 介质自发光（已归一化）
        <span class="lab-caption-sub">T 从前端向后端指数衰减</span>
      </figcaption>
      <svg class="lab-svg" :viewBox="`0 0 ${box.w} ${box.h}`" role="img"
           aria-label="透射率与自发光分布曲线">
        <rect class="lab-plot-bg" :x="box.padL" :y="box.padT"
              :width="box.w - box.padL - box.padR" :height="box.h - box.padT - box.padB" />
        <line v-for="g in 4" :key="'g1' + g" class="lab-grid"
              :x1="box.padL" :x2="box.w - box.padR"
              :y1="sy(g / 4)" :y2="sy(g / 4)" />
        <line v-for="(b, i) in stepBoundaries" :key="'sb' + i" class="lab-step-line"
              :x1="b" :x2="b" :y1="box.padT" :y2="box.h - box.padB" />
        <path class="lab-line lab-line-t" :d="tPath" />
        <path class="lab-line lab-line-c" :d="cPath" />
        <g class="lab-axis">
          <text :x="box.padL" :y="box.h - 6">0</text>
          <text :x="sx(L)" :y="box.h - 6" text-anchor="end">{{ L.toFixed(1) }}</text>
          <text :x="(box.padL + box.w - box.padR) / 2" :y="box.h - 6" text-anchor="middle">沿光线距离 t</text>
        </g>
      </svg>
    </figure>

    <!-- 被积函数与矩形近似 -->
    <figure class="lab-figure">
      <figcaption>
        <b>f(t) = C(t)·T(t)·σ(t)</b> 被积函数与每一小步的贡献
        <span class="lab-caption-sub">竖条 = f(t_mid)·Δt，累加即为 I</span>
      </figcaption>
      <svg class="lab-svg" :viewBox="`0 0 ${box.w} ${box.h}`" role="img"
           aria-label="被积函数与逐步累加柱状图">
        <rect class="lab-plot-bg" :x="box.padL" :y="box.padT"
              :width="box.w - box.padL - box.padR" :height="box.h - box.padT - box.padB" />
        <line v-for="g in 4" :key="'g2' + g" class="lab-grid"
              :x1="box.padL" :x2="box.w - box.padR"
              :y1="sy((fMax * g) / 4)" :y2="sy((fMax * g) / 4)" />
        <rect v-for="(bar, i) in bars" :key="'bar' + i" class="lab-bar"
              :x="bar.x" :y="bar.y" :width="bar.w" :height="bar.h" />
        <line class="lab-ref-line" :x1="box.padL" :x2="box.w - box.padR" :y1="refY" :y2="refY" />
        <path class="lab-line lab-line-f" :d="fPath" />
        <path class="lab-line lab-line-sum" :d="sumPath" />
        <g class="lab-axis">
          <text :x="box.padL - 6" :y="box.padT + 9" text-anchor="end">{{ fmt(fMax, 2) }}</text>
          <text :x="box.padL - 6" :y="box.h - box.padB" text-anchor="end">0</text>
          <text :x="box.padL" :y="box.h - 6">0</text>
          <text :x="sx(L)" :y="box.h - 6" text-anchor="end">{{ L.toFixed(1) }}</text>
          <text :x="(box.padL + box.w - box.padR) / 2" :y="box.h - 6" text-anchor="middle">沿光线距离 t</text>
        </g>
      </svg>
      <ul class="lab-legend">
        <li><i class="sw sw-f"></i>f(t) 精确被积函数</li>
        <li><i class="sw sw-bar"></i>每步贡献（中点矩形）</li>
        <li><i class="sw sw-sum"></i>累加量（阶梯，终点即当前结果）</li>
        <li><i class="sw sw-ref"></i>参考值（细步长）</li>
      </ul>
    </figure>

    <div class="lab-controls">
      <label class="lab-field">
        <span>σ 密度 <em>{{ fmt(sigma, 2) }}</em></span>
        <input v-model.number="sigma" type="range" min="0.1" max="4" step="0.05" />
      </label>
      <label class="lab-field">
        <span>C₀ 自发光 <em>{{ fmt(emission, 2) }}</em></span>
        <input v-model.number="emission" type="range" min="0.1" max="1.5" step="0.05" />
      </label>
      <label class="lab-field">
        <span>自发光调制 a <em>{{ fmt(modAmp, 2) }}</em></span>
        <input v-model.number="modAmp" type="range" min="0" max="1" step="0.02" />
      </label>
      <label class="lab-field">
        <span>调制频率 f <em>{{ fmt(modFreq, 2) }}</em></span>
        <input v-model.number="modFreq" type="range" min="0.25" max="4" step="0.25" />
      </label>
      <label class="lab-field">
        <span>光线长度 L <em>{{ fmt(L, 2) }}</em></span>
        <input v-model.number="L" type="range" min="0.5" max="4" step="0.1" />
      </label>
      <label class="lab-field">
        <span>步数 N <em>{{ N }}</em></span>
        <input v-model.number="N" type="range" min="1" max="64" step="1" />
      </label>
    </div>

    <div class="lab-readout">
      <div class="lab-cell">
        <span class="lab-cell-label">τ(L)</span>
        <span class="lab-cell-value">{{ fmt(tauTotal) }}</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">参考值（细步长）</span>
        <span class="lab-cell-value">{{ fmt(refI) }}</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">N = {{ N }} 步累加</span>
        <span class="lab-cell-value lab-v-sum">{{ fmt(stepI) }}</span>
      </div>
      <div class="lab-cell">
        <span class="lab-cell-label">相对误差</span>
        <span class="lab-cell-value" :class="errClass">{{ errText }}</span>
      </div>
    </div>

    <p class="lab-note">
      自发光不随位置变化（a = 0）且密度均匀时，积分有闭式解 I = C₀·(1 − e<sup>−σ·L</sup>)，
      在当前 σ、C₀、L 下等于 {{ fmt(uniformClosed) }}；把 a 调大让 C(t) 起伏，
      被积函数变得不平滑，就能明显看到步数不足带来的误差。步数只影响精度，不改变物理结果。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEFAULT_BOX as box, fmt, polyline, sample, sx, sy } from './medium'

const sigma = ref(2)
const emission = ref(1)
const modAmp = ref(0.7)
const modFreq = ref(2)
const L = ref(2)
const N = ref(6)

/** 介质自发光沿着光线的分布（带正弦调制，用来制造非平凡的被积函数） */
function emissionAt(t: number): number {
  return emission.value * (1 + modAmp.value * Math.sin((2 * Math.PI * modFreq.value * t) / Math.max(L.value, 1e-6)))
}

/** 透射率 T(t) = e^(-σt)：只考虑均匀吸收 */
function transmittanceAt(t: number): number {
  return Math.exp(-sigma.value * t)
}

/** 被积函数 f(t) = C(t)·T(t)·σ(t) */
function integrandAt(t: number): number {
  return emissionAt(t) * transmittanceAt(t) * sigma.value
}

const tauTotal = computed(() => sigma.value * L.value)
const uniformClosed = computed(() => emission.value * (1 - Math.exp(-sigma.value * L.value)))

/** 中点法累加，返回每一步的贡献（位移乘区间长度） */
function stepContributions(steps: number): number[] {
  const dt = L.value / steps
  const out: number[] = []
  for (let i = 0; i < steps; i++) {
    out.push(integrandAt((i + 0.5) * dt) * dt)
  }
  return out
}

const refI = computed(() => {
  const contributions = stepContributions(4000)
  return contributions.reduce((a, b) => a + b, 0)
})

const contributions = computed(() => stepContributions(Math.max(1, Math.round(N.value))))
const stepI = computed(() => contributions.value.reduce((a, b) => a + b, 0))
const relError = computed(() => {
  const ref = refI.value
  return ref > 1e-9 ? Math.abs(stepI.value - ref) / ref : 0
})
const errText = computed(() => `${(relError.value * 100).toFixed(2)}%`)
const errClass = computed(() => (relError.value < 0.005 ? 'lab-ok' : relError.value < 0.03 ? 'lab-warn' : 'lab-bad'))

const tPath = computed(() => polyline(sample(transmittanceAt, 0, L.value), L.value, 1))
const cMax = computed(() => Math.max(...sample(emissionAt, 0, L.value, 64).map(([, y]) => y), 1e-6))
const cPath = computed(() => polyline(sample(emissionAt, 0, L.value), L.value, cMax.value))

const fMax = computed(() => {
  const peak = Math.max(...sample(integrandAt, 0, L.value, 200).map(([, y]) => y), 1e-6)
  return Math.max(peak, refI.value) * 1.12
})
const fPath = computed(() => polyline(sample(integrandAt, 0, L.value, 240), L.value, fMax.value))
const refY = computed(() => sy(refI.value, fMax.value))

/** 每一步的竖条（中点矩形） */
const bars = computed(() =>
  contributions.value.map((value, i) => {
    const dt = L.value / contributions.value.length
    const x0 = sx(i * dt, L.value)
    const x1 = sx((i + 1) * dt, L.value)
    const y = sy(value / dt, fMax.value)
    return { x: x0, y, w: Math.max(x1 - x0 - 1, 0.5), h: Math.max(sy(0, fMax.value) - y, 0) }
  }),
)

/** 累加量曲线：从相机出发（t=0）逐步累加，末端即当前数值结果 */
const sumPath = computed(() => {
  const n = contributions.value.length
  const dt = L.value / n
  const pts: Array<[number, number]> = [[0, 0]]
  let acc = 0
  for (let i = 0; i < n; i++) {
    acc += contributions.value[i]
    pts.push([i * dt, acc])
    pts.push([(i + 1) * dt, acc])
  }
  return polyline(pts, L.value, fMax.value)
})

/** 每步边界在横轴上的位置 */
const stepBoundaries = computed(() => {
  const n = Math.round(N.value)
  const out: number[] = []
  if (n > 40) return out
  for (let i = 1; i < n; i++) {
    out.push(sx((i * L.value) / n, L.value))
  }
  return out
})
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

.lab-step-line {
  stroke: var(--vp-c-text-3);
  stroke-width: 1;
  stroke-dasharray: 2 3;
  opacity: 0.5;
}

.lab-axis text {
  font-size: 9px;
  fill: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
}

.lab-line {
  fill: none;
  stroke-width: 2;
  stroke-linejoin: round;
}

.lab-line-t {
  stroke: #0ea5e9;
}

.lab-line-c {
  stroke: #a855f7;
  stroke-dasharray: 5 3;
}

.lab-line-f {
  stroke: #d97706;
}

.lab-line-sum {
  stroke: #10b981;
  stroke-width: 1.6;
}

.lab-ref-line {
  stroke: #10b981;
  stroke-width: 1.2;
  stroke-dasharray: 5 4;
  opacity: 0.85;
}

.lab-bar {
  fill: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.35));
  stroke: var(--vp-c-brand-1, var(--vp-c-brand));
  stroke-width: 0.8;
}

.lab-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}

.lab-legend li {
  display: flex;
  align-items: center;
  gap: 5px;
}

.sw {
  width: 14px;
  height: 3px;
  border-radius: 2px;
  display: inline-block;
}

.sw-f {
  background: #d97706;
}

.sw-bar {
  background: var(--vp-c-brand-1, var(--vp-c-brand));
  height: 8px;
}

.sw-sum {
  background: #10b981;
}

.sw-ref {
  height: 2px;
  background: repeating-linear-gradient(90deg, #10b981 0 5px, transparent 5px 9px);
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

.lab-v-sum {
  color: #10b981;
}

.lab-ok {
  color: #10b981;
}

.lab-warn {
  color: #d97706;
}

.lab-bad {
  color: #e5484d;
}

.lab-note {
  margin: 12px 0 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}
</style>
