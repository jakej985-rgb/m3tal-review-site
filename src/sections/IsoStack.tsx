import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '@/lib/cn'

/*
  The hero's wireframe stack: three hatched slabs drawn as a real 3D model
  (an affine camera whose two angles drift), so it can slowly turn and
  lean toward the pointer. Every face is filled with the page colour (so
  nearer slabs hide farther ones) and then hatched with lines parallel to one
  of its edges, which is what gives the reference its engraved look.
*/

type V3 = [number, number, number]
type V2 = [number, number]
type Box = { o: V3; L: number; H: number; D: number }

const L = 380
const H = 170
const D = 105
// A staircase: each slab sits on the one below, set back and shifted right.
// Drawn back to front, so the highest (farthest) slab comes first.
const BOXES: Box[] = [2, 1, 0].map((i) => ({ o: [i * 62, i * H, i * D * 0.5] as V3, L, H, D }))

/**
 * Affine "camera": world x (length), y (height), z (depth) map to three screen
 * vectors. Animating the two angles reads as a slow turn of the whole model.
 */
function makeProject(a: number, b: number): (p: V3) => V2 {
  const ex: V2 = [Math.cos(a), Math.sin(a)]
  const ey: V2 = [0.28, -0.96]
  const ez: V2 = [Math.cos(b) * 0.72, Math.sin(b) * 0.72]
  return ([x, y, z]) => [x * ex[0] + y * ey[0] + z * ez[0], x * ex[1] + y * ey[1] + z * ez[1]]
}

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const scale = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]

/** A face is origin + u + v; we hatch with `lines` strokes parallel to u, stepped along v. */
type Face = { o: V3; u: V3; v: V3; lines: number; kind: 'front' | 'top' | 'end' }

function faces(b: Box): Face[] {
  const { o } = b
  return [
    // front (z = 0): dense lines along the length
    { o, u: [b.L, 0, 0], v: [0, b.H, 0], lines: 34, kind: 'front' },
    // top (y = H): bars across the depth, spaced along the length
    { o: add(o, [0, b.H, 0]), u: [0, 0, b.D], v: [b.L, 0, 0], lines: 32, kind: 'top' },
    // right end (x = L): lines parallel to the height edge
    { o: add(o, [b.L, 0, 0]), u: [0, b.H, 0], v: [0, 0, b.D], lines: 9, kind: 'end' },
  ]
}

const BASE_A = (19 * Math.PI) / 180
const BASE_B = (-38 * Math.PI) / 180

export function IsoStack({ className }: { className?: string }) {
  const reduce = useReducedMotion()
  const wrap = useRef<HTMLDivElement>(null)
  const [t, setT] = useState(0)
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const visible = useRef(true)

  useEffect(() => {
    if (reduce) return
    const el = wrap.current
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting))
    if (el) io.observe(el)
    const move = (e: PointerEvent) => {
      pointer.current.tx = (e.clientX / window.innerWidth - 0.5) * 2
      pointer.current.ty = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('pointermove', move)
    let raf = 0
    const start = performance.now()
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible.current) return
      const p = pointer.current
      p.x += (p.tx - p.x) * 0.04
      p.y += (p.ty - p.y) * 0.04
      setT((now - start) / 1000)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      window.removeEventListener('pointermove', move)
    }
  }, [reduce])

  const p = pointer.current
  const a = BASE_A + Math.sin(t * 0.16) * 0.035 + p.x * 0.03
  const b = BASE_B + Math.sin(t * 0.11 + 1) * 0.09 + p.y * 0.06

  const shapes = useMemo(() => {
    const project = makeProject(a, b)
    return BOXES.map((b) =>
      faces(b).map((f) => {
        const corners = [f.o, add(f.o, f.u), add(add(f.o, f.u), f.v), add(f.o, f.v)].map(project)
        const lines: string[] = []
        for (let i = 1; i < f.lines; i++) {
          const k = i / f.lines
          const a = project(add(f.o, scale(f.v, k)))
          const c = project(add(add(f.o, scale(f.v, k)), f.u))
          lines.push(`M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${c[0].toFixed(1)} ${c[1].toFixed(1)}`)
        }
        return { kind: f.kind, outline: corners.map((c) => c.map((n) => n.toFixed(1)).join(',')).join(' '), lines: lines.join('') }
      }),
    )
  }, [a, b])

  return (
    <div ref={wrap} className={cn('pointer-events-none select-none', className)} aria-hidden>
      <svg viewBox="-10 -552 760 686" className="h-full w-full overflow-visible">
        {shapes.map((box, bi) => (
          <g key={bi}>
            {box.map((f) => (
              <g key={f.kind}>
                <polygon points={f.outline} fill="var(--c-bg)" />
                <path d={f.lines} stroke="var(--c-stack)" strokeOpacity={f.kind === 'top' ? 0.42 : 0.26} strokeWidth={f.kind === 'top' ? 3.2 : 0.8} fill="none" />
                <polygon points={f.outline} fill="none" stroke="var(--c-stack)" strokeOpacity="0.45" strokeWidth="1" strokeLinejoin="round" />
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  )
}
