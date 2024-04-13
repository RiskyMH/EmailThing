const path = require("path")
const hexFixPath = (path.join(process.env.npm_config_local_prefix || __dirname || "./", "./postcss/hex-fix.cjs"));

module.exports = {
  plugins: {
    [hexFixPath]: {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
