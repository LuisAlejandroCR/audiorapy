// metro.config.js: lets the app import the repo's pure TypeScript — `@audiorapy/domain` and the web
// dashboard's framework-free helpers — instead of copying them. Their dependencies resolve from the root.
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const root = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [root];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(root, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@audiorapy/domain': path.resolve(root, 'packages/domain'),
  '@audiorapy/web-lib': path.resolve(root, 'apps/web/src/lib'),
};

module.exports = config;
