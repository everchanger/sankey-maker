<script setup>
import { ref, watch, onMounted } from 'vue'
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey'
import * as d3 from 'd3'

const props = defineProps({
  data: { type: Object, required: true },
})

const svgRef = ref(null)

const COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6',
  '#f97316', '#8b5cf6', '#06b6d4', '#84cc16', '#ef4444',
]

function getColor(index) {
  return COLORS[index % COLORS.length]
}

const emit = defineEmits(['error'])

function draw() {
  if (!svgRef.value || !props.data) return

  const el = svgRef.value
  // Clear previous
  while (el.firstChild) el.removeChild(el.firstChild)

  const width = el.clientWidth || 800
  const height = el.clientHeight || 480
  const margin = { top: 24, right: 24, bottom: 24, left: 24 }

  try {
    const svg = d3.select(el)
      .attr('width', width)
      .attr('height', height)

    const sankeyLayout = sankey()
      .nodeId((d) => d.name)
      .nodeAlign(sankeyLeft)
      .nodeWidth(16)
      .nodePadding(14)
      .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]])

    const { nodes, links } = sankeyLayout({
      nodes: props.data.nodes.map((d) => ({ ...d })),
      links: props.data.links.map((d) => ({ ...d })),
    })

    // Links
    svg.append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(links)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr('stroke', (d) => getColor(d.source.index))
      .attr('stroke-width', (d) => Math.max(1, d.width))
      .attr('opacity', 0.45)
      .append('title')
      .text((d) => `${d.source.name} → ${d.target.name}: ${d.value.toLocaleString()}`)

    // Nodes
    const node = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')

    node.append('rect')
      .attr('x', (d) => d.x0)
      .attr('y', (d) => d.y0)
      .attr('height', (d) => Math.max(1, d.y1 - d.y0))
      .attr('width', (d) => d.x1 - d.x0)
      .attr('fill', (d) => getColor(d.index))
      .attr('rx', 3)
      .append('title')
      .text((d) => `${d.name}: ${d.value.toLocaleString()}`)

    // Labels
    node.append('text')
      .attr('x', (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
      .attr('y', (d) => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d) => (d.x0 < width / 2 ? 'start' : 'end'))
      .attr('font-size', 12)
      .attr('fill', '#1e293b')
      .text((d) => d.name)
  } catch (e) {
    while (el.firstChild) el.removeChild(el.firstChild)
    emit('error', 'Failed to render the chart. The data may contain invalid or conflicting values.')
  }
}

onMounted(draw)
watch(() => props.data, draw)

defineExpose({ svgRef })
</script>

<template>
  <div class="chart-wrap">
    <svg ref="svgRef" class="sankey-svg"></svg>
  </div>
</template>

<style scoped>
.chart-wrap {
  width: 100%;
  height: 480px;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.sankey-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
