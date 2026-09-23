const fs = require('fs');
const path = require('path');

const rollupNativePath = path.join(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes("@rollup/wasm-node/dist/native.js")) {
    content = content.replace(
      'return require(id);',
      `return require(id);\n\t} catch (error) {\n\t\ttry {\n\t\t\treturn require('@rollup/wasm-node/dist/native.js');\n\t\t} catch (e) {}`
    );
    fs.writeFileSync(rollupNativePath, content, 'utf8');
    console.log('[Sovereign Build] Successfully patched rollup for Windows App Control wasm fallback.');
  }
}
