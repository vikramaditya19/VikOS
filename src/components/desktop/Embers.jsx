import { useEffect, useRef } from 'react'

export default function Embers({ count = 40 }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let width = 0
    let height = 0
    let frame = 0
    let embers = []

    const spawn = (anywhere) => ({
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : height + 12,
      radius: 0.6 + Math.random() * 1.5,
      speed: 0.12 + Math.random() * 0.32,
      sway: Math.random() * Math.PI * 2,
      alpha: 0.2 + Math.random() * 0.5,
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      for (const e of embers) {
        // Fade out as they rise toward the top of the screen
        const fade = Math.max(0, Math.min(1, e.y / (height * 0.35)))
        const a = e.alpha * fade

        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius * 4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(196,18,47,${a * 0.12})`
        ctx.fill()

        ctx.beginPath()
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,107,130,${a})`
        ctx.fill()
      }
    }

    const tick = () => {
      for (const e of embers) {
        e.y -= e.speed
        e.sway += 0.015
        e.x += Math.sin(e.sway) * 0.25
        if (e.y < -10) Object.assign(e, spawn(false))
      }
      draw()
      frame = requestAnimationFrame(tick)
    }

    const onResize = () => {
      resize()
      draw()
    }

    resize()
    embers = Array.from({ length: count }, () => spawn(true))
    draw()
    if (!reduceMotion) frame = requestAnimationFrame(tick)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
    />
  )
}