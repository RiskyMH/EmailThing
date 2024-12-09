// const path = require("path")
// console.log(process.env.npm_config_local_prefix)
// const hexFixPath = (path.join(process.env.npm_config_local_prefix || __dirname || "./", "./postcss/hex-fix.cjs"));

// const hexFixPath = require.resolve("./postcss/hex-fix.cjs")

module.exports = {
  plugins: {
    // [hexFixPath]: {},
    // tailwindcss: {},
    // autoprefixer: {},
    '@tailwindcss/postcss': {},
  },
};
