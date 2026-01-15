let pluginModule: any;
try {
  pluginModule = await import('@mo-hhy/opencode-plugin-repo-spec-zero');
} catch {
  // Fallback for local dev or misconfiguration
  console.warn('Failed to load @mo-hhy/opencode-plugin-repo-spec-zero, checking local dist...');
  try {
      // Allow relative loading if mapped locally
      pluginModule = await import('./@mo-hhy/opencode-plugin-repo-spec-zero/dist/index.js');
  } catch (e) {
      console.error('Could not load plugin @mo-hhy/opencode-plugin-repo-spec-zero', e);
  }
}

const plugin = pluginModule?.default ?? pluginModule;
export default plugin;