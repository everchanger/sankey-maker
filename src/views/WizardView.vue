<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSankeyStore } from '../stores/sankey'

const router = useRouter()
const store = useSankeyStore()

if (!store.csvData) {
  router.replace('/')
}

const step = ref(1)
const source = ref(store.sourceCol || '')
const target = ref(store.targetCol || '')
const value = ref(store.valueCol || '')

const headers = computed(() => store.headers)
const preview = computed(() => store.csvData?.slice(0, 3) ?? [])

const steps = [
  { label: 'Source', desc: 'Which column represents the flow source (e.g. category, department)?' },
  { label: 'Target', desc: 'Which column represents the flow destination?' },
  { label: 'Value', desc: 'Which column contains the numeric value for each flow?' },
]

const currentValue = computed({
  get() {
    if (step.value === 1) return source.value
    if (step.value === 2) return target.value
    return value.value
  },
  set(v) {
    if (step.value === 1) source.value = v
    else if (step.value === 2) target.value = v
    else value.value = v
  },
})

function next() {
  if (step.value < 3) {
    step.value++
  } else {
    store.setColumns(source.value, target.value, value.value)
    router.push('/chart')
  }
}

function back() {
  if (step.value > 1) {
    step.value--
  } else {
    router.push('/')
  }
}

const canNext = computed(() => {
  if (step.value === 1) return !!source.value
  if (step.value === 2) return !!target.value
  return !!value.value
})
</script>

<template>
  <div class="page">
    <div class="container">
      <div class="wizard-header">
        <h1>Configure Columns</h1>
        <div class="stepper">
          <div
            v-for="(s, i) in steps"
            :key="i"
            class="step-dot"
            :class="{ active: i + 1 === step, done: i + 1 < step }"
          >
            <span class="dot-num">{{ i + 1 }}</span>
            <span class="dot-label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <div class="card">
        <p class="step-desc">{{ steps[step - 1].desc }}</p>

        <div class="options">
          <label
            v-for="h in headers"
            :key="h"
            class="option"
            :class="{ selected: currentValue === h }"
          >
            <input type="radio" :value="h" v-model="currentValue" />
            <span class="option-name">{{ h }}</span>
            <span class="option-samples">
              {{ preview.map((r) => r[h]).filter(Boolean).join(', ') }}
            </span>
          </label>
        </div>

        <div class="actions">
          <button class="btn btn-ghost" @click="back">Back</button>
          <button class="btn btn-primary" :disabled="!canNext" @click="next">
            {{ step === 3 ? 'Generate Chart' : 'Next' }}
          </button>
        </div>
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
  max-width: 560px;
}

.wizard-header {
  margin-bottom: 1.5rem;
}

.wizard-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.stepper {
  display: flex;
  gap: 1rem;
}

.step-dot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.875rem;
}

.step-dot.active {
  color: #6366f1;
  font-weight: 600;
}

.step-dot.done {
  color: #22c55e;
}

.dot-num {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: currentColor;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.step-dot.active .dot-num { background: #6366f1; }
.step-dot.done .dot-num { background: #22c55e; }
.step-dot:not(.active):not(.done) .dot-num { background: #cbd5e1; color: #64748b; }

.card {
  background: #fff;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
}

.step-desc {
  color: #475569;
  margin-bottom: 1.25rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.option {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.option:hover {
  border-color: #a5b4fc;
  background: #f8f8ff;
}

.option.selected {
  border-color: #6366f1;
  background: #f0f0ff;
}

.option input[type="radio"] {
  display: none;
}

.option-name {
  font-weight: 600;
  color: #1e293b;
  min-width: 8rem;
}

.option-samples {
  color: #94a3b8;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  justify-content: space-between;
}

.btn {
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.15s, opacity 0.15s;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
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
