const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      // Only keep native addons external; everything else (including
      // the local workspace package @easy-charts/easycharts-types) gets
      // bundled into main.js so Docker doesn't need to install it.
      externalDependencies: ['bcrypt', 'argon2'],
    }),
  ],
};
