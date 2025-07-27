import typescriptEslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      'no-console': ['error', {
        allow: ['warn', 'error']
      }],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off' // Too many legacy any types to fix right now
    }
  },
  {
    // Allow console.log in CLI commands, config, utilities, tests, and mocks
    files: [
      'src/commands/**/*.ts', 
      'src/config/interactive.ts',
      'src/utils/**/*.ts', 
      'src/api/**/*.ts',
      'src/**/*.test.ts', 
      'src/__tests__/**/*.ts', 
      'src/__mocks__/**/*.ts'
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
];