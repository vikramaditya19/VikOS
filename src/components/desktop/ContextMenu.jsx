import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import AkatsukiCloud from '../brand/AkatsukiCloud'
import { sound } from '../../utils/sound'

const MARGIN = 8

// items: [{ id, label, icon, hint, onSelect, disabled }, { separator: true, id }]
export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ left: x, top: y })
  const [active, setActive] = useState(-1)

  // Keep the menu fully on screen (runs before paint, so there is no flicker)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const width = el.offsetWidth
    const height = el.offsetHeight
    setPos({
      left: Math.max(MARGIN, Math.min(x, window.innerWidth - width - MARGIN)),
      top: Math.max(MARGIN, Math.min(y, window.innerHeight - height - MARGIN)),
    })
  }, [x, y, items.length])

  const selectable = items.reduce((acc, item, i) => {
    if (!item.separator && !item.disabled) acc.push(i)
    return acc
  }, [])

  const run = (item) => {
    if (!item || item.separator || item.disabled) return
    item.onSelect?.()
    onClose()
  }

  // Keyboard: arrows move, Enter selects (Escape is handled by the layer)
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const dir = e.key === 'ArrowDown' ? 1 : -1
        const current = selectable.indexOf(active)
        const next =
          current === -1
            ? dir === 1
              ? 0
              : selectable.length - 1
            : (current + dir + selectable.length) % selectable.length
        setActive(selectable[next])
        sound.hover()
      } else if (e.key === 'Enter' && active >= 0) {
        e.preventDefault()
        run(items[active])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <motion.div
      ref={ref}
      role="menu"
      aria-label="Desktop menu"
      data-context-menu
      data-sound="off"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.1 } }}
      transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
      style={{ left: pos.left, top: pos.top, transformOrigin: 'top left' }}
      className="vik-window fixed z-[1500] w-60 py-1"
    >
      <div className="flex items-center gap-2 border-b border-white/[0.05] px-3 py-2">
        <AkatsukiCloud filled className="h-3 w-auto text-crimson-400" />
        <span className="vik-label">Desktop</span>
      </div>

      <div className="py-1">
        {items.map((item, i) => {
          if (item.separator) {
            return <div key={item.id} role="separator" className="my-1 h-px bg-white/[0.06]" />
          }
          const Icon = item.icon
          const isActive = i === active
          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseEnter={() => {
                if (!item.disabled && active !== i) {
                  setActive(i)
                  sound.hover()
                }
              }}
              onClick={() => run(item)}
              className={`relative flex w-full items-center gap-3 px-3 py-2 text-left text-[13px] outline-none transition-colors disabled:opacity-40 ${
                isActive ? 'bg-crimson-900/30 text-bone' : 'text-bone-dim'
              }`}
            >
              <span
                className={`absolute inset-y-1 left-0 w-px transition-colors ${
                  isActive ? 'bg-crimson-500' : 'bg-transparent'
                }`}
              />
              {Icon && (
                <Icon
                  size={15}
                  strokeWidth={1.6}
                  className={isActive ? 'text-crimson-300' : 'text-ash'}
                />
              )}
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint && (
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                  {item.hint}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </motion.div>
  )
}