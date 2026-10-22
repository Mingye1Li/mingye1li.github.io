import { visit } from 'unist-util-visit';
import {contentLocale,languages,defaultLocale} from '../i18n/config.mjs';

/** The same authoring syntax works in both Markdown and MDX. */
export function remarkWidgets() {
  return (tree, file) => {
    const messages=languages[contentLocale(file?.path)].messages.widget ?? {};
    const label=key=>messages[key]??languages[defaultLocale].messages.widget[key]??key;
    visit(tree, (node) => {
      // Keep anchors stable across translated headings: ## 标题 {#original-id}
      if (node.type === 'heading') {
        const last = node.children.at(-1);
        const suffix = last?.type === 'text' && last.value.match(/\s+\{#[^}]+\}$/);
        // Astro's typography pass can turn -- into an em dash. Read the ID
        // from the original source, while removing the transformed suffix.
        const source = file?.value?.toString().slice(node.position?.start.offset, node.position?.end.offset) ?? last?.value;
        const match = source?.match(/\\?\{#([a-zA-Z][\w-]*)\\?\}\s*$/);
        if (suffix && match) {
          last.value = last.value.slice(0, -suffix[0].length);
          node.data ??= {};
          node.data.hProperties = {...node.data.hProperties, id:match[1]};
        }
      }
      if (node.type === 'code' && node.lang === 'mermaid') {
        node.type = 'paragraph';
        node.children = [{ type: 'text', value: node.value }];
        node.data = { hName: 'mermaid-diagram' };
        delete node.value;
      }
      if (!['containerDirective','leafDirective','textDirective'].includes(node.type)) return;
      const a = node.attributes ?? {};
      const data = node.data ??= {};
      data.hProperties = {};
      if (['note','tip','info','warning','danger','caution'].includes(node.name)) {
        data.hName = 'aside'; data.hProperties = { className: ['callout',`callout-${node.name}`], 'data-label': label(node.name === 'note' ? 'noteLabel' : node.name) };
      } else if (node.name === 'details') {
        data.hName = 'details';
        node.children.unshift({ type:'paragraph', data:{hName:'summary'}, children:[{ type:'text', value:a.summary || label('details') }] });
      } else if (node.name === 'counter') {
        data.hName = 'site-counter'; data.hProperties = { 'data-start': a.start || '0', 'data-label': a.label || label('clicks') };
      } else if (node.name === 'pop') {
        data.hName = 'site-note'; data.hProperties = { 'data-note': a.note || '' };
      } else if (node.name === 'tabs') {
        data.hName = 'site-tabs';
      } else if (node.name === 'tab') {
        data.hName = 'section'; data.hProperties = { 'data-label': a.label || label('tab') };
      } else if (node.name === 'magic-move') {
        data.hName = 'code-wizard'; data.hProperties = { 'data-title': a.title || label('walkthrough') };
      } else if (node.name === 'step') {
        data.hName = 'div'; data.hProperties = { 'data-step-caption': a.caption || label('stepCaption') };
      } else if (['youtube','sandbox','gist'].includes(node.name)) {
        data.hName = 'site-embed'; data.hProperties = { 'data-provider': node.name, 'data-id': a.id || '' };
      }
    });
  };
}
export function rehypeDiagrams() {
  return (tree) => visit(tree, 'element', node => {
    if (node.tagName !== 'pre') return;
    const code = node.children?.[0];
    if (code?.properties?.className?.includes('language-mermaid')) {
      node.tagName = 'mermaid-diagram'; node.children = code.children;
    }
  });
}
