import {pageTranslator} from '../i18n';
let widgetId = 0;
class SiteCounter extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    let count = Number(this.dataset.start) || 0;
    const button = document.createElement('button');
    const update = () => button.textContent = `${count} ${this.dataset.label ?? 'clicks'}`;
    update(); button.onclick = () => { count++; update(); };
    this.append(button);
  }
}
class SiteNote extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const note = document.createElement('span'); note.id = `note-${++widgetId}`; note.className = 'note-popover'; note.setAttribute('popover', 'auto'); note.textContent = this.dataset.note ?? '';
    const button = document.createElement('button'); button.className = 'note-trigger'; button.textContent = 'ⓘ'; button.setAttribute('aria-label', pageTranslator()('widget.note')); button.setAttribute('popovertarget', note.id);
    this.append(button,note);
  }
}
class SiteTabs extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const panels = [...this.querySelectorAll<HTMLElement>(':scope > section')];
    const bar = document.createElement('div'); bar.className = 'widget-toolbar'; bar.setAttribute('role','tablist'); bar.setAttribute('aria-label',pageTranslator()('widget.tabs'));
    const buttons = panels.map((panel,i) => {
      const button = document.createElement('button'); button.textContent = panel.dataset.label || `Tab ${i+1}`; button.setAttribute('role','tab');
      panel.id = `panel-${++widgetId}`; button.id = `tab-${widgetId}`; panel.classList.add('widget-panel'); panel.setAttribute('role','tabpanel'); panel.setAttribute('aria-labelledby',button.id); button.setAttribute('aria-controls',panel.id);
      button.onclick = () => select(i);
      button.onkeydown = (e) => { if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) { e.preventDefault(); const next = e.key === 'Home' ? 0 : e.key === 'End' ? panels.length-1 : (i+(e.key === 'ArrowRight'?1:-1)+panels.length)%panels.length; select(next); buttons[next].focus(); } };
      bar.append(button); return button;
    });
    const select = (index:number) => panels.forEach((panel,i) => { panel.hidden = i !== index; buttons[i].setAttribute('aria-selected',String(i === index)); buttons[i].tabIndex = i === index ? 0 : -1; });
    this.prepend(bar); select(0);
  }
}
class CodeWizard extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const steps = [...this.querySelectorAll<HTMLElement>(':scope > [data-step-caption]')];
    if (!steps.length) return;
    let index = 0;
    const bar = document.createElement('div'); bar.className = 'widget-toolbar';
    const title = document.createElement('strong'); title.textContent = this.dataset.title || pageTranslator()('widget.walkthrough');
    const caption = document.createElement('span'); caption.className='spacer'; caption.setAttribute('aria-live','polite');
    const previous = document.createElement('button'); previous.textContent = '←'; previous.setAttribute('aria-label',pageTranslator()('widget.previous'));
    const next = document.createElement('button'); next.textContent = '→'; next.setAttribute('aria-label',pageTranslator()('widget.next'));
    const dots = document.createElement('div'); dots.className = 'wizard-steps'; dots.setAttribute('role','group'); dots.setAttribute('aria-label',pageTranslator()('widget.steps'));
    const buttons = steps.map((_, i) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = String(i + 1); button.setAttribute('aria-label', pageTranslator()('widget.step',{count:i+1}));
      button.onclick = () => { index = i; update(); }; dots.append(button); return button;
    });
    const update = () => { steps.forEach((step,i) => { step.hidden = i !== index; buttons[i].setAttribute('aria-pressed',String(i === index)); }); caption.textContent = `${index+1}/${steps.length} · ${steps[index].dataset.stepCaption}`; previous.disabled = index === 0; next.disabled = index === steps.length-1; };
    previous.onclick = () => { index--; update(); }; next.onclick = () => { index++; update(); };
    bar.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault(); index = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : Math.max(0, Math.min(steps.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
      update(); buttons[index].focus();
    });
    bar.append(title,caption,previous,dots,next); this.prepend(bar); update();
  }
}
class MermaidDiagram extends HTMLElement {
  private source = '';
  private revision = 0;
  private theme = '';
  connectedCallback() {
    this.source ||= this.textContent ?? '';
    document.addEventListener('site:preferences', this.preferences);
    this.draw();
  }
  disconnectedCallback() { this.revision++; document.removeEventListener('site:preferences', this.preferences); }
  private preferences = () => { if (this.theme !== document.documentElement.dataset.colorMode) this.draw(); };
  private async draw() {
    const revision = ++this.revision;
    this.theme = document.documentElement.dataset.colorMode || 'dark';
    try {
      const {default:mermaid} = await import('mermaid');
      if (!this.isConnected || revision !== this.revision) return;
      mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:this.theme === 'light' ? 'default':'dark'});
      const {svg} = await mermaid.render(`diagram-${++widgetId}`,this.source);
      if (this.isConnected && revision === this.revision) { this.innerHTML = svg; this.removeAttribute('aria-label'); }
    } catch { if (revision === this.revision) { this.textContent = this.source; this.setAttribute('aria-label',pageTranslator()('widget.diagramSource')); } }
  }
}
class SiteEmbed extends HTMLElement {
  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    const id = this.dataset.id ?? '', provider = this.dataset.provider;
    if (!/^[a-zA-Z0-9_\-/]+$/.test(id)) return;
    if (provider === 'gist') { const link=document.createElement('a'); link.href=`https://gist.github.com/${id}`; link.textContent=pageTranslator()('widget.gist'); link.target='_blank'; link.rel='noopener noreferrer'; this.append(link); return; }
    if (!['youtube','sandbox'].includes(provider || '')) return;
    const load = () => {
      const frame=document.createElement('iframe'); frame.src=provider === 'youtube' ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : `https://codesandbox.io/embed/${id}`; frame.loading='lazy'; frame.title=provider === 'youtube' ? pageTranslator()('widget.video') : pageTranslator()('widget.sandboxTitle'); frame.allowFullscreen=true; frame.allow='autoplay; fullscreen; picture-in-picture'; frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation'); this.className='embed-box'; this.replaceChildren(frame);
    };
    const button=document.createElement('button'); button.className='embed-load'; button.type='button'; button.textContent=provider === 'youtube' ? pageTranslator()('widget.play') : pageTranslator()('widget.sandbox'); button.onclick=load; this.append(button);
  }
}
for (const [name, ctor] of Object.entries({'site-counter':SiteCounter,'site-note':SiteNote,'site-tabs':SiteTabs,'code-wizard':CodeWizard,'mermaid-diagram':MermaidDiagram,'site-embed':SiteEmbed})) if (!customElements.get(name)) customElements.define(name,ctor);

function headingLinks() {
  document.querySelectorAll<HTMLElement>('.content-prose :is(h2,h3,h4,h5,h6)[id]').forEach(heading => {
    if (heading.querySelector('.heading-anchor')) return;
    const anchor=document.createElement('a'); anchor.className='heading-anchor'; anchor.href=`#${encodeURIComponent(heading.id)}`; anchor.setAttribute('aria-label',pageTranslator()('article.headingLink',{title:heading.textContent})); anchor.textContent='#'; heading.append(anchor);
  });
}
headingLinks();
document.addEventListener('astro:page-load', headingLinks);

document.addEventListener('click', async (event) => {
  const target = (event.target as Element).closest<HTMLButtonElement>('button[data-copy-markdown],button[data-terminal-command]');
  if (!target) return;
  if (target.dataset.terminalCommand) { document.dispatchEvent(new CustomEvent('site:terminal',{detail:target.dataset.terminalCommand})); return; }
  const original = target.textContent;
  try {
    const response = await fetch(target.dataset.source!);
    if (!response.ok) throw new Error('Markdown unavailable');
    const markdown = await response.text();
    await navigator.clipboard.writeText(markdown);
    target.textContent = pageTranslator()('article.copied');
  } catch { target.textContent = pageTranslator()('article.copyFailed'); const a = document.createElement('a'); a.href=target.dataset.source!; a.target='_blank'; a.rel='noopener'; a.click(); }
  setTimeout(() => target.textContent=original,2000);
});
