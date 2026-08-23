/**
 * VitePress Markdown 自定义容器扩展插件
 * 支持 ::: ps, ::: leave, ::: ins, ::: hl, ::: np 等语法糖
 */

export function registerMarkdownContainers(md: any) {
  const containerTypes = ['ps', 'leave', 'ins', 'hl', 'np']

  md.block.ruler.before('fence', 'custom_style_container', (state: any, startLine: number, endLine: number, silent: boolean) => {
    const start = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]
    const lineText = state.src.slice(start, max).trim()

    const match = lineText.match(/^:::\s*(\w+)(?:\s+(.*))?$/)
    if (!match) return false

    const type = match[1]
    if (!containerTypes.includes(type)) return false

    if (silent) return true

    const extraClass = match[2] ? match[2].trim() : ''

    let nextLine = startLine + 1
    let foundEnd = false

    while (nextLine < endLine) {
      const nextStart = state.bMarks[nextLine] + state.tShift[nextLine]
      const nextMax = state.eMarks[nextLine]
      const nextText = state.src.slice(nextStart, nextMax).trim()

      if (nextText === ':::') {
        foundEnd = true
        break
      }
      nextLine++
    }

    const oldParentType = state.parentType
    state.parentType = 'container'

    const tokenOpen = state.push('custom_container_open', 'div', 1)
    tokenOpen.attrs = [['class', `${type}${extraClass ? ' ' + extraClass : ''}`]]
    tokenOpen.block = true
    tokenOpen.map = [startLine, nextLine]

    state.md.block.tokenize(state, startLine + 1, nextLine)

    const tokenClose = state.push('custom_container_close', 'div', -1)
    tokenClose.block = true

    state.parentType = oldParentType
    state.line = foundEnd ? nextLine + 1 : nextLine
    return true
  })
}
