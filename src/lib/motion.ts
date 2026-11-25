// Motion tokens. Durations in seconds (for `motion`) and the matching easings.
// The CSS side lives in styles.css (--ease-out-quint, --ease-snap).
export const DUR = { fast: 0.12, base: 0.2, slow: 0.4, hero: 0.8 } as const
export const EASE = {
  out: [0.22, 1, 0.36, 1] as const,
  snap: [0.2, 0.9, 0.1, 1] as const,
}
export const SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 } as const

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: DUR.slow, ease: EASE.out } },
}
