import { defineStore } from 'pinia'

export function parseNumericValue(raw) {
  if (raw == null) return NaN
  if (typeof raw === 'number') return raw
  let s = String(raw).trim()
  if (!s) return NaN
  // Strip &nbsp; HTML entities and non-breaking / regular spaces used as thousands separators
  s = s.replace(/&nbsp;/gi, '').replace(/[\u00A0\u2007\u202F]/g, '').replace(/ /g, '')
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastComma > lastDot) {
    return parseFloat(s.replace(/\./g, '').replace(',', '.'))
  }
  if (lastDot > lastComma) {
    return parseFloat(s.replace(/,/g, ''))
  }
  return parseFloat(s)
}

export const useSankeyStore = defineStore('sankey', {
  state: () => ({
    csvData: null,       // raw parsed rows (array of objects)
    headers: [],         // column names
    categoryCol: null,
    subCategoryCol: null,
    valueCol: null,
  }),
  actions: {
    setCsvData(data, headers) {
      this.csvData = data
      this.headers = headers
      this.categoryCol = null
      this.subCategoryCol = null
      this.valueCol = null
    },
    setColumns(category, value, subCategory = null) {
      this.categoryCol = category
      this.valueCol = value
      this.subCategoryCol = subCategory
    },
    reset() {
      this.csvData = null
      this.headers = []
      this.categoryCol = null
      this.subCategoryCol = null
      this.valueCol = null
    },
  },
  getters: {
    sankeyData(state) {
      if (!state.csvData || !state.categoryCol || !state.valueCol) return null

      const TOTAL_INCOME = 'Total Income'

      // Separate income (positive) and expenses (negative)
      const incomeByCategory = new Map()
      const expenseByCategory = new Map()
      const expenseBySubCategory = new Map() // key: "category|||subCategory"

      for (const row of state.csvData) {
        const category = row[state.categoryCol]
        const val = parseNumericValue(row[state.valueCol])
        if (!category || isNaN(val)) continue

        if (val > 0) {
          incomeByCategory.set(category, (incomeByCategory.get(category) ?? 0) + val)
        } else if (val < 0) {
          const absVal = Math.abs(val)
          expenseByCategory.set(category, (expenseByCategory.get(category) ?? 0) + absVal)

          if (state.subCategoryCol) {
            const subCat = row[state.subCategoryCol]
            if (subCat) {
              const key = `${category}|||${subCat}`
              expenseBySubCategory.set(key, (expenseBySubCategory.get(key) ?? 0) + absVal)
            }
          }
        }
      }

      // Build nodes and links
      const nodeSet = new Set()
      const links = []

      // Income sources → Total Income
      for (const [source, value] of incomeByCategory) {
        nodeSet.add(source)
        nodeSet.add(TOTAL_INCOME)
        links.push({ sourceName: source, targetName: TOTAL_INCOME, value })
      }

      // Total Income → Expense categories
      for (const [category, value] of expenseByCategory) {
        nodeSet.add(TOTAL_INCOME)
        nodeSet.add(category)
        links.push({ sourceName: TOTAL_INCOME, targetName: category, value })
      }

      // Expense categories → Sub-categories (if applicable)
      // Disambiguate subcategory names that collide with existing node names
      if (state.subCategoryCol) {
        const topLevelNames = new Set(nodeSet)
        const subCatNameMap = new Map() // original key → safe node name

        for (const [key] of expenseBySubCategory) {
          const [category, subCat] = key.split('|||')
          let safeName = subCat
          if (topLevelNames.has(subCat) || subCat === TOTAL_INCOME) {
            safeName = `${category} › ${subCat}`
          }
          subCatNameMap.set(key, safeName)
        }

        for (const [key, value] of expenseBySubCategory) {
          const [category] = key.split('|||')
          const safeName = subCatNameMap.get(key)
          nodeSet.add(category)
          nodeSet.add(safeName)
          links.push({ sourceName: category, targetName: safeName, value })
        }
      }

      if (links.length === 0) return null

      const nodes = Array.from(nodeSet).map((name) => ({ name }))

      return {
        nodes,
        links: links.map((l) => ({
          source: l.sourceName,
          target: l.targetName,
          value: l.value,
        })),
      }
    },
  },
})
