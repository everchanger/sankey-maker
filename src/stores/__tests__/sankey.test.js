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

  it('strips &nbsp; HTML entities used as thousands separators', () => {
    expect(parseNumericValue('2&nbsp;600,00')).toBeCloseTo(2600)
    expect(parseNumericValue('-4&nbsp;435,00')).toBeCloseTo(-4435)
    expect(parseNumericValue('16&nbsp;200,00')).toBeCloseTo(16200)
    expect(parseNumericValue('24&nbsp;850,00')).toBeCloseTo(24850)
    expect(parseNumericValue('-1&nbsp;087,29')).toBeCloseTo(-1087.29)
  })

  it('strips non-breaking space characters used as thousands separators', () => {
    expect(parseNumericValue('2\u00A0600,00')).toBeCloseTo(2600)
    expect(parseNumericValue('-16\u00A0200,00')).toBeCloseTo(-16200)
  })

  it('strips regular spaces used as thousands separators', () => {
    expect(parseNumericValue('2 600,00')).toBeCloseTo(2600)
    expect(parseNumericValue('-16 200,00')).toBeCloseTo(-16200)
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

  it('disambiguates subcategory names that collide with category names', () => {
    const rows = [
      { Kategori: 'Uncategorized', Underkategori: 'Uncategorized', Belopp: '-100,00' },
      { Kategori: 'Food', Underkategori: 'Groceries', Belopp: '-200,00' },
      { Kategori: 'Salary', Underkategori: 'Main job', Belopp: '5000,00' },
    ]
    store.setCsvData(rows, ['Kategori', 'Underkategori', 'Belopp'])
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    const nodeNames = data.nodes.map((n) => n.name)
    // The subcategory "Uncategorized" collides with the category "Uncategorized",
    // so it should be disambiguated
    expect(nodeNames).toContain('Uncategorized')
    expect(nodeNames).toContain('Uncategorized › Uncategorized')

    // Verify no self-loop link exists
    const selfLoop = data.links.find((l) => l.source === l.target)
    expect(selfLoop).toBeUndefined()
  })
})

// ── Full anonymised CSV with subcategories, &nbsp; values, and income ──

const FULL_ROWS = [
  // Expenses with &nbsp; thousands separators
  { Datum: '2026-02-24', Kategori: 'Food', Underkategori: 'Grocery', Text: 'Store A', Belopp: '-96,50', Saldo: '314,85', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Transport', Underkategori: 'Parking', Text: 'Parking Co', Belopp: '-13,95', Saldo: '411,35', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Food', Underkategori: 'Grocery', Text: 'Store B', Belopp: '-371,28', Saldo: '425,30', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-23', Kategori: 'Entertainment', Underkategori: 'Café', Text: 'Café D', Belopp: '-88,00', Saldo: '796,58', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-02', Kategori: 'Housing', Underkategori: 'Mortgage', Text: 'Loan A', Belopp: '-8&nbsp;976,64', Saldo: '6&nbsp;724,69', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-02', Kategori: 'Housing', Underkategori: 'Mortgage', Text: 'Loan B', Belopp: '-8&nbsp;976,64', Saldo: '15&nbsp;701,33', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-02', Kategori: 'Food', Underkategori: 'Grocery', Text: 'Store C', Belopp: '-1&nbsp;087,29', Saldo: '5&nbsp;393,90', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-04', Kategori: 'Uncategorized', Underkategori: 'Uncategorized', Text: 'Pharmacy X', Belopp: '-119,00', Saldo: '430,90', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-01-02', Kategori: 'Transport', Underkategori: 'Car loan', Text: 'Lender Co', Belopp: '-4&nbsp;443,00', Saldo: '4&nbsp;000,73', Status: 'Utförd', Avstämt: 'Nej' },
  // Income with &nbsp; thousands separators
  { Datum: '2026-02-06', Kategori: 'Other income', Underkategori: 'Own transfers', Text: 'Deposit', Belopp: '2&nbsp;600,00', Saldo: '4&nbsp;351,90', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-02-05', Kategori: 'Other income', Underkategori: 'Own transfers', Text: 'From Account B', Belopp: '1&nbsp;500,00', Saldo: '1&nbsp;751,90', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-01-24', Kategori: 'Other income', Underkategori: 'Own transfers', Text: 'From Account C', Belopp: '16&nbsp;200,00', Saldo: '35&nbsp;351,23', Status: 'Utförd', Avstämt: 'Nej' },
  { Datum: '2026-01-23', Kategori: 'Other income', Underkategori: 'Own transfers', Text: 'From Account D', Belopp: '24&nbsp;850,00', Saldo: '25&nbsp;151,23', Status: 'Utförd', Avstämt: 'Nej' },
]

describe('sankeyData with full anonymised CSV including subcategories and &nbsp; values', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useSankeyStore()
  })

  it('correctly parses income values containing &nbsp; thousands separators', () => {
    store.setCsvData(FULL_ROWS, Object.keys(FULL_ROWS[0]))
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    const incomeLink = data.links.find(
      (l) => l.source === 'Other income' && l.target === 'Total Income',
    )
    expect(incomeLink).toBeDefined()
    // 2600 + 1500 + 16200 + 24850 = 45150
    expect(incomeLink.value).toBeCloseTo(45150)
  })

  it('correctly parses expense values containing &nbsp; thousands separators', () => {
    store.setCsvData(FULL_ROWS, Object.keys(FULL_ROWS[0]))
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    const housingLink = data.links.find(
      (l) => l.source === 'Total Income' && l.target === 'Housing',
    )
    expect(housingLink).toBeDefined()
    // 8976.64 + 8976.64 = 17953.28
    expect(housingLink.value).toBeCloseTo(17953.28)
  })

  it('disambiguates subcategory names that collide with categories', () => {
    store.setCsvData(FULL_ROWS, Object.keys(FULL_ROWS[0]))
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()

    // "Uncategorized" category has "Uncategorized" subcategory — must be disambiguated
    const selfLoop = data.links.find((l) => l.source === l.target)
    expect(selfLoop).toBeUndefined()

    const subLink = data.links.find(
      (l) => l.source === 'Uncategorized' && l.target === 'Uncategorized › Uncategorized',
    )
    expect(subLink).toBeDefined()
    expect(subLink.value).toBeCloseTo(119)
  })

  it('generates chart data with subcategories without errors', () => {
    store.setCsvData(FULL_ROWS, Object.keys(FULL_ROWS[0]))
    store.setColumns('Kategori', 'Belopp', 'Underkategori')

    const data = store.sankeyData
    expect(data).not.toBeNull()
    expect(data.nodes.length).toBeGreaterThan(0)
    expect(data.links.length).toBeGreaterThan(0)

    // All link sources and targets should reference existing node names
    const nodeNames = new Set(data.nodes.map((n) => n.name))
    for (const link of data.links) {
      expect(nodeNames.has(link.source)).toBe(true)
      expect(nodeNames.has(link.target)).toBe(true)
    }
  })
})
