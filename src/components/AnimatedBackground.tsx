'use client'

import { useEffect, useRef } from 'react'

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W: number, H: number
    let animId: number

    type Star = { x: number; y: number; r: number; a: number; da: number; vx: number; vy: number; color: string }
    type Nebula = { x: number; y: number; r: number; a: number; da: number; vx: number; vy: number; hue: number }
    type Shooter = { x: number; y: number; len: number; speed: number; angle: number; alpha: number; done: boolean }

    let stars: Star[] = []
    let nebulas: Nebula[] = []
    let shooters: Shooter[] = []

    function resize() {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      initStars()
      initNebulas()
    }

    function initStars() {
      stars = []
      const count = Math.floor((W * H) / 6000)
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 1.4 + 0.2,
          a: Math.random(),
          da: (Math.random() - 0.5) * 0.006,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
          color: Math.random() < 0.3 ? '#c084fc' : Math.random() < 0.5 ? '#34d399' : '#f1f5f9',
        })
      }
    }

    function initNebulas() {
      nebulas = []
      for (let i = 0; i < 6; i++) {
        nebulas.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: Math.random() * 160 + 80,
          a: Math.random() * 0.04 + 0.02,
          da: (Math.random() - 0.5) * 0.0004,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          hue: Math.random() < 0.5 ? 265 : Math.random() < 0.5 ? 160 : 200,
        })
      }
    }

    function maybeShoot() {
      if (Math.random() < 0.004) {
        shooters.push({
          x: Math.random() * W * 0.6,
          y: Math.random() * H * 0.4,
          len: Math.random() * 200 + 80,
          speed: Math.random() * 8 + 6,
          angle: Math.PI * 0.18 + Math.random() * 0.2,
          alpha: 1,
          done: false,
        })
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H)

      // Nebulas
      nebulas.forEach(n => {
        n.x += n.vx; n.y += n.vy
        n.a += n.da
        n.a = Math.max(0.01, Math.min(0.06, n.a))
        if (n.x < -n.r) n.x = W + n.r
        if (n.x > W + n.r) n.x = -n.r
        if (n.y < -n.r) n.y = H + n.r
        if (n.y > H + n.r) n.y = -n.r
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, `hsla(${n.hue},80%,65%,${n.a})`)
        g.addColorStop(1, 'transparent')
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
      })

      // Stars
      stars.forEach(s => {
        s.x += s.vx; s.y += s.vy; s.a += s.da
        if (s.a < 0.05 || s.a > 1) s.da = -s.da
        if (s.x < 0) s.x = W; if (s.x > W) s.x = 0
        if (s.y < 0) s.y = H; if (s.y > H) s.y = 0
        const alpha = s.a.toFixed(2)
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        if (s.color === '#c084fc') ctx.fillStyle = `rgba(192,132,252,${alpha})`
        else if (s.color === '#34d399') ctx.fillStyle = `rgba(52,211,153,${alpha})`
        else ctx.fillStyle = `rgba(241,245,249,${alpha})`
        ctx.fill()
      })

      // Shooting stars
      maybeShoot()
      shooters.forEach(s => {
        if (s.done) return
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.alpha -= 0.018
        if (s.alpha <= 0) { s.done = true; return }
        const tail = { x: s.x - Math.cos(s.angle) * s.len, y: s.y - Math.sin(s.angle) * s.len }
        const g = ctx.createLinearGradient(tail.x, tail.y, s.x, s.y)
        g.addColorStop(0, 'transparent')
        g.addColorStop(0.7, `rgba(192,132,252,${(s.alpha * 0.5).toFixed(2)})`)
        g.addColorStop(1, `rgba(255,255,255,${s.alpha.toFixed(2)})`)
        ctx.beginPath(); ctx.moveTo(tail.x, tail.y); ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
      })
      shooters = shooters.filter(s => !s.done)

      animId = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
