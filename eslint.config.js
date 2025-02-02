import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },
  stylistic: {
    semi: true,
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
});
