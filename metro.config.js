// /metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const escape = (p) =>
  p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Exclude project directories unused by Metro.
const hide = [
  'functions',
  'agents',
  'docs',
  'designexamples',
  'tests',
  'coverage',
  'dist',
  'build',
].map(
  (d) => new RegExp('^' + escape(__dirname + '/' + d) + '/.*')
);

// Reduce file watchers on Android / Termux.
config.resolver.blockList = [
  ...hide,

  /node_modules\/.*\/node_modules\/.*/,
  /node_modules\/@react-native\/debugger-frontend\/.*/,
  /node_modules\/react-native\/ReactAndroid\/.*/,
  /node_modules\/react-native\/ReactCommon\/.*\/tests?\//,
  /node_modules\/expo-modules-core\/android\/.*/,

  // Native-only package directories.
  /node_modules\/(?:@[^/]+\/)?[^/]+\/(?:android|ios|cpp)\/.*/,

  // Unused Firebase variants.
  /node_modules\/firebase\/compat\/.*/,
  /node_modules\/@firebase\/[^/]+\/dist\/cordova\/.*/,
  /node_modules\/(?:@firebase\/[^/]+|firebase)\/(?:.*\/)?compat\/.*/,

  // Tests inside dependencies.
  /node_modules\/.*\/__tests__\/.*/,
  /node_modules\/.*\/tests?\/.*/,
];

module.exports = config;
