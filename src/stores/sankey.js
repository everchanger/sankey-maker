import { defineStore } from 'pinia'

export const useSankeyStore = defineStore('sankey', {
  state: () => ({
    csvData: null,       // raw parsed rows (array of objects)
    headers: [],         // column names
    sourceCol: null,
    targetCol: null,
    valueCol: null,
  }),
  actions: {
    setCsvData(data, headers) {
      this.csvData = data
      this.headers = headers
      this.sourceCol = null
      this.targetCol = null
      this.valueCol = null
    },
    setColumns(source, target, value) {
      this.sourceCol = source
      this.targetCol = target
      this.valueCol = value
    },
    reset() {
      this.csvData = null
      this.headers = []
      this.sourceCol = null
      this.targetCol = null
      this.valueCol = null
    },
  },
  getters: {
    sankeyData(state) {
      if (!state.csvData || !state.sourceCol || !state.targetCol || !state.valueCol) return null

      const nodeSet = new Set()
      const linksMap = new Map()

      for (const row of state.csvData) {
        const src = row[state.sourceCol]
        const tgt = row[state.targetCol]
        const val = parseFloat(row[state.valueCol])
        if (!src || !tgt || isNaN(val)) continue

        nodeSet.add(src)
        nodeSet.add(tgt)

        const key = `${src}|||${tgt}`
        linksMap.set(key, (linksMap.get(key) ?? 0) + val)
      }

      const nodes = Array.from(nodeSet).map((name) => ({ name }))
      const nodeIndex = Object.fromEntries(nodes.map((n, i) => [n.name, i]))

      const links = Array.from(linksMap.entries()).map(([key, value]) => {
        const [source, target] = key.split('|||')
        return { source: nodeIndex[source], target: nodeIndex[target], value }
      })

      return { nodes, links }
    },
  },
})
