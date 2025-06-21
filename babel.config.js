/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  plugins: [
    [
      'module-resolver',
      {
        alias: {
          '@': './src',
        },
        extensions: ['.js', '.json', '.ts', '.tsx', '.jsx'],
        root: ['./src'],
      },
    ],
    'inline-dotenv',
    'react-native-reanimated/plugin',
  ],
  presets: ['module:@react-native/babel-preset'],
};
