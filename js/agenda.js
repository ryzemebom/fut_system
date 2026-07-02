// Módulo de Agendamento do Baba, Convites WhatsApp e Cobrança
let defaultNextBaba = {
    title: "Baba Oficial de Fim de Semana",
    date: getNextSaturdayStr(),
    time: "16:00",
    location: "Arena Society VIP - Quadra Principal",
    price: 20.00,
    valendoArtilharia: true
};

function getNextSaturdayStr() {
    const d = new Date();
    d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
    return d.toISOString().split('T')[0];
}

function getAgendaConfig() {
    const stored = localStorage.getItem('fut_next_baba');
    if (stored) {
        try { return JSON.parse(stored); } catch(e) {}
    }
    return { ...defaultNextBaba };
}

function saveAgendaConfig(cfg) {
    localStorage.setItem('fut_next_baba', JSON.stringify(cfg));
    if (typeof initNextGameTimer === 'function') initNextGameTimer();
    renderAgenda();
    if (typeof showToast === 'function') showToast("📅 Próximo Baba configurado com sucesso!", "success");

    if (window.supabaseClient) {
        window.supabaseClient.from('next_baba').upsert({ id: 1, ...cfg }).then(({ error }) => {
            if (error) console.warn("Supabase next_baba:", error.message);
        });
    }
}

function renderAgenda() {
    const cfg = getAgendaConfig();
    
    // Atualiza campos de input se existirem
    const elDate = document.getElementById('ag-date');
    const elTime = document.getElementById('ag-time');
    const elLoc = document.getElementById('ag-loc');
    const elPrice = document.getElementById('ag-price');
    const elTitle = document.getElementById('ag-title');

    if (elDate && elDate.value !== cfg.date) elDate.value = cfg.date || '';
    if (elTime && elTime.value !== cfg.time) elTime.value = cfg.time || '16:00';
    if (elLoc && elLoc.value !== cfg.location) elLoc.value = cfg.location || '';
    if (elPrice && elPrice.value !== cfg.price) elPrice.value = cfg.price || 20;
    if (elTitle && elTitle.value !== cfg.title) elTitle.value = cfg.title || 'Baba Oficial';

    // Renderiza Preview da Mensagem do Grupo
    const elPreview = document.getElementById('agenda-msg-preview');
    if (elPreview) {
        const dateFormatted = formatDateBr(cfg.date);
        elPreview.innerHTML = `
            <div style="font-family: monospace; font-size: 13px; line-height: 1.5; color: #fff; white-space: pre-line;">⚽ *CONFIRMAÇÃO DE BABA!* ⚽

🏆 *${cfg.title}*
📅 *Dia:* ${dateFormatted}
⏰ *Horário:* ${cfg.time}
📍 *Local:* ${cfg.location}
💵 *Valor por Jogador:* R$ ${parseFloat(cfg.price).toFixed(2).replace('.', ',')}
🔥 *Artilharia:* Valendo para a Chuteira de Ouro!

Responda abaixo confirmando sua presença! 👍</div>
        `;
    }

    // Renderiza lista individual de jogadores
    const playersListEl = document.getElementById('agenda-players-list');
    if (playersListEl) {
        const players = typeof getPlayers === 'function' ? getPlayers() : [];
        if (players.length === 0) {
            playersListEl.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted);">Cadastre jogadores no elenco primeiro.</div>`;
        } else {
            playersListEl.innerHTML = players.map(p => {
                const dateFormatted = formatDateBr(cfg.date);
                const priceStr = parseFloat(cfg.price).toFixed(2).replace('.', ',');
                
                // Textos para o WhatsApp
                const msgCobrar = encodeURIComponent(`Fala ${p.nickname}, tudo certo? Passando para lembrar do valor de R$ ${priceStr} referente ao nosso ${cfg.title} do dia ${dateFormatted} (${cfg.time}) em ${cfg.location}. Tamo junto! ⚽👊`);
                const msgConfirmar = encodeURIComponent(`E aí ${p.nickname}, confirmado no ${cfg.title} dia ${dateFormatted} às ${cfg.time} em ${cfg.location}? Confirma aí para montarmos os times! ⚽🔥`);

                const statusBadge = p.confirmed ? 
                    `<span style="background: rgba(16,185,129,0.2); color: var(--primary); padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px;">✅ VAI JOGAR</span>` :
                    `<span style="background: rgba(239,68,68,0.2); color: var(--accent-red); padding: 4px 10px; border-radius: 20px; font-weight: 800; font-size: 11px;">❌ NÃO CONFIRMADO</span>`;

                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; margin-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; border-radius: 50%; background-image: url('${p.avatar}'); background-size: cover; border: 2px solid ${p.confirmed ? 'var(--primary)' : 'rgba(255,255,255,0.2)'};"></div>
                            <div>
                                <div style="font-weight: 800; color: #fff; font-size: 15px;">${p.nickname}</div>
                                <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                    <span style="font-size: 12px; color: var(--text-muted);">${p.pos}</span>
                                    ${statusBadge}
                                </div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                            <button class="btn btn-sm ${p.confirmed ? 'btn-secondary' : 'btn-primary'}" style="font-weight: 700; font-size: 12px; padding: 8px 12px;" onclick="togglePlayerPresence(${p.id})">
                                ${p.confirmed ? '❌ Cancelar Presença' : '✅ Confirmar Presença'}
                            </button>

                            <a href="https://api.whatsapp.com/send?text=${msgConfirmar}" target="_blank" class="btn btn-sm" style="background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); font-weight: 700; font-size: 12px; text-decoration: none;">
                                <i class="fa-brands fa-whatsapp"></i> Convidar
                            </a>

                            <a href="https://api.whatsapp.com/send?text=${msgCobrar}" target="_blank" class="btn btn-sm" style="background: rgba(234,179,8,0.15); color: #eab308; border: 1px solid rgba(234,179,8,0.3); font-weight: 700; font-size: 12px; text-decoration: none;">
                                <i class="fa-solid fa-file-invoice-dollar"></i> Cobrar R$ ${priceStr}
                            </a>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

function confirmFormAgenda() {
    const title = document.getElementById('ag-title')?.value || "Baba Oficial";
    const date = document.getElementById('ag-date')?.value || getNextSaturdayStr();
    const time = document.getElementById('ag-time')?.value || "16:00";
    const location = document.getElementById('ag-loc')?.value || "Arena Society";
    const price = parseFloat(document.getElementById('ag-price')?.value || 20);

    saveAgendaConfig({ title, date, time, location, price, valendoArtilharia: true });
}

function sendGroupWhatsApp() {
    const cfg = getAgendaConfig();
    const dateFormatted = typeof formatDateBr === 'function' ? formatDateBr(cfg.date) : cfg.date;
    const priceStr = parseFloat(cfg.price).toFixed(2).replace('.', ',');

    const msg = `⚽ *CONFIRMAÇÃO DE BABA!* ⚽\n\n🏆 *${cfg.title}*\n📅 *Dia:* ${dateFormatted}\n⏰ *Horário:* ${cfg.time}\n📍 *Local:* ${cfg.location}\n💵 *Valor por Jogador:* R$ ${priceStr}\n🔥 *Artilharia:* Valendo para a Chuteira de Ouro!\n\nResponda abaixo confirmando sua presença! 👍`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
}

function togglePlayerPresence(id) {
    const list = typeof getPlayers === 'function' ? getPlayers() : [];
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return;

    list[index].confirmed = !list[index].confirmed;
    saveLocalPlayers(list);
    renderAgenda();

    if (typeof showToast === 'function') {
        const txt = list[index].confirmed ? `✅ ${list[index].nickname} confirmado para o jogo!` : `❌ Presença de ${list[index].nickname} cancelada.`;
        showToast(txt, list[index].confirmed ? 'success' : 'info');
    }
}

function formatDateBr(isoStr) {
    if (!isoStr) return "";
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
}
