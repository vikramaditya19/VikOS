import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Wallpaper from './components/desktop/Wallpaper'
import DesktopIcons from './components/desktop/DesktopIcons'
import DesktopContextLayer from './components/desktop/DesktopContextLayer'
import Taskbar from './components/desktop/Taskbar'
import Launcher from './components/desktop/Launcher'
import AppWindow from './components/desktop/AppWindow'
import BootScreen from './components/boot/BootScreen'
import { getApp } from './apps/registry'

// Starting window size per app (shrunk automatically on small screens)
const DEFAULT_SIZES = {
  files: { w: 780, h: 480 },
  terminal: { w: 700, h: 420 },
  monitor: { w: 600, h: 470 },
}
const FALLBACK_SIZE = { w: 560, h: 380 }

export default function App() {
  const workspaceRef = useRef(null)
  const zRef = useRef(10) // ever-increasing counter used for window stacking
  const slotRef = useRef(0) // cascades new windows so they don't overlap exactly

  const [booting, setBooting] = useState(true)
  const [launcherOpen, setLauncherOpen] = useState(false)
  // [{ appId, z, x, y, w, h, minimized, maximized }]
  const [windows, setWindows] = useState([])

  const finishBoot = useCallback(() => setBooting(false), [])
  const closeLauncher = useCallback(() => setLauncherOpen(false), [])
  const toggleLauncher = useCallback(() => setLauncherOpen((open) => !open), [])

  const updateWindow = useCallback((appId, patch) => {
    setWindows((ws) => ws.map((w) => (w.appId === appId ? { ...w, ...patch } : w)))
  }, [])

  const focusApp = useCallback(
    (appId) => {
      updateWindow(appId, { z: ++zRef.current, minimized: false })
    },
    [updateWindow],
  )

  const openApp = useCallback((appId) => {
    const z = ++zRef.current
    const slot = slotRef.current++ % 6
    setLauncherOpen(false)

    const box = workspaceRef.current?.getBoundingClientRect()
    const bw = box?.width ?? 1200
    const bh = box?.height ?? 700

    setWindows((ws) => {
      // One window per app: if it's already open, restore it and bring it to the front
      if (ws.some((w) => w.appId === appId)) {
        return ws.map((w) => (w.appId === appId ? { ...w, z, minimized: false } : w))
      }
      const size = DEFAULT_SIZES[appId] ?? FALLBACK_SIZE
      const w = Math.max(320, Math.min(size.w, bw - 24))
      const h = Math.max(220, Math.min(size.h, bh - 24))
      const x = Math.max(8, Math.min(120 + slot * 32, bw - w - 8))
      const y = Math.max(8, Math.min(24 + slot * 32, bh - h - 8))
      return [...ws, { appId, z, x, y, w, h, minimized: false, maximized: false }]
    })
  }, [])

  const closeApp = useCallback((appId) => {
    setWindows((ws) => ws.filter((w) => w.appId !== appId))
  }, [])

  const minimizeApp = useCallback(
    (appId) => updateWindow(appId, { minimized: true }),
    [updateWindow],
  )

  const toggleMaximize = useCallback((appId) => {
    const z = ++zRef.current
    setWindows((ws) => ws.map((w) => (w.appId === appId ? { ...w, maximized: !w.maximized, z } : w)))
  }, [])

  const restart = useCallback(() => {
    setLauncherOpen(false)
    setWindows([])
    setBooting(true)
  }, [])

  // The active window is the visible one with the highest z
  const visible = windows.filter((w) => !w.minimized)
  const activeAppId = visible.length ? visible.reduce((top, w) => (w.z > top.z ? w : top)).appId : null

  // Taskbar button: minimized -> restore, in front -> minimize, behind -> bring forward
  const onTaskbarClick = (appId) => {
    const win = windows.find((w) => w.appId === appId)
    if (!win) return
    if (win.minimized) focusApp(appId)
    else if (appId === activeAppId) minimizeApp(appId)
    else focusApp(appId)
  }

  // Keep windows reachable if the browser window shrinks
  useEffect(() => {
    const onResize = () => {
      const box = workspaceRef.current?.getBoundingClientRect()
      if (!box) return
      setWindows((ws) =>
        ws.map((w) => ({
          ...w,
          x: Math.max(120 - w.w, Math.min(w.x, box.width - 120)),
          y: Math.max(0, Math.min(w.y, box.height - 40)),
        })),
      )
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <main className="relative h-full w-full overflow-hidden bg-obsidian-950">
      <Wallpaper />
      <DesktopContextLayer onOpenApp={openApp} />

      {/* Workspace: everything above the taskbar. z-[10] makes it one stacking layer,
          so window z-indexes can grow forever without ever covering the taskbar. */}
      <div ref={workspaceRef} className="absolute inset-x-0 bottom-12 top-0 z-[10]">
        <DesktopIcons onOpenApp={openApp} />

        <AnimatePresence>
          {windows.map((w) => (
            <AppWindow
              key={w.appId}
              app={getApp(w.appId)}
              win={w}
              isActive={w.appId === activeAppId}
              workspaceRef={workspaceRef}
              onFocus={() => focusApp(w.appId)}
              onUpdate={(patch) => updateWindow(w.appId, patch)}
              onClose={() => closeApp(w.appId)}
              onMinimize={() => minimizeApp(w.appId)}
              onToggleMaximize={() => toggleMaximize(w.appId)}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {launcherOpen && (
          <Launcher key="launcher" onOpenApp={openApp} onRestart={restart} onClose={closeLauncher} />
        )}
      </AnimatePresence>

      <Taskbar
        launcherOpen={launcherOpen}
        onToggleLauncher={toggleLauncher}
        windows={windows}
        activeAppId={activeAppId}
        onTaskbarClick={onTaskbarClick}
      />

      <AnimatePresence>{booting && <BootScreen key="boot" onDone={finishBoot} />}</AnimatePresence>
    </main>
  )
}