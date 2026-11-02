// https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Las migraciones de Drizzle son archivos .sql.
config.resolver.sourceExts.push('sql');

module.exports = config;
