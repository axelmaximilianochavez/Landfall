const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Let Metro resolve the .sql files drizzle-kit generates into ./drizzle
config.resolver.sourceExts.push('sql');

// NOTE: expo-sqlite on web would additionally need `assetExts.push('wasm')`
// plus COEP/COOP headers for SharedArrayBuffer. db/client.web.ts keeps
// expo-sqlite out of the web bundle entirely, so neither is needed here —
// and COEP would otherwise block non-CORS cross-origin assets in dev.

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
