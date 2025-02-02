import antfu from '@antfu/eslint-config';

export default antfu({
  typescript: {
    tsconfigPath: 'tsconfig.json',
  },
  stylistic: {
    semi: true,
  },
  formatters: true,
  test: {
    overrides: {
      'test/prefer-lowercase-title': [
        'error',
        {
          ignore: ['describe'],
        },
      ],
    },
  },
});
