const path = require("path")
const hexFixPath = (path.join(process.env.npm_config_local_prefix || "./", "./postcss/hex-fix.js"));

module.exports = {
  plugins: {
    [hexFixPath]: {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
