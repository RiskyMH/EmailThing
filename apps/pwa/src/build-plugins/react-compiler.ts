// Mostly from https://gist.github.com/hyrious/0ec637c7ec2214096cb591062ec73ee0
// Reference: https://github.com/SukkaW/react-compiler-webpack

import babel from "@babel/core";
import BabelPluginReactCompiler from "babel-plugin-react-compiler";

export function reactCompiler(
  options = {} as { filter?: RegExp; reactCompilerConfig?: babel.PluginOptions },
): Bun.BunPlugin {
  const filter = options.filter || /\.[jt]sx$/;
  const reactCompilerConfig = options.reactCompilerConfig || {};

  function b64enc(b: string | Buffer<ArrayBufferLike>) {
    return Buffer.from(b).toString("base64");
  }

  function toUrl(map: babel.BabelFileResult["map"]) {
    return `data:application/json;charset=utf-8;base64,${b64enc(JSON.stringify(map))}`;
  }

  return {
    name: "react-compiler",
    setup({ onLoad }) {
      onLoad({ filter }, async (args) => {
        const input = await Bun.file(args.path).text();
        const result = await babel.transformAsync(input, {
          filename: args.path,
          plugins: [[BabelPluginReactCompiler, reactCompilerConfig]],
          parserOpts: {
            plugins: ["jsx", "typescript"],
          },
          ast: false,
          sourceMaps: true,
          configFile: false,
          babelrc: false,
        });
        if (result == null) {
          // return { errors: [{ text: 'babel.transformAsync with react compiler plugin returns null' }] }
          return { contents: input, loader: "tsx" };
        }
        const { code, map } = result;
        return { contents: `${code}\n//# sourceMappingURL=${toUrl(map)}`, loader: "tsx" };
      });
    },
  };
}

export default reactCompiler;
