import { build } from 'vite';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
await build({
  configFile: false,
  root,
  publicDir: false,
  plugins: [{name:'standalone-fonts',enforce:'pre',transform(code,id){
    if(id.replaceAll('\\','/').endsWith('/eternal-astrology.css')) return code.replace(/@import '\.\/fonts\/(?:yishan-title|faction-song)\.css';/g,'');
  }}],
  build: {
    outDir: path.resolve(root, '../deploy/astrology-performance-v2/payload'),
    emptyOutDir: false,
    rollupOptions: { input: path.join(root, 'faction-profile.html') },
  },
});
