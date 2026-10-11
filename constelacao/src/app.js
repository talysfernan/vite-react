'use strict';
/* =========================================================
   Constelação de ações
   ========================================================= */
const SI = /*SI*/{};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36).slice(-5) + Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clone = o => o == null ? o : JSON.parse(JSON.stringify(o));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const initials = s => String(s || '?').trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
const pad = n => String(n).padStart(2, '0');
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const mAdd = (m, d) => { let [y, mo] = m.split('-').map(Number); mo += d; while (mo > 12) { mo -= 12; y++; } while (mo < 1) { mo += 12; y--; } return `${y}-${pad(mo)}`; };
const mName = m => MONTHS[+m.slice(5) - 1];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const mLong = m => `${cap(mName(m))} ${m.slice(0, 4)}`;
const nowM = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const fmtD = d => d ? d.slice(0, 10).split('-').reverse().slice(0, 2).join('/') : '';
const ago = t => { if (!t) return ''; const s = (Date.now() - t) / 1e3; if (s < 60) return 'agora'; if (s < 3600) return `há ${Math.floor(s / 60)} min`; if (s < 86400) return `há ${Math.floor(s / 3600)} h`; return new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
const money = v => { const n = parseFloat(String(v || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')); return isNaN(n) ? 0 : n; };
const lum = hex => { const m = /^#?([0-9a-f]{6})$/i.exec(hex || ''); if (!m) return .5; const n = parseInt(m[1], 16); return (0.2126 * (n >> 16) + 0.7152 * (n >> 8 & 255) + 0.0722 * (n & 255)) / 255; };
const ink = c => lum(c) > .55 ? '#111113' : '#f4f4f5';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- ícones (mesmo traço dos painéis) ---------- */
const IC = {
  plus: '<path d="M12 5v14M5 12h14"/>', l: '<path d="M15 6l-6 6 6 6"/>', r: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', upc: '<path d="M18 15l-6-6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>', dl: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', ul: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  img: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12l5 5 9-10"/>', cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>', clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>', chat: '<path d="M4 5h16v11H9l-5 4z"/>', play: '<path d="M8 5l11 7-11 7z"/>',
  link: '<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1"/><path d="M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1"/>', file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.2A5.5 5.5 0 0 1 21.5 20"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>', grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>', edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  mega: '<path d="M4 10v4h3l6 4V6L7 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 7a7.5 7.5 0 0 1 0 10"/>', target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".8"/>', bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
  list: '<path d="M9 7h11M9 12h11M9 17h11"/><circle cx="5" cy="7" r=".9"/><circle cx="5" cy="12" r=".9"/><circle cx="5" cy="17" r=".9"/>', note: '<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>', route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h7"/>',
  dot: '<circle cx="12" cy="12" r="5"/>', layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>', branch: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 8v8M8 6c6 0 4 6 8 6"/>',
  zin: '<circle cx="11" cy="11" r="6.5"/><path d="M11 8.5v5M8.5 11h5M20 20l-4.2-4.2"/>', zout: '<circle cx="11" cy="11" r="6.5"/><path d="M8.5 11h5M20 20l-4.2-4.2"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', nofull: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  alert: '<path d="M12 4 3 20h18z"/><path d="M12 10v4M12 17v.01"/>', scale: '<path d="M12 4v16M6 20h12M5 8h14"/><path d="M5 8l-2.5 6a2.5 2.5 0 0 0 5 0zM19 8l-2.5 6a2.5 2.5 0 0 0 5 0z"/>', video: '<rect x="3" y="6" width="13" height="12" rx="2.5"/><path d="M16 10l5-3v10l-5-3"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>', type: '<path d="M5 7V5h14v2M9 19h6M12 5v14"/>', phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17h2"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l3 3"/>',
  shield: '<path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z"/>', chart: '<path d="M4 20V11M10 20V5M16 20v-6M22 20H2"/>', tag: '<path d="M20 12 12 20 4 12V4h8z"/><circle cx="8.5" cy="8.5" r="1.2"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 7l9 6 9-6"/>',
  kanban: '<rect x="4" y="4" width="4.5" height="16" rx="1.5"/><rect x="10" y="4" width="4.5" height="11" rx="1.5"/><rect x="16" y="4" width="4" height="7" rx="1.5"/>', table: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3 10h18M3 15h18M9 5v14"/>', flag: '<path d="M6 21V4M6 4h11l-2 4 2 4H6"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5a13 13 0 0 1 0 17M12 3.5a13 13 0 0 0 0 17"/>', store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5.5 12v8h13v-8"/>', bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  pend: '<path d="M4 12h11M11 8l4 4-4 4M20 5v14"/>', logout: '<path d="M9 20H5V4h4M16 16l4-4-4-4M20 12H9"/>', more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>'
};
const ic = (n, s = '') => `<svg class="i" viewBox="0 0 24 24" style="${s}">${IC[n] || ''}</svg>`;
function flagSVG(c, h = 11) {
  const w = Math.round(h * 1.45);
  if (c === 'US') return `<svg class="flag" width="${w}" height="${h}" viewBox="0 0 19 10" aria-label="Estados Unidos"><rect width="19" height="10" fill="#fff"/>${[0, 2, 4, 6, 8].map(y => `<rect y="${y * 10 / 13 * 1.3}" width="19" height="0.77" fill="#b22234"/>`).join('')}<rect y="${10 - 0.77}" width="19" height="0.77" fill="#b22234"/><rect width="7.6" height="5.4" fill="#3c3b6e"/></svg>`;
  return `<svg class="flag" width="${w}" height="${h}" viewBox="0 0 20 14" aria-label="Brasil"><rect width="20" height="14" fill="#009c3b"/><path d="M10 1.6 18.2 7 10 12.4 1.8 7z" fill="#ffdf00"/><circle cx="10" cy="7" r="3.1" fill="#002776"/><path d="M7.1 6.3q3-1 5.8.6" stroke="#fff" stroke-width=".55" fill="none"/></svg>`;
}

/* ---------- biblioteca de logos (canais e lojas) ---------- */
const XTRA = {
  email: ['E-mail', '#a78bfa', 'I:mail'], site: ['Site', '#60a5fa', 'I:globe'], loja: ['Loja própria', '#a78bfa', 'I:store'], live: ['Live', '#f87171', 'I:video'], sms: ['SMS', '#22d3ee', 'I:phone'], evento: ['Evento', '#facc15', 'I:star'], b2b: ['B2B', '#22d3ee', 'I:box'], pdv: ['PDV / varejo', '#4ade80', 'I:bag'],
  mercadolivre: ['Mercado Livre', '#FFE600', 'T:ML'], tiktokshop: ['TikTok Shop', '#000000', 'SI:tiktok'], magalu: ['Magalu', '#0086FF', 'T:mgl'], kwai: ['Kwai', '#FF7A00', 'T:K'], petz: ['Petz', '#00A1E0', 'T:Pz'], cobasi: ['Cobasi', '#0067B1', 'T:Cb'], chewy: ['Chewy', '#1C49C2', 'T:ch'], temu: ['Temu', '#FB7701', 'T:T'], petlove: ['Petlove', '#7B2CBF', 'T:Pl'], americanas: ['Americanas', '#E60014', 'T:a'], carrefour: ['Carrefour', '#004E9F', 'T:C']
};
function logoSvg(key, fg) {
  if (!key) return ic('dot');
  if (key.startsWith('data:')) return `<img src="${esc(key)}" alt="">`;
  if (SI[key]) return `<svg viewBox="0 0 24 24" fill="${fg || '#fff'}"><path d="${SI[key][2]}"/></svg>`;
  const x = XTRA[key]; if (!x) return ic('dot');
  if (x[2].startsWith('I:')) return `<svg class="i" viewBox="0 0 24 24" style="stroke:${fg || '#fff'};width:62%;height:62%">${IC[x[2].slice(2)]}</svg>`;
  if (x[2].startsWith('SI:')) return logoSvg(x[2].slice(3), fg);
  const t = x[2].slice(2);
  return `<svg viewBox="0 0 24 24"><text x="12" y="16.5" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="700" font-size="${t.length > 2 ? 9 : t.length > 1 ? 11 : 14}" fill="${fg || '#fff'}">${esc(t)}</text></svg>`;
}
const LIB_KEYS = [...Object.keys(SI), ...Object.keys(XTRA)];
const libName = k => (SI[k] || XTRA[k] || [k])[0];
const libColor = k => (SI[k] || XTRA[k] || [0, '#85858e'])[1];

/* ---------- tipos de estrela ---------- */
const KINDS = {
  marco: { n: 'Marco', d: 'Ponto de ancoragem / bifurcação', ic: 'dot', round: 1 },
  periodo: { n: 'Período', d: 'Janela do mês (ex.: Black Friday)', ic: 'cal', stretch: 1 },
  etapa: { n: 'Trilho', d: 'Tarefa que estica até finalizar', ic: 'route', stretch: 1 },
  plano: { n: 'Plano', d: 'Frente de trabalho', ic: 'layers' },
  acao: { n: 'Ação', d: 'Uma entrega', ic: 'check' },
  reuniao: { n: 'Reunião', d: 'Encontro do time', ic: 'users' },
  campanha: { n: 'Campanha', d: 'Ativação / campanha', ic: 'mega', round: 1, c: '#fb923c' },
  conteudo: { n: 'Conteúdo', d: 'Peça, vídeo, post', ic: 'play', round: 1, c: '#22d3ee' },
  meta: { n: 'Meta', d: 'Objetivo / KPI', ic: 'target', round: 1, c: '#4ade80' },
  ideia: { n: 'Ideia', d: 'Para amadurecer', ic: 'bulb', round: 1, c: '#facc15' },
  canal: { n: 'Canal', d: 'TikTok, Instagram, e-mail…', reg: 'channels', ic: 'phone', round: 1 },
  loja: { n: 'Loja', d: 'Amazon, Mercado Livre…', reg: 'stores', ic: 'store' },
  marca: { n: 'Marca', d: 'Marca do grupo', reg: 'brands', ic: 'star' },
  time: { n: 'Time', d: 'Time responsável', reg: 'teams', ic: 'users' },
  pessoa: { n: 'Pessoa', d: 'Alguém do time', reg: 'people', ic: 'user', round: 1 },
  quadro: { n: 'Quadro', d: 'Documento / quadro', ic: 'file' },
  lista: { n: 'Lista', d: 'Lista de itens', ic: 'list' },
  nota: { n: 'Nota', d: 'Anotação livre', ic: 'note' }
};
const KGROUPS = [['Linha do mês', ['marco', 'periodo', 'etapa']], ['Estrelas', ['plano', 'acao', 'reuniao', 'campanha', 'conteudo', 'meta', 'ideia']], ['Quem e onde', ['canal', 'loja', 'marca', 'time', 'pessoa']], ['Quadros', ['quadro', 'lista', 'nota']]];
const KBAR = ['marco', 'periodo', 'etapa', 'plano', 'acao', 'reuniao', 'canal'];
const STATUS = { ideia: ['Ideia', '#85858e', 'w'], planejado: ['Planejado', '#60a5fa', 'b'], andamento: ['Em andamento', '#fb923c', 'o'], travado: ['Travado', '#f87171', 'r'], feito: ['Feito', '#4ade80', 'g'] };
const PRIO = { baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente' };
const PALETTE = ['#a78bfa', '#facc15', '#4ade80', '#9dd0cd', '#22d3ee', '#f472b6', '#fb923c', '#60a5fa', '#f87171', '#f4f4f5'];

/* ---------- quadros do card ---------- */
const BCATS = { 'Planejamento': '#a78bfa', 'Conteúdo': '#22d3ee', 'Campanha e mídia': '#fb923c', 'Pessoas e times': '#f472b6', 'Estratégia e números': '#4ade80', 'Genéricos': '#e7e7ea' };
const BLOCKS = [
  { t: 'checklist', c: 'Planejamento', n: 'Checklist', ic: 'check', check: 1 },
  { t: 'marcos', c: 'Planejamento', n: 'Marcos e prazos', ic: 'flag', rows: [['o', 'Marco', 'text', 2], ['d', 'Data', 'date'], ['p', 'Quem', 'person'], ['ok', 'Feito', 'bool']] },
  { t: 'riscos', c: 'Planejamento', n: 'Riscos', ic: 'alert', rows: [['r', 'Risco', 'text', 2], ['i', 'Impacto', 'sel:Baixo|Médio|Alto'], ['m', 'Plano B', 'text', 2]] },
  { t: 'decisoes', c: 'Planejamento', n: 'Decisões', ic: 'scale', rows: [['d', 'Decisão', 'text', 2], ['q', 'Quem', 'person'], ['dt', 'Data', 'date']] },
  { t: 'dependencias', c: 'Planejamento', n: 'Dependências', ic: 'link', rows: [['o', 'Depende de', 'text', 2], ['p', 'Quem destrava', 'person'], ['ok', 'Ok', 'bool']] },
  { t: 'roteiro', c: 'Conteúdo', n: 'Roteiro', ic: 'video', fields: [['gancho', 'Gancho (primeiros 3s)', 'textarea', 2], ['formato', 'Formato', 'sel:Reels|TikTok|Shorts|Stories|Carrossel|Live|UGC|VSL|Anúncio'], ['dur', 'Duração', 'text']], rows: [['cena', 'Cena', 'text'], ['fala', 'Fala / texto na tela', 'textarea', 2], ['visual', 'Visual / ação', 'textarea', 2], ['t', 'Tempo', 'text']], after: [['cta', 'CTA final', 'text', 2]] },
  { t: 'pauta', c: 'Conteúdo', n: 'Pauta / briefing', ic: 'file', fields: [['obj', 'Objetivo', 'textarea', 2], ['pub', 'Público', 'text'], ['tom', 'Tom de voz', 'text'], ['msg', 'Mensagem-chave', 'textarea', 2], ['cta', 'CTA', 'text'], ['prazo', 'Prazo', 'date'], ['ref', 'Referências', 'textarea', 2]] },
  { t: 'post', c: 'Conteúdo', n: 'Post social', ic: 'phone', fields: [['rede', 'Canal', 'channel'], ['formato', 'Formato', 'sel:Feed|Carrossel|Reels|Stories|TikTok|Shorts|Live|Pin'], ['data', 'Publicação', 'datetime'], ['st', 'Status', 'sel:Ideia|Roteiro|Gravação|Edição|Aprovação|Agendado|Publicado'], ['legenda', 'Legenda', 'textarea', 2], ['tags', 'Hashtags', 'text', 2], ['link', 'Link', 'url', 2]] },
  { t: 'editorial', c: 'Conteúdo', n: 'Calendário editorial', ic: 'cal', rows: [['d', 'Data', 'date'], ['rede', 'Canal', 'channel'], ['tema', 'Tema', 'text', 2], ['p', 'Quem', 'person'], ['st', 'Status', 'sel:Ideia|Produção|Aprovação|Agendado|Publicado']] },
  { t: 'copy', c: 'Conteúdo', n: 'Copy e legendas', ic: 'type', rows: [['v', 'Versão', 'text'], ['uso', 'Onde usar', 'text'], ['txt', 'Texto', 'textarea', 2]] },
  { t: 'design', c: 'Conteúdo', n: 'Briefing de design', ic: 'pen', fields: [['peca', 'Peças', 'textarea', 2], ['medidas', 'Formatos / medidas', 'text'], ['p', 'Designer', 'person'], ['entrega', 'Entrega', 'date'], ['ref', 'Referências', 'textarea', 2]] },
  { t: 'campanha', c: 'Campanha e mídia', n: 'Campanha', ic: 'mega', fields: [['obj', 'Objetivo', 'textarea', 2], ['kpi', 'KPI principal', 'text'], ['meta', 'Meta', 'text'], ['verba', 'Verba', 'money'], ['pub', 'Público', 'text'], ['ini', 'Início', 'date'], ['fim', 'Fim', 'date'], ['oferta', 'Oferta / mecânica', 'textarea', 2]] },
  { t: 'midia', c: 'Campanha e mídia', n: 'Mídia paga', ic: 'chart', rows: [['canal', 'Canal', 'channel'], ['camp', 'Campanha / conjunto', 'text'], ['verba', 'Verba', 'money'], ['st', 'Status', 'sel:Planejado|Ativo|Pausado|Encerrado']], sum: 'verba' },
  { t: 'influ', c: 'Campanha e mídia', n: 'Influenciadores', ic: 'star', rows: [['nome', 'Nome', 'text'], ['arroba', '@', 'text'], ['rede', 'Canal', 'channel'], ['cache', 'Cachê', 'money'], ['entrega', 'Entrega', 'text'], ['st', 'Status', 'sel:Prospect|Contato|Negociação|Fechado|Entregue|Pago']], sum: 'cache' },
  { t: 'crm', c: 'Campanha e mídia', n: 'E-mail / CRM', ic: 'mail', fields: [['assunto', 'Assunto', 'text', 2], ['pre', 'Pré-header', 'text', 2], ['seg', 'Segmento', 'text'], ['envio', 'Envio', 'datetime'], ['corpo', 'Corpo', 'textarea', 2]] },
  { t: 'promo', c: 'Campanha e mídia', n: 'Promoção / cupom', ic: 'tag', fields: [['cupom', 'Cupom', 'text'], ['desc', 'Desconto', 'text'], ['ini', 'Início', 'date'], ['fim', 'Fim', 'date'], ['regras', 'Regras', 'textarea', 2]] },
  { t: 'funcao', c: 'Pessoas e times', n: 'Função / papel', ic: 'key', fields: [['papel', 'Papel', 'text'], ['p', 'Quem', 'person'], ['resp', 'Responsabilidades', 'textarea', 2], ['entregas', 'Entregas', 'textarea', 2]] },
  { t: 'vaga', c: 'Pessoas e times', n: 'Nova pessoa', ic: 'user', fields: [['cargo', 'Cargo', 'text'], ['time', 'Time', 'team'], ['modelo', 'Modelo', 'sel:CLT|PJ|Freela|Estágio|Agência|Parceria'], ['st', 'Status', 'sel:Aberta|Triagem|Entrevistas|Proposta|Contratado'], ['perfil', 'Perfil', 'textarea', 2]], rows: [['nome', 'Candidato', 'text'], ['link', 'Link', 'url'], ['nota', 'Nota', 'text', 2]] },
  { t: 'raci', c: 'Pessoas e times', n: 'Matriz RACI', ic: 'grid', rows: [['tarefa', 'Tarefa', 'text', 2], ['r', 'Responsável', 'person'], ['a', 'Aprovador', 'person'], ['c', 'Consultado', 'text'], ['i', 'Informado', 'text']] },
  { t: 'ata', c: 'Pessoas e times', n: 'Reunião / ata', ic: 'chat', fields: [['quando', 'Quando', 'datetime'], ['onde', 'Onde / link', 'text'], ['pauta', 'Pauta', 'textarea', 2]], rows: [['enc', 'Encaminhamento', 'text', 2], ['p', 'Quem', 'person'], ['d', 'Prazo', 'date'], ['ok', 'Feito', 'bool']] },
  { t: 'estrategia', c: 'Estratégia e números', n: 'Estratégia', ic: 'route', fields: [['ctx', 'Contexto', 'textarea', 2], ['hip', 'Hipótese', 'textarea', 2], ['tat', 'Táticas', 'textarea', 2], ['med', 'Como medir', 'textarea', 2]] },
  { t: 'kpis', c: 'Estratégia e números', n: 'KPIs e metas', ic: 'target', rows: [['k', 'Métrica', 'text', 2], ['meta', 'Meta', 'text'], ['atual', 'Atual', 'text']] },
  { t: 'orcamento', c: 'Estratégia e números', n: 'Orçamento', ic: 'money', rows: [['item', 'Item', 'text', 2], ['v', 'Valor', 'money'], ['pago', 'Pago', 'bool']], sum: 'v' },
  { t: 'swot', c: 'Estratégia e números', n: 'SWOT', ic: 'grid', fields: [['s', 'Forças', 'textarea'], ['w', 'Fraquezas', 'textarea'], ['o', 'Oportunidades', 'textarea'], ['t', 'Ameaças', 'textarea']] },
  { t: 'concorrencia', c: 'Estratégia e números', n: 'Concorrência', ic: 'shield', rows: [['nome', 'Concorrente', 'text'], ['preco', 'Preço', 'text'], ['canal', 'Onde vende', 'text'], ['obs', 'Observação', 'text', 2]] },
  { t: 'produto', c: 'Estratégia e números', n: 'Produto / SKU', ic: 'box', rows: [['sku', 'SKU / produto', 'text', 2], ['preco', 'Preço', 'money'], ['est', 'Estoque', 'text'], ['loja', 'Loja', 'channel']] },
  { t: 'texto', c: 'Genéricos', n: 'Texto livre', ic: 'type', fields: [['txt', '', 'textarea', 2]] },
  { t: 'lista', c: 'Genéricos', n: 'Lista', ic: 'list', rows: [['t', 'Item', 'text', 2]] },
  { t: 'tabela', c: 'Genéricos', n: 'Tabela', ic: 'table', custom: 1 },
  { t: 'campos', c: 'Genéricos', n: 'Campos', ic: 'layers', rows: [['k', 'Campo', 'text'], ['v', 'Valor', 'text', 2]] },
  { t: 'links', c: 'Genéricos', n: 'Links e arquivos', ic: 'link', rows: [['t', 'Título', 'text'], ['u', 'Link', 'url', 2]] },
  { t: 'kanban', c: 'Genéricos', n: 'Mini kanban', ic: 'kanban', rows: [['item', 'Item', 'text', 2], ['p', 'Quem', 'person'], ['st', 'Coluna', 'sel:A fazer|Fazendo|Revisão|Feito']] }
];
const BT = Object.fromEntries(BLOCKS.map(b => [b.t, b]));
const SUGGEST = { reuniao: 'ata', campanha: 'campanha', conteudo: 'roteiro', meta: 'kpis', acao: 'checklist', plano: 'checklist', canal: 'editorial', loja: 'produto', pessoa: 'funcao', time: 'raci', quadro: 'texto', lista: 'lista', etapa: 'checklist', periodo: 'campanha', ideia: 'texto' };

/* =========================================================
   Dados e sincronização (mesmo servidor dos outros painéis)
   ========================================================= */
const S = { role: null, name: '', board: 'br', docs: {}, since: 0, ready: false };
const ui = { view: 'mapa', month: nowM(), brand: 'all', person: '', team: '', status: '', sel: null, selEdge: null, branch: true, full: false };
const store = { saving: false, lastSave: 0, error: '' };
const B = () => S.board;
const isAdmin = () => S.role === 'admin';
const pending = new Map();
let flushT = 0, flushing = false, saveErr = 0;
async function req(path, opt = {}) {
  const r = await fetch(path, { credentials: 'same-origin', ...opt, headers: { 'content-type': 'application/json', ...(opt.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (r.status === 401) { lockScreen(); throw new Error('login'); }
  if (!r.ok) throw new Error(d.error || ('HTTP ' + r.status));
  return d;
}
const UNDO = [], REDO = [];
let lastRec = 0, recOpen = false;
function record(path, before, after) {
  const now = Date.now(); let g = UNDO[UNDO.length - 1];
  if (!g || !recOpen || now - lastRec > 900) { g = { ops: new Map() }; UNDO.push(g); if (UNDO.length > 120) UNDO.shift(); recOpen = true; }
  if (!g.ops.has(path)) g.ops.set(path, { before: clone(before) });
  g.ops.get(path).after = clone(after); lastRec = now; REDO.length = 0;
  setTimeout(() => recOpen = false, 0);
}
function put(path, body, before, noRec) {
  if (before === undefined) before = S.docs[path];
  if (!noRec) record(path, before ?? null, body);
  if (body == null) delete S.docs[path]; else S.docs[path] = body;
  pending.set(path, body ?? null);
  clearTimeout(flushT); flushT = setTimeout(flush, 350); store.saving = true; paintSave();
}
function edit(path, fn) { const before = clone(S.docs[path]); const nb = clone(S.docs[path]) || {}; fn(nb); nb.upd = Date.now(); nb.by = S.name; put(path, nb, before); return nb; }
function undo(redo) {
  const st = redo ? REDO : UNDO, g = st.pop(); if (!g) return toast(redo ? 'Nada para refazer' : 'Nada para desfazer');
  for (const [p, o] of g.ops) put(p, clone(redo ? o.after : o.before), undefined, true);
  (redo ? UNDO : REDO).push(g); recOpen = false;
  refresh(); if (ED.id) { if (!N(ED.id)) closeModal(); else renderCard(); }
  toast(redo ? 'Refeito' : 'Desfeito');
}
async function flush() {
  if (flushing || !pending.size) return;
  flushing = true;
  const ops = [...pending].map(([path, body]) => ({ path, body })); pending.clear();
  try {
    for (let i = 0; i < ops.length; i += 400) await req('/api/docs', { method: 'POST', body: JSON.stringify({ ops: ops.slice(i, i + 400) }) });
    saveErr = 0; store.error = ''; store.lastSave = Date.now();
  } catch (e) {
    if (/administrador/.test(e.message)) { store.error = ''; toast(e.message, 'r'); }
    else { for (const o of ops) if (!pending.has(o.path)) pending.set(o.path, o.body); saveErr++; store.error = 'Sem conexão — tentando de novo'; setTimeout(flush, Math.min(15000, 1000 * 2 ** saveErr)); }
  } finally { flushing = false; store.saving = pending.size > 0; paintSave(); if (pending.size && !saveErr) flush(); }
}
async function poll() {
  if (document.hidden || !S.ready) return;
  try {
    const d = await req('/api/changes?since=' + S.since); S.since = d.now; let ch = false;
    for (const [p, b] of Object.entries(d.docs || {})) {
      if (pending.has(p) || JSON.stringify(S.docs[p]) === JSON.stringify(b)) continue;
      if (b === null) delete S.docs[p]; else S.docs[p] = b; ch = true;
    }
    if (ch && !G && !DG) { refresh(); if (ED.id && !$('#scrim')?.contains(document.activeElement)) { if (!N(ED.id)) closeModal(); else renderCard(); } }
  } catch (e) { }
}
addEventListener('beforeunload', e => { if (pending.size) { flush(); e.preventDefault(); e.returnValue = ''; } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); else flush(); });
function paintSave() {
  const el = $('#savest'); if (!el) return;
  const t = ts => ts ? new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  el.innerHTML = store.error ? `<span class="dot r"></span>${esc(store.error)}` : store.saving ? `<span class="dot b"></span>Salvando…` : `<span class="dot g"></span>Servidor${store.lastSave ? ' · salvo ' + t(store.lastSave) : ' · sincronizado'}`;
}

/* ---------- cadastros (compartilhados entre os países) ---------- */
const REG0 = {
  people: [],
  teams: [{ id: 't_mkt', name: 'Marketing', color: '#f472b6' }, { id: 't_com', name: 'Comercial', color: '#22d3ee' }, { id: 't_ops', name: 'Operações', color: '#4ade80' }, { id: 't_des', name: 'Design', color: '#a78bfa' }, { id: 't_dir', name: 'Diretoria', color: '#facc15' }],
  brands: [{ id: 'b_coco', name: 'Coco & Luna', color: '#f472b6' }, { id: 'b_yuc', name: 'Yucaloo', color: '#4ade80' }],
  channels: ['tiktok', 'instagram', 'youtube', 'facebook', 'whatsapp', 'pinterest', 'email', 'site'].map(k => ({ id: 'c_' + k, name: libName(k), color: k === 'tiktok' ? '#f472b6' : libColor(k), icon: k })),
  stores: ['amazon', 'mercadolivre', 'shopee', 'tiktokshop', 'shopify', 'walmart'].map(k => ({ id: 's_' + k, name: libName(k), color: libColor(k), icon: k }))
};
const REGN = { people: 'Pessoas', teams: 'Times', brands: 'Marcas', channels: 'Canais', stores: 'Lojas' };
const SING = { people: 'pessoa', teams: 'time', brands: 'marca', channels: 'canal', stores: 'loja' };
const reg = k => (S.docs['app/reg.' + k] || {}).items || REG0[k];
const regItem = (k, id) => reg(k).find(x => x.id === id);
const saveReg = (k, items) => put('app/reg.' + k, { items, upd: Date.now() });
const BCFG0 = { br: { country: 'BR' }, us: { country: 'US' } };
const cfg = () => ({ title: { text: 'Constelação de ações', color: '#26262b', size: 15 }, logo: '', logoSize: 90, detail: true, ...BCFG0[B()], ...(S.docs['app/board.' + B()] || {}) });
const countryName = () => cfg().country === 'US' ? 'Estados Unidos' : 'Brasil';
const flagHere = (h = 11) => flagSVG(cfg().country === 'US' ? 'US' : 'BR', h);
function setCfg(k, v) { const p = 'app/board.' + B(); const cur = { ...(S.docs[p] || {}) }; cur[k] = v; put(p, cur); }

/* ---------- estrelas e ligações ---------- */
const NP = id => `node/${B()}.${id}`, EP = id => `edge/${B()}.${id}`;
const N = id => S.docs[NP(id)], E = id => S.docs[EP(id)];
const allNodes = () => { const p = `node/${B()}.`; return Object.entries(S.docs).filter(([k, v]) => k.startsWith(p) && v).map(([, v]) => v); };
const allEdges = () => { const p = `edge/${B()}.`; return Object.entries(S.docs).filter(([k, v]) => k.startsWith(p) && v).map(([, v]) => v); };
const monthNodes = (m = ui.month) => allNodes().filter(n => n.m === m);
const label = n => n.title || (KINDS[n.k].reg ? (regItem(KINDS[n.k].reg, n.ref) || {}).name : '') || KINDS[n.k].n;
function tally(n) {
  let t = 0, d = 0;
  for (const b of n.blocks || []) {
    const D = b.data || {}, def = BT[b.t] || {};
    if (def.check) for (const it of D.items || []) { t++; if (it.ok) d++; }
    const hasOk = def.rows?.some(c => c[0] === 'ok');
    for (const r of D.rows || []) { if (hasOk) { t++; if (r.ok) d++; } else if (b.t === 'kanban') { t++; if (r.st === 'Feito') d++; } }
  }
  return { t, d };
}
function progress(n) { if (n.status === 'feito') return 1; const { t, d } = tally(n); return t ? d / t : 0; }
const nodeEdges = id => allEdges().filter(e => e.a === id || e.b === id);
function descendants(id, seen = new Set([id])) {
  const out = [];
  for (const e of allEdges()) if (e.a === id && !seen.has(e.b)) { const c = N(e.b); if (!c || c.m !== N(id).m || c.spine) continue; seen.add(e.b); out.push(e.b, ...descendants(e.b, seen)); }
  return out;
}
function logIt(n, txt) { n.log = [{ t: Date.now(), by: S.name, txt }, ...(n.log || [])].slice(0, 40); }
function createNode(kind, x, y, o = {}) {
  const K = KINDS[kind], id = uid();
  const spine = o.spine ?? (Math.abs(y) < 40);
  const n = { id, b: B(), m: o.m || ui.month, k: kind, title: o.title || '', x: Math.round(x), y: spine ? 0 : Math.round(y), spine, status: 'planejado', blocks: [], created: Date.now(), by: S.name, upd: Date.now() };
  if (K.stretch) n.w = kind === 'periodo' ? 240 : 300;
  if (kind === 'plano' || kind === 'etapa') n.color = PALETTE[monthNodes().filter(z => z.k === kind).length % (PALETTE.length - 1)];
  if (K.reg) n.ref = (reg(K.reg)[0] || {}).id || '';
  if (ui.brand !== 'all') n.brands = [ui.brand];
  if (SUGGEST[kind] && o.blocks !== false) n.blocks = [newBlock(SUGGEST[kind])];
  Object.assign(n, o.extra || {});
  logIt(n, 'criou');
  put(NP(id), n, null);
  if (o.parent) createEdge(o.parent, id);
  ENTER.add(id);
  return n;
}
function createEdge(a, b, extra = {}) {
  if (a === b) return;
  if (allEdges().some(e => (e.a === a && e.b === b) || (e.a === b && e.b === a))) return toast('Essas estrelas já estão ligadas');
  const id = uid(); put(EP(id), { id, a, b, style: 'auto', ...extra, created: Date.now() }, null); NEWE.add(id); return id;
}
function delNode(id) {
  if (!N(id)) return;
  for (const e of nodeEdges(id)) put(EP(e.id), null);
  put(NP(id), null);
  if (ui.sel === id) ui.sel = null;
}
function newBlock(t) {
  const d = BT[t], b = { id: uid(), t, data: {} };
  if (d.check) b.data.items = [];
  if (d.rows) b.data.rows = [];
  if (d.custom) { b.data.cols = [{ k: 'c1', l: 'Coluna 1' }, { k: 'c2', l: 'Coluna 2' }]; b.data.rows = []; }
  return b;
}
function dup(id) {
  const n = N(id); if (!n) return;
  const c = clone(n); c.id = uid(); c.x += 40; c.y = c.spine ? 0 : c.y + 40; c.created = Date.now(); c.by = S.name; c.log = []; logIt(c, 'duplicou de “' + label(n) + '”');
  (c.blocks || []).forEach(b => b.id = uid());
  put(NP(c.id), c, null); ENTER.add(c.id); ui.sel = c.id; refresh();
}
function carry(id, m, mode) {
  const n = N(id); if (!n || m === n.m) return;
  if (mode === 'move') { for (const cid of [id, ...descendants(id)]) edit(NP(cid), x => { x.m = m; if (cid === id) logIt(x, 'moveu para ' + mName(m)); }); ui.sel = null; refresh(); toast(`Movida para ${mName(m)}`, 'g'); return; }
  const c = clone(n); c.id = uid(); c.m = m; c.status = n.status === 'travado' ? 'travado' : 'planejado'; c.from = n.id; c.created = Date.now(); c.by = S.name; c.log = []; logIt(c, 'continua de ' + mName(n.m));
  (c.blocks || []).forEach(b => b.id = uid());
  put(NP(c.id), c, null); createEdge(n.id, c.id, { label: 'continua', bridge: 1 }); refresh();
  toast(`Continuação criada em ${mName(m)}`, 'g');
}

/* =========================================================
   Filtros e números
   ========================================================= */
function matches(n) {
  const has = (arr, v) => (arr || []).includes(v);
  if (ui.brand !== 'all' && !(has(n.brands, ui.brand) || (n.k === 'marca' && n.ref === ui.brand))) return false;
  if (ui.person && !(has(n.people, ui.person) || (n.k === 'pessoa' && n.ref === ui.person) || (n.blocks || []).some(b => (b.data?.items || []).some(i => i.p === ui.person) || (b.data?.rows || []).some(r => Object.values(r).includes(ui.person))))) return false;
  if (ui.team && !(has(n.teams, ui.team) || (n.k === 'time' && n.ref === ui.team))) return false;
  if (ui.status && (n.status || 'planejado') !== ui.status) return false;
  return true;
}
const filtering = () => ui.brand !== 'all' || ui.person || ui.team || ui.status;
const STRUCT = new Set(['marco', 'periodo', 'nota']);
function monthStats(m = ui.month) {
  const ns = monthNodes(m).filter(n => !STRUCT.has(n.k));
  const c = k => ns.filter(n => (n.status || 'planejado') === k).length;
  const ppl = new Set(); ns.forEach(n => (n.people || []).forEach(p => ppl.add(p)));
  const late = ns.filter(n => n.due && n.due < today() && n.status !== 'feito').length;
  const bridges = allEdges().filter(e => { const a = N(e.a), b = N(e.b); return a && b && a.m !== b.m && (a.m === m || b.m === m); }).length;
  return { total: ns.length, done: c('feito'), open: c('andamento'), stuck: c('travado'), plan: c('planejado') + c('ideia'), ppl: ppl.size, late, bridges };
}

/* =========================================================
   Layout principal (mesma estrutura dos painéis)
   ========================================================= */
function titlePillHTML() {
  const t = cfg().title || {}; if (!String(t.text || '').trim()) return '';
  const c = t.color || '#26262b', L = lum(c), fs = t.size || 15;
  return `<span class="title-pill" style="background:${c};color:${L > .6 ? '#111113' : '#f4f4f5'};font-size:${fs}px;padding:${Math.round(fs * .45)}px ${Math.round(fs * 1.05)}px;box-shadow:0 0 ${Math.round(fs * 1.6)}px ${c}55">${esc(t.text)}</span>`;
}
function render() {
  closePop(); hideTip();
  const c = cfg();
  const views = [['mapa', 'Constelação'], ['ano', 'Ano'], ['lista', 'Lista']];
  const counts = { all: monthNodes().filter(n => !STRUCT.has(n.k)).length };
  reg('brands').forEach(b => counts[b.id] = monthNodes().filter(n => (n.brands || []).includes(b.id) && !STRUCT.has(n.k)).length);
  $('#app').innerHTML = `
  ${c.logo ? `<div class="hero"><img src="${esc(c.logo)}" alt="Logo" id="hero-logo" style="height:${c.logoSize}px"></div>` : ''}
  <div class="titlebar" id="titlebar">${titlePillHTML()}</div>
  <header class="top">
    <div class="top-l"><nav class="seg">${views.map(([k, l]) => `<button class="pill ${ui.view === k ? 'on' : ''}" data-act="view" data-v="${k}">${l}</button>`).join('')}</nav></div>
    <div class="month" id="topc">${ui.view === 'set' ? `<span class="sub">${S.open ? 'Ajustes' : `${ic('unlock', 'width:13px;height:13px')} modo administrador`}</span>` : ui.view === 'ano' ? `<button class="pill icon" data-act="y-prev" aria-label="Ano anterior">${ic('l')}</button><button class="month-btn" data-act="noop">${ic('cal', 'color:var(--muted)')}${ui.month.slice(0, 4)}</button><button class="pill icon" data-act="y-next" aria-label="Próximo ano">${ic('r')}</button>` : `<button class="pill icon" data-act="m-prev" aria-label="Mês anterior">${ic('l')}</button><button class="month-btn" data-act="mpick">${ic('cal', 'color:var(--muted)')}${mLong(ui.month)}${ic('down', 'width:14px;color:var(--muted)')}</button><button class="pill icon" data-act="m-next" aria-label="Próximo mês">${ic('r')}</button>`}</div>
    <div class="top-r"><div class="save-st" id="savest"></div></div>
  </header>
  <div class="brandbar">
    <button class="pill sm ${ui.brand === 'all' ? 'on' : ''}" data-act="brand" data-v="all"><span class="dot w"></span>Todas as marcas <span class="dim">${counts.all}</span></button>
    ${reg('brands').map(b => `<button class="pill sm ${ui.brand === b.id ? 'on' : ''}" data-act="brand" data-v="${b.id}"><span class="dot" style="background:${b.color};box-shadow:0 0 10px ${b.color}80"></span>${flagHere()}${esc(b.name)} <span class="dim">${counts[b.id] || 0}</span></button>`).join('')}
    <span class="sp"></span><button class="pill sm ghost" data-act="country" title="Trocar de país">${flagHere()}constelação · ${esc(countryName())}${ic('down', 'width:12px')}</button></div>
  <main id="main"></main>`;
  renderMain();
  paintSave();
  $('#gearfab').hidden = false; $('#gearfab').classList.toggle('on', ui.view === 'set');
  document.body.classList.toggle('nodetail', c.detail === false);
}
function renderMain() {
  const V = { mapa: viewMapa, ano: viewAno, lista: viewLista, set: viewSet }[ui.view] || viewMapa;
  $('#main').innerHTML = `<div class="view">${V()}</div>`;
  if (ui.view === 'mapa') mountCanvas();
  else { cv = null; if (selTb) { selTb.remove(); selTb = null; } }
  if (ui.view === 'set') loadBackupList();
}
// atualização leve depois de mudanças de dados (sem recriar a página)
function refresh() {
  if (!S.ready) return;
  if (ui.view === 'mapa') { const k = $('#kpis'); if (k) k.outerHTML = kpiHTML(true); paintFoot(); renderWorld(); const pb = $('#pendbtn'); if (pb) pb.outerHTML = pendBtnHTML(); }
  else if (ui.view === 'lista') { const t = $('#ltable'); if (t) t.innerHTML = listTableHTML(); }
  else if (ui.view === 'ano') renderMain();
  paintSave();
}
function kpiHTML(still) {
  const s = monthStats();
  const L = [['Estrelas no mês', s.total, `${s.plan} planejadas · ${s.bridges} ponte${s.bridges === 1 ? '' : 's'}`, 'w'], ['Concluídas', s.done, s.total ? `${Math.round(s.done / s.total * 100)}% do mês` : '—', 'g'], ['Em andamento', s.open, s.late ? `${s.late} com prazo vencido` : 'nenhuma atrasada', 'o'], ['Travadas', s.stuck, s.stuck ? 'precisam de atenção' : 'nada travado', 'r'], ['Pessoas envolvidas', s.ppl, `${reg('people').length} cadastradas`, 'b']];
  return `<div class="kpis k5" id="kpis">${L.map(([k, v, sub, d], i) => `<div class="node kpi ${still ? '' : 'rise'}" style="--d:${i}"><div class="k"><span class="dot ${d}"></span>${k}</div><div class="v num">${v}</div><div class="d">${sub}</div></div>`).join('')}</div>`;
}
function pendBtnHTML() {
  const prev = mAdd(ui.month, -1), n = monthNodes(prev).filter(x => x.status !== 'feito' && !STRUCT.has(x.k)).length;
  return n ? `<button class="pill" id="pendbtn" data-act="pend">${ic('pend')}Pendências de ${mName(prev)} <span class="bcount">${n}</span></button>` : `<span id="pendbtn"></span>`;
}
function selectHTML(key, lbl, list, all) {
  return `<label class="field op-sel"><span>${lbl}</span><select class="inp sm" data-ui="${key}"><option value="">${all}</option>${list.map(o => `<option value="${o.id}" ${ui[key] === o.id ? 'selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>`;
}

/* ---------- visão: Constelação ---------- */
function viewMapa() {
  return `${kpiHTML()}
  <div class="op-head mt">
    <div class="label" style="margin:0"><span class="dot"></span>Constelação de ${mName(ui.month)} <span class="dim">· arraste uma estrela para o palco, ou toque nela e puxe o +</span></div>
    <div class="op-acts">${pendBtnHTML()}
      ${selectHTML('person', 'Pessoa', reg('people'), 'Todas')}${selectHTML('team', 'Time', reg('teams'), 'Todos')}
      <label class="field op-sel" style="width:150px"><span>Status</span><select class="inp sm" data-ui="status"><option value="">Todos</option>${Object.entries(STATUS).map(([k, [l]]) => `<option value="${k}" ${ui.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <button class="pill white" data-act="new-star">${ic('plus')}Nova estrela</button></div>
  </div>
  <div class="node tree-node cvcard rise${ui.full ? ' full' : ''}" id="cvcard" style="--d:1">
    <div class="cv-top">
      <div class="kbar" id="kbar">${KBAR.map(k => `<button class="pill sm" data-dk="${k}" title="${KINDS[k].n} — arraste para o palco, ou toque e depois toque no palco"><span class="kg">${kGlyph(k)}</span><span class="kl">${KINDS[k].n}</span></button>`).join('')}<button class="pill sm" data-act="kinds" title="Todas as estrelas">${ic('grid')}<span class="kl">Mais</span></button></div>
      <span class="sp"></span>
      <button class="pill sm icon" data-act="undo" title="Desfazer (Ctrl+Z)">${ic('undo')}</button><button class="pill sm icon" data-act="redo" title="Refazer">${ic('redo')}</button>
      <div class="seg zseg"><button class="pill sm icon" data-act="zout" title="Afastar">${ic('zout')}</button><button class="pill sm" id="zl" data-act="fit" title="Enquadrar o mês (F)">100%</button><button class="pill sm icon" data-act="zin" title="Aproximar">${ic('zin')}</button></div>
      <button class="pill sm icon ${ui.branch ? 'on' : ''}" data-act="branch" title="Arrastar o ramo junto">${ic('branch')}</button>
      <button class="pill sm icon" data-act="full" title="Tela cheia">${ic(ui.full ? 'nofull' : 'full')}</button>
    </div>
    <div class="cv" id="cv">
      <div id="world"><svg id="wires" width="1" height="1"><g id="gspine"></g><g id="gedges"></g><g id="gtmp"></g></svg><div id="spx"></div><div id="ghosts"></div><div id="nodes"></div></div>
      <div class="cv-empty off" id="cvempty"></div>
    </div>
    <div class="tree-foot"><div class="tf-row" id="cvfoot"></div></div>
  </div>`;
}
function paintFoot() {
  const el = $('#cvfoot'); if (!el) return;
  const s = monthStats();
  el.innerHTML = `<span class="legend">${Object.entries(STATUS).map(([k, [l, c]]) => `<span><i style="background:${c}"></i>${l}</span>`).join('')}<span><i style="background:transparent;border:1px dashed #a78bfa"></i>ponte entre meses</span></span>
    <span class="sp"></span><span class="metab"><span class="hint">concluído no mês</span><b class="num ${s.total && s.done === s.total ? 'pos' : ''}">${s.done}/${s.total}</b><span class="mbar"><i style="width:${s.total ? s.done / s.total * 100 : 0}%;background:${s.total && s.done === s.total ? '#4ade80' : '#f4f4f5'}"></i></span></span>`;
}
function kGlyph(k) {
  const g = {
    marco: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="#141416" stroke="currentColor" stroke-width="1.8"/><circle cx="7" cy="7" r="1.8" fill="currentColor"/></svg>',
    periodo: '<svg width="20" height="12" viewBox="0 0 20 12"><path d="M1 6V1.5h18V6" stroke="currentColor" stroke-width="1.3" fill="none"/><rect x="1" y="8" width="18" height="3.5" fill="#facc15"/><path d="M4 8l-3 3.5M8 8l-3 3.5M12 8l-3 3.5M16 8l-3 3.5M20 8l-3 3.5" stroke="#111" stroke-width="1.3"/></svg>',
    etapa: '<svg width="20" height="10" viewBox="0 0 20 10"><rect x=".8" y=".8" width="18.4" height="8.4" rx="4.2" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="2" width="9" height="6" rx="3" fill="#a78bfa"/></svg>',
    plano: '<svg width="20" height="10" viewBox="0 0 20 10"><rect x=".8" y=".8" width="18.4" height="8.4" rx="4.2" fill="#a78bfa" stroke="currentColor" stroke-width="1.4"/></svg>',
    acao: '<svg width="18" height="8" viewBox="0 0 18 8"><rect width="18" height="8" rx="4" fill="currentColor"/></svg>',
    reuniao: '<svg width="20" height="10" viewBox="0 0 20 10"><rect x=".8" y=".8" width="18.4" height="8.4" rx="4.2" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
    canal: '<svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#f472b6" stroke="currentColor" stroke-width="1.3"/></svg>'
  };
  return g[k] || ic(KINDS[k].ic, 'width:14px;height:14px');
}

/* ---------- visão: Ano ---------- */
function viewAno() {
  const yr = +ui.month.slice(0, 4);
  let cards = '';
  for (let i = 0; i < 12; i++) {
    const m = `${yr}-${pad(i + 1)}`, ns = monthNodes(m), s = monthStats(m);
    cards += `<button class="node ycard ${m === nowM() ? 'cur' : ''}" style="--d:${i}" data-act="goto-m" data-v="${m}"><div class="yh"><b>${MONTHS[i]}</b>${m === nowM() ? '<span class="tag">agora</span>' : s.bridges ? `<span class="tag v">${s.bridges} ponte${s.bridges > 1 ? 's' : ''}</span>` : ''}</div>${miniConstellation(ns)}<div class="yf"><span>${s.total ? `${s.total} estrelas` : 'vazio'}</span><span class="mbar"><i style="width:${s.total ? s.done / s.total * 100 : 0}%;background:#4ade80"></i></span><span>${s.total ? Math.round(s.done / s.total * 100) + '%' : ''}</span></div></button>`;
  }
  const br = allEdges().filter(e => { const a = N(e.a), b = N(e.b); return a && b && a.m !== b.m && (a.m.startsWith(yr) || b.m.startsWith(yr)); }).sort((x, y) => N(x.a).m.localeCompare(N(y.a).m));
  return `<div class="between mb"><div><h1>Constelação de ${yr}</h1><div class="sub">Cada mês com sua linha central. As pontes mostram ações que continuam ou se complementam entre meses.</div></div></div>
  <div class="ygrid">${cards}</div>
  <div class="mt2 rise" style="--d:3"><div class="label"><span class="dot v"></span>Pontes entre meses · ${br.length}</div>
  <div class="node pad">${br.length ? `<div class="stat-list ybridges">${br.map(e => { const a = N(e.a), b = N(e.b); return `<div class="li" data-act="focus" data-v="${b.id}"><span class="lk"><span class="tag">${cap(mName(a.m))}</span> ${esc(label(a))} ${ic('arrow', 'width:13px;height:13px;vertical-align:-2px')} <span class="tag v">${cap(mName(b.m))}</span> ${esc(label(b))}</span><span class="dim">${esc(e.label || '')}</span></div>`; }).join('')}</div>` : `<div class="empty"><h3>Nenhuma ponte ainda</h3>No card de uma estrela, use “Continuar em outro mês” — ou traga as pendências do mês anterior.</div>`}</div></div>`;
}
function miniConstellation(ns) {
  const W = 240, H = 110, mid = 62;
  if (!ns.length) return `<svg viewBox="0 0 ${W} ${H}"><line x1="10" x2="${W - 10}" y1="${mid}" y2="${mid}" stroke="#2a2a30" stroke-width="2" stroke-linecap="round"/></svg>`;
  const { min, max } = spineExt(ns);
  const P = n => ({ x: 10 + (n.x - min) / (max - min) * (W - 20), y: mid + clamp(n.y * .1, -46, 44) });
  const ids = new Set(ns.map(n => n.id));
  let s = `<line x1="10" x2="${W - 10}" y1="${mid}" y2="${mid}" stroke="#36363d" stroke-width="2" stroke-linecap="round"/>`;
  const done = ns.filter(n => n.spine && n.status === 'feito').map(n => P(n).x);
  if (done.length) s += `<line x1="10" x2="${Math.max(...done)}" y1="${mid}" y2="${mid}" stroke="#f4f4f5" stroke-width="2" stroke-linecap="round"/>`;
  for (const e of allEdges()) if (ids.has(e.a) && ids.has(e.b)) { const a = P(N(e.a)), b = P(N(e.b)); s += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#f4f4f5" stroke-opacity=".35" stroke-width="1"/>`; }
  for (const n of ns) { const p = P(n), col = n.status === 'feito' ? '#4ade80' : n.color || KINDS[n.k].c || '#f4f4f5'; s += `<circle cx="${p.x}" cy="${p.y}" r="${n.spine ? 3.6 : n.k === 'plano' ? 3.2 : 2.2}" fill="${col}"/>`; }
  return `<svg viewBox="0 0 ${W} ${H}">${s}</svg>`;
}

/* ---------- visão: Lista ---------- */
function viewLista() {
  return `<div class="between mb"><div><h1>Estrelas · ${mLong(ui.month)}</h1><div class="sub">Tudo o que está na constelação do mês, com dono, prazo e andamento.</div></div><div class="op-acts">${selectHTML('person', 'Pessoa', reg('people'), 'Todas')}${selectHTML('team', 'Time', reg('teams'), 'Todos')}</div></div>
  <div class="node pad scroll-x rise" id="ltable">${listTableHTML()}</div>`;
}
function listTableHTML() {
  const ns = monthNodes().filter(n => !STRUCT.has(n.k) && matches(n)).sort((a, b) => (a.due || '9').localeCompare(b.due || '9') || a.x - b.x);
  if (!ns.length) return `<div class="empty"><h3>Nada por aqui</h3>Crie estrelas na Constelação — elas aparecem aqui como lista.</div>`;
  return `<table class="tbl"><thead><tr><th>Estrela</th><th style="text-align:left">Status</th><th style="text-align:left">Responsáveis</th><th style="text-align:left">Times · marcas</th><th>Prazo</th><th>Andamento</th></tr></thead><tbody>${ns.map(n => {
    const st = STATUS[n.status || 'planejado'], { t, d } = tally(n), late = n.due && n.due < today() && n.status !== 'feito';
    return `<tr class="click" data-act="open" data-v="${n.id}"><td><span class="nm"><span class="kg" style="color:var(--text-2)">${kGlyph(n.k)}</span>${esc(label(n))}${label(n) !== KINDS[n.k].n ? `<span class="dim">${KINDS[n.k].n}</span>` : ''}</span></td>
    <td style="text-align:left"><span class="row" style="gap:7px"><span class="dot ${st[2]}"></span>${st[0]}</span></td>
    <td style="text-align:left">${avStack(n.people) || '<span class="dim">—</span>'}</td>
    <td style="text-align:left"><span class="row" style="gap:6px;flex-wrap:wrap">${[...(n.teams || []).map(id => regItem('teams', id)), ...(n.brands || []).map(id => regItem('brands', id))].filter(Boolean).map(x => `<span class="tag"><span class="dot" style="background:${x.color}"></span>${esc(x.name)}</span>`).join('') || '<span class="dim">—</span>'}</span></td>
    <td class="${late ? 'neg' : ''}">${n.due ? fmtD(n.due) : '<span class="dim">—</span>'}</td>
    <td><span class="metab" style="justify-content:flex-end">${t ? `<span class="hint num">${d}/${t}</span>` : ''}<span class="mbar"><i style="width:${progress(n) * 100}%;background:${n.status === 'feito' ? '#4ade80' : '#f4f4f5'}"></i></span></span></td></tr>`;
  }).join('')}</tbody></table>`;
}
function avStack(ids, max = 4) {
  const ps = (ids || []).map(id => regItem('people', id)).filter(Boolean);
  if (!ps.length) return '';
  return `<span class="row" style="gap:0">${ps.slice(0, max).map((p, i) => `<span class="av c" style="--c:${p.color || '#a78bfa'};${i ? 'margin-left:-6px;' : ''}" title="${esc(p.name)}">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name))}</span>`).join('')}${ps.length > max ? `<span class="av" style="margin-left:-6px">+${ps.length - max}</span>` : ''}</span>`;
}

/* =========================================================
   Palco: câmera, desenho e gestos
   ========================================================= */
const cam = { x: 0, y: 0, k: 1 };
let cv = null, world, nodesEl, gE, gS, gT;
const EL = new Map(), SIG = new Map(), SZ = {}, ENTER = new Set(), NEWE = new Set();
let firstDraw = true;
function mountCanvas() {
  cv = $('#cv'); world = $('#world'); nodesEl = $('#nodes'); gE = $('#gedges'); gS = $('#gspine'); gT = $('#gtmp');
  EL.clear(); SIG.clear(); firstDraw = true;
  for (const n of monthNodes()) ENTER.add(n.id);
  renderWorld(); paintFoot();
  let c = null; try { c = JSON.parse(localStorage.getItem(camKey())); } catch (e) { }
  if (c && c.k) { Object.assign(cam, c); applyCam(); } else fit(false);
  bindCanvas();
  document.body.classList.toggle('cvfull', ui.full);
}
const camKey = () => `cst.cam.${B()}.${ui.month}`;
function applyCam(fly) {
  if (!world || !cv) return;
  world.classList.toggle('fly', !!fly);
  world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.k})`;
  const g = 20 * cam.k, card = $('#cvcard');
  if (card) { card.style.backgroundSize = `${g}px ${g}px,100% 100%`; card.style.backgroundPosition = `${cam.x % g}px ${(cam.y + cv.offsetTop) % g}px,0 0`; }
  cv.classList.toggle('far', cam.k < .5);
  const zl = $('#zl'); if (zl) zl.textContent = Math.round(cam.k * 100) + '%';
  if (fly) setTimeout(() => world?.classList.remove('fly'), 700);
  clearTimeout(applyCam.t); applyCam.t = setTimeout(() => { try { localStorage.setItem(camKey(), JSON.stringify(cam)); } catch (e) { } }, 400);
  posSelTb();
}
const cvR = () => cv.getBoundingClientRect();
const toWorld = (cx, cy) => { const r = cvR(); return { x: (cx - r.left - cam.x) / cam.k, y: (cy - r.top - cam.y) / cam.k }; };
const toScreen = (wx, wy) => { const r = cvR(); return { x: wx * cam.k + cam.x + r.left, y: wy * cam.k + cam.y + r.top }; };
function zoomAt(cx, cy, f, fly) {
  const r = cvR(), k = clamp(cam.k * f, .15, 2.6), w = toWorld(cx, cy);
  cam.k = k; cam.x = cx - r.left - w.x * k; cam.y = cy - r.top - w.y * k; applyCam(fly);
}
function spineExt(ns = monthNodes()) {
  let min = -760, max = 760;
  for (const n of ns) { const s = SZ[n.id] || { w: 60 }; min = Math.min(min, n.x - s.w / 2 - 200); max = Math.max(max, n.x + s.w / 2 + 200); }
  return { min, max };
}
function titleY(ns) {
  let top = 0;
  for (const n of ns) { const s = SZ[n.id] || { h: 40 }; top = Math.min(top, n.y - s.h / 2 - (n.k === 'periodo' ? 60 : 0) - (KINDS[n.k].round || n.k === 'loja' ? 6 : 0)); }
  return Math.min(-210, top - 80);
}
function fit(fly = true) {
  if (!cv) return;
  const ns = monthNodes(), W = cv.clientWidth, H = cv.clientHeight, sp = spineExt(ns);
  const a = sp.min - (GH.some(g => g.side < 0) ? 170 : 0), c = sp.max + (GH.some(g => g.side > 0) ? 170 : 0);
  let b = titleY(ns) - 40, d = 120;
  for (const n of ns) { const s = SZ[n.id] || { w: 60, h: 40 }; b = Math.min(b, n.y - s.h / 2 - 20); d = Math.max(d, n.y + s.h / 2 + 50); }
  let k = clamp(Math.min((W - 40) / (c - a), (H - 30) / (d - b)), .15, 1.2);
  if (W < 700) k = Math.max(k, Math.min(.45, (H - 30) / (d - b)));
  cam.k = k; cam.x = W / 2 - (a + c) / 2 * k; cam.y = H / 2 - (b + d) / 2 * k;
  applyCam(fly);
}
function focusNode(id, open) {
  const n = N(id); if (!n) return;
  const go = () => requestAnimationFrame(() => {
    if (!cv) return;
    const k = Math.max(cam.k, .9); cam.k = k; cam.x = cv.clientWidth / 2 - n.x * k; cam.y = cv.clientHeight / 2 - n.y * k; applyCam(true);
    ui.sel = id; renderWorld();
    const el = EL.get(id); if (el) { el.classList.remove('hl'); void el.offsetWidth; el.classList.add('hl'); }
    if (!ui.full) cv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (open) setTimeout(() => openCard(id), 350);
  });
  if (n.m !== ui.month || ui.view !== 'mapa') { ui.month = n.m; ui.view = 'mapa'; saveUi(); render(); }
  go();
}

/* ---------- desenho das estrelas ---------- */
function smeta(n) {
  let h = '';
  const ps = (n.people || []).map(id => regItem('people', id)).filter(Boolean);
  h += ps.slice(0, 3).map(p => `<span class="av c" style="--c:${p.color || '#a78bfa'}">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name))}</span>`).join('');
  if (ps.length > 3) h += `<span class="av">+${ps.length - 3}</span>`;
  h += (n.brands || []).map(id => regItem('brands', id)).filter(Boolean).map(b => `<span class="bd" style="background:${b.color};box-shadow:0 0 6px ${b.color}"></span>`).join('');
  if (n.due) h += `<span class="dchip ${n.due < today() && n.status !== 'feito' ? 'o' : 'm'}">até ${fmtD(n.due)}</span>`;
  return h ? `<div class="smeta">${h}</div>` : '';
}
function starHTML(n, preview) {
  const K = KINDS[n.k], st = n.status || 'planejado', L = esc(label(n)), R = K.reg ? regItem(K.reg, n.ref) : null;
  const c = n.color || R?.color || K.c || '';
  let inner = '', lab = '', extra = '', cls = '';
  const { t, d } = tally(n), p = progress(n);
  const chk = ic('check', 'width:11px;height:11px;stroke-width:2.6');
  switch (n.k) {
    case 'plano': {
      const prog = t > 0 && st !== 'feito', badge = t > 0 || st === 'feito';
      cls = (prog ? ' prog' : '') + (badge ? ' badge' : '');
      inner = `${prog ? '<span class="tp-fill"></span>' : ''}${badge ? `<span class="tp-b">${st === 'feito' ? chk : `${d}/${t}`}</span>` : ''}<span class="tp-h">${L}</span>`; break;
    }
    case 'etapa': inner = `<span class="tp-fill"></span><span class="tp-b">${st === 'feito' ? chk : t ? `${d}/${t}` : Math.round(p * 100) + '%'}</span><span class="tp-h">${L}</span>${t ? `<span class="pct">${Math.round(p * 100)}%</span>` : ''}`; extra = '<i class="grip l"></i><i class="grip r"></i>'; break;
    case 'acao': inner = `${st !== 'planejado' && st !== 'feito' ? `<span class="dot ${STATUS[st][2]}"></span>` : ''}${L}`; break;
    case 'reuniao': inner = `${ic('users')}${L}`; break;
    case 'marco': lab = n.title ? `<div class="lab">${L}</div>` : ''; break;
    case 'periodo': extra = `<i class="brk"></i><div class="plab">${st !== 'planejado' ? `<span class="dot ${STATUS[st][2]}"></span>` : ''}${L}</div><i class="grip l"></i><i class="grip r"></i>`; break;
    case 'canal': inner = logoSvg(R?.icon, ink(c || '#f472b6')); lab = `<div class="lab">${L}</div>`; break;
    case 'campanha': case 'conteudo': case 'meta': case 'ideia': inner = ic(K.ic); lab = `<div class="lab">${L}</div>`; break;
    case 'loja': inner = R?.wide ? `<img class="wide" src="${esc(R.wide)}" alt="">` : `<span class="lg">${logoSvg(R?.icon, R?.color || '#f4f4f5')}</span>${L}`; break;
    case 'marca': inner = R?.logo ? `<img src="${esc(R.logo)}" alt="">${L}` : `<span class="dot" style="background:${c || '#f4f4f5'};box-shadow:0 0 10px ${c || '#ffffff'}80"></span>${L}`; break;
    case 'time': { const mem = reg('people').filter(x => x.team === n.ref).slice(0, 3); inner = mem.length ? mem.map(x => `<span class="av c" style="--c:${x.color || c || '#a78bfa'}">${esc(initials(x.name))}</span>`).join('') : `<span class="av c" style="--c:${c || '#a78bfa'}">${ic('users', 'width:13px;height:13px')}</span>`; lab = `<div class="lab">${L}</div>`; break; }
    case 'pessoa': inner = `<span class="av c" style="--c:${c || '#a78bfa'}">${R?.photo ? `<img src="${esc(R.photo)}" alt="">` : esc(initials(R?.name || n.title))}</span>`; lab = `<div class="lab">${L}</div>`; break;
    case 'quadro': case 'lista': inner = ic(K.ic); lab = `<div class="lab">${L}</div>`; break;
    case 'nota': inner = esc(n.title || n.desc || 'Nota'); break;
  }
  const badge = preview || ['plano', 'etapa', 'acao', 'periodo'].includes(n.k) ? '' : st === 'feito' ? `<span class="sbadge ok">${ic('check')}</span>` : st !== 'planejado' ? `<span class="sbadge dot ${STATUS[st][2]}" style="color:${STATUS[st][1]}"></span>` : '';
  const style = `${c ? `--c:${c};--ink:${ink(c)};--bc:${c};` : '--ink:#111113;'}${K.stretch ? `width:${n.w || 300}px;` : ''}--p:${Math.round(p * 100)}%`;
  return {
    html: `<div class="sn-in"><div class="shp" style="${style}">${inner}${badge}</div>${lab}${extra}${preview || cfg().detail === false ? '' : smeta(n)}${preview ? '' : `<b class="knob" title="Arraste para ligar · toque para criar um ramo">${ic('plus')}</b>`}</div>`,
    cls: `sn k-${n.k}${cls}${lab ? ' has-lab' : ''}${st === 'feito' ? ' done' : ''}`
  };
}
function renderWorld() {
  if (!cv || !S.ready || !document.body.contains(cv)) return;
  const ns = monthNodes(), seen = new Set(), fl = filtering();
  for (const n of ns) {
    seen.add(n.id);
    let el = EL.get(n.id);
    const sh = starHTML(n), sig = sh.html + sh.cls;
    if (!el) { el = document.createElement('div'); el.dataset.id = n.id; nodesEl.appendChild(el); EL.set(n.id, el); }
    if (SIG.get(n.id) !== sig) { el.innerHTML = sh.html; SIG.set(n.id, sig); el.className = sh.cls; }
    el.classList.toggle('sel', ui.sel === n.id);
    el.classList.toggle('dim', !!fl && !matches(n));
    if (ENTER.has(n.id)) { ENTER.delete(n.id); const cl = firstDraw ? 'enter' : 'fresh'; el.classList.add(cl); setTimeout(() => el.classList.remove(cl), 1400); }
    el.style.transform = `translate(${n.x}px,${n.y}px) translate(-50%,-50%)`;
  }
  for (const [id, el] of EL) if (!seen.has(id)) { EL.delete(id); SIG.delete(id); el.classList.add('leave'); setTimeout(() => el.remove(), 300); }
  for (const n of ns) { const s = EL.get(n.id).querySelector('.shp'); SZ[n.id] = { w: s.offsetWidth, h: s.offsetHeight }; }
  renderSpine(ns); renderGhosts(ns); drawEdges();
  const em = $('#cvempty');
  if (em) { em.classList.toggle('off', ns.length > 0); em.innerHTML = `<b style="color:var(--text)">${cap(mName(ui.month))} ainda está vazio.</b><br><span class="muted">Arraste um marco, plano ou ação da barra acima para a linha, ou toque no + branco no início da linha.</span>`; }
  posSelTb();
  if (firstDraw && !reduced()) { $$('#gspine .sp-base,#gspine .sp-done').forEach(p => drawIn(p, 900, 0)); $$('#gedges .e').forEach((p, i) => drawIn(p, 650, 250 + Math.min(i, 40) * 30)); }
  firstDraw = false;
}
function drawIn(p, dur, delay) {
  const len = Math.ceil(p.getTotalLength?.() || 0) + 2; if (len < 3 || !p.animate) return;
  p.style.strokeDasharray = len;
  const a = p.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: dur, delay, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
  a.onfinish = () => (p.style.strokeDasharray = '');
}
function renderSpine(ns) {
  const { min, max } = spineExt(ns);
  let dx = min;
  for (const n of ns) if (n.spine && n.status === 'feito') dx = Math.max(dx, n.x);
  const s = monthStats(), ty = titleY(ns);
  gS.innerHTML = `<line class="sp-glow" id="spglow" x1="${min}" x2="${max}" y1="0" y2="0"/>
    <path class="sp-base" d="M${min} 0H${max}"/>${dx > min ? `<path class="sp-done" d="M${min} 0H${dx}"/>` : ''}
    <text class="sp-cap" x="${min + 28}" y="30">início</text><text class="sp-cap" x="${max - 22}" y="30" text-anchor="end">fim do mês</text>`;
  $('#spx').innerHTML = `<button class="tstart" data-act="spine-add" style="left:${min}px;top:0" aria-label="Nova estrela na linha" title="Nova estrela na linha">${ic('plus')}</button>
    <span class="tend" style="left:${max}px;top:0" title="Estrelas na linha central">${ns.filter(n => n.spine).length}</span>
    <div class="mlabel" style="left:${(min + max) / 2}px;top:${ty}px">${esc(mName(ui.month))}<span class="mbar"><i style="width:${s.total ? s.done / s.total * 100 : 0}%;background:#f4f4f5"></i></span><small>${s.total ? Math.round(s.done / s.total * 100) : 0}%</small></div>`;
}
let GH = [];
function renderGhosts(ns) {
  const ids = new Set(ns.map(n => n.id)), { min, max } = spineExt(ns), inc = [], out = [];
  for (const e of allEdges()) {
    const ia = ids.has(e.a), ib = ids.has(e.b); if (ia === ib) continue;
    const loc = ia ? e.a : e.b, oth = N(ia ? e.b : e.a); if (!oth) continue;
    (oth.m < ui.month ? inc : out).push({ e, loc, oth });
  }
  GH = [];
  const mk = (arr, side) => arr.map((g, i) => { const x = side < 0 ? min - 110 : max + 110, y = -58 - i * 40; GH.push({ ...g, x, y, side }); return `<div class="bghost" data-goto="${g.oth.id}" style="left:${x}px;top:${y}px" title="${esc(mLong(g.oth.m))}"><b>${side < 0 ? '↩ ' : ''}${mName(g.oth.m)}${side > 0 ? ' ↪' : ''}</b><span>${esc(label(g.oth))}</span></div>`; }).join('');
  $('#ghosts').innerHTML = mk(inc, -1) + mk(out, 1);
}
function clipPt(c, s, tx, ty, round) {
  const dx = tx - c.x, dy = ty - c.y; if (!dx && !dy) return { x: c.x, y: c.y };
  if (round) { const r = Math.min(s.w, s.h) / 2 + 1, L = Math.hypot(dx, dy); return { x: c.x + dx / L * r, y: c.y + dy / L * r }; }
  const hw = s.w / 2 + 1, hh = s.h / 2 + 1, t = Math.min(dx ? hw / Math.abs(dx) : Infinity, dy ? hh / Math.abs(dy) : Infinity);
  return { x: c.x + dx * t, y: c.y + dy * t };
}
function edgePath(a, b, sa, sb, style, ra, rb) {
  const dx = b.x - a.x, dy = b.y - a.y;
  if (style === 'auto') style = (Math.abs(dx) < 14 || Math.abs(dy) < 14) ? 'reta' : (a.spine !== b.spine) ? 'curva' : 'reta';
  if (style === 'curva') {
    const f = a.spine || !b.spine, P = f ? a : b, Q = f ? b : a, sP = f ? sa : sb, sQ = f ? sb : sa, rP = f ? ra : rb, rQ = f ? rb : ra;
    const ctrl = { x: Q.x, y: P.y }, p1 = clipPt(P, sP, ctrl.x, ctrl.y, rP), p2 = clipPt(Q, sQ, ctrl.x, ctrl.y, rQ);
    return { d: `M${p1.x} ${p1.y}Q${ctrl.x} ${ctrl.y} ${p2.x} ${p2.y}`, m: { x: (p1.x + 2 * ctrl.x + p2.x) / 4, y: (p1.y + 2 * ctrl.y + p2.y) / 4 } };
  }
  if (style === 'cotovelo') {
    const corner = { x: a.x, y: b.y }, p1 = clipPt(a, sa, corner.x, corner.y, ra), p2 = clipPt(b, sb, corner.x, corner.y, rb);
    const r = Math.min(16, Math.abs(p2.x - corner.x), Math.abs(corner.y - p1.y)), sy = Math.sign(corner.y - p1.y) || 1, sx = Math.sign(p2.x - corner.x) || 1;
    return { d: `M${p1.x} ${p1.y}V${corner.y - sy * r}Q${corner.x} ${corner.y} ${corner.x + sx * r} ${corner.y}H${p2.x}`, m: corner };
  }
  const p1 = clipPt(a, sa, b.x, b.y, ra), p2 = clipPt(b, sb, a.x, a.y, rb);
  return { d: `M${p1.x} ${p1.y}L${p2.x} ${p2.y}`, m: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 } };
}
const isRound = n => !!KINDS[n.k].round;
function drawEdges() {
  if (!gE || !cv) return;
  const ids = new Set(monthNodes().map(n => n.id)), fl = filtering();
  let h = '';
  for (const e of allEdges()) {
    if (!ids.has(e.a) || !ids.has(e.b)) continue;
    const A = N(e.a), Bn = N(e.b), sa = SZ[e.a] || { w: 30, h: 30 }, sb = SZ[e.b] || { w: 30, h: 30 };
    const { d, m } = edgePath(A, Bn, sa, sb, e.style || 'auto', isRound(A), isRound(Bn));
    const dim = fl && !(matches(A) && matches(Bn));
    const fresh = NEWE.has(e.id); if (fresh) NEWE.delete(e.id);
    h += `<path class="e${e.dash ? ' dash' : ''}${ui.selEdge === e.id ? ' sel' : ''}${fresh ? ' fresh' : ''}" d="${d}" style="${dim ? 'opacity:.1;' : ''}${e.color ? `stroke:${e.color};` : ''}"/><path class="hit" data-edge="${e.id}" d="${d}"/>`;
    if (e.label) h += `<text class="elab" x="${m.x}" y="${m.y - 7}" text-anchor="middle">${esc(e.label)}</text>`;
  }
  for (const g of GH) {
    const L = N(g.loc); if (!L) continue;
    const s = SZ[g.loc] || { w: 30, h: 30 }, p1 = clipPt(L, s, g.x, g.y, isRound(L));
    const gel = $(`#ghosts [data-goto="${g.oth.id}"]`), gw = gel ? gel.offsetWidth / 2 : 60, gx = g.x + (g.side < 0 ? gw : -gw);
    h += `<path class="e bridge" d="M${gx} ${g.y}C${(gx + p1.x) / 2} ${g.y} ${(gx + p1.x) / 2} ${p1.y} ${p1.x} ${p1.y}"/>`;
  }
  gE.innerHTML = h;
  $$('#gedges .e.fresh').forEach(p => drawIn(p, 600, 0));
}

/* ---------- seleção ---------- */
let selTb = null;
function posSelTb() {
  const n = ui.sel && N(ui.sel);
  const hide = () => { if (selTb) { selTb.remove(); selTb = null; } };
  if (!cv || !n || n.m !== ui.month || (G?.type === 'node' && G.moved) || $('#scrim')) return hide();
  const s = SZ[n.id] || { w: 40, h: 40 }, p = toScreen(n.x, n.y - s.h / 2 - (n.k === 'periodo' ? 62 : 0)), r = cvR();
  if (p.y < r.top + 50 || p.y > r.bottom - 10 || p.x < r.left || p.x > r.right) return hide();
  if (!selTb || selTb.dataset.for !== n.id) {
    hide(); selTb = document.createElement('div'); selTb.className = 'node seltb'; selTb.dataset.for = n.id;
    selTb.innerHTML = `<button class="pill sm" data-act="open" data-v="${n.id}">${ic('edit')}Abrir card</button><button class="pill sm icon" data-act="dup" data-v="${n.id}" title="Duplicar (Ctrl+D)">${ic('copy')}</button><button class="pill sm icon" data-act="carry" data-v="${n.id}" title="Levar ou continuar em outro mês">${ic('cal')}</button><button class="pill sm icon danger" data-act="del" data-v="${n.id}" title="Excluir (Del)">${ic('trash')}</button>`;
    document.body.appendChild(selTb);
  }
  const w = selTb.offsetWidth;
  selTb.style.left = clamp(p.x - w / 2, 8, innerWidth - w - 8) + 'px';
  selTb.style.top = (p.y - 52) + 'px';
}
function select(id) { ui.sel = id; ui.selEdge = null; closePop(); renderWorld(); }

/* ---------- gestos (mouse, caneta e toque) ---------- */
const P = new Map(); let G = null, lastTap = { t: 0, x: 0, y: 0, id: null }, PLACE = null;
function bindCanvas() {
  cv.addEventListener('pointerdown', onDown);
  cv.addEventListener('pointermove', onMove);
  cv.addEventListener('pointerup', onUp);
  cv.addEventListener('pointercancel', onUp);
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('wheel', onWheel, { passive: false });
  $('#kbar').addEventListener('pointerdown', kbarDown);
}
function onWheel(e) {
  const zoom = e.ctrlKey || e.metaKey || (e.deltaX === 0 && Math.abs(e.deltaY) >= 40 && Number.isInteger(e.deltaY));
  e.preventDefault();
  if (zoom) zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0018)));
  else { cam.x -= e.deltaX; cam.y -= e.deltaY; applyCam(); }
}
function onDown(e) {
  if (e.target.closest('.tstart')) return;
  if (e.button === 2) { const nd = e.target.closest('.sn'), hit = e.target.closest('[data-edge]'); if (nd) nodeMenu(nd.dataset.id, e.clientX, e.clientY); else if (hit) edgeMenu(hit.dataset.edge, e.clientX, e.clientY); else kindsPop(e.clientX, e.clientY, { at: toWorld(e.clientX, e.clientY) }); return; }
  cv.setPointerCapture(e.pointerId);
  P.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (P.size === 2) {
    if (G?.type === 'node' && G.moved) endNodeDrag();
    clearTimeout(G?.lp);
    const [a, b] = [...P.values()];
    G = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y), k0: cam.k, m0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, c0: { ...cam }, r: cvR() }; return;
  }
  if (P.size > 2) return;
  const t = e.target, base = { sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId };
  const knob = t.closest('.knob'), grip = t.closest('.grip'), nd = t.closest('.sn'), hit = t.closest('[data-edge]'), gh = t.closest('[data-goto]');
  if (gh) { G = { type: 'tap', fn: () => focusNode(gh.dataset.goto), ...base }; return; }
  if (knob) { G = { type: 'wire', from: nd.dataset.id, ...base }; return; }
  if (grip) { const n = N(nd.dataset.id); G = { type: 'grip', id: n.id, side: grip.classList.contains('l') ? -1 : 1, x0: n.x, w0: n.w || 300, before: clone(n), ...base }; return; }
  if (nd) { G = { type: 'node', id: nd.dataset.id, ...base }; G.lp = setTimeout(() => { if (G && !G.moved && G.type === 'node') { G.type = 'none'; navigator.vibrate?.(12); nodeMenu(nd.dataset.id, e.clientX, e.clientY); } }, 520); return; }
  if (hit) { G = { type: 'tap', fn: () => edgeMenu(hit.dataset.edge, e.clientX, e.clientY), ...base }; return; }
  G = { type: 'pan', cx: cam.x, cy: cam.y, ...base };
  G.lp = setTimeout(() => { if (G && !G.moved && G.type === 'pan' && e.pointerType !== 'mouse') { G.type = 'none'; navigator.vibrate?.(12); kindsPop(e.clientX, e.clientY, { at: toWorld(e.clientX, e.clientY) }); } }, 560);
}
function onMove(e) {
  if (!P.has(e.pointerId)) return hover(e);
  P.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!G) return;
  if (G.type === 'pinch') {
    if (P.size < 2) return;
    const [a, b] = [...P.values()], d = Math.hypot(a.x - b.x, a.y - b.y), m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const k = clamp(G.k0 * d / G.d0, .15, 2.6), w = { x: (G.m0.x - G.r.left - G.c0.x) / G.c0.k, y: (G.m0.y - G.r.top - G.c0.y) / G.c0.k };
    cam.k = k; cam.x = m.x - G.r.left - w.x * k; cam.y = m.y - G.r.top - w.y * k; applyCam(); return;
  }
  if (e.pointerId !== G.pid) return;
  const dx = e.clientX - G.sx, dy = e.clientY - G.sy;
  if (!G.moved && Math.hypot(dx, dy) < 6) return;
  if (!G.moved) { G.moved = true; clearTimeout(G.lp); startDrag(); }
  if (G.type === 'pan') { cam.x = G.cx + dx; cam.y = G.cy + dy; applyCam(); }
  else if (G.type === 'node') dragNode(e);
  else if (G.type === 'wire') { const n = N(G.from), w = toWorld(e.clientX, e.clientY); gT.innerHTML = `<path class="tmp" d="M${n.x} ${n.y}L${w.x} ${w.y}"/>`; hlTarget(e); edgeScroll(e); }
  else if (G.type === 'grip') {
    const n = N(G.id), w = Math.max(90, G.w0 + dx / cam.k * G.side);
    n.w = Math.round(w); n.x = Math.round(G.x0 + (w - G.w0) / 2 * G.side);
    const el = EL.get(n.id); el.querySelector('.shp').style.width = n.w + 'px'; el.style.transform = `translate(${n.x}px,${n.y}px) translate(-50%,-50%)`;
    SZ[n.id] = { w: n.w, h: SZ[n.id]?.h || 10 }; drawEdges();
  }
}
function startDrag() {
  if (G.type === 'pan') { cv.classList.add('panning'); if (PLACE) cancelPlace(); }
  if (G.type === 'node') {
    closePop();
    G.group = ui.branch ? [G.id, ...descendants(G.id)] : [G.id];
    G.start = G.group.map(id => ({ id, x: N(id).x, y: N(id).y, before: clone(N(id)) }));
    G.wasSpine = !!N(G.id).spine;
    EL.get(G.id)?.classList.add('drag'); posSelTb();
  }
}
function dragNode(e) {
  const s0 = G.start[0];
  let wy = s0.y + (e.clientY - G.sy) / cam.k; const wx = s0.x + (e.clientX - G.sx) / cam.k;
  const snap = G.wasSpine ? Math.abs(wy) < 70 : Math.abs(wy) < 34;
  $('#spglow')?.classList.toggle('on', snap); if (snap) wy = 0; G.snap = snap;
  const ddx = wx - s0.x, ddy = wy - s0.y;
  for (const st of G.start) { const m = N(st.id); m.x = Math.round(st.x + ddx); m.y = Math.round(st.id === G.id ? wy : st.y + ddy); const el = EL.get(st.id); if (el) el.style.transform = `translate(${m.x}px,${m.y}px) translate(-50%,-50%)`; }
  drawEdges(); edgeScroll(e);
}
function endNodeDrag() {
  const n = N(G.id); EL.get(G.id)?.classList.remove('drag'); $('#spglow')?.classList.remove('on');
  n.spine = !!G.snap; if (n.spine) n.y = 0;
  for (const st of G.start) { const after = clone(N(st.id)); after.upd = Date.now(); put(NP(st.id), after, st.before); }
  recOpen = false; refresh();
}
let esRaf = 0, esE = null;
function edgeScroll(e) {
  esE = e; if (esRaf) return;
  const loop = () => {
    esRaf = 0; if (!G || !G.moved || !esE || !cv) return;
    const r = cvR(), m = 40, sp = 11; let vx = 0, vy = 0;
    if (esE.clientX < r.left + m) vx = sp; else if (esE.clientX > r.right - m) vx = -sp;
    if (esE.clientY < r.top + m) vy = sp; else if (esE.clientY > r.bottom - m) vy = -sp;
    if (!vx && !vy) return;
    cam.x += vx; cam.y += vy; G.sx += vx; G.sy += vy; applyCam();
    if (G.type === 'node') dragNode(esE);
    esRaf = requestAnimationFrame(loop);
  };
  esRaf = requestAnimationFrame(loop);
}
let hlEl = null;
const hlSet = el => { if (hlEl && hlEl !== el) hlEl.querySelector('.shp').style.outline = ''; hlEl = el || null; if (hlEl) hlEl.querySelector('.shp').style.outline = '2px dashed #f4f4f5'; };
function hlTarget(e) { const el = document.elementsFromPoint(e.clientX, e.clientY).find(x => x.classList?.contains('sn')); hlSet(el && el.dataset.id !== G?.from ? el : null); }
function onUp(e) {
  P.delete(e.pointerId);
  if (!G) return;
  if (G.type === 'pinch') { if (!P.size) G = null; else { const [id, p] = [...P][0]; G = { type: 'pan', cx: cam.x, cy: cam.y, sx: p.x, sy: p.y, pid: id, moved: true }; } return; }
  if (e.pointerId !== G.pid) return;
  clearTimeout(G.lp); cv.classList.remove('panning');
  const g = G; G = null; esE = null;
  if (g.type === 'tap' && !g.moved) return g.fn();
  if (g.type === 'node') {
    if (g.moved) return endNodeDrag();
    const dbl = Date.now() - lastTap.t < 330 && lastTap.id === g.id; lastTap = { t: Date.now(), id: g.id };
    if (PLACE) return placeAt(e.clientX, e.clientY, g.id);
    if (dbl) return openCard(g.id);
    return select(g.id);
  }
  if (g.type === 'wire') {
    gT.innerHTML = ''; const tgt = hlEl; hlSet(null);
    if (tgt) { createEdge(g.from, tgt.dataset.id); refresh(); return; }
    if (!g.moved) { const n = N(g.from), s = toScreen(n.x, n.y); kindsPop(s.x + 30, s.y - 20, { parent: g.from, at: autoPos(g.from) }); return; }
    kindsPop(e.clientX, e.clientY, { parent: g.from, at: toWorld(e.clientX, e.clientY) }); return;
  }
  if (g.type === 'grip') { if (g.moved) { put(NP(g.id), { ...clone(N(g.id)), upd: Date.now() }, g.before); refresh(); } return; }
  if (g.type === 'pan' && !g.moved) {
    if (PLACE) return placeAt(e.clientX, e.clientY);
    const dbl = Date.now() - lastTap.t < 330 && !lastTap.id && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30;
    lastTap = { t: Date.now(), x: e.clientX, y: e.clientY, id: null };
    if (dbl) return kindsPop(e.clientX, e.clientY, { at: toWorld(e.clientX, e.clientY) });
    if (ui.sel || ui.selEdge) { ui.sel = null; ui.selEdge = null; renderWorld(); }
  }
}
function hover(e) {
  if (e.pointerType !== 'mouse' || !cv.classList.contains('far')) return hideTip();
  const nd = e.target.closest?.('.sn'); if (!nd) return hideTip();
  const n = N(nd.dataset.id); if (n) showTip(`<div class="th">${KINDS[n.k].n}</div><b>${esc(label(n))}</b>`, e.clientX, e.clientY);
}
function autoPos(pid) {
  const p = N(pid), kids = allEdges().filter(e => e.a === pid).map(e => N(e.b)).filter(Boolean);
  if (p.spine) { const i = kids.length, dir = i % 2 ? -1 : 1; return { x: p.x + (i > 1 ? (i >> 1) * 70 : 0), y: dir * (150 + (i >> 1) * 40) }; }
  const dir = Math.sign(p.y) || 1;
  return { x: p.x + 200, y: p.y + kids.length * 60 * dir };
}
/* barra de estrelas: arrastar para o palco, ou tocar e depois tocar no palco */
let DG = null;
function kbarDown(e) {
  const b = e.target.closest('[data-dk]'); if (!b) return;
  DG = { k: b.dataset.dk, sx: e.clientX, sy: e.clientY, moved: false, pid: e.pointerId };
  try { b.setPointerCapture(e.pointerId); } catch (_) { }
}
addEventListener('pointermove', e => {
  if (!DG || e.pointerId !== DG.pid) return;
  if (!DG.moved) {
    if (Math.hypot(e.clientX - DG.sx, e.clientY - DG.sy) < 7) return;
    DG.moved = true; cancelPlace();
    const fake = { id: 'g', k: DG.k, title: '', status: 'planejado', ref: KINDS[DG.k].reg ? (reg(KINDS[DG.k].reg)[0] || {}).id : '', w: KINDS[DG.k].stretch ? 240 : 0, color: (DG.k === 'plano' || DG.k === 'etapa') ? PALETTE[monthNodes().filter(z => z.k === DG.k).length % (PALETTE.length - 1)] : '' };
    const sh = starHTML(fake, true);
    DG.el = document.createElement('div'); DG.el.className = sh.cls + ' dghost'; DG.el.innerHTML = sh.html; document.body.appendChild(DG.el);
  }
  DG.el.style.transform = `translate(${e.clientX}px,${e.clientY}px) translate(-50%,-50%) scale(${Math.max(.55, cam.k)})`;
  const over = document.elementsFromPoint(e.clientX, e.clientY);
  if (over.includes(cv)) $('#spglow')?.classList.toggle('on', Math.abs(toWorld(e.clientX, e.clientY).y) < 40);
  hlSet(over.find(x => x.classList?.contains('sn') && x.dataset.id) || null);
});
const dgEnd = e => {
  if (!DG || e.pointerId !== DG.pid) return;
  const d = DG; DG = null; $('#spglow')?.classList.remove('on');
  if (!d.moved) { if (e.type === 'pointerup') togglePlace(d.k); return; }
  d.el.remove();
  const tgt = hlEl; hlSet(null);
  if (e.type !== 'pointerup' || !cv || !document.elementsFromPoint(e.clientX, e.clientY).includes(cv)) return;
  const w = tgt ? autoPos(tgt.dataset.id) : toWorld(e.clientX, e.clientY);
  const n = createNode(d.k, w.x, w.y, { parent: tgt?.dataset.id, spine: tgt ? false : undefined });
  ui.sel = n.id; refresh(); setTimeout(() => openCard(n.id, true), 160);
};
addEventListener('pointerup', dgEnd); addEventListener('pointercancel', dgEnd);
function togglePlace(k) {
  if (PLACE === k) return cancelPlace();
  PLACE = k; cv.classList.add('placing');
  $$('#kbar [data-dk]').forEach(b => b.classList.toggle('on', b.dataset.dk === k));
  toast(`Toque no palco (ou numa estrela) para colocar: ${KINDS[k].n}`);
}
function cancelPlace() { PLACE = null; cv?.classList.remove('placing'); $$('#kbar [data-dk]').forEach(b => b.classList.remove('on')); }
function placeAt(cx, cy, parent) {
  const k = PLACE; cancelPlace();
  const w = parent ? autoPos(parent) : toWorld(cx, cy);
  const n = createNode(k, w.x, w.y, { parent, spine: parent ? false : undefined });
  ui.sel = n.id; refresh(); setTimeout(() => openCard(n.id, true), 160);
}

/* =========================================================
   Popovers (mesmo padrão .node.pop)
   ========================================================= */
function closePop() { $('#pop')?.remove(); }
function popAt(html, x, y, w = 300) {
  closePop();
  const el = document.createElement('div'); el.className = 'node pop fx'; el.id = 'pop'; el.style.width = w + 'px'; el.innerHTML = html;
  document.body.appendChild(el);
  const r = el.getBoundingClientRect();
  el.style.left = clamp(x, 8, innerWidth - r.width - 8) + 'px';
  el.style.top = clamp(y, 8, innerHeight - r.height - 8) + 'px';
  return el;
}
const popUnder = (html, anchor, w = 300) => { const r = anchor.getBoundingClientRect(); return popAt(html, r.left + r.width / 2 - w / 2, r.bottom + 8, w); };
document.addEventListener('pointerdown', e => { const p = $('#pop'); if (p && !p.contains(e.target) && !e.target.closest('[data-keep]')) closePop(); }, true);
function kindGridHTML() {
  return KGROUPS.map(([g, ks]) => `<div class="cat-h">${g}<span class="ln"></span></div><div class="kgrid">${ks.map(k => `<button class="pill sm" data-mk="${k}" title="${KINDS[k].d}"><span class="kg">${kGlyph(k)}</span>${KINDS[k].n}</button>`).join('')}</div>`).join('');
}
function kindsPop(x, y, o = {}) {
  const head = o.parent ? `<b>Novo ramo de “${esc(label(N(o.parent)))}”</b>` : o.change ? '<b>Trocar o tipo</b>' : '<b>Nova estrela</b>';
  const el = popAt(`${head}<div class="hint" style="margin:4px 0 2px">${o.change ? 'O conteúdo do card é mantido.' : 'O card abre logo depois de criada.'}</div>${kindGridHTML()}`, x, y, 340);
  el.onclick = e => {
    const b = e.target.closest('[data-mk]'); if (!b) return; closePop();
    const k = b.dataset.mk;
    if (o.change) { edit(NP(o.change), n => { n.k = k; if (KINDS[k].stretch && !n.w) n.w = 300; if (KINDS[k].reg && !regItem(KINDS[k].reg, n.ref)) n.ref = (reg(KINDS[k].reg)[0] || {}).id; logIt(n, 'virou ' + KINDS[k].n); }); refresh(); renderCard(); return; }
    if (ui.view !== 'mapa') { ui.view = 'mapa'; render(); }
    let at = o.at;
    if (!at) { const sp = monthNodes().filter(n => n.spine); at = { x: sp.length ? Math.max(...sp.map(n => n.x)) + 170 : spineExt().min + 140, y: 0 }; }
    const n = createNode(k, at.x, at.y, { parent: o.parent, spine: o.parent ? false : undefined });
    ui.sel = n.id; refresh(); setTimeout(() => openCard(n.id, true), 160);
  };
}
function nodeMenu(id, x, y) {
  select(id); const n = N(id);
  const el = popAt(`<b>${esc(label(n))}</b><div class="hint" style="margin:2px 0 8px">${KINDS[n.k].n} · ${STATUS[n.status || 'planejado'][0]}</div>
    <button class="li" data-nm="open">${ic('edit')}Abrir card<small>Enter</small></button>
    <button class="li" data-nm="child">${ic('branch')}Criar ramo</button>
    <button class="li" data-nm="dup">${ic('copy')}Duplicar<small>Ctrl+D</small></button>
    <button class="li" data-nm="spine">${ic('route')}${n.spine ? 'Tirar da linha central' : 'Pôr na linha central'}</button>
    <button class="li" data-nm="carry">${ic('cal')}Levar / continuar em outro mês</button>
    <div class="sepl"></div><div class="row" style="flex-wrap:wrap;gap:4px;padding:2px">${Object.entries(STATUS).map(([k, [l, , d]]) => `<button class="pill sm ${(n.status || 'planejado') === k ? 'on' : ''}" data-ns="${k}"><span class="dot ${d}"></span>${l}</button>`).join('')}</div>
    <div class="sepl"></div><button class="li d" data-nm="del">${ic('trash')}Excluir<small>Del</small></button>`, x + 6, y + 6, 290);
  el.onclick = e => {
    const s = e.target.closest('[data-ns]'); if (s) { setStatus(id, s.dataset.ns); closePop(); return; }
    const a = e.target.closest('[data-nm]')?.dataset.nm; if (!a) return; closePop();
    if (a === 'open') openCard(id);
    if (a === 'child') { const s2 = toScreen(n.x, n.y); kindsPop(s2.x + 30, s2.y, { parent: id, at: autoPos(id) }); }
    if (a === 'dup') dup(id);
    if (a === 'spine') { edit(NP(id), z => { z.spine = !z.spine; z.y = z.spine ? 0 : 130; }); refresh(); }
    if (a === 'carry') carryPop(id, null, x, y);
    if (a === 'del') delWithUndo(id);
  };
}
function setStatus(id, st) {
  edit(NP(id), n => { if ((n.status || 'planejado') !== st) logIt(n, 'status → ' + STATUS[st][0]); n.status = st; });
  refresh(); if (ED.id === id) renderCard();
  if (st === 'feito') celebrate(id);
}
function delWithUndo(id) { const nm = label(N(id)); delNode(id); refresh(); toast(`“${nm}” excluída · Ctrl+Z desfaz`); }
function carryPop(id, anchor, x, y) {
  const n = N(id);
  const html = `<b>“${esc(label(n))}”</b><div class="hint" style="margin:2px 0 8px">Entre meses</div>
    <button class="li" data-cm="cont">${ic('link')}<span>Continuar em outro mês<br><span class="hint">cria uma cópia ligada por ponte</span></span></button>
    <button class="li" data-cm="move">${ic('arrow')}<span>Mover para outro mês<br><span class="hint">leva a estrela e o ramo</span></span></button>`;
  const el = anchor ? popUnder(html, anchor, 280) : popAt(html, x, y, 280);
  el.onclick = e => { const b = e.target.closest('[data-cm]'); if (!b) return; const mode = b.dataset.cm, r = el.getBoundingClientRect(); monthPop(null, mAdd(n.m, 1), m => carry(id, m, mode), r.left, r.top, mode === 'move' ? 'Mover para…' : 'Continuar em…'); };
}
function monthPop(anchor, cur, onPick, x, y, title) {
  let yr = +cur.slice(0, 4);
  const counts = {}; for (const n of allNodes()) counts[n.m] = 1;
  const draw = () => {
    const html = `${title ? `<b>${title}</b>` : ''}<div class="between" ${title ? 'style="margin-top:8px"' : ''}><button class="pill sm icon" data-y="-1">${ic('l')}</button><b>${yr}</b><button class="pill sm icon" data-y="1">${ic('r')}</button></div>
      <div class="mgrid">${MONTHS.map((n, i) => { const k = `${yr}-${pad(i + 1)}`; return `<button class="${k === cur ? 'on' : ''}" data-pm="${k}">${cap(n)}${counts[k] ? '<span class="dot g"></span>' : ''}</button>`; }).join('')}</div>`;
    const el = anchor ? popUnder(html, anchor, 290) : popAt(html, x, y, 290);
    el.onclick = e => { const yb = e.target.closest('[data-y]'); if (yb) { yr += +yb.dataset.y; draw(); return; } const b = e.target.closest('[data-pm]'); if (b) { closePop(); onPick(b.dataset.pm); } };
  };
  draw();
}
function edgeMenu(id, x, y) {
  ui.selEdge = id; ui.sel = null; renderWorld();
  const e = E(id);
  const el = popAt(`<b>Ligação</b><div class="seg" style="margin:10px 0;width:100%">${[['auto', 'Auto'], ['reta', 'Reta'], ['curva', 'Curva'], ['cotovelo', 'Cotovelo']].map(([k, l]) => `<button class="pill sm ${(e.style || 'auto') === k ? 'on' : ''}" data-es="${k}" style="flex:1;justify-content:center">${l}</button>`).join('')}</div>
    <label class="field"><span>Rótulo <em>opcional</em></span><input class="inp sm" data-el value="${esc(e.label || '')}" placeholder="ex.: depende de"></label>
    <div class="sepl" style="margin-top:10px"></div>
    <button class="li" data-ea="dash">${ic('more')}${e.dash ? 'Linha contínua' : 'Linha pontilhada'}</button>
    <button class="li" data-ea="flip">${ic('arrow')}Inverter (pai ↔ filho)</button>
    <button class="li d" data-ea="del">${ic('trash')}Remover ligação</button>`, x, y, 290);
  el.querySelector('[data-el]').oninput = ev => { edit(EP(id), z => z.label = ev.target.value); drawEdges(); };
  el.onclick = ev => {
    const s = ev.target.closest('[data-es]'); if (s) { edit(EP(id), z => z.style = s.dataset.es); $$('[data-es]', el).forEach(b => b.classList.toggle('on', b === s)); drawEdges(); return; }
    const a = ev.target.closest('[data-ea]')?.dataset.ea; if (!a) return;
    if (a === 'dash') edit(EP(id), z => z.dash = !z.dash);
    if (a === 'flip') edit(EP(id), z => { [z.a, z.b] = [z.b, z.a]; });
    if (a === 'del') { put(EP(id), null); ui.selEdge = null; }
    closePop(); renderWorld();
  };
}
function celebrate(id) {
  const n = N(id); if (!n || !cv || n.m !== ui.month || reduced()) return;
  const p = toScreen(n.x, n.y);
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 36 + Math.random() * 54;
    s.style.cssText = `position:fixed;left:${p.x}px;top:${p.y}px;width:5px;height:5px;border-radius:50%;background:${['#4ade80', '#f4f4f5', '#a78bfa', '#facc15'][i % 4]};z-index:95;pointer-events:none;transition:all .8s cubic-bezier(.2,.8,.2,1)`;
    document.body.appendChild(s);
    requestAnimationFrame(() => { s.style.transform = `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.3)`; s.style.opacity = '0'; });
    setTimeout(() => s.remove(), 900);
  }
}
function toast(msg, kind = 'w') {
  const t = document.createElement('div'); t.className = 'toast';
  t.innerHTML = `<span class="dot ${kind}"></span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s, transform .4s'; t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 400); }, 3400);
}
function showTip(html, x, y) { const t = $('#tip'); t.innerHTML = html; t.style.opacity = '1'; const w = t.offsetWidth, h = t.offsetHeight; let L = x + 14, T = y + 14; if (L + w > innerWidth - 8) L = x - w - 14; if (T + h > innerHeight - 8) T = y - h - 14; t.style.left = L + 'px'; t.style.top = T + 'px'; }
function hideTip() { const t = $('#tip'); if (t) t.style.opacity = '0'; }

/* =========================================================
   Modal (mesmo padrão dos painéis) e card da estrela
   ========================================================= */
let modalOnClose = null;
function openModal({ title, body, cls = '', onClose, foot = '' }) {
  $('#scrim')?.remove(); hideTip(); closePop();
  modalOnClose = onClose || null;
  const el = document.createElement('div'); el.className = 'scrim'; el.id = 'scrim';
  el.innerHTML = `<div class="node modal ${cls}" role="dialog" aria-modal="true"><div class="between mb modal-h"><h2>${title}</h2><button class="pill sm icon ghost" data-act="modal-x" aria-label="Fechar">${ic('x')}</button></div><div id="modal-b">${body}</div>${foot}</div>`;
  el.addEventListener('mousedown', e => { if (e.target === el) closeModal(); });
  document.body.appendChild(el);
  posSelTb();
  return el;
}
function closeModal() {
  const s = $('#scrim'); if (!s) return;
  s.remove(); const f = modalOnClose; modalOnClose = null; if (f) f();
  posSelTb();
}
const ED = { id: null };
function openCard(id, fresh) {
  if (!N(id)) return;
  ED.id = id; ui.sel = id;
  openModal({ title: '', body: '', cls: 'smodal', onClose: () => { ED.id = null; refresh(); } });
  renderCard();
  if (fresh) setTimeout(() => { const t = $('#scrim .ttl-in'); t?.focus(); t?.select(); }, 60);
}
function fieldInput(type, path, val, ph = '') {
  const v = esc(val ?? '');
  if (type === 'textarea') return `<textarea class="inp" data-f="${path}" placeholder="${esc(ph)}" rows="2">${v}</textarea>`;
  if (type === 'date') return `<input class="inp" type="date" data-f="${path}" value="${v}">`;
  if (type === 'datetime') return `<input class="inp" type="datetime-local" data-f="${path}" value="${v}" style="color-scheme:dark">`;
  if (type === 'money') return `<div class="affix"><span class="pre">${cfg().country === 'US' ? 'US$' : 'R$'}</span><input class="inp r" inputmode="decimal" data-f="${path}" value="${v}" placeholder="0,00" style="padding-left:38px"></div>`;
  if (type === 'url') return `<input class="inp" type="url" data-f="${path}" value="${v}" placeholder="https://">`;
  if (type === 'bool') return `<label class="chk" style="height:38px"><input type="checkbox" data-f="${path}" ${val ? 'checked' : ''}>ok</label>`;
  const opt = (list, cur) => `<option value="">—</option>` + list.map(o => `<option value="${esc(o.v)}" ${o.v === cur ? 'selected' : ''}>${esc(o.l)}</option>`).join('');
  if (type.startsWith('sel:')) return `<select class="inp" data-f="${path}">${opt(type.slice(4).split('|').map(x => ({ v: x, l: x })), val)}</select>`;
  if (type === 'person') return `<select class="inp" data-f="${path}">${opt(reg('people').map(p => ({ v: p.id, l: p.name })), val)}</select>`;
  if (type === 'team') return `<select class="inp" data-f="${path}">${opt(reg('teams').map(p => ({ v: p.id, l: p.name })), val)}</select>`;
  if (type === 'channel') return `<select class="inp" data-f="${path}">${opt([...reg('channels'), ...reg('stores')].map(p => ({ v: p.id, l: p.name })), val)}</select>`;
  return `<input class="inp" data-f="${path}" value="${v}" placeholder="${esc(ph)}">`;
}
function chips(kreg, sel, field, single) {
  const items = reg(kreg);
  const dot = it => kreg === 'people' ? `<span class="av c" style="--c:${it.color || '#a78bfa'}">${esc(initials(it.name))}</span>` : (kreg === 'channels' || kreg === 'stores') ? `<span class="lgm" style="background:${it.color}">${logoSvg(it.icon, ink(it.color))}</span>` : `<span class="dot" style="background:${it.color};box-shadow:0 0 8px ${it.color}80"></span>`;
  return `<div class="kchips">${items.map(it => `<button class="pill sm ${single ? (sel === it.id ? 'on' : '') : (sel || []).includes(it.id) ? 'on' : ''}" data-tg="${field}:${it.id}"${single ? ' data-single="1"' : ''}>${dot(it)}${esc(it.name)}</button>`).join('')}<button class="pill sm add" data-act="goset" title="Cadastrar em Ajustes">${ic('plus')}${items.length ? '' : 'cadastrar ' + REGN[kreg].toLowerCase()}</button></div>`;
}
function blockHTML(b, i) {
  const d = BT[b.t] || BT.texto, D = b.data || {}, base = `blocks.${i}.data`, col = BCATS[d.c];
  const flds = list => `<div class="fgrid">${list.map(([k, l, t, span]) => `<label class="field ${span === 2 ? 'full' : ''}">${l ? `<span>${l}</span>` : ''}${fieldInput(t, `${base}.${k}`, D[k])}</label>`).join('')}</div>`;
  let body = '';
  if (d.fields) body += flds(d.fields);
  if (d.check) body += `<div class="ck-list">${(D.items || []).map((it, j) => `<div class="ck ${it.ok ? 'ok' : ''}"><button class="bx" data-ck="${i}:${j}" aria-label="Concluir">${ic('check')}</button><input class="tx" data-f="${base}.items.${j}.t" value="${esc(it.t)}" placeholder="Passo…"><select class="inp sm" data-f="${base}.items.${j}.p"><option value="">quem</option>${reg('people').map(p => `<option value="${p.id}" ${p.id === it.p ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select><input class="inp sm" type="date" data-f="${base}.items.${j}.d" value="${esc(it.d || '')}"><button class="pill sm icon ghost" data-ed="delitem:${i}:${j}" aria-label="Remover">${ic('x')}</button></div>`).join('')}</div><button class="addrow" data-ed="additem:${i}">${ic('plus')}Adicionar passo</button>`;
  if (d.rows || d.custom) {
    const cols = d.custom ? (D.cols || []).map(c => [c.k, c.l, 'text']) : d.rows;
    const tmpl = cols.map(c => c[3] === 2 ? 'minmax(0,2fr)' : c[2] === 'bool' ? '60px' : 'minmax(0,1fr)').join(' ') + ' 32px';
    body += `<div class="brow hint" style="grid-template-columns:${tmpl}">${d.custom ? (D.cols || []).map((c, j) => `<input class="inp sm" data-f="${base}.cols.${j}.l" value="${esc(c.l)}">`).join('') + `<button class="pill sm icon ghost" data-ed="addcol:${i}" title="Nova coluna">${ic('plus')}</button>` : cols.map(c => `<span>${c[1]}</span>`).join('') + '<span></span>'}</div>`;
    body += (D.rows || []).map((r, j) => `<div class="brow" style="grid-template-columns:${tmpl}">${cols.map(([k, l, t]) => fieldInput(t, `${base}.rows.${j}.${k}`, r[k], l)).join('')}<button class="pill sm icon ghost" data-ed="delrow:${i}:${j}" aria-label="Remover">${ic('x')}</button></div>`).join('');
    body += `<button class="addrow" data-ed="addrow:${i}">${ic('plus')}Adicionar linha</button>`;
    if (d.sum) { const tot = (D.rows || []).reduce((s, r) => s + money(r[d.sum]), 0); body += `<div class="sum-r"><span class="hint">Total</span><b class="num">${tot.toLocaleString('pt-BR', { style: 'currency', currency: cfg().country === 'US' ? 'USD' : 'BRL' })}</b></div>`; }
  }
  if (d.after) body += `<div class="mt">${flds(d.after)}</div>`;
  const nm = b.name ?? d.n;
  const cnt = d.check ? `${(D.items || []).filter(x => x.ok).length}/${(D.items || []).length}` : (d.rows || d.custom) ? `${(D.rows || []).length}` : '';
  return `<section class="secb" id="sec-b${i}"><div class="cat-h"><span class="dot" style="background:${col};box-shadow:0 0 8px ${col}80"></span><input data-f="blocks.${i}.name" value="${esc(nm)}" size="${Math.max(6, nm.length)}"><span class="dim" style="font-weight:400">${cnt}</span><span class="ln"></span><span class="acts"><button class="pill sm icon ghost" data-ed="upblk:${i}" title="Subir">${ic('up')}</button><button class="pill sm icon ghost" data-ed="colblk:${i}" title="${b.col ? 'Abrir' : 'Recolher'}">${ic(b.col ? 'down' : 'upc')}</button><button class="pill sm icon ghost danger" data-ed="delblk:${i}" title="Remover quadro">${ic('trash')}</button></span></div>${b.col ? '' : body}</section>`;
}
function renderCard() {
  const n = N(ED.id), sc = $('#scrim'); if (!n || !sc) return;
  const K = KINDS[n.k], st = n.status || 'planejado', es = nodeEdges(n.id), { t, d } = tally(n), p = progress(n);
  const keepModal = $('#scrim .modal')?.scrollTop;
  $('#scrim .modal-h h2').innerHTML = `<span class="tag">${K.n}</span><span class="dim" style="font-weight:400;font-size:13px">${esc(mLong(n.m))}${n.from && N(n.from) ? ` · continua de ${esc(mName(N(n.from).m))}` : ''}</span>`;
  const steps = [['geral', 'Geral', ic('edit'), '#3a3a41'], ['quem', 'Quem e onde', ic('users'), '#3a3a41'], ...(n.blocks || []).map((b, i) => [`b${i}`, b.name ?? BT[b.t]?.n ?? 'Quadro', i + 1, BCATS[BT[b.t]?.c] || '#e7e7ea']), ['add', 'Adicionar quadro', ic('plus'), '#3a3a41']];
  const sp = s => s === 'ideia' || s === 'feito' ? '#06210f' : '#111';
  $('#modal-b').innerHTML = `<div class="pc">
    <div class="pc-left">
      <div class="pc-steps">${steps.map(([k, l, icn, c], i) => `<button class="stp ${i === 0 ? 'on' : ''}" data-go="${k}" style="--c:${c}"><span class="stp-i">${icn}</span><span class="stp-t"><b>${esc(l)}</b></span></button>`).join('')}</div>
      <div class="pc-acts"><div class="pa-h">Ações</div>
        <button class="pa" data-ed="dup"><span class="pa-i">${ic('copy')}</span><span class="pa-t"><b>Duplicar</b><small>cópia ao lado</small></span></button>
        <button class="pa" data-ed="cont"><span class="pa-i">${ic('link')}</span><span class="pa-t"><b>Continuar em outro mês</b><small>cria uma ponte</small></span></button>
        <button class="pa pa-w" data-ed="move"><span class="pa-i">${ic('arrow')}</span><span class="pa-t"><b>Mover de mês</b><small>leva o ramo junto</small></span></button>
        <button class="pa pa-d" data-ed="del"><span class="pa-i">${ic('trash')}</span><span class="pa-t"><b>Excluir estrela</b><small>Ctrl+Z desfaz</small></span></button>
      </div>
    </div>
    <div class="pc-main">
      <div class="pc-h"><div style="flex:1;min-width:0"><input class="ttl-in" data-f="title" value="${esc(n.title)}" placeholder="${esc(K.reg ? label(n) : 'Dê um nome…')}" enterkeyhint="done"><div class="sub">${esc(K.d)}</div></div></div>
      <section class="secb" id="sec-geral"><div class="cat-h"><span class="dot w"></span>Geral<span class="ln"></span></div>
        <div class="fgrid c3">
          <div class="field"><span>Tipo</span><button class="inp" style="text-align:left;display:flex;align-items:center;gap:8px" data-ed="kind" data-keep><span class="kg">${kGlyph(n.k)}</span>${K.n}<span class="sp"></span>${ic('down', 'width:12px;color:var(--muted)')}</button></div>
          <label class="field"><span>Início</span>${fieldInput('date', 'start', n.start)}</label>
          <label class="field"><span>Prazo</span>${fieldInput('date', 'due', n.due)}</label>
          ${K.reg ? `<div class="field full"><span>${cap(SING[K.reg])}</span>${chips(K.reg, n.ref, 'ref', 1)}</div>` : ''}
          <div class="field"><span>Prioridade</span><div class="seg" style="width:100%">${Object.entries(PRIO).map(([k, l]) => `<button class="pill sm ${n.prio === k ? 'on' : ''}" data-ed="prio:${k}" style="flex:1;justify-content:center;padding:0 6px">${l}</button>`).join('')}</div></div>
          <div class="field"><span>Na linha central</span><div class="row" style="height:38px"><button class="switch ${n.spine ? 'on' : ''}" data-ed="spine" role="switch" aria-checked="${!!n.spine}"></button><span class="hint">${n.spine ? 'na linha do mês' : 'ramo solto'}</span></div></div>
          <div class="field"><span>Cor</span><div class="swatches" style="min-height:38px">${['', ...PALETTE].map(c => `<button class="${c ? '' : 'none'} ${(n.color || '') === c ? 'on' : ''}" style="${c ? `--c:${c}` : ''}" data-ed="color:${c}" title="${c || 'padrão'}"></button>`).join('')}</div></div>
          <label class="field full"><span>Descrição</span>${fieldInput('textarea', 'desc', n.desc, 'Contexto, objetivo, observações…')}</label>
        </div></section>
      <section class="secb" id="sec-quem"><div class="cat-h"><span class="dot p"></span>Quem e onde<span class="ln"></span></div>
        <div class="field"><span>Responsáveis</span>${chips('people', n.people, 'people')}</div>
        <div class="field mt"><span>Times</span>${chips('teams', n.teams, 'teams')}</div>
        <div class="field mt"><span>Marcas</span>${chips('brands', n.brands, 'brands')}</div>
        <div class="fgrid mt"><div class="field"><span>Canais</span>${chips('channels', n.channels, 'channels')}</div><div class="field"><span>Lojas</span>${chips('stores', n.stores, 'stores')}</div></div>
        <div class="field mt"><span>Tags</span><div class="kchips">${(n.tags || []).map((tg, j) => `<span class="tag">#${esc(tg)}<button data-ed="deltag:${j}" style="display:grid;color:var(--dim)">${ic('x', 'width:11px;height:11px')}</button></span>`).join('')}<input class="inp sm" style="width:160px" placeholder="+ tag e Enter" data-tag></div></div>
      </section>
      ${(n.blocks || []).map(blockHTML).join('')}
      <section class="secb" id="sec-add"><div class="cat-h"><span class="dot"></span>Adicionar quadro<span class="ln"></span></div>
        <div class="lib">${Object.entries(BCATS).map(([c, col]) => `<div class="hint" style="margin:8px 0 6px;display:flex;align-items:center;gap:7px"><span class="dot" style="background:${col}"></span>${c}</div><div class="kchips">${BLOCKS.filter(b => b.c === c).map(b => `<button class="pill sm" data-ed="addblk:${b.t}">${ic(b.ic)}${b.n}</button>`).join('')}</div>`).join('')}</div>
      </section>
    </div>
    <div class="pc-side">
      <div class="side-b"><h3>${ic('flag', 'width:14px;height:14px;color:var(--muted)')}Status</h3>
        <span class="spill" style="background:${STATUS[st][1]};color:${sp(st)}">${STATUS[st][0]}</span>
        <div class="segp">${t ? Array.from({ length: Math.min(t, 24) }, (_, i) => `<i style="background:${i < Math.round(d / t * Math.min(t, 24)) ? '#4ade80' : 'rgba(255,255,255,.08)'}"></i>`).join('') : `<i style="background:${st === 'feito' ? '#4ade80' : 'rgba(255,255,255,.08)'}"></i>`}</div>
        <div class="between"><span class="hint">${t ? `${d} de ${t} itens` : 'sem itens de checklist'}</span><b class="num">${Math.round(p * 100)}%</b></div>
        <div class="seg mt" style="gap:3px">${Object.entries(STATUS).map(([k, [l, , dc]]) => `<button class="pill sm ${st === k ? 'on' : ''}" data-ed="status:${k}"><span class="dot ${dc}"></span>${l}</button>`).join('')}</div>
        ${n.due ? `<div class="between mt"><span class="hint">Prazo</span><span class="${n.due < today() && st !== 'feito' ? 'neg' : ''}">${fmtD(n.due)}</span></div>` : ''}
      </div>
      <div class="side-b"><h3>${ic('link', 'width:14px;height:14px;color:var(--muted)')}Conexões <span class="dim" style="font-weight:400">${es.length}</span></h3>
        <div class="stat-list">${es.map(e => { const out = e.a === n.id, o = N(out ? e.b : e.a); if (!o) return ''; return `<div class="li"><button class="lk linkrow" data-go2="${o.id}" style="display:flex;gap:6px;min-width:0;align-items:center">${out ? '→' : '←'} <span class="ell" style="max-width:none">${esc(label(o))}</span>${o.m !== n.m ? `<small>${mName(o.m).slice(0, 3)}</small>` : ''}</button><button class="pill sm icon ghost" data-ed="deledge:${e.id}" aria-label="Desligar">${ic('x')}</button></div>`; }).join('') || '<p class="hint">Puxe o + da estrela no palco até outra para ligar — ou busque abaixo (qualquer mês).</p>'}</div>
        <input class="inp sm cx-in" data-cx placeholder="Ligar a… (buscar estrela)"><div data-cxr></div>
      </div>
      <div class="side-b"><h3>${ic('clock', 'width:14px;height:14px;color:var(--muted)')}Histórico</h3>
        <div class="hist">${(n.log || []).map(h => `<div class="h-i"><span class="h-d"></span><span>${esc(h.by || '—')} ${esc(h.txt)}<br><small>${ago(h.t)}</small></span></div>`).join('') || '<p class="hint">Sem registros ainda.</p>'}</div>
        <div class="hint mt">Atualizado ${ago(n.upd)}${n.by ? ' por ' + esc(n.by) : ''}</div>
      </div>
    </div></div>`;
  $$('#scrim textarea.inp').forEach(autoGrow);
  if (keepModal) $('#scrim .modal').scrollTop = keepModal;
}
function autoGrow(t) { t.style.height = 'auto'; t.style.height = Math.min(360, Math.max(38, t.scrollHeight + 2)) + 'px'; }
function setPath(o, path, v) { const ks = path.split('.'); let c = o; for (let i = 0; i < ks.length - 1; i++) { const k = ks[i]; if (c[k] == null) c[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; c = c[k]; } c[ks.at(-1)] = v; }
document.addEventListener('input', e => {
  const sc = $('#scrim'); if (!sc || !sc.contains(e.target) || !ED.id) return;
  const f = e.target.dataset.f;
  if (f) {
    if (e.target.tagName === 'TEXTAREA') autoGrow(e.target);
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    edit(NP(ED.id), n => setPath(n, f, v)); refresh(); return;
  }
  if (e.target.matches('[data-cx]')) {
    const q = norm(e.target.value), out = $('#scrim [data-cxr]'); if (!q) { out.innerHTML = ''; return; }
    const linked = new Set(nodeEdges(ED.id).flatMap(x => [x.a, x.b]));
    const res = allNodes().filter(n => n.id !== ED.id && !linked.has(n.id) && norm(label(n)).includes(q)).slice(0, 8);
    out.innerHTML = `<div class="stat-list mt">${res.map(n => `<button class="li linkrow" data-cxto="${n.id}"><span class="lk" style="display:flex;gap:8px;align-items:center"><span class="kg">${kGlyph(n.k)}</span>${esc(label(n))}</span><span class="dim">${mName(n.m).slice(0, 3)}</span></button>`).join('') || '<p class="hint">Nada encontrado</p>'}</div>`;
  }
});
document.addEventListener('keydown', e => {
  const sc = $('#scrim'); if (!sc || !sc.contains(e.target) || !ED.id) return;
  if (e.target.matches('.ttl-in') && e.key === 'Enter') { e.preventDefault(); e.target.blur(); }
  if (e.target.matches('[data-tag]') && e.key === 'Enter' && e.target.value.trim()) { const v = e.target.value.trim().replace(/^#/, ''); edit(NP(ED.id), n => { n.tags = [...new Set([...(n.tags || []), v])]; }); renderCard(); setTimeout(() => $('#scrim [data-tag]')?.focus(), 0); }
  if (e.target.matches('.ck .tx') && e.key === 'Enter') { e.preventDefault(); addItem(+e.target.dataset.f.split('.')[1]); }
});
function addItem(bi) { edit(NP(ED.id), n => n.blocks[bi].data.items.push({ id: uid(), t: '', ok: false })); renderCard(); refresh(); $$(`#sec-b${bi} .ck .tx`).at(-1)?.focus(); }
function cardClick(e) {
  const sc = $('#scrim'); if (!sc || !sc.contains(e.target) || !ED.id) return false;
  const id = ED.id;
  const go = e.target.closest('[data-go]'); if (go) { $$('#scrim .stp').forEach(s => s.classList.toggle('on', s === go)); $(`#sec-${go.dataset.go}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return true; }
  const go2 = e.target.closest('[data-go2]'); if (go2) { closeModal(); focusNode(go2.dataset.go2, true); return true; }
  const cx = e.target.closest('[data-cxto]'); if (cx) { createEdge(id, cx.dataset.cxto, N(cx.dataset.cxto).m !== N(id).m ? { bridge: 1 } : {}); renderCard(); refresh(); return true; }
  const ck = e.target.closest('[data-ck]'); if (ck) { const [bi, j] = ck.dataset.ck.split(':').map(Number); edit(NP(id), n => { const it = n.blocks[bi].data.items[j]; it.ok = !it.ok; }); renderCard(); refresh(); const tl = tally(N(id)); if (tl.t && tl.d === tl.t && N(id).status !== 'feito') toast('Checklist completo — marque como Feito quando fechar a etapa', 'g'); return true; }
  const tg = e.target.closest('[data-tg]'); if (tg) { const [f, v] = tg.dataset.tg.split(':'); edit(NP(id), n => { if (tg.dataset.single) n[f] = n[f] === v ? '' : v; else { const s = new Set(n[f] || []); s.has(v) ? s.delete(v) : s.add(v); n[f] = [...s]; } }); renderCard(); refresh(); return true; }
  const b = e.target.closest('[data-ed]'); if (!b) return false;
  const [a, x, y] = b.dataset.ed.split(':');
  const blk = fn => { edit(NP(id), fn); renderCard(); refresh(); };
  switch (a) {
    case 'status': setStatus(id, x); break;
    case 'prio': blk(n => n.prio = n.prio === x ? '' : x); break;
    case 'color': blk(n => n.color = b.dataset.ed.slice(6)); break;
    case 'spine': blk(n => { n.spine = !n.spine; n.y = n.spine ? 0 : 130; }); break;
    case 'deltag': blk(n => n.tags.splice(+x, 1)); break;
    case 'addblk': { blk(n => (n.blocks = n.blocks || []).push(newBlock(x))); const i = N(id).blocks.length - 1; setTimeout(() => $(`#sec-b${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); break; }
    case 'delblk': { const nb = N(id).blocks[+x]; blk(n => n.blocks.splice(+x, 1)); toast(`Quadro “${nb.name || BT[nb.t].n}” removido · Ctrl+Z desfaz`); break; }
    case 'upblk': if (+x > 0) blk(n => { const [m] = n.blocks.splice(+x, 1); n.blocks.splice(+x - 1, 0, m); }); break;
    case 'colblk': blk(n => n.blocks[+x].col = !n.blocks[+x].col); break;
    case 'additem': addItem(+x); break;
    case 'delitem': blk(n => n.blocks[+x].data.items.splice(+y, 1)); break;
    case 'addrow': { blk(n => (n.blocks[+x].data.rows = n.blocks[+x].data.rows || []).push({})); $$(`#sec-b${x} .brow`).at(-1)?.querySelector('input,textarea,select')?.focus(); break; }
    case 'delrow': blk(n => n.blocks[+x].data.rows.splice(+y, 1)); break;
    case 'addcol': blk(n => { const D = n.blocks[+x].data; D.cols.push({ k: 'c' + uid().slice(-4), l: 'Coluna ' + (D.cols.length + 1) }); }); break;
    case 'deledge': put(EP(x), null); renderCard(); refresh(); break;
    case 'dup': closeModal(); dup(id); break;
    case 'del': closeModal(); delWithUndo(id); break;
    case 'kind': { const r = b.getBoundingClientRect(); kindsPop(r.left, r.bottom + 6, { change: id }); break; }
    case 'cont': case 'move': { const r = b.getBoundingClientRect(); monthPop(null, mAdd(N(id).m, 1), m => { carry(id, m, a === 'move' ? 'move' : 'cont'); if (a === 'move') closeModal(); else renderCard(); }, r.left, r.top, a === 'move' ? 'Mover para…' : 'Continuar em…'); break; }
  }
  return true;
}

/* =========================================================
   Pendências do mês anterior
   ========================================================= */
function openPending() {
  const prev = mAdd(ui.month, -1);
  const bridged = new Set(allEdges().filter(e => e.bridge).map(e => e.a));
  const list = monthNodes(prev).filter(n => n.status !== 'feito' && !STRUCT.has(n.k));
  openModal({
    title: `Pendências de ${mName(prev)}`, body: list.length ? `<p class="hint mb">Cada estrela escolhida ganha uma continuação em <b>${mName(ui.month)}</b>, ligada por uma ponte à original.</p>
    <div class="stat-list">${list.map(n => `<label class="li" style="cursor:pointer"><span class="lk" style="display:flex;align-items:center;gap:10px"><input type="checkbox" data-pd="${n.id}" ${bridged.has(n.id) ? '' : 'checked'} style="accent-color:#4ade80"><span class="kg">${kGlyph(n.k)}</span>${esc(label(n))}${bridged.has(n.id) ? '<span class="tag v">já continuada</span>' : ''}</span><span class="row" style="gap:6px"><span class="dot ${STATUS[n.status || 'planejado'][2]}"></span>${STATUS[n.status || 'planejado'][0]}</span></label>`).join('')}</div>` : `<div class="empty"><h3>Nada pendente em ${mName(prev)}</h3>Tudo foi concluído (ou o mês está vazio).</div>`,
    foot: list.length ? `<div class="modal-f"><button class="pill" data-act="modal-x">Cancelar</button><button class="pill white" data-act="pend-go">${ic('pend')}Trazer selecionadas</button></div>` : ''
  });
}
function doPending() {
  const ids = $$('#scrim [data-pd]:checked').map(c => c.dataset.pd); closeModal(); if (!ids.length) return;
  const sp = spineExt(); let i = 0;
  for (const id of ids) {
    const n = N(id), c = clone(n); c.id = uid(); c.m = ui.month; c.from = n.id; c.status = n.status === 'travado' ? 'travado' : 'planejado'; c.created = Date.now(); c.by = S.name; c.log = []; logIt(c, 'continua de ' + mName(n.m));
    c.x = Math.round(sp.min + 170 + (i % 6) * 170); c.y = c.spine ? 0 : -150 - Math.floor(i / 6) * 70; (c.blocks || []).forEach(b => b.id = uid());
    put(NP(c.id), c, null); createEdge(n.id, c.id, { label: 'continua', bridge: 1 }); ENTER.add(c.id); i++;
  }
  refresh(); toast(`${ids.length} pendência${ids.length > 1 ? 's' : ''} trazida${ids.length > 1 ? 's' : ''} com pontes`, 'g');
}

/* =========================================================
   Ajustes (protegidos por senha, igual aos painéis)
   ========================================================= */
function viewSet() {
  if (!isAdmin()) return `<div class="node pad empty locked-set"><h3>${ic('lock', 'width:16px;height:16px')} Ajustes protegidos</h3>Os ajustes exigem a senha de administrador.<div style="margin-top:14px"><button class="pill white" data-act="unlock">${ic('unlock')}Desbloquear</button></div></div>`;
  const c = cfg();
  const del = (k, i) => `<button class="pill sm icon ghost" data-act="r-del" data-k="${k}" data-i="${i}" aria-label="Excluir">${ic('trash')}</button>`;
  const color = (k, i, v) => `<input type="color" class="colorin" data-r="${k}:${i}:color" value="${esc(v || '#a78bfa')}">`;
  return `<div class="between mb"><div><h1>Ajustes</h1><div class="sub">Pessoas, times, marcas, canais e lojas valem para as duas constelações (Brasil e Estados Unidos).</div></div>${S.open ? '' : `<button class="pill" data-act="lock">${ic('lock')}Sair do modo admin</button>`}</div>
  <div class="grid set-grid">
    <div class="grid">
      <div><div class="label"><span class="dot p"></span>Pessoas</div><div class="node pad">
        <p class="hint mb">Quem executa. Aparecem como responsáveis nas estrelas, nos checklists e no filtro por pessoa. Toque no círculo para colocar foto.</p>
        ${reg('people').length ? `<div class="rowline hint rl-person"><span></span><span>Nome</span><span>Cargo</span><span>Time</span><span>Cor</span><span></span></div>` : ''}
        ${reg('people').map((p, i) => `<div class="rowline rl-person"><button class="av c" style="--c:${p.color || '#a78bfa'};width:30px;height:30px;cursor:pointer" data-act="r-photo" data-k="people" data-i="${i}" title="Foto">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.name))}</button><input class="inp sm" data-r="people:${i}:name" value="${esc(p.name)}" placeholder="Nome"><input class="inp sm" data-r="people:${i}:cargo" value="${esc(p.cargo || '')}" placeholder="Cargo"><select class="inp sm" data-r="people:${i}:team"><option value="">—</option>${reg('teams').map(t => `<option value="${t.id}" ${t.id === p.team ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select>${color('people', i, p.color)}${del('people', i)}</div>`).join('')}
        <button class="addrow" data-act="r-add" data-k="people">${ic('plus')}Adicionar pessoa</button></div></div>
      <div><div class="label"><span class="dot b"></span>Canais</div><div class="node pad">
        <p class="hint mb">Onde a comunicação acontece. Toque no logo para escolher da biblioteca, enviar SVG/PNG ou colar o código.</p>
        ${reg('channels').map((x, i) => `<div class="rowline rl-chan"><button class="lgbtn" style="--c:${x.color}" data-act="r-icon" data-k="channels" data-i="${i}" title="Logo">${logoSvg(x.icon, ink(x.color))}</button><input class="inp sm" data-r="channels:${i}:name" value="${esc(x.name)}">${color('channels', i, x.color)}${del('channels', i)}</div>`).join('')}
        <button class="addrow" data-act="r-add" data-k="channels">${ic('plus')}Adicionar canal</button></div></div>
      <div><div class="label"><span class="dot o"></span>Lojas</div><div class="node pad">
        <p class="hint mb">Onde se vende. Além do ícone, dá para enviar o logo horizontal (wordmark) — ele aparece no lugar do nome na constelação.</p>
        ${reg('stores').map((x, i) => `<div class="rowline rl-store"><button class="lgbtn" style="--c:#19191c" data-act="r-icon" data-k="stores" data-i="${i}" title="Logo">${logoSvg(x.icon, x.color)}</button><input class="inp sm" data-r="stores:${i}:name" value="${esc(x.name)}"><span class="row" style="gap:6px"><button class="pill sm" data-act="r-wide" data-k="stores" data-i="${i}">${ic('img')}${x.wide ? 'Trocar' : 'Logo horizontal'}</button>${x.wide ? `<button class="pill sm icon ghost" data-act="r-clr" data-k="stores" data-i="${i}" data-f="wide" title="Remover">${ic('x')}</button>` : ''}</span>${color('stores', i, x.color)}${del('stores', i)}</div>`).join('')}
        <button class="addrow" data-act="r-add" data-k="stores">${ic('plus')}Adicionar loja</button></div></div>
    </div>
    <div class="grid">
      <div><div class="label"><span class="dot"></span>Marcas · projetos</div><div class="node pad">
        ${reg('brands').map((x, i) => `<div class="rowline rl-brand2"><span class="dot" style="background:${x.color};box-shadow:0 0 10px ${x.color}80"></span><input class="inp sm" data-r="brands:${i}:name" value="${esc(x.name)}"><span class="row" style="gap:6px"><button class="pill sm" data-act="r-logo" data-k="brands" data-i="${i}">${x.logo ? `<img src="${esc(x.logo)}" style="height:14px;max-width:60px;object-fit:contain">` : ic('img') + 'Logo'}</button>${x.logo ? `<button class="pill sm icon ghost" data-act="r-clr" data-k="brands" data-i="${i}" data-f="logo" title="Remover">${ic('x')}</button>` : ''}</span>${color('brands', i, x.color)}${del('brands', i)}</div>`).join('')}
        <button class="addrow" data-act="r-add" data-k="brands">${ic('plus')}Adicionar marca</button></div></div>
      <div><div class="label"><span class="dot g"></span>Times</div><div class="node pad">
        ${reg('teams').map((x, i) => `<div class="rowline rl-team"><span class="dot" style="background:${x.color};box-shadow:0 0 10px ${x.color}80"></span><input class="inp sm" data-r="teams:${i}:name" value="${esc(x.name)}">${color('teams', i, x.color)}${del('teams', i)}</div>`).join('')}
        <button class="addrow" data-act="r-add" data-k="teams">${ic('plus')}Adicionar time</button></div></div>
      <div><div class="label"><span class="dot"></span>Identidade do painel <span class="dim" style="display:inline-flex;align-items:center;gap:6px">· ${flagHere()} ${esc(countryName())}</span></div><div class="node pad">
        <div class="row"><input class="inp" data-cfg="title.text" value="${esc(c.title.text || '')}" placeholder="Nome do painel"><input type="color" class="colorin big" style="width:60px" data-cfg="title.color" value="${esc(c.title.color || '#26262b')}"></div>
        <div class="between mt"><span class="hint">Tamanho</span><span class="hint" id="ts-v">${c.title.size || 15}px</span></div><input type="range" class="range" min="11" max="30" data-cfg="title.size" value="${c.title.size || 15}">
        <div class="row mt" style="flex-wrap:wrap"><button class="pill sm" data-act="logo-up">${ic('img')}${c.logo ? 'Trocar logo' : 'Enviar logo'}</button>${c.logo ? `<button class="pill sm ghost danger" data-act="logo-x">Remover logo</button>` : ''}</div>
        ${c.logo ? `<div class="between mt"><span class="hint">Altura do logo</span><span class="hint" id="ls-v">${c.logoSize}px</span></div><input type="range" class="range" min="28" max="220" data-cfg="logoSize" value="${c.logoSize}">` : ''}
        <div class="between mt"><span class="hint">Detalhes nas estrelas (pessoas, marcas, prazo)</span><button class="switch ${c.detail !== false ? 'on' : ''}" data-act="cfg-detail" role="switch"></button></div>
      </div></div>
      <div><div class="label"><span class="dot w"></span>Dados e backup</div><div class="node pad">
        <p class="hint mb">Tudo salva sozinho no servidor. Uma cópia diária fica guardada por 30 dias.</p>
        <div class="row" style="flex-wrap:wrap"><button class="pill sm" data-act="export">${ic('dl')}Baixar tudo (JSON)</button><button class="pill sm" data-act="import">${ic('ul')}Importar</button><button class="pill sm" data-act="bk-now">${ic('clock')}Fazer cópia agora</button></div>
        <div class="stat-list mt" id="bk-list"><p class="hint">Carregando cópias…</p></div></div></div>
      ${S.open ? '' : `<div><div class="label"><span class="dot r"></span>Senha de emergência</div><div class="node pad">
        <p class="hint mb">Usada quando o Quintal estiver fora do ar (endereço com <span class="mono">?emergencia</span>) e para abrir estes Ajustes.</p>
        <div class="fgrid"><input class="inp" type="password" id="np" placeholder="Nova senha" inputmode="numeric"><input class="inp" type="password" id="nc" placeholder="Repita" inputmode="numeric"></div>
        <button class="pill sm mt" data-act="pin-save">${ic('lock')}Alterar senha</button></div></div>`}
    </div>
  </div>`;
}
async function loadBackupList() {
  const el = $('#bk-list'); if (!el) return;
  try { const d = await req('/api/backups'); const list = d.backups || []; el.innerHTML = list.length ? list.slice(0, 30).map(b => `<div class="li"><span class="lk">${b.day.split('-').reverse().join('/')} · ${b.n} registros</span><button class="pill sm ghost" data-act="bk-dl" data-v="${b.day}">${ic('dl')}Baixar</button></div>`).join('') : '<p class="hint">Nenhuma cópia ainda — a primeira sai no primeiro acesso de amanhã.</p>'; }
  catch (e) { el.innerHTML = `<p class="hint">${esc(e.message)}</p>`; }
}
function regSet(k, fn, soft) { const items = clone(reg(k)); fn(items); saveReg(k, items); if (!soft) renderMain(); }
let pickFile = null;
$('#file').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f && pickFile) pickFile(f); };
function choose(accept, fn) { pickFile = fn; $('#file').accept = accept; $('#file').click(); }
function readImg(f, maxW = 256) {
  return new Promise((res, rej) => {
    if (!/^image\//.test(f.type)) return rej('Envie uma imagem (SVG, PNG, JPG ou WebP)');
    const r = new FileReader();
    r.onload = () => {
      if (f.type === 'image/svg+xml') return r.result.length > 400000 ? rej('SVG grande demais') : res(r.result);
      const img = new Image(); img.onload = () => { const s = Math.min(1, maxW / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/png')); }; img.onerror = () => rej('Imagem inválida'); img.src = r.result;
    };
    r.readAsDataURL(f);
  });
}
function iconPop(k, i, anchor) {
  const it = reg(k)[i];
  const grid = q => LIB_KEYS.filter(x => !q || norm(libName(x)).includes(norm(q))).map(x => `<button class="${it.icon === x ? 'on' : ''}" data-pick="${x}" title="${esc(libName(x))}" style="background:${libColor(x)}">${logoSvg(x, ink(libColor(x)))}</button>`).join('');
  const el = popUnder(`<b>Logo de “${esc(it.name)}”</b><input class="inp sm mt" data-iq placeholder="Buscar na biblioteca…"><div class="icog" data-ig>${grid('')}</div>
    <div class="sepl" style="margin:12px 0"></div><div class="row" style="flex-wrap:wrap;gap:6px"><button class="pill sm" data-ip="up">${ic('ul')}Enviar SVG/PNG</button><button class="pill sm" data-ip="paste">${ic('file')}Colar SVG</button></div>
    <textarea class="inp mt" data-svg placeholder="<svg viewBox=…>…</svg>" style="display:none;min-height:70px"></textarea>`, anchor, 340);
  el.querySelector('[data-iq]').oninput = e => el.querySelector('[data-ig]').innerHTML = grid(e.target.value);
  el.onclick = e => {
    const p = e.target.closest('[data-pick]'); if (p) { const key = p.dataset.pick; regSet(k, a => { a[i].icon = key; if (/^Nov[oa] /.test(a[i].name)) { a[i].name = libName(key); a[i].color = libColor(key); } }); closePop(); return; }
    const ip = e.target.closest('[data-ip]')?.dataset.ip;
    if (ip === 'up') choose('image/*', async f => { try { const u = await readImg(f, 128); regSet(k, a => a[i].icon = u); closePop(); } catch (er) { toast(String(er), 'r'); } });
    if (ip === 'paste') { const ta = el.querySelector('[data-svg]'); if (ta.style.display === 'none') { ta.style.display = ''; ta.focus(); return; } const s = ta.value.trim(); if (!/^<svg[\s\S]*<\/svg>$/i.test(s)) return toast('Cole um SVG completo (<svg …>…</svg>)', 'r'); const cl = s.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/\son\w+="[^"]*"/gi, '').replace(/javascript:/gi, ''); regSet(k, a => a[i].icon = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(cl)))); closePop(); }
  };
}
function download(name, obj) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

/* ---------- senha de administrador ---------- */
async function checkPin(kind, pin) {
  const r = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kind, pin }) }).catch(() => null);
  if (!r) return false;
  if (r.status === 429) { toast('Muitas tentativas. Aguarde alguns minutos.', 'r'); return false; }
  const d = await r.json().catch(() => ({}));
  if (r.ok && d.ok) { if (d.role) S.role = d.role; return true; }
  return false;
}
function pinOverlay(onOk, msg) {
  $('#gate')?.remove();
  const g = document.createElement('div'); g.id = 'gate'; g.className = 'soft';
  g.innerHTML = `<div class="gate-box"><div class="gate-t">${ic('lock', 'width:18px;height:18px')}${esc(msg || 'Senha de administrador')}</div><input class="gate-in" id="gate-pin" type="password" inputmode="numeric" autocomplete="off" aria-label="Senha de administrador"><div class="hint" style="text-align:center">Esc para cancelar</div></div>`;
  document.body.appendChild(g);
  const inp = $('#gate-pin'); setTimeout(() => inp.focus(), 60);
  let busy = 0; const done = () => { g.classList.add('out'); setTimeout(() => g.remove(), 420); };
  inp.addEventListener('input', async () => { const v = inp.value.trim(), n = ++busy; if (v.length < 4) return; if (await checkPin('admin', v) && n === busy) { inp.disabled = true; done(); onOk(); } });
  inp.addEventListener('keydown', async e => { if (e.key === 'Escape') { e.stopPropagation(); done(); } if (e.key === 'Enter' && !(await checkPin('admin', inp.value.trim()))) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.select(); } });
  g.addEventListener('mousedown', e => { if (e.target === g) done(); });
}
const requireAdmin = (cb, msg) => isAdmin() ? cb() : pinOverlay(cb, msg);

/* =========================================================
   Cliques e campos (delegação, como nos painéis)
   ========================================================= */
const openSet = () => requireAdmin(() => { ui.view = 'set'; render(); scrollTo({ top: 0 }); }, 'Senha para abrir os Ajustes');
const ACT = {
  view: a => { ui.view = a.dataset.v; ui.sel = null; saveUi(); render(); scrollTo({ top: 0 }); },
  noop: () => { },
  'm-prev': () => goMonth(mAdd(ui.month, -1)), 'm-next': () => goMonth(mAdd(ui.month, 1)),
  'y-prev': () => { ui.month = mAdd(ui.month, -12); saveUi(); render(); }, 'y-next': () => { ui.month = mAdd(ui.month, 12); saveUi(); render(); },
  mpick: a => monthPop(a, ui.month, goMonth),
  'goto-m': a => { ui.month = a.dataset.v; ui.view = 'mapa'; saveUi(); render(); scrollTo({ top: 0 }); },
  brand: a => { ui.brand = a.dataset.v; saveUi(); render(); },
  country: a => {
    const other = B() === 'br' ? 'us' : 'br', url = location.hostname.startsWith('constelacao-') ? location.origin.replace(/constelacao-[a-z]{2}\./, `constelacao-${other}.`) + '/' : location.pathname + '?b=' + other;
    popUnder(`<b>Constelações por país</b><div class="stat-list mt"><div class="li"><span class="lk" style="display:flex;gap:8px;align-items:center">${flagHere()}${esc(countryName())}</span><span class="tag">aqui</span></div><a class="li linkrow" href="${esc(url)}" style="text-decoration:none;color:inherit"><span class="lk" style="display:flex;gap:8px;align-items:center">${flagSVG(other === 'us' ? 'US' : 'BR')}${other === 'us' ? 'Estados Unidos' : 'Brasil'}</span>${ic('r')}</a></div>${S.open ? '' : `<button class="pill sm ghost mt" data-act="logout">${ic('logout')}Sair</button>`}`, a, 260);
  },
  logout: () => fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).finally(() => location.replace('https://meucaos.com/')),
  'new-star': a => { const r = a.getBoundingClientRect(); kindsPop(r.right - 340, r.bottom + 8); },
  kinds: a => { const r = a.getBoundingClientRect(); kindsPop(r.left, r.bottom + 8); },
  'spine-add': a => { const r = a.getBoundingClientRect(); kindsPop(r.right + 10, r.top - 20); },
  pend: () => openPending(), 'pend-go': () => doPending(),
  undo: () => undo(), redo: () => undo(true),
  zin: () => { const r = cvR(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.25, true); },
  zout: () => { const r = cvR(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, .8, true); },
  fit: () => fit(),
  branch: a => { ui.branch = !ui.branch; a.classList.toggle('on', ui.branch); saveUi(); toast(ui.branch ? 'Arrastar uma estrela leva o ramo junto' : 'Arrastar move só a estrela'); },
  full: a => { ui.full = !ui.full; $('#cvcard').classList.toggle('full', ui.full); document.body.classList.toggle('cvfull', ui.full); a.innerHTML = ic(ui.full ? 'nofull' : 'full'); setTimeout(() => fit(), 30); },
  open: a => openCard(a.dataset.v), dup: a => dup(a.dataset.v), del: a => delWithUndo(a.dataset.v), carry: a => carryPop(a.dataset.v, a),
  focus: a => focusNode(a.dataset.v),
  goset: () => { closeModal(); openSet(); },
  'modal-x': () => closeModal(),
  unlock: () => requireAdmin(() => render(), 'Senha para abrir os Ajustes'),
  lock: async () => { await fetch('/api/demote', { method: 'POST', credentials: 'same-origin' }).catch(() => { }); const s = await fetch('/api/session', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({})); S.role = s.role || 'view'; ui.view = 'mapa'; render(); toast('Modo administrador encerrado'); },
  'r-add': a => { const k = a.dataset.k, items = reg(k); const base = { id: k.slice(0, 2) + '_' + uid(), name: { people: 'Nova pessoa', teams: 'Novo time', brands: 'Nova marca', channels: 'Novo canal', stores: 'Nova loja' }[k], color: PALETTE[items.length % PALETTE.length] }; if (k === 'channels') base.icon = 'site'; if (k === 'stores') base.icon = 'loja'; regSet(k, x => x.push(base)); setTimeout(() => { const l = $$(`[data-r^="${k}:"][data-r$=":name"]`).at(-1); l?.focus(); l?.select(); }, 30); },
  'r-del': a => { const k = a.dataset.k, i = +a.dataset.i, it = reg(k)[i]; if (confirm(`Remover “${it.name}”? As estrelas que usam este cadastro ficam sem ele.`)) regSet(k, x => x.splice(i, 1)); },
  'r-icon': a => iconPop(a.dataset.k, +a.dataset.i, a),
  'r-photo': a => choose('image/*', async f => { try { const u = await readImg(f, 160); regSet(a.dataset.k, x => x[+a.dataset.i].photo = u); } catch (er) { toast(String(er), 'r'); } }),
  'r-logo': a => choose('image/*', async f => { try { const u = await readImg(f, 320); regSet(a.dataset.k, x => x[+a.dataset.i].logo = u); } catch (er) { toast(String(er), 'r'); } }),
  'r-wide': a => choose('image/*', async f => { try { const u = await readImg(f, 420); regSet(a.dataset.k, x => x[+a.dataset.i].wide = u); } catch (er) { toast(String(er), 'r'); } }),
  'r-clr': a => regSet(a.dataset.k, x => delete x[+a.dataset.i][a.dataset.f]),
  'logo-up': () => choose('image/*', async f => { try { const u = await readImg(f, 900); setCfg('logo', u); render(); } catch (er) { toast(String(er), 'r'); } }),
  'logo-x': () => { setCfg('logo', ''); render(); },
  'cfg-detail': () => { setCfg('detail', cfg().detail === false); render(); },
  export: () => download(`constelacao-${B()}-${today()}.json`, { format: 'constelacao-v1', board: B(), exportedAt: new Date().toISOString(), docs: S.docs }),
  import: () => choose('.json,application/json', async f => { try { const d = JSON.parse(await f.text()); let n = 0; for (const [p, b] of Object.entries(d.docs || {})) { const q = p.replace(/^(node|edge)\/(br|us)\./, `$1/${B()}.`).replace(/^app\/board\.(br|us)$/, `app/board.${B()}`); if (/^(node|edge)\//.test(q) && b) b.b = B(); put(q, b); n++; } toast(`${n} itens importados`, 'g'); render(); } catch (er) { toast('Arquivo inválido', 'r'); } }),
  'bk-now': async () => { await req('/api/backups/now', { method: 'POST' }).catch(() => { }); toast('Cópia feita', 'g'); loadBackupList(); },
  'bk-dl': async a => { const d = await req('/api/backups/' + a.dataset.v); download(`constelacao-${B()}-backup-${a.dataset.v}.json`, d); },
  'pin-save': async () => { const a = $('#np').value.trim(), b = $('#nc').value.trim(); if (a.length < 4) return toast('A senha precisa ter pelo menos 4 caracteres', 'r'); if (a !== b) return toast('As duas senhas não conferem', 'r'); try { await req('/api/pin', { method: 'POST', body: JSON.stringify({ pin: a }) }); $('#np').value = ''; $('#nc').value = ''; toast('Senha alterada', 'g'); } catch (e) { toast('Não foi possível alterar a senha', 'r'); } }
};
document.addEventListener('click', e => {
  if (cardClick(e)) return;
  const a = e.target.closest('[data-act]'); if (!a || a.disabled) return;
  const f = ACT[a.dataset.act]; if (f) { closePop(); f(a); }
});
document.addEventListener('change', e => { const t = e.target; if (t.dataset.ui) { ui[t.dataset.ui] = t.value; saveUi(); refresh(); } });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.r) { const [k, i, f] = t.dataset.r.split(':'); regSet(k, x => x[+i][f] = t.value, true); if (f === 'color') { const dot = t.closest('.rowline')?.querySelector('.dot,.av,.lgbtn'); if (dot) { dot.style.setProperty('--c', t.value); if (dot.classList.contains('dot')) { dot.style.background = t.value; dot.style.boxShadow = `0 0 10px ${t.value}80`; } } } return; }
  if (t.dataset.cfg) {
    const k = t.dataset.cfg, v = t.type === 'range' ? +t.value : t.value;
    if (k.startsWith('title.')) { const tt = { ...cfg().title }; tt[k.slice(6)] = v; setCfg('title', tt); $('#titlebar').innerHTML = titlePillHTML(); if (k === 'title.size') $('#ts-v').textContent = v + 'px'; }
    else { setCfg(k, v); if (k === 'logoSize') { const img = $('#hero-logo'); if (img) img.style.height = v + 'px'; $('#ls-v').textContent = v + 'px'; } }
  }
});
$('#gearfab').onclick = () => { if (ui.view === 'set') { ui.view = 'mapa'; render(); return; } openSet(); };
function goMonth(m) { if (m === ui.month) return; ui.month = m; ui.sel = null; saveUi(); render(); }
function saveUi() { try { localStorage.setItem('cst.ui.' + B(), JSON.stringify({ view: ui.view === 'set' ? 'mapa' : ui.view, month: ui.month, brand: ui.brand, branch: ui.branch })); } catch (e) { } }
function loadUi() { try { Object.assign(ui, JSON.parse(localStorage.getItem('cst.ui.' + B())) || {}); } catch (e) { } }

/* ---------- teclado ---------- */
document.addEventListener('keydown', e => {
  const typing = e.target.matches('input,textarea,select,[contenteditable]');
  if (e.key === 'Escape') { if ($('#gate')) return; if ($('#pop')) return closePop(); if ($('#scrim')) return closeModal(); if (ui.full) return ACT.full($('[data-act="full"]')); if (PLACE) return cancelPlace(); if (ui.sel) { ui.sel = null; renderWorld(); } return; }
  if (typing || $('#scrim') || ui.view !== 'mapa') return;
  const k = e.key.toLowerCase();
  if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); return undo(e.shiftKey); }
  if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); return undo(true); }
  if ((e.ctrlKey || e.metaKey) && k === 'd') { e.preventDefault(); if (ui.sel) dup(ui.sel); return; }
  if ((e.key === 'Delete' || e.key === 'Backspace') && ui.sel) { e.preventDefault(); return delWithUndo(ui.sel); }
  if ((e.key === 'Delete' || e.key === 'Backspace') && ui.selEdge) { put(EP(ui.selEdge), null); ui.selEdge = null; return renderWorld(); }
  if (e.key === 'Enter' && ui.sel) { e.preventDefault(); return openCard(ui.sel); }
  if (k === 'f') return fit();
  if (e.key === '+' || e.key === '=') return ACT.zin();
  if (e.key === '-') return ACT.zout();
});
addEventListener('resize', () => { if (ui.view === 'mapa') renderWorld(); });
addEventListener('scroll', () => posSelTb(), { passive: true });

/* ---------- glitch no logo do topo (liga/desliga no Quintal) ---------- */
(function () {
  const wrap = () => {
    const img = document.getElementById('hero-logo');
    if (!img || img.parentElement.classList.contains('glx')) return;
    const w = document.createElement('span'); w.className = 'glx';
    img.replaceWith(w); w.appendChild(img);
    for (const c of ['gl1', 'gl2']) { const g = img.cloneNode(); g.removeAttribute('id'); g.className = 'gl ' + c; g.alt = ''; g.setAttribute('aria-hidden', 'true'); w.appendChild(g); }
  };
  new MutationObserver(wrap).observe(document.body, { childList: true, subtree: true });
  window.setGlitch = on => document.body.classList.toggle('noglitch', !on);
})();

/* =========================================================
   Login único pelo Quintal do CAO(S) e início
   ========================================================= */
const QUINTAL = 'https://meucaos.com/';
function lockScreen() {
  document.body.classList.add('locked');
  if (/[?&]emergencia\b/.test(location.search)) return emergencyGate(false);
  fetch('/api/session', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ down: true })).then(d => {
    if (d.role) { location.reload(); return; }
    if (d.down) return emergencyGate(true);
    if (d.reason === 'acesso') return denied();
    location.replace(QUINTAL + '?next=' + encodeURIComponent(location.origin + location.pathname));
  });
}
function denied() {
  $('#gate')?.remove();
  const g = document.createElement('div'); g.id = 'gate'; g.className = 'soft';
  g.innerHTML = `<div class="node pad empty" style="max-width:420px"><h3>${ic('lock', 'width:16px;height:16px')} Sem acesso a esta constelação</h3>Peça ao mestre para liberar este painel para você nos Ajustes do Quintal.<div style="margin-top:14px"><a class="pill white" href="${QUINTAL}">Voltar ao Quintal</a></div></div>`;
  document.body.appendChild(g);
}
function emergencyGate(down) {
  $('#gate')?.remove();
  const g = document.createElement('div'); g.id = 'gate';
  g.innerHTML = `<div class="gate-box"><input class="gate-in" id="gate-pin" type="password" inputmode="numeric" autocomplete="off" aria-label="Senha de emergência"><div class="hint" style="text-align:center">${down ? 'Quintal fora do ar · senha de emergência' : 'Senha de emergência'}</div></div>`;
  document.body.appendChild(g);
  const inp = $('#gate-pin'); setTimeout(() => inp.focus(), 60);
  inp.addEventListener('keydown', async e => { if (e.key === 'Enter') { if (await checkPin('admin', inp.value.trim())) location.replace(location.pathname); else { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.select(); } } });
}
(async function boot() {
  let s;
  try { s = await (await fetch('/api/session', { credentials: 'same-origin' })).json(); } catch (e) { s = { down: true }; }
  if (!s.role) return lockScreen();
  S.role = s.role; S.name = s.name || ''; S.board = s.board || 'br'; S.open = !!s.open;
  if (s.glitch === false) setGlitch(false);
  const d = await req('/api/docs');
  S.docs = d.docs || {}; S.since = d.now || 0;
  loadUi();
  if (!['mapa', 'ano', 'lista'].includes(ui.view)) ui.view = 'mapa';
  if (isAdmin()) for (const k of Object.keys(REG0)) if (!S.docs['app/reg.' + k] && REG0[k].length) put('app/reg.' + k, { items: REG0[k], upd: Date.now() }, null, true);
  UNDO.length = 0; S.ready = true;
  document.title = `${cfg().title.text || 'Constelação de ações'} · ${countryName()}`;
  render();
  setInterval(poll, 5000);
})();
