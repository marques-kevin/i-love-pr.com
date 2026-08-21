export function close_daisy_dropdown(node: EventTarget | null): void {
  if (!(node instanceof HTMLElement)) return
  const root = node.closest('.dropdown')
  if (!(root instanceof HTMLElement)) return
  const focused = root.querySelector<HTMLElement>(':focus')
  focused?.blur()
}
