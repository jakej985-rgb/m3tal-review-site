import { expect, test } from 'bun:test'

import { mergeWorkspace } from '../src/shared/workspace'

type Workspace = {
  version: 1
  workspace: string
  meId: string
  nextNumber: number
  issues: { number: number; title: string }[]
  members: { id: string; name: string }[]
  labels: { id: string; name: string }[]
  cycles: { id: string; name: string }[]
  notices: { id: string; text: string }[]
}

const paper = (over: Partial<Workspace> = {}): Workspace => ({
  version: 1,
  workspace: 'm3tal-review',
  meId: 'm1',
  nextNumber: 3,
  issues: [],
  members: [],
  labels: [],
  cycles: [],
  notices: [],
  ...over,
})

test('an edit made here survives the newer copy saved elsewhere', () => {
  const base = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  const local = paper({ issues: [{ number: 1, title: 'A (edited here)' }, { number: 2, title: 'B' }] })
  const incoming = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B (edited elsewhere)' }] })
  expect(mergeWorkspace(base, local, incoming).issues).toEqual([
    { number: 1, title: 'A (edited here)' },
    { number: 2, title: 'B (edited elsewhere)' },
  ])
})

test('an issue added on another device is kept', () => {
  const base = paper({ issues: [{ number: 1, title: 'A' }] })
  const local = paper({ issues: [{ number: 1, title: 'A' }] })
  const incoming = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  expect(mergeWorkspace(base, local, incoming).issues.map((i) => i.number)).toEqual([1, 2])
})

test('a deletion here is not undone by the newer copy', () => {
  const base = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  const local = paper({ issues: [{ number: 1, title: 'A' }] })
  const incoming = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  expect(mergeWorkspace(base, local, incoming).issues.map((i) => i.number)).toEqual([1])
})

test('a deletion elsewhere drops the issue unless it changed here', () => {
  const base = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  const local = paper({ issues: [{ number: 1, title: 'A' }, { number: 2, title: 'B' }] })
  const incoming = paper({ issues: [{ number: 1, title: 'A' }] })
  expect(mergeWorkspace(base, local, incoming).issues.map((i) => i.number)).toEqual([1])
})

test('scalars this tab did not touch come from the newer copy', () => {
  const base = paper({ workspace: 'm3tal-review', nextNumber: 3 })
  const local = paper({ workspace: 'm3tal-review', nextNumber: 3 })
  const incoming = paper({ workspace: 'renamed elsewhere', nextNumber: 7 })
  const merged = mergeWorkspace(base, local, incoming)
  expect(merged.workspace).toBe('renamed elsewhere')
  expect(merged.nextNumber).toBe(7)
})

test('two tabs that handed out the same issue number keep both issues', () => {
  const base = paper({ issues: [{ number: 1, title: 'A' }], nextNumber: 2 })
  const local = paper({ issues: [{ number: 2, title: 'Mine' }, { number: 1, title: 'A' }], nextNumber: 3 })
  const incoming = paper({ issues: [{ number: 2, title: 'Theirs' }, { number: 1, title: 'A' }], nextNumber: 3 })
  const merged = mergeWorkspace(base, local, incoming)
  expect(merged.issues.map((i) => i.title).sort()).toEqual(['A', 'Mine', 'Theirs'])
  expect(new Set(merged.issues.map((i) => i.number)).size).toBe(3)
  expect(merged.nextNumber).toBe(4)
})

test('a rename here wins over the newer copy', () => {
  const base = paper({ workspace: 'm3tal-review' })
  const local = paper({ workspace: 'renamed here' })
  const incoming = paper({ workspace: 'renamed elsewhere' })
  expect(mergeWorkspace(base, local, incoming).workspace).toBe('renamed here')
})
