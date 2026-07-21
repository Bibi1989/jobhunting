/**
 * In-memory undo stack for AI mutations (enhance, draft, translate, ATS fix, rewrites).
 * Each page should call useAiUndo() once so stacks stay scoped to that editor.
 */
export type AiUndoEntry = {
  scope: string
  label: string
  restore: () => void
}

export function useAiUndo(maxEntries = 30) {
  const stack = ref<AiUndoEntry[]>([])

  const canUndo = computed(() => stack.value.length > 0)
  const lastLabel = computed(() => stack.value.at(-1)?.label ?? 'Undo AI change')

  function push(scope: string, label: string, restore: () => void) {
    stack.value = [...stack.value, { scope, label, restore }].slice(-maxEntries)
  }

  function canUndoScope(scope: string) {
    return stack.value.some((entry) => entry.scope === scope)
  }

  /** Undo the most recent AI change (any scope). */
  function undo(): AiUndoEntry | null {
    if (!stack.value.length) return null
    const entry = stack.value[stack.value.length - 1]!
    stack.value = stack.value.slice(0, -1)
    entry.restore()
    return entry
  }

  /** Undo the most recent change for a specific field/scope. */
  function undoScope(scope: string): AiUndoEntry | null {
    for (let i = stack.value.length - 1; i >= 0; i--) {
      if (stack.value[i]!.scope === scope) {
        const entry = stack.value[i]!
        stack.value = [...stack.value.slice(0, i), ...stack.value.slice(i + 1)]
        entry.restore()
        return entry
      }
    }
    return null
  }

  function clear() {
    stack.value = []
  }

  return {
    canUndo,
    lastLabel,
    push,
    undo,
    undoScope,
    canUndoScope,
    clear,
  }
}

/** Deep-clone JSON-serializable editor state for full-document undo. */
export function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
