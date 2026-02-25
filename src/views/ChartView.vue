<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSankeyStore } from '../stores/sankey'
import SankeyChart from '../components/SankeyChart.vue'

const router = useRouter()
const store = useSankeyStore()

if (!store.sankeyData) {
  router.replace('/')
}

const chartData = computed(() => store.sankeyData)

function exportSVG() {
  const svgEl = document.querySelector('.sankey-svg')
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgEl)
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  downloadBlob(blob, 'sankey.svg')
}

function exportPNG() {
  const svgEl = document.querySelector('.sankey-svg')
  if (!svgEl) return
  const serializer = new XMLSerializer()
  const svgStr = serializer.serializeToString(svgEl)
  const img = new Image()
  const blob = new Blob([svgStr], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = svgEl.clientWidth || 800
    canvas.height = svgEl.clientHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    canvas.toBlob((pngBlob) => downloadBlob(pngBlob, 'sankey.png'))
  }
  img.src = url
}

function exportJSON() {
  const data = store.sankeyData
  if (!data) return
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  downloadBlob(blob, 'sankey-data.json')
}

function downloadBlob(blob, filename) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="header">
        <div class="header-left">
          <button class="btn btn-ghost" @click="router.push('/wizard')">← Back</button>
          <div>
            <h1>Sankey Diagram</h1>
            <p class="meta">
              {{ store.sourceCol }} → {{ store.targetCol }} ({{ store.valueCol }})
            </p>
          </div>
        </div>

        <div class="export-group">
          <span class="export-label">Export</span>
          <div class="export-btns">
            <button class="btn btn-outline" @click="exportSVG">SVG</button>
            <button class="btn btn-outline" @click="exportPNG">PNG</button>
            <button class="btn btn-primary" @click="exportJSON">JSON Data</button>
          </div>
        </div>
      </div>

      <SankeyChart v-if="chartData" :data="chartData" />

      <button class="btn btn-ghost start-over" @click="() => { store.reset(); router.push('/') }">
        Start over
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 960px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-left h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.meta {
  color: #64748b;
  font-size: 0.875rem;
  margin-top: 0.125rem;
}

.export-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.export-label {
  color: #64748b;
  font-size: 0.875rem;
  font-weight: 500;
}

.export-btns {
  display: flex;
  gap: 0.5rem;
}

.start-over {
  margin-top: 1.5rem;
}

.btn {
  padding: 0.5rem 1.125rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover {
  background: #4f46e5;
}

.btn-outline {
  background: transparent;
  color: #6366f1;
  border: 2px solid #6366f1;
}

.btn-outline:hover {
  background: #f0f0ff;
}

.btn-ghost {
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
}

.btn-ghost:hover {
  border-color: #94a3b8;
}
</style>
