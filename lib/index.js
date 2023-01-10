const path = require("path");
const { ConcatSource } = require("webpack-sources");

class MiniProgramUniSubRequireWebpackPlugin {
  options = Object.create(null);

  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    compiler.hooks.thisCompilation.tap(
      "MiniProgramUniSubRequireWebpackPlugin",
      (compilation) => {
        const hooks = compilation.hooks;
        hooks.optimizeChunkAssets.tapAsync(
          "MiniProgramUniSubRequireWebpackPlugin",
          (chunks, callback) => {
            chunks.forEach(chunk => {
              const filtersChunk = ["common/main", "common/runtime", "common/vendor", "build~commons/commons"];
              
              if (filtersChunk.some((item) => chunk.id.includes(item))) {
                return;
              }

              const subPackageRoots = this.options && Array.isArray(this.options.subPackageRoots) ? this.options.subPackageRoots : [];

              if (!subPackageRoots.some((item) => (chunk.id.replace(/^\//, "")).startsWith(item.replace(/^\//, "")))) {
                return;
              }

              const subPackageRoot = (subPackageRoots.filter((item) => (chunk.id.replace(/^\//, "")).startsWith(item.replace(/^\//, "")))[0] || "").replace(/^\//, "").replace(/\/$/, "");

              if (!subPackageRoot) {
                return;
              }

              const commonsPath = `${subPackageRoot}/build~commons/commons.js`;
              if (!compilation.assets[commonsPath]) {
                return;
              }

              chunk.files.forEach(file => {
                if (/\.(js|ts)$/.test(file)) {
                  const relativePath = path.relative(path.dirname(file), commonsPath);
                  console.log(relativePath);
                  compilation.assets[file] = new ConcatSource(
                    `;require("${relativePath}");`,
                    '\n',
                    compilation.assets[file]
                  );
                }
              });
            });
        
            callback();
          }
        );
      },
    );
  }
}

module.exports = MiniProgramUniSubRequireWebpackPlugin;
