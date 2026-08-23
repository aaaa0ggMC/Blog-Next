import { reactive } from 'vue'

export interface ViewerState {
  visible: boolean
  src: string
  title: string
}

export const viewerState = reactive<ViewerState>({
  visible: false,
  src: '',
  title: '',
})

export function openViewer(src: string, title = ''): void {
  viewerState.src = src
  viewerState.title = title
  viewerState.visible = true
}

export function closeViewer(): void {
  viewerState.visible = false
}
