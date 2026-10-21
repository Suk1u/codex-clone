/* Codex desktop replica — shell behaviour */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ------------------------------------------------------------------ state */

const state = {
  theme: localStorage.getItem('codex-theme') || 'dark',
  view: 'thread',
  pane: 'diff',
  artifactOpen: true,
  model: '5.5 Low',
  approval: 'Auto-review',
};

/* ------------------------------------------------------------------ diff  */

const DIFF = [
  { type: 'file', name: 'src/components/Sidebar.tsx', add: 18, del: 7 },
  { type: 'hunk', text: '@@ -1,9 +1,12 @@' },
  { type: 'ctx', old: 1, new: 1, text: "import { useEffect, useRef, useState } from 'react'" },
  { type: 'ctx', old: 2, new: 2, text: "import { cn } from '@/lib/cn'" },
  { type: 'add', new: 3, text: "import { useResizeObserver } from '@/hooks/useResizeObserver'" },
  { type: 'ctx', old: 3, new: 4, text: "import styles from './Sidebar.module.css'" },
  { type: 'ctx', old: 4, new: 5, text: '' },
  { type: 'ctx', old: 5, new: 6, text: 'export function Sidebar({ children }: SidebarProps) {' },
  { type: 'del', old: 6, text: '  const [collapsed, setCollapsed] = useState(false)' },
  { type: 'add', new: 7, text: '  const [collapsed, setCollapsed] = useState(false)' },
  { type: 'add', new: 8, text: '  const [isResizing, setIsResizing] = useState(false)' },
  { type: 'add', new: 9, text: '  const panelRef = useRef<HTMLDivElement>(null)' },
  { type: 'add', new: 10, text: '' },
  { type: 'add', new: 11, text: '  useResizeObserver(panelRef, () => {' },
  { type: 'add', new: 12, text: '    setIsResizing(true)' },
  { type: 'add', new: 13, text: '    clearTimeout(timer.current)' },
  { type: 'add', new: 14, text: '    timer.current = setTimeout(() => setIsResizing(false), 120)' },
  { type: 'add', new: 15, text: '  })' },
  { type: 'ctx', old: 7, new: 16, text: '' },
  { type: 'ctx', old: 8, new: 17, text: '  return (' },
  { type: 'del', old: 9, text: '    <aside className={cn(styles.sidebar, collapsed && styles.isCollapsed)}>' },
  { type: 'add', new: 18, text: '    <aside' },
  { type: 'add', new: 19, text: '      ref={panelRef}' },
  { type: 'add', new: 20, text: '      data-resizing={isResizing || undefined}' },
  { type: 'add', new: 21, text: '      className={cn(styles.sidebar, collapsed && styles.isCollapsed)}' },
  { type: 'add', new: 22, text: '    >' },
  { type: 'ctx', old: 10, new: 23, text: '      {children}' },
  { type: 'ctx', old: 11, new: 24, text: '    </aside>' },
];

function renderDiff(host = $('#diff-block')) {
  if (!host) return;
  const frag = document.createDocumentFragment();

  for (const row of DIFF) {
    if (row.type === 'file') {
      const el = document.createElement('div');
      el.className = 'diff-file';
      el.innerHTML =
        `<svg class="icon" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-file"/></svg>` +
        `<span>${row.name}</span><span class="composer-spacer"></span>` +
        `<span class="stat-add">+${row.add}</span><span class="stat-del">−${row.del}</span>`;
      frag.appendChild(el);
      continue;
    }
    if (row.type === 'hunk') {
      const el = document.createElement('div');
      el.className = 'diff-line hunk';
      el.innerHTML = `<span class="ln"></span><span class="sign"></span><span class="code">${esc(row.text)}</span>`;
      frag.appendChild(el);
      continue;
    }
    const el = document.createElement('div');
    el.className = 'diff-line ' + (row.type === 'add' ? 'add' : row.type === 'del' ? 'del' : '');
    const n = row.type === 'add' ? row.new : row.type === 'del' ? row.old : row.new;
    const sign = row.type === 'add' ? '+' : row.type === 'del' ? '−' : ' ';
    el.innerHTML = `<span class="ln">${n ?? ''}</span><span class="sign">${sign}</span><span class="code">${esc(row.text) || ' '}</span>`;
    frag.appendChild(el);
  }
  host.replaceChildren(frag);
}

/* ------------------------------------------------------------------ code  */

const SIDEBAR_SRC = `import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { useResizeObserver } from '@/hooks/useResizeObserver'
import styles from './Sidebar.module.css'

type SidebarProps = {
  children: React.ReactNode
  defaultCollapsed?: boolean
}

export function Sidebar({ children, defaultCollapsed = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useResizeObserver(panelRef, () => {
    setIsResizing(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setIsResizing(false), 120)
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <aside
      ref={panelRef}
      data-resizing={isResizing || undefined}
      data-collapsed={collapsed || undefined}
      className={cn(styles.sidebar, collapsed && styles.isCollapsed)}
    >
      {children}
    </aside>
  )
}`;

const KEYWORDS = new Set([
  'import', 'from', 'export', 'function', 'const', 'let', 'var', 'return', 'type',
  'if', 'else', 'for', 'while', 'new', 'await', 'async', 'default', 'true', 'false',
  'null', 'undefined', 'void', 'as', 'of', 'in',
]);

function highlight(line) {
  if (line.trim().startsWith('//')) return `<span class="tok-c">${esc(line)}</span>`;
  let out = '';
  let i = 0;
  const push = (cls, txt) => { out += cls ? `<span class="${cls}">${esc(txt)}</span>` : esc(txt); };
  while (i < line.length) {
    const ch = line[i];
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
      push('tok-s', line.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      push(KEYWORDS.has(word) ? 'tok-k' : /^[A-Z]/.test(word) ? 'tok-f' : '', word);
      i = j;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      push('tok-n', line.slice(i, j));
      i = j;
      continue;
    }
    push('', ch);
    i++;
  }
  return out;
}

function renderCode() {
  const lines = SIDEBAR_SRC.split('\n');
  return lines
    .map((l, idx) => `<div class="code-line"><span class="ln">${idx + 1}</span><span class="src">${highlight(l) || ' '}</span></div>`)
    .join('');
}

/* ------------------------------------------------------------------ panes */

const PREVIEW_HTML = `
  <div class="browser-chrome">
    <svg class="icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3)"><use href="#i-refresh"/></svg>
    <div class="browser-url">
      <svg class="icon" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><use href="#i-shield"/></svg>
      localhost:3000
    </div>
  </div>
  <div class="browser-page">
    <h1>Sidebar</h1>
    <div class="sub">components / Sidebar.tsx — dev preview</div>
    <p>The panel is open. Resize the window and the collapse animation stays on the compositor; the panel
    stops transitioning the moment a resize starts, then settles.</p>
    <p style="color:var(--text-3);font-size:13px">HMR connected · 3 tests passing</p>
  </div>`;

function renderPane(name) {
  const body = $('#artifact-body');
  if (!body) return;
  state.pane = name;
  $$('.art-tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.pane === name)));

  if (name === 'preview') {
    body.innerHTML = PREVIEW_HTML;
  } else if (name === 'code') {
    body.innerHTML = `<div class="code-view">${renderCode()}</div>`;
  } else {
    body.innerHTML = '<div class="diff"></div>';
    renderDiff(body.firstElementChild);
  }
}

/* ------------------------------------------------------------------ utils */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.dataset.show = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.dataset.show = 'false'; }, 1600);
}

/* ------------------------------------------------------------------ theme */

function applyTheme(next) {
  state.theme = next;
  document.documentElement.dataset.theme = next;
  localStorage.setItem('codex-theme', next);
}

/* ------------------------------------------------------------------ menus */

const MENU = {
  model: {
    label: 'Model',
    items: [
      { text: '5.5 Low', desc: 'fast' },
      { text: '5.5 Medium', desc: '' },
      { text: '5.5 High', desc: 'slow' },
      { text: '5.1-Codex-Max', desc: 'long runs' },
      { text: '5.1-Codex-Mini', desc: 'cheap' },
    ],
  },
  approval: {
    label: 'Approval mode',
    items: [
      { text: 'Auto-review', desc: 'asks on risk' },
      { text: 'Read only', desc: 'no writes' },
      { text: 'Full access', desc: 'no prompts' },
    ],
  },
};

let openMenu = null;

function closeMenu() {
  const m = $('#menu');
  m.hidden = true;
  if (openMenu) openMenu.setAttribute('aria-expanded', 'false');
  openMenu = null;
}

function showMenu(kind, anchor) {
  if (openMenu === anchor) { closeMenu(); return; }
  closeMenu();
  const conf = MENU[kind];
  const menu = $('#menu');
  const current = kind === 'model' ? state.model : state.approval;

  menu.innerHTML =
    `<div class="menu-label">${conf.label}</div>` +
    conf.items
      .map(
        (it) =>
          `<button class="menu-item" role="menuitemradio" aria-checked="${it.text === current}" data-value="${esc(it.text)}">` +
          `<span>${esc(it.text)}</span>` +
          (it.desc ? `<span class="desc">${esc(it.desc)}</span>` : '') +
          `<svg class="icon check" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#i-check"/></svg>` +
          `</button>`,
      )
      .join('');

  menu.hidden = false;
  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth;
  const mh = menu.offsetHeight;
  let left = Math.min(r.left, window.innerWidth - mw - 12);
  let top = r.top - mh - 8;
  if (top < 12) top = r.bottom + 8;
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';

  anchor.setAttribute('aria-expanded', 'true');
  openMenu = anchor;

  menu.onclick = (e) => {
    const btn = e.target.closest('.menu-item');
    if (!btn) return;
    const value = btn.dataset.value;
    if (kind === 'model') {
      state.model = value;
      $('#model-label').textContent = value.replace(' ', '\u00a0');
    } else {
      state.approval = value;
      $('#approval-label').textContent = value;
    }
    closeMenu();
  };
}

/* ------------------------------------------------------------------ send  */

function autosize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 200) + 'px';
}

function send() {
  const input = $('#input');
  const text = input.value.trim();
  if (!text) return;

  const thread = $('#thread');
  const user = document.createElement('div');
  user.className = 'turn-user';
  user.textContent = text;
  thread.appendChild(user);

  const think = document.createElement('div');
  think.className = 'thinking';
  think.innerHTML =
    `<svg class="icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-sparkle"/></svg>` +
    `<span>Thinking</span><span class="dots"><i></i><i></i><i></i></span>`;
  thread.appendChild(think);

  input.value = '';
  autosize(input);
  $('#btn-send').disabled = true;
  const scroll = $('#thread-scroll');
  scroll.scrollTop = scroll.scrollHeight;

  setTimeout(() => {
    think.dataset.done = 'true';
    think.innerHTML =
      `<svg class="icon" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-sparkle"/></svg>` +
      `<span>Thought for 3s</span>`;

    const reply = document.createElement('div');
    reply.className = 'assistant';
    reply.innerHTML =
      `<p>On it. I'll read the touched files first, then land the smallest change that holds.</p>`;
    thread.appendChild(reply);

    const tool = document.createElement('div');
    tool.className = 'tool';
    tool.innerHTML =
      `<div class="tool-head">` +
      `<svg class="icon tool-icon" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-terminal"/></svg>` +
      `<span class="tool-title">Ran</span>` +
      `<span class="tool-sub">git status --short</span>` +
      `<span class="tool-status"><span class="dot"></span>exit 0</span></div>` +
      `<pre class="term"> M src/components/Sidebar.tsx\n?? src/components/Sidebar.test.tsx</pre>`;
    thread.appendChild(tool);

    scroll.scrollTop = scroll.scrollHeight;
  }, 900);
}

/* ------------------------------------------------------------------ views */

function showHome() {
  state.view = 'home';
  $('#thread-scroll').hidden = true;
  $('#artifact').hidden = true;
  $('#composer-wrap').hidden = true;
  $('#home').hidden = false;
  $('#surface-title').textContent = 'New chat';
  $$('.thread-row').forEach((r) => r.removeAttribute('aria-current'));
  setTimeout(() => $('#input-home').focus(), 30);
}

function showThread() {
  state.view = 'thread';
  $('#home').hidden = true;
  $('#thread-scroll').hidden = false;
  $('#composer-wrap').hidden = false;
  $('#artifact').hidden = !state.artifactOpen;
  $('#surface-title').textContent = 'Sidebar collapse';
}

/* ------------------------------------------------------------------ wire  */

function init() {
  const params = new URLSearchParams(location.search);
  if (params.get('theme')) state.theme = params.get('theme');
  if (params.get('static') === '1') document.documentElement.classList.add('no-anim');
  applyTheme(state.theme);
  renderDiff();
  renderPane(state.pane);
  autosize($('#input'));
  autosize($('#input-home'));
  if (params.get('view') === 'home') showHome();
  if (params.get('pane')) renderPane(params.get('pane'));
  if (params.get('panel') === 'off') $('#btn-artifact').click();

  $('#btn-theme').addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  $('#btn-sidebar').addEventListener('click', () => {
    const w = $('#window');
    const collapsed = w.dataset.sidebar === 'collapsed';
    w.dataset.sidebar = collapsed ? 'expanded' : 'collapsed';
    $('#btn-sidebar').setAttribute('aria-pressed', String(collapsed));
  });

  $('#btn-artifact').addEventListener('click', () => {
    state.artifactOpen = !state.artifactOpen;
    $('#artifact').hidden = !state.artifactOpen;
    $('#btn-artifact').setAttribute('aria-pressed', String(state.artifactOpen));
  });

  $('#btn-close-artifact').addEventListener('click', () => {
    state.artifactOpen = false;
    $('#artifact').hidden = true;
    $('#btn-artifact').setAttribute('aria-pressed', 'false');
  });

  $$('.art-tab').forEach((tab) => {
    tab.addEventListener('click', () => renderPane(tab.dataset.pane));
  });

  $('#btn-new-chat').addEventListener('click', showHome);

  $$('.thread-row').forEach((row) => {
    row.addEventListener('click', () => {
      $$('.thread-row').forEach((r) => r.removeAttribute('aria-current'));
      row.setAttribute('aria-current', 'true');
      showThread();
      $('#surface-title').textContent = $('.label', row).textContent;
    });
  });

  $('#chip-model').addEventListener('click', (e) => showMenu('model', e.currentTarget));
  $('#chip-approval').addEventListener('click', (e) => showMenu('approval', e.currentTarget));

  document.addEventListener('mousedown', (e) => {
    if (!$('#menu').contains(e.target) && !e.target.closest('.chip')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      $('#btn-sidebar').click();
    }
  });

  const input = $('#input');
  input.addEventListener('input', () => {
    autosize(input);
    $('#btn-send').disabled = input.value.trim().length === 0;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });
  $('#btn-send').addEventListener('click', send);

  const homeInput = $('#input-home');
  homeInput.addEventListener('input', () => autosize(homeInput));

  $$('.home-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      showThread();
      const input = $('#input');
      input.value = chip.textContent.trim();
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
  });

  window.addEventListener('blur', () => ($('#window').dataset.blurred = 'true'));
  window.addEventListener('focus', () => delete $('#window').dataset.blurred);
}

document.addEventListener('DOMContentLoaded', init);
