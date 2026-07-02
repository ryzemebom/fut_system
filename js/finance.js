// Módulo de Gestão Financeira (Caixinha do Baba) - Híbrido Rápido (Local + Supabase)

const INITIAL_TRANSACTIONS = [
    { id: 1, date: "2026-06-01", desc: "Mensalidades - Mês de Junho (10 jogadores)", type: "IN", val: 500.00 },
    { id: 2, date: "2026-06-05", desc: "Aluguel Arena Society (4 semanas)", type: "OUT", val: 320.00 },
    { id: 3, date: "2026-06-12", desc: "Compra de 2 Bolas Penalty PRO", type: "OUT", val: 180.00 },
    { id: 4, date: "2026-06-20", desc: "Diárias de Convidados (4 diaristas)", type: "IN", val: 80.00 },
    { id: 5, date: "2026-06-28", desc: "Caixa Confraternização / Churrasco pós-jogo", type: "OUT", val: 150.00 }
];

let cachedTransactions = null;

function getTransactions() {
    if (cachedTransactions !== null) return cachedTransactions;
    
    const data = localStorage.getItem('fut_transactions');
    if (data) {
        try { cachedTransactions = JSON.parse(data); return cachedTransactions; } catch(e) { cachedTransactions = [...INITIAL_TRANSACTIONS]; }
    }
    if (!localStorage.getItem('fut_demo_cleared')) {
        cachedTransactions = [...INITIAL_TRANSACTIONS];
        localStorage.setItem('fut_transactions', JSON.stringify(cachedTransactions));
        return cachedTransactions;
    }
    cachedTransactions = [];
    return cachedTransactions;
}

function saveTransactions(list) {
    cachedTransactions = list;
    localStorage.setItem('fut_transactions', JSON.stringify(list));
    renderFinance();
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }
}

async function loadTransactionsFromSupabase() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient.from('transactions').select('*');
        if (!error && data && data.length > 0) {
            cachedTransactions = data;
            localStorage.setItem('fut_transactions', JSON.stringify(data));
            renderFinance();
            if (typeof updateDashboardStats === 'function') updateDashboardStats();
        }
    } catch(e) {
        console.warn("Falha ao buscar transações na nuvem:", e);
    }
}

function addTransaction(desc, type, val) {
    const list = getTransactions();
    const newId = list.length > 0 ? Math.max(...list.map(t => t.id || 0)) + 1 : Date.now();
    const today = new Date().toISOString().split('T')[0];
    
    const newTrans = {
        id: newId,
        date: today,
        desc: desc,
        type: type,
        val: parseFloat(val) || 0
    };
    
    list.push(newTrans);
    saveTransactions(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('transactions').insert(newTrans).then(({ error }) => {
            if (error) console.error("Erro no Supabase ao inserir transação:", error.message);
        });
    }
}

function deleteTransaction(id) {
    if (!confirm("Excluir este lançamento do caixa?")) return;
    let list = getTransactions();
    list = list.filter(t => t.id !== id);
    saveTransactions(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('transactions').delete().eq('id', id).then(({ error }) => {
            if (error) console.error("Erro no Supabase ao remover transação:", error.message);
        });
    }
}

function renderFinance() {
    const elIn = document.getElementById('fin-total-in');
    const elOut = document.getElementById('fin-total-out');
    const elBalance = document.getElementById('fin-balance');
    const tableBody = document.getElementById('fin-transactions-body');
    const pendingContainer = document.getElementById('fin-pending-players');
    
    if (!elIn || !elOut) return;
    
    const list = getTransactions();
    let totalIn = 0;
    let totalOut = 0;
    
    list.forEach(t => {
        if (t.type === 'IN') totalIn += t.val;
        else totalOut += t.val;
    });
    
    const balance = totalIn - totalOut;
    
    elIn.innerText = `R$ ${totalIn.toFixed(2).replace('.', ',')}`;
    elOut.innerText = `R$ ${totalOut.toFixed(2).replace('.', ',')}`;
    elBalance.innerText = `R$ ${balance.toFixed(2).replace('.', ',')}`;
    
    if (balance < 0) {
        elBalance.style.color = 'var(--accent-red)';
    } else {
        elBalance.style.color = 'var(--primary)';
    }
    
    // Tabela de transações
    if (tableBody) {
        if (list.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 30px; color: var(--text-muted);">Nenhuma transação registrada no caixa do Baba.</td></tr>`;
        } else {
            tableBody.innerHTML = list.slice().reverse().map(t => `
                <tr>
                    <td><span style="color: var(--text-muted); font-size: 13px;">${formatDateBr(t.date)}</span></td>
                    <td><span style="font-weight: 600; color: #fff;">${t.desc}</span></td>
                    <td>
                        <span style="padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; background: ${t.type === 'IN' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color: ${t.type === 'IN' ? 'var(--primary)' : 'var(--accent-red)'};">
                            ${t.type === 'IN' ? 'ENTRADA (+)' : 'SAÍDA (-)'}
                        </span>
                    </td>
                    <td><span style="font-family: var(--font-heading); font-weight: 800; color: ${t.type === 'IN' ? 'var(--primary)' : '#fff'};">R$ ${t.val.toFixed(2).replace('.', ',')}</span></td>
                    <td>
                        <button class="btn btn-sm" style="background: rgba(255,255,255,0.05); color: var(--text-muted);" onclick="deleteTransaction(${t.id})" title="Excluir">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    }
    
    // Lista de jogadores pendentes/inadimplentes
    if (pendingContainer) {
        const players = typeof getPlayers === 'function' ? getPlayers() : [];
        const unpaidPlayers = players.filter(p => p.status === 'unpaid');
        if (unpaidPlayers.length === 0) {
            pendingContainer.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--primary); font-weight: 600;">🎉 Maravilha! Nenhum jogador inadimplente no momento.</div>`;
        } else {
            pendingContainer.innerHTML = unpaidPlayers.map(p => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background-image: url('${p.avatar}'); background-size: cover;"></div>
                        <div>
                            <div style="font-weight: 700; color: #fff; font-size: 14px;">${p.nickname}</div>
                            <div style="font-size: 11px; color: var(--accent-red);">Mensalidade Pendente</div>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-primary" style="font-weight: 800; padding: 8px 14px;" onclick="quitarMensalidade(${p.id})">
                        ✅ Receber R$ 50,00
                    </button>
                </div>
            `).join('');
        }
    }
}

function quitarMensalidade(playerId) {
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Atualiza status do jogador para paid
    player.status = 'paid';
    if (typeof saveLocalPlayers === 'function') {
        saveLocalPlayers(players);
    } else {
        localStorage.setItem('fut_players', JSON.stringify(players));
    }
    
    if (window.supabaseClient) {
        window.supabaseClient.from('players').update({ status: 'paid' }).eq('id', playerId).then(() => {});
    }
    
    // Adiciona entrada no financeiro
    addTransaction(`Mensalidade Paga - ${player.nickname}`, "IN", 50.00);
    if (typeof showToast === 'function') {
        showToast(`💰 Mensalidade de R$ 50,00 quitada para ${player.nickname}!`, 'success');
    }
}

function formatDateBr(isoStr) {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return isoStr;
}

function openAddTransModal() {
    const modal = document.getElementById('modal-finance');
    if (modal) modal.classList.add('active');
}

function closeAddTransModal() {
    const modal = document.getElementById('modal-finance');
    if (modal) modal.classList.remove('active');
}

function confirmNewTransaction() {
    const desc = document.getElementById('trans-desc').value;
    const type = document.getElementById('trans-type').value;
    const val = document.getElementById('trans-val').value;
    
    if (!desc || !val) {
        if (typeof showToast === 'function') showToast("Preencha a descrição e o valor da transação.", "error");
        else alert("Preencha a descrição e o valor da transação.");
        return;
    }
    
    addTransaction(desc, type, val);
    closeAddTransModal();
    document.getElementById('trans-desc').value = '';
    document.getElementById('trans-val').value = '';
    if (typeof showToast === 'function') showToast("Transação adicionada ao caixa!", "success");
}
