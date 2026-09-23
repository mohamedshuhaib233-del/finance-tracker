const fs = require('fs');
const path = require('path');

// Vercel, Linux, CI and non-Windows systems run native rollup natively.
// Only run this patch on Windows when needed.
if (process.platform !== 'win32' || process.env.VERCEL || process.env.CI) {
  process.exit(0);
}

const rollupNativePath = path.join(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(rollupNativePath)) {
  let content = fs.readFileSync(rollupNativePath, 'utf8');
  if (!content.includes("@rollup/wasm-node/dist/native.js")) {
    content = content.replace(
      '} catch (error) {',
      `} catch (error) {\n\t\ttry {\n\t\t\treturn require('@rollup/wasm-node/dist/native.js');\n\t\t} catch (wasmErr) {}`
    );
    fs.writeFileSync(rollupNativePath, content, 'utf8');
    console.log('[Sovereign Build] Successfully patched rollup for Windows App Control wasm fallback.');
  }
}

