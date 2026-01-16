// CommonJS wrapper for ESM module
// This allows `require()` to work correctly with the default export

async function loadPlugin() {
    const mod = await import('./index.js');
    return mod.default || mod.plugin || mod;
}

// For synchronous require, we export a function that loads the ESM module
module.exports = loadPlugin;
module.exports.default = loadPlugin;
module.exports.loadPlugin = loadPlugin;
