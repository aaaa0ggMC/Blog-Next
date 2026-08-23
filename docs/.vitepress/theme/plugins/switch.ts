if (typeof window !== 'undefined') {
  window.checkSwitch = (
    tg: HTMLInputElement,
    onchek?: () => void,
    onuchek?: () => void,
  ): boolean => {
    if (tg.checked) {
      if (onchek) onchek()
    } else {
      if (onuchek) onuchek()
    }
    return tg.checked
  }
}