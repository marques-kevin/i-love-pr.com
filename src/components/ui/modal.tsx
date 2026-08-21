import { useEffect, useRef, type ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Modal({
  open,
  on_close,
  children,
  box_className,
  hide_close = false,
  placement,
}: {
  open: boolean
  on_close: () => void
  children: ReactNode
  box_className?: string
  hide_close?: boolean
  placement?: 'end'
}) {
  const dialog_ref = useRef<HTMLDialogElement>(null)
  const open_ref = useRef(open)
  open_ref.current = open

  useEffect(() => {
    const dialog = dialog_ref.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialog_ref}
      className={cn('modal', placement === 'end' && 'modal-end')}
      onClose={() => {
        if (open_ref.current) on_close()
      }}
      onCancel={(event) => {
        event.preventDefault()
        on_close()
      }}
    >
      <div className={cn('modal-box', box_className)}>
        {hide_close ? null : (
          <form method="dialog">
            <button
              type="submit"
              className="btn btn-ghost btn-circle btn-sm absolute top-2 right-2"
              aria-label="Close"
            >
              <XIcon className="size-4" />
            </button>
          </form>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  )
}
