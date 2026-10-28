import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [{
    name: 'preload-paper-opening',
    enforce: 'post',
    generateBundle(_, bundle) {
      const paper = Object.values(bundle).find(file => file.type === 'chunk' && file.name === 'paper-opening');
      const home = bundle['index.html'];
      if (!paper || !home) return;
      const files = new Set();
      const gather = file => { if (files.has(file.fileName)) return; files.add(file.fileName); for (const dependency of file.imports) if (bundle[dependency]?.type === 'chunk') gather(bundle[dependency]); };
      gather(paper);
      const links = JSON.stringify([...files].map(file => '/' + file));
      const preload = `<script>{const opening=window.__paperOpening;if(opening?.active){opening.preparing=true;for(const href of ${links}){const link=document.createElement('link');link.rel='modulepreload';link.crossOrigin='';link.href=href;document.head.append(link);}import(${JSON.stringify('/' + paper.fileName)}).then(({playPaperOpening})=>{const play=()=>{if(opening.active)playPaperOpening(document.querySelector('.paper-opening-art'),opening);};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',play,{once:true});else play();}).catch(()=>opening.finish('fallback'));}}</script>`;
      home.source = String(home.source).replace('<script src="/opening-boot.js"></script>', '<script src="/opening-boot.js"></script>' + preload);
    },
  }],
  build: {
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        forme: resolve(import.meta.dirname, 'concepts/forme/index.html'),
        slowtide: resolve(import.meta.dirname, 'concepts/slow-tide/index.html'),
        common: resolve(import.meta.dirname, 'concepts/common-ground/index.html'),
        sora: resolve(import.meta.dirname, 'concepts/sora-reyes/index.html'),
        mara: resolve(import.meta.dirname, 'concepts/mara-solis/index.html'),
        foundry: resolve(import.meta.dirname, 'concepts/foundry-build/index.html'),
        fitness: resolve(import.meta.dirname, 'work/fitness-vault/index.html'),
        faceless: resolve(import.meta.dirname, 'work/the-faceless-prompts/index.html'),
      },
    },
  },
});
