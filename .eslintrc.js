/* eslint-disable quote-props */
module.exports = {
  'parser': '@typescript-eslint/parser',
  'extends': [
    'airbnb-base',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  'plugins': ['@typescript-eslint'],
  'rules': {
    'arrow-parens': [2, 'always'],
    'brace-style': [2, '1tbs', { 'allowSingleLine': true }],
    'camelcase': 0,
    'comma-dangle': [2, 'never'],
    'linebreak-style': 0,
    'max-len': [2, { code: 120 }],
    'new-cap': [2, { 'capIsNewExceptions': ['AbstractApi', 'Repositories', 'Request', 'Teams', 'User'] }],
    'import/extensions': ['error', 'ignorePackages', { 'ts': 'never' }],
    'import/no-unresolved': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { 'typedefs': false }]
  },
  'parserOptions': {
    'ecmaVersion': 2024
  },
  'overrides': [
    {
      'files': ['*.ts'],
      'parserOptions': {
        'project': './tsconfig.json'
      }
    }
  ],
  'settings': {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts']
      }
    }
  }
};
