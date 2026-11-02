module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Las migraciones de Drizzle son archivos .sql que se incluyen como texto.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
