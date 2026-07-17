// Configuração básica do calendário
const BASE_YEAR = 2026;
const BASE_MONTH = 6;
const STORAGE_KEY = 'boletins-calendar-data';
const DRAFTS_STORAGE_KEY = 'boletins-calendar-drafts';
const LEGACY_STORAGE_KEY = 'boletins-julho-2026';
const LEGACY_DRAFTS_STORAGE_KEY = 'boletins-julho-2026-drafts';

// Elementos da interface
const grid = document.getElementById('grid');
const overlay = document.getElementById('overlay');
const counterEl = document.getElementById('counter');
const pdfBtn = document.getElementById('btnPdf');
const saveCalendarBtn = document.getElementById('btnSaveCalendar');
const monthLabelEl = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('btnPrevMonth');
const nextMonthBtn = document.getElementById('btnNextMonth');

// Estado da aplicação
let data = {};
let drafts = {};
let activeDay = null;
let activeEntryIndex = null;
let currentYear = BASE_YEAR;
let currentMonth = BASE_MONTH;

// Data atual para destacar o dia de hoje
const today = new Date();

function getMonthKey(year, month) {
    return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthBucket(year, month) {
    const monthKey = getMonthKey(year, month);
    if (!data[monthKey]) data[monthKey] = {};
    return data[monthKey];
}

function getDraftBucket(year, month) {
    const monthKey = getMonthKey(year, month);
    if (!drafts[monthKey]) drafts[monthKey] = {};
    return drafts[monthKey];
}

function getMonthName(year, month) {
    return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month, 1)).replace(/^\w/, (char) => char.toUpperCase());
}

function getMonthTitle() {
    return `Boletins de ${getMonthName(currentYear, currentMonth)}`;
}

// Gera a chave única de um dia no calendário
function key(day) {
    return currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
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
    const monthBucket = getMonthBucket(currentYear, currentMonth);
    const value = monthBucket[k];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return [value];
    return [];
}

// Renderiza o calendário completo com os boletins salvos
function render() {
    grid.innerHTML = '';
    const first = new Date(currentYear, currentMonth, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
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
        const isToday = currentYear === today.getFullYear() && currentMonth === today.getMonth() && dayNum === today.getDate();
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

    const headingEl = document.querySelector('.brand-row h1');
    if (headingEl) headingEl.textContent = getMonthTitle();
    if (monthLabelEl) monthLabelEl.textContent = `${getMonthName(currentYear, currentMonth)} ${currentYear}`;
}

// Abre o modal para criar ou editar um boletim
function openModal(day, entryIndex = null) {
    activeDay = day;
    activeEntryIndex = entryIndex;
    const k = key(day);
    const entries = getEntriesForDay(k);
    const draftBucket = getDraftBucket(currentYear, currentMonth);
    const draft = draftBucket[draftKey(day, entryIndex)];
    const entry = draft || ((entryIndex !== null && entries[entryIndex]) ? entries[entryIndex] : { title: '', desc: '', art: '' });
    const monthName = getMonthName(currentYear, currentMonth);
    document.getElementById('mdate').textContent = day + ' de ' + monthName + ' de ' + currentYear;
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
        const draftBucket = getDraftBucket(currentYear, currentMonth);
        const draftKeyName = draftKey(activeDay, activeEntryIndex);
        if (draftEntry.title || draftEntry.desc || draftEntry.art) {
            draftBucket[draftKeyName] = draftEntry;
        } else {
            delete draftBucket[draftKeyName];
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
    const draftBucket = getDraftBucket(currentYear, currentMonth);
    const draftKeyName = draftKey(activeDay, activeEntryIndex);
    if (draftEntry.title || draftEntry.desc || draftEntry.art) {
        draftBucket[draftKeyName] = draftEntry;
    } else {
        delete draftBucket[draftKeyName];
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

function updateSaveStatus(message, isSaving = false) {
    if (!saveCalendarBtn) return;
    saveCalendarBtn.disabled = isSaving;
    saveCalendarBtn.textContent = message;
}

// Salva explicitamente o estado atual do calendário
if (saveCalendarBtn) {
    saveCalendarBtn.onclick = async () => {
        updateSaveStatus('Salvando...', true);
        try {
            await persist();
            updateSaveStatus('Calendário salvo');
        } catch (err) {
            console.error('Falha ao salvar o calendário', err);
            updateSaveStatus('Falha ao salvar');
        }
        setTimeout(() => {
            if (saveCalendarBtn) updateSaveStatus('Salvar calendário atual');
        }, 1500);
    };
}

function changeMonth(delta) {
    const nextDate = new Date(currentYear, currentMonth + delta, 1);
    currentYear = nextDate.getFullYear();
    currentMonth = nextDate.getMonth();
    render();
}

if (prevMonthBtn) {
    prevMonthBtn.onclick = () => changeMonth(-1);
}

if (nextMonthBtn) {
    nextMonthBtn.onclick = () => changeMonth(1);
}

// Gera uma versão para impressão/PDF do calendário atual
if (pdfBtn) {
    pdfBtn.onclick = async () => {
        const title = 'Calendário editorial - ' + getMonthTitle();
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
    .wrap { max-width: 100%; margin: 0 auto; transform: scale(0.92); transform-origin: top left; width: 108.7%; }
    .masthead { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #E4DDCB; }
    .brand-row { display: flex; align-items: center; gap: 10px; }
    .quill { width: 24px; height: 24px; }
    h1 { font-family: Fraunces, Georgia, serif; font-size: 20px; margin: 0; color: #141E2E; }
    .eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 9px; color: #9A7530; margin: 0 0 3px; }
    .stroke { width: 180px; height: 10px; margin-top: 4px; }
    .subline { color: #3C4A5E; font-size: 10px; margin: 6px 0 10px; max-width: 760px; line-height: 1.3; }
    .weekdays, .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; }
    .weekdays { margin-bottom: 2px; }
    .weekdays span { font-size: 8px; text-transform: uppercase; font-weight: 700; color: #3C4A5E; padding: 2px 3px 4px; }
    .grid { background: #E4DDCB; border: 1px solid #E4DDCB; }
    .cell { background: #FAF7F0; min-height: 82px; padding: 6px; display: flex; flex-direction: column; border: 1px solid #E4DDCB; }
    .daynum { font-family: Fraunces, Georgia, serif; font-size: 11px; font-weight: 600; color: #141E2E; }
    .entry { background: #FFFFFF; border: 1px solid #E4DDCB; border-left: 3px solid #C49A5A; border-radius: 5px; padding: 4px; margin-top: 4px; font-size: 8.2px; line-height: 1.25; }
    .entry .t { font-weight: 700; margin: 0 0 1px; color: #141E2E; font-size: 8.3px; }
    .entry .d { margin: 0; color: #3C4A5E; font-size: 8px; }
    .entry img { width: 100%; height: 24px; object-fit: cover; border-radius: 3px; margin-top: 3px; }
    .add { display: none; }
    .today { background: #FBF1DC; }
    .counter { font-size: 10px; text-align: right; color: #3C4A5E; }
    .counter b { display: block; font-size: 16px; color: #141E2E; }
    .empty-hint { margin-top: 8px; color: #3C4A5E; font-size: 9px; }
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
    const monthBucket = getMonthBucket(currentYear, currentMonth);
    const existingEntries = getEntriesForDay(k);
    if (activeEntryIndex !== null && existingEntries[activeEntryIndex]) {
        existingEntries[activeEntryIndex] = newEntry;
        monthBucket[k] = existingEntries;
    } else {
        monthBucket[k] = [...existingEntries, newEntry];
    }
    if (!monthBucket[k].length) delete monthBucket[k];
    const draftBucket = getDraftBucket(currentYear, currentMonth);
    delete draftBucket[draftKey(activeDay, activeEntryIndex)];
    await persist();
    updateSaveStatus('Calendário salvo');
    setTimeout(() => {
        if (saveCalendarBtn) updateSaveStatus('Salvar calendário atual');
    }, 1200);
    render();
    closeModal();
};

// Remove um boletim específico de um dia
async function removeEntry(day, index) {
    const k = key(day);
    const entries = getEntriesForDay(k);
    if (index < 0 || index >= entries.length) return;
    entries.splice(index, 1);
    const monthBucket = getMonthBucket(currentYear, currentMonth);
    if (entries.length) monthBucket[k] = entries;
    else delete monthBucket[k];
    const draftBucket = getDraftBucket(currentYear, currentMonth);
    delete draftBucket[draftKey(day, index)];
    await persist();
    updateSaveStatus('Calendário salvo');
    setTimeout(() => {
        if (saveCalendarBtn) updateSaveStatus('Salvar calendário atual');
    }, 1200);
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
    const payloadData = JSON.stringify(data);
    const payloadDrafts = JSON.stringify(drafts);

    try {
        localStorage.setItem(STORAGE_KEY, payloadData);
        localStorage.setItem(DRAFTS_STORAGE_KEY, payloadDrafts);
    } catch (err) {
        console.error('Falha ao salvar no localStorage', err);
    }

    try {
        if (window.storage && typeof window.storage.set === 'function') {
            await window.storage.set(STORAGE_KEY, payloadData);
            await window.storage.set(DRAFTS_STORAGE_KEY, payloadDrafts);
        }
    } catch (err) {
        console.error('Falha ao salvar no storage', err);
    }
}

function normalizeStorageShape(source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        return {};
    }

    const normalized = {};
    const monthKeys = Object.keys(source).filter((keyName) => /^\d{4}-\d{2}$/.test(keyName));

    if (monthKeys.length) {
        monthKeys.forEach((keyName) => {
            const value = source[keyName];
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                normalized[keyName] = value;
            }
        });
    } else {
        normalized[getMonthKey(BASE_YEAR, BASE_MONTH)] = source;
    }

    Object.keys(normalized).forEach((bucketKey) => {
        const bucket = normalized[bucketKey];
        Object.keys(bucket).forEach((entryKey) => {
            const value = bucket[entryKey];
            if (value && typeof value === 'object' && !Array.isArray(value) && ('title' in value || 'desc' in value || 'art' in value)) {
                bucket[entryKey] = [value];
            }
        });
    });

    return normalized;
}

// Carrega os dados salvos ao iniciar a página
async function load() {
    try {
        if (window.storage && typeof window.storage.get === 'function') {
            const res = await window.storage.get(STORAGE_KEY);
            const rawData = res ? JSON.parse(res.value) : {};
            const draftRes = await window.storage.get(DRAFTS_STORAGE_KEY);
            const rawDrafts = draftRes ? JSON.parse(draftRes.value) : {};
            data = normalizeStorageShape(rawData);
            drafts = normalizeStorageShape(rawDrafts);
        } else {
            const storedData = localStorage.getItem(STORAGE_KEY);
            const rawData = storedData ? JSON.parse(storedData) : {};
            const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
            const rawDrafts = storedDrafts ? JSON.parse(storedDrafts) : {};
            data = normalizeStorageShape(rawData);
            drafts = normalizeStorageShape(rawDrafts);
        }
    } catch (err) {
        data = {};
        drafts = {};
    }

    const legacyMonthKey = getMonthKey(BASE_YEAR, BASE_MONTH);
    if (!data[legacyMonthKey]) {
        try {
            if (window.storage && typeof window.storage.get === 'function') {
                const legacyRes = await window.storage.get(LEGACY_STORAGE_KEY);
                if (legacyRes && legacyRes.value) {
                    data[legacyMonthKey] = JSON.parse(legacyRes.value);
                }
            } else {
                const storedLegacyData = localStorage.getItem(LEGACY_STORAGE_KEY);
                if (storedLegacyData) {
                    data[legacyMonthKey] = JSON.parse(storedLegacyData);
                }
            }
        } catch (err) {
            console.warn('Nenhum dado legado encontrado para o calendário inicial.', err);
        }
    }

    if (!drafts[legacyMonthKey]) {
        try {
            if (window.storage && typeof window.storage.get === 'function') {
                const legacyDraftRes = await window.storage.get(LEGACY_DRAFTS_STORAGE_KEY);
                if (legacyDraftRes && legacyDraftRes.value) {
                    drafts[legacyMonthKey] = JSON.parse(legacyDraftRes.value);
                }
            } else {
                const storedLegacyDrafts = localStorage.getItem(LEGACY_DRAFTS_STORAGE_KEY);
                if (storedLegacyDrafts) {
                    drafts[legacyMonthKey] = JSON.parse(storedLegacyDrafts);
                }
            }
        } catch (err) {
            console.warn('Nenhum rascunho legado encontrado para o calendário inicial.', err);
        }
    }

    await persist();
    render();
}

load();