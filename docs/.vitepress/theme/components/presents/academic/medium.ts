/**
 * presents/academic 演示组件共用的数学与绘图小工具
 *
 * 演示用的 1D 介质模型（沿光线方向的参数化）：
 *   σ(s) = σ_base + σ_mist · e^(-k·s)
 * 它的光学厚度可以解析积分：
 *   τ(s) = ∫₀ˢ σ(x)dx = σ_base·s + (σ_mist / k)·(1 - e^(-k·s))
 *   T(s) = e^(-τ(s))
 */

export interface MediumParams {
  /** 全局基础浓度 σ_base */
  sigmaBase: number
  /** 沿光线额外叠加的雾气浓度 σ_mist */
  sigmaMist: number
  /** 衰减速度 k，越大越集中在光线前端 */
  k: number
}

export function densityAt(s: number, p: MediumParams): number {
  return p.sigmaBase + p.sigmaMist * Math.exp(-p.k * Math.max(s, 0))
}

export function tauAt(s: number, p: MediumParams): number {
  if (s <= 0) return 0
  if (p.k < 1e-6) return (p.sigmaBase + p.sigmaMist) * s
  return p.sigmaBase * s + (p.sigmaMist / p.k) * (1 - Math.exp(-p.k * s))
}

export function transmittanceAt(s: number, p: MediumParams): number {
  return Math.exp(-tauAt(s, p))
}

/** 采样式积分（中点法），用于和解析解对照 */
export function tauNumeric(t: number, p: MediumParams, steps = 512): number {
  const ds = t / steps
  let acc = 0
  for (let i = 0; i < steps; i++) {
    acc += densityAt((i + 0.5) * ds, p) * ds
  }
  return acc
}

export interface PlotBox {
  w: number
  h: number
  padL: number
  padR: number
  padT: number
  padB: number
}

export const DEFAULT_BOX: PlotBox = { w: 480, h: 150, padL: 36, padR: 12, padT: 14, padB: 24 }

export function sx(x: number, xMax: number, b: PlotBox = DEFAULT_BOX): number {
  return b.padL + (x / (xMax || 1)) * (b.w - b.padL - b.padR)
}

export function sy(y: number, yMax: number, b: PlotBox = DEFAULT_BOX): number {
  return b.padT + (1 - y / (yMax || 1)) * (b.h - b.padT - b.padB)
}

/** 数据点序列 -> SVG path 的 d 属性 */
export function polyline(
  points: Array<[number, number]>,
  xMax: number,
  yMax: number,
  b: PlotBox = DEFAULT_BOX,
): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${sx(x, xMax, b).toFixed(2)},${sy(y, yMax, b).toFixed(2)}`)
    .join(' ')
}

/** 采样一条曲线 */
export function sample(
  f: (t: number) => number,
  t0: number,
  t1: number,
  count = 160,
): Array<[number, number]> {
  const out: Array<[number, number]> = []
  for (let i = 0; i <= count; i++) {
    const t = t0 + ((t1 - t0) * i) / count
    out.push([t, f(t)])
  }
  return out
}

export function fmt(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return '—'
  if (Math.abs(v) >= 1000) return v.toFixed(0)
  return v.toFixed(digits)
}
