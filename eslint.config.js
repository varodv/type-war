import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
}, {
  rules: {
    'test/prefer-lowercase-title': [
      'error',
      {
        ignore: ['describe'],
      },
    ],
  },
})
