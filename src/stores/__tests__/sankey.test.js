import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { parseNumericValue, useSankeyStore } from '../sankey.js'

// ── parseNumericValue ──────────────────────────────────────────────

describe('parseNumericValue', () => {
  it('parses European comma-decimal format', () => {
    expect(parseNumericValue('-96,50')).toBeCloseTo(-96.5)
    expect(parseNumericValue('-371,28')).toBeCloseTo(-371.28)
    expect(parseNumericValue('314,85')).toBeCloseTo(314.85)
  })

  it('parses US dot-decimal format', () => {
    expect(parseNumericValue('-96.50')).toBeCloseTo(-96.5)
    expect(parseNumericValue('1234.56')).toBeCloseTo(1234.56)
  })

  it('parses European thousands-dot + comma-decimal', () => {
    expect(parseNumericValue('1.234,56')).toBeCloseTo(1234.56)
  })

  it('parses US thousands-comma + dot-decimal', () => {
    expect(parseNumericValue('1,234.56')).toBeCloseTo(1234.56)
  })

  it('parses plain integers', () => {
    expect(parseNumericValue('100')).toBe(100)
    expect(parseNumericValue('-50')).toBe(-50)
  })

  it('returns NaN for non-numeric input', () => {
    expect(parseNumericValue(null)).toBeNaN()
    expect(parseNumericValue(undefined)).toBeNaN()
    expect(parseNumericValue('')).toBeNaN()
    expect(parseNumericValue('abc')).toBeNaN()
  })

  it('passes through numbers unchanged', () => {
    expect(parseNumericValue(42)).toBe(42)
    expect(parseNumericValue(-3.14)).toBeCloseTo(-3.14)
  })
})

// ── sankeyData getter (with anonymised Swedish-format CSV) ─────────

/*
 * Anonymised rows based on the format from the reported issue:
 *   Datum,Kategori,Underkategori,Text,Belopp,Saldo,Status,Avstämt
 * Values use European comma-decimal and are quoted where they contain commas.
 */
const SWEDISH_ROWS = [
  { Datum: '2026-02-24', Kategori: 'Mat & dryck', Underkategori: 'Livsmedelsbutik', Text: 'Butik A', Belopp: '-120,00', Saldo: '500,00', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Transport', Underkategori: 'Parkering', Text: 'Parkering AB', Belopp: '-15,50', Saldo: '620,00', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Mat & dryck', Underkategori: 'Livsmedelsbutik', Text: 'Butik B', Belopp: '-350,75', Saldo: '635,50', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Nöje & fritid', Underkategori: 'Kafé', Text: 'Kafé C', Belopp: '-85,00', Saldo: '986,25', Status: 'Utförd', Avstämt: 'Nej' },
]

describe('sankeyData getter', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSankeyStore()
  })

  it('returns null when no data is loaded', () => {
    expect(store.sankeyData).toBeNull()
  })

  it('returns null when columns are not configured', () => {
    store.setCsvData(SWEDISH_ROWS, Object.keys(SWEDISH_ROWS[0]))
    expect(store.sankeyData).toBeNull()
  })

  it('returns null when value column holds no valid numbers', () => {
    const badRows = [
      { Kategori: 'A', Belopp: 'abc' },
      { Kategori: 'B', Belopp: 'def' },
    ]
    store.setCsvData(badRows, ['Kategori', 'Belopp'])
    store.setColumns('Kategori', 'Belopp')
    expect(store.sankeyData).toBeNull()
  })

  it('builds correct nodes and links from European-format CSV data', () => {
    store.setCsvData(SWEDISH_ROWS, Object.keys(SWEDISH_ROWS[0]))
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    const nodeNames = data.nodes.map((n) => n.name)
    expect(nodeNames).toContain('Total Income')
    expect(nodeNames).toContain('Mat & dryck')
    expect(nodeNames).toContain('Transport')
    expect(nodeNames).toContain('Nöje & fritid')
    expect(nodeNames).toContain('Livsmedelsbutik')
    expect(nodeNames).toContain('Parkering')
    expect(nodeNames).toContain('Kafé')

    // Total Income → category links
    const foodLink = data.links.find(
      (l) => l.source === 'Total Income' && l.target === 'Mat & dryck',
    )
    expect(foodLink).toBeDefined()
    expect(foodLink.value).toBeCloseTo(120 + 350.75)

    const transportLink = data.links.find(
      (l) => l.source === 'Total Income' && l.target === 'Transport',
    )
    expect(transportLink).toBeDefined()
    expect(transportLink.value).toBeCloseTo(15.5)

    // category → sub-category links
    const subLink = data.links.find(
      (l) => l.source === 'Mat & dryck' && l.target === 'Livsmedelsbutik',
    )
    expect(subLink).toBeDefined()
    expect(subLink.value).toBeCloseTo(470.75)
  })

  it('works without a sub-category column', () => {
    store.setCsvData(SWEDISH_ROWS, Object.keys(SWEDISH_ROWS[0]))
    store.setColumns('Kategori', 'Belopp')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    // Should have no sub-category nodes
    const nodeNames = data.nodes.map((n) => n.name)
    expect(nodeNames).not.toContain('Livsmedelsbutik')

    // Should still have category links
    expect(data.links.length).toBeGreaterThan(0)
  })

  it('reset clears all state', () => {
    store.setCsvData(SWEDISH_ROWS, Object.keys(SWEDISH_ROWS[0]))
    store.setColumns('Kategori', 'Belopp')
    expect(store.sankeyData).not.toBeNull()

    store.reset()
    expect(store.csvData).toBeNull()
    expect(store.headers).toEqual([])
    expect(store.sankeyData).toBeNull()
  })
})
