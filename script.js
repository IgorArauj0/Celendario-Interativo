// Configuração básica do calendário
const YEAR = 2026, MONTH = 6;
const STORAGE_KEY = 'boletins-julho-2026';
const DRAFTS_STORAGE_KEY = 'boletins-julho-2026-drafts';

// Elementos da interface
const grid = document.getElementById('grid');
const overlay = document.getElementById('overlay');
const counterEl = document.getElementById('counter');
const pdfBtn = document.getElementById('btnPdf');

// Estado da aplicação
let data = {};
let drafts = {};
let activeDay = null;
let activeEntryIndex = null;

// Data atual para destacar o dia de hoje
const todayStr = (() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
})();

// Gera a chave única de um dia no calendário
function key(day) {
    return YEAR + '-' + String(MONTH + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
}

// Gera a chave usada para identificar um rascunho de boletim
function draftKey(day, entryIndex) {
    const indexKey = entryIndex === null || entryIndex === undefined ? 'new' : entryIndex;
    return key(day) + '::' + indexKey;
}

// Escapa conteúdo para evitar renderização insegura em HTML
function esc(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
}

// Retorna os boletins de um dia, sempre como array
function getEntriesForDay(k) {
    const value = data[k];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return [value];
    return [];
}

// Renderiza o calendário completo com os boletins salvos
function render() {
    grid.innerHTML = '';
    const first = new Date(YEAR, MONTH, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;

    let count = 0;
    for (let i = 0; i < totalCells; i++) {
        const dayNum = i - startPad + 1;
        const cell = document.createElement('div');
        if (dayNum < 1 || dayNum > daysInMonth) {
            cell.className = 'cell pad';
            grid.appendChild(cell);
            continue;
        }
        const k = key(dayNum);
        const isToday = k === todayStr;
        cell.className = 'cell' + (isToday ? ' today' : '');
        cell.onclick = () => openModal(dayNum, null);

        const num = document.createElement('div');
        num.className = 'daynum';
        num.innerHTML = dayNum + (isToday ? '<span class="today-dot"></span>' : '');
        cell.appendChild(num);

        const entries = getEntriesForDay(k);
        if (entries.length) {
            count += entries.length;
            cell.classList.add('has-entries');
            if (entries.length > 1) cell.classList.add('has-many');
            const stack = document.createElement('div');
            stack.className = 'entry-stack';
            const countBadge = document.createElement('div');
            countBadge.className = 'entry-count';
            countBadge.textContent = entries.length + (entries.length === 1 ? ' boletim' : ' boletins');
            stack.appendChild(countBadge);
            entries.forEach((entry, index) => {
                const e = document.createElement('div');
                e.className = 'entry';
                e.onclick = (event) => {
                    event.stopPropagation();
                    openModal(dayNum, index);
                };

                const head = document.createElement('div');
                head.className = 'entry-head';
                head.innerHTML = '<span class="entry-index">' + (index + 1) + '</span><span class="entry-tag">Boletim</span>';

                const removeBtn = document.createElement('button');
                removeBtn.className = 'entry-remove';
                removeBtn.type = 'button';
                removeBtn.textContent = '×';
                removeBtn.title = 'Remover este boletim';
                removeBtn.onclick = (event) => {
                    event.stopPropagation();
                    removeEntry(dayNum, index);
                };

                head.appendChild(removeBtn);

                const title = document.createElement('p');
                title.className = 't';
                title.textContent = entry.title;

                const desc = document.createElement('p');
                desc.className = 'd';
                desc.textContent = entry.desc || '';

                e.appendChild(head);
                e.appendChild(title);
                if (entry.desc) e.appendChild(desc);
                if (entry.art) {
                    const img = document.createElement('img');
                    img.src = entry.art;
                    img.onerror = () => { img.style.display = 'none'; };
                    e.appendChild(img);
                }
                stack.appendChild(e);
            });
            cell.appendChild(stack);
        } else {
            const add = document.createElement('div');
            add.className = 'add';
            add.textContent = '+';
            cell.appendChild(add);
        }
        grid.appendChild(cell);
    }
    const counterLabel = count === 1 ? 'boletim programado' : 'boletins programados';
    counterEl.innerHTML = '<b>' + count + '</b>' + counterLabel;
}

// Abre o modal para criar ou editar um boletim
function openModal(day, entryIndex = null) {
    activeDay = day;
    activeEntryIndex = entryIndex;
    const k = key(day);
    const entries = getEntriesForDay(k);
    const draft = drafts[draftKey(day, entryIndex)];
    const entry = draft || ((entryIndex !== null && entries[entryIndex]) ? entries[entryIndex] : { title: '', desc: '', art: '' });
    document.getElementById('mdate').textContent = day + ' de julho de 2026';
    document.getElementById('fTitle').value = entry.title;
    document.getElementById('fDesc').value = entry.desc;
    document.getElementById('fArt').value = entry.art;
    const prev = document.getElementById('fArtPreview');
    if (entry.art) { prev.src = entry.art; prev.style.display = 'block'; } else { prev.style.display = 'none'; }
    document.getElementById('btnDel').style.visibility = (entryIndex !== null && entries[entryIndex]) ? 'visible' : 'hidden';
    overlay.classList.add('open');
}

// Fecha o modal e salva o conteúdo atual como rascunho
function closeModal() {
    if (activeDay !== null) {
        const draftEntry = {
            title: document.getElementById('fTitle').value.trim(),
            desc: document.getElementById('fDesc').value.trim(),
            art: document.getElementById('fArt').value.trim()
        };
        if (draftEntry.title || draftEntry.desc || draftEntry.art) {
            drafts[draftKey(activeDay, activeEntryIndex)] = draftEntry;
        } else {
            delete drafts[draftKey(activeDay, activeEntryIndex)];
        }
        persist();
    }
    overlay.classList.remove('open');
    activeDay = null;
    activeEntryIndex = null;
}

// Salva automaticamente o que foi digitado no formulário
function saveDraftFromForm() {
    if (activeDay === null) return;
    const draftEntry = {
        title: document.getElementById('fTitle').value.trim(),
        desc: document.getElementById('fDesc').value.trim(),
        art: document.getElementById('fArt').value.trim()
    };
    if (draftEntry.title || draftEntry.desc || draftEntry.art) {
        drafts[draftKey(activeDay, activeEntryIndex)] = draftEntry;
    } else {
        delete drafts[draftKey(activeDay, activeEntryIndex)];
    }
    persist();
}

document.getElementById('fTitle').addEventListener('input', saveDraftFromForm);
document.getElementById('fDesc').addEventListener('input', saveDraftFromForm);
document.getElementById('fArt').addEventListener('input', (e) => {
    const prev = document.getElementById('fArtPreview');
    if (e.target.value) { prev.src = e.target.value; prev.style.display = 'block'; }
    else { prev.style.display = 'none'; }
    saveDraftFromForm();
});

document.getElementById('btnCancel').onclick = closeModal;
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

// Gera uma versão para impressão/PDF do calendário atual
if (pdfBtn) {
    pdfBtn.onclick = async () => {
        const title = 'Calendário editorial - Julho 2026';
        const printWindow = window.open('', '_blank', 'width=1200,height=900');
        if (!printWindow) {
            alert('Permita pop-ups para gerar o PDF.');
            return;
        }

        const calendarMarkup = document.querySelector('.wrap').outerHTML;
        //Carregando HTML incorporado com estilo e conteúdo do calendário
        printWindow.document.write(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; color: #141E2E; background: #FAF7F0; }
    .wrap { max-width: 100%; margin: 0 auto; }
    .masthead { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #E4DDCB; }
    .brand-row { display: flex; align-items: center; gap: 12px; }
    .quill { width: 28px; height: 28px; }
    h1 { font-family: Fraunces, Georgia, serif; font-size: 24px; margin: 0; color: #141E2E; }
    .eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 10px; color: #9A7530; margin: 0 0 4px; }
    .stroke { width: 220px; height: 12px; margin-top: 6px; }
    .subline { color: #3C4A5E; font-size: 11px; margin: 8px 0 12px; max-width: 760px; line-height: 1.4; }
    .weekdays, .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .weekdays { margin-bottom: 3px; }
    .weekdays span { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #3C4A5E; padding: 3px 4px 5px; }
    .grid { background: #E4DDCB; border: 1px solid #E4DDCB; }
    .cell { background: #FAF7F0; min-height: 96px; padding: 7px; display: flex; flex-direction: column; border: 1px solid #E4DDCB; }
    .daynum { font-family: Fraunces, Georgia, serif; font-size: 12px; font-weight: 600; color: #141E2E; }
    .entry { background: #FFFFFF; border: 1px solid #E4DDCB; border-left: 3px solid #C49A5A; border-radius: 5px; padding: 5px; margin-top: 5px; font-size: 9px; line-height: 1.3; }
    .entry .t { font-weight: 700; margin: 0 0 1px; color: #141E2E; }
    .entry .d { margin: 0; color: #3C4A5E; }
    .entry img { width: 100%; height: 30px; object-fit: cover; border-radius: 3px; margin-top: 4px; }
    .add { display: none; }
    .today { background: #FBF1DC; }
    .counter { font-size: 11px; text-align: right; color: #3C4A5E; }
    .counter b { display: block; font-size: 18px; color: #141E2E; }
    .empty-hint { margin-top: 10px; color: #3C4A5E; font-size: 10px; }
    .entry-count, .entry-head, .entry-remove, .entry-index, .entry-tag { display: none !important; }
  </style>
</head>
<body>
${calendarMarkup}
</body>
</html>`);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };
}

// Salva o boletim no estado e no storage
document.getElementById('btnSave').onclick = async () => {
    const title = document.getElementById('fTitle').value.trim();
    if (!title) { document.getElementById('fTitle').focus(); return; }
    const k = key(activeDay);
    const newEntry = {
        title,
        desc: document.getElementById('fDesc').value.trim(),
        art: document.getElementById('fArt').value.trim()
    };
    const existingEntries = getEntriesForDay(k);
    if (activeEntryIndex !== null && existingEntries[activeEntryIndex]) {
        existingEntries[activeEntryIndex] = newEntry;
        data[k] = existingEntries;
    } else {
        data[k] = [...existingEntries, newEntry];
    }
    if (!data[k].length) delete data[k];
    delete drafts[draftKey(activeDay, activeEntryIndex)];
    await persist();
    render();
    closeModal();
};

// Remove um boletim específico de um dia
async function removeEntry(day, index) {
    const k = key(day);
    const entries = getEntriesForDay(k);
    if (index < 0 || index >= entries.length) return;
    entries.splice(index, 1);
    if (entries.length) data[k] = entries;
    else delete data[k];
    delete drafts[draftKey(day, index)];
    await persist();
    render();
    closeModal();
}

// Botão de remoção do boletim aberto no modal
document.getElementById('btnDel').onclick = async () => {
    if (activeDay === null || activeEntryIndex === null) return;
    await removeEntry(activeDay, activeEntryIndex);
};

// Persiste os boletins e os rascunhos no armazenamento do navegador
async function persist() {
    try {
        if (window.storage && typeof window.storage.set === 'function') {
            await window.storage.set(STORAGE_KEY, JSON.stringify(data));
            await window.storage.set(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
            return;
        }
    } catch (err) {
        console.error('Falha ao salvar no storage', err);
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (err) {
        console.error('Falha ao salvar no localStorage', err);
    }
}

// Carrega os dados salvos ao iniciar a página
async function load() {
    try {
        if (window.storage && typeof window.storage.get === 'function') {
            const res = await window.storage.get(STORAGE_KEY);
            data = res ? JSON.parse(res.value) : {};
            const draftRes = await window.storage.get(DRAFTS_STORAGE_KEY);
            drafts = draftRes ? JSON.parse(draftRes.value) : {};
        } else {
            const storedData = localStorage.getItem(STORAGE_KEY);
            data = storedData ? JSON.parse(storedData) : {};
            const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
            drafts = storedDrafts ? JSON.parse(storedDrafts) : {};
        }
    } catch (err) {
        data = {};
        drafts = {};
    }
    Object.keys(data).forEach((keyName) => {
        if (data[keyName] && !Array.isArray(data[keyName]) && typeof data[keyName] === 'object') {
            data[keyName] = [data[keyName]];
        }
    });
    await persist();
    render();
}

load();