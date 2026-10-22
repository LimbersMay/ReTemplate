import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',

  manifest: {
    name: '__PRODUCT__',
    description: '__DESCRIPTION__',
    version: '0.0.1',

    action: {
      default_popup: './popup/index.html',
    },

    // Every permission has its reason in docs/architecture.md (Permisos). None without it.
    permissions: ['storage'],
  },
});
