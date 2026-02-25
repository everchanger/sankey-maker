import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  { ignores: ['dist/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: {
        document: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        XMLSerializer: 'readonly',
        Image: 'readonly',
      },
    },
  },
]
