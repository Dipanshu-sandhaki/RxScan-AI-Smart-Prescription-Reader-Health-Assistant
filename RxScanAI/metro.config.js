const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// ─── STRICT BLOCKLIST ───
// Tell Metro Bundler to completely ignore the Python backend folder and its virtual environment
config.resolver.blockList = [
  ...config.resolver.blockList || [],
  /backend\/.*/,
  /.*\/venv\/.*/,
  /.*\/__pycache__\/.*/
];

// Add watchFolders exclusions if necessary
config.watchFolders = config.watchFolders || [];

module.exports = config;