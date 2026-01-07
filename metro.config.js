const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add blockList to exclude problematic cache files
config.resolver = {
  ...config.resolver,
  blockList: [
    /node_modules\/react-native-css-interop\/\.cache\/.*/,
  ],
};

// Ensure watchFolders includes the project root
config.watchFolders = [__dirname];

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
