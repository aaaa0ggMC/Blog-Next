import type { InjectionKey } from 'vue'

export type PeriodRole = 'center' | 'left' | 'right' | 'hidden'

export interface PeriodsState {
  active: number
  nextKey: number
  go: (delta: number) => void
}

export const PeriodsKey: InjectionKey<PeriodsState> = Symbol('periods')
