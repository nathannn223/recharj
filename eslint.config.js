// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      // The app's copy is entirely in French, where a bare apostrophe
      // ("l'aise", "t'appelles"...) shows up constantly — enforcing HTML
      // entities for it everywhere would make every string harder to read
      // for no real benefit here.
      "react/no-unescaped-entities": "off",
    },
  },
]);
