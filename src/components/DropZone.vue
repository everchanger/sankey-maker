<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file'])

const isDragging = ref(false)
const error = ref('')

function onDragOver(e) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(e) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  handleFile(file)
}

function onFileInput(e) {
  const file = e.target.files[0]
  handleFile(file)
}

function handleFile(file) {
  error.value = ''
  if (!file) return
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    error.value = 'Please upload a CSV file.'
    return
  }
  emit('file', file)
}
</script>

<template>
  <div
    class="drop-zone"
    :class="{ dragging: isDragging }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="$refs.fileInput.click()"
  >
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="hidden-input"
      @change="onFileInput"
    />
    <div class="drop-icon">📂</div>
    <p class="drop-title">Drop your CSV file here</p>
    <p class="drop-sub">or click to browse</p>
    <p v-if="error" class="drop-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.drop-zone {
  border: 2px dashed #94a3b8;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  background: #fff;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: #6366f1;
  background: #f0f0ff;
}

.hidden-input {
  display: none;
}

.drop-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.drop-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #334155;
  margin-bottom: 0.25rem;
}

.drop-sub {
  color: #94a3b8;
  font-size: 0.875rem;
}

.drop-error {
  margin-top: 0.75rem;
  color: #ef4444;
  font-size: 0.875rem;
}
</style>
