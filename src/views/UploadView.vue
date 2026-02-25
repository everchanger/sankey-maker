<script setup>
import { useRouter } from 'vue-router'
import Papa from 'papaparse'
import DropZone from '../components/DropZone.vue'
import { useSankeyStore } from '../stores/sankey'

const router = useRouter()
const store = useSankeyStore()

function handleFile(file) {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete(results) {
      if (!results.data.length) return
      store.setCsvData(results.data, results.meta.fields)
      router.push('/wizard')
    },
  })
}
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="hero">
        <h1 class="title">Sankey Maker</h1>
        <p class="subtitle">Turn your CSV data into beautiful Sankey diagrams</p>
      </div>
      <DropZone @file="handleFile" />
      <div class="hints">
        <p>Your CSV should have columns for <strong>source</strong>, <strong>target</strong>, and <strong>value</strong>.</p>
        <p>You'll choose which columns to use in the next step.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.container {
  width: 100%;
  max-width: 540px;
}

.hero {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

.hints {
  margin-top: 1.5rem;
  text-align: center;
  color: #94a3b8;
  font-size: 0.875rem;
  line-height: 1.6;
}

.hints p + p {
  margin-top: 0.25rem;
}
</style>
