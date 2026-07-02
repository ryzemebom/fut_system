// Controlador Principal da Aplicação (FutSystem Pro)

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa dados do localStorage e dispara sync no Supabase
    getPlayers(true);
    getTransactions();
    if (typeof loadTransactionsFromSupabase === 'function') loadTransactionsFromSupabase();
    
    // Configura navegação SPA
    setupNavigation();
    
    // Carrega aba inicial (Dashboard)
    switchTab('dashboard');
    
    // Inicia timer do próximo Baba
    initNextGameTimer();
    
    // Configura atalhos de teclado e fechamento inteligente de Modais
    setupModalUX();
    
    // Ouvinte para atualização de jogadores em outros módulos
    window.addEventListener('playersUpdated', () => {
        updateDashboardStats();
        if (document.getElementById('view-players')?.classList.contains('active')) {
            renderPlayersGrid();
        }
    });
});

/**
 * Exibe notificação flutuante não-bloqueante (Toast)
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.prepend(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `fut-toast ${type}`;
    const icon = type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon} fut-toast-icon"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animação de entrada
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Remoção automática após 3.5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3500);
}

/**
 * Configura UX dos modais (Esc para fechar, clique fora para fechar, Enter para salvar)
 */
function setupModalUX() {
    // Fechar ao clicar no overlay escuro
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
    
    // Fechar com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
    
    // Submeter formulários com Enter
    const addPlayerInputs = document.querySelectorAll('#inp-name, #inp-nickname, #inp-avatar');
    addPlayerInputs.forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmAddPlayer();
        });
    });
    
    const transInputs = document.querySelectorAll('#trans-desc, #trans-val');
    transInputs.forEach(inp => {
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (typeof confirmNewTransaction === 'function') confirmNewTransaction();
            }
        });
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
}

function switchTab(tabId) {
    // Atualiza classes do menu
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Mostra a view correspondente
    document.querySelectorAll('.view-section').forEach(section => {
        if (section.id === `view-${tabId}`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Executa hooks específicos de cada aba
    if (tabId === 'dashboard') {
        updateDashboardStats();
    } else if (tabId === 'players') {
        renderPlayersGrid();
    } else if (tabId === 'sorteio') {
        if (typeof initSorteio === 'function') initSorteio();
    } else if (tabId === 'match') {
        if (typeof loadLiveMatchData === 'function') loadLiveMatchData();
    } else if (tabId === 'finance') {
        if (typeof renderFinance === 'function') renderFinance();
    } else if (tabId === 'ranking') {
        if (typeof renderRanking === 'function') renderRanking('GOALS');
    }
}

function updateDashboardStats() {
    const players = typeof getPlayers === 'function' ? getPlayers() : [];
    const transactions = typeof getTransactions === 'function' ? getTransactions() : [];
    
    // Total Jogadores
    const elTotalPlayers = document.getElementById('dash-total-players');
    if (elTotalPlayers) elTotalPlayers.innerText = players.length;
    
    // Artilheiro
    let artilheiro = players[0];
    players.forEach(p => {
        if ((p.goals || 0) > (artilheiro?.goals || 0)) artilheiro = p;
    });
    const elArtilheiroName = document.getElementById('dash-top-scorer-name');
    const elArtilheiroGoals = document.getElementById('dash-top-scorer-val');
    if (elArtilheiroName) elArtilheiroName.innerText = artilheiro ? artilheiro.nickname : '-';
    if (elArtilheiroGoals) elArtilheiroGoals.innerText = artilheiro ? `${artilheiro.goals || 0} gols` : '0 gols';
    
    // Rei das Assistências
    let garcom = players[0];
    players.forEach(p => {
        if ((p.assists || 0) > (garcom?.assists || 0)) garcom = p;
    });
    const elGarcomName = document.getElementById('dash-top-assist-name');
    const elGarcomAssists = document.getElementById('dash-top-assist-val');
    if (elGarcomName) elGarcomName.innerText = garcom ? garcom.nickname : '-';
    if (elGarcomAssists) elGarcomAssists.innerText = garcom ? `${garcom.assists || 0} passes` : '0 passes';
    
    // Saldo em Caixa
    let balance = 0;
    transactions.forEach(t => {
        if (t.type === 'IN') balance += t.val;
        else balance -= t.val;
    });
    const elBalance = document.getElementById('dash-balance-val');
    if (elBalance) {
        elBalance.innerText = `R$ ${balance.toFixed(2).replace('.', ',')}`;
        elBalance.style.color = balance >= 0 ? 'var(--primary)' : 'var(--accent-red)';
    }
    
    // Mini destaques no Dashboard (Top 4 FUT Cards)
    const dashCardsGrid = document.getElementById('dash-top-players-grid');
    if (dashCardsGrid) {
        const top4 = [...players].sort((a,b) => b.stars - a.stars || (b.goals||0) - (a.goals||0)).slice(0, 4);
        dashCardsGrid.innerHTML = top4.map(p => `
            <div class="fut-card" onclick="switchTab('players')" style="transform: scale(0.95); cursor: pointer;">
                <div class="fut-top">
                    <div class="fut-rating">${p.stars * 18 + 10}</div>
                    <div class="fut-pos">${p.pos}</div>
                </div>
                <div class="fut-avatar" style="background-image: url('${p.avatar}')"></div>
                <div class="fut-name">${p.nickname}</div>
                <div class="fut-stars">${"★".repeat(p.stars)}</div>
                <div class="fut-stats">
                    <div class="fut-stat-box"><div class="fut-stat-val">${p.matches}</div><div class="fut-stat-lbl">JOG</div></div>
                    <div class="fut-stat-box"><div class="fut-stat-val" style="color:var(--primary);">${p.goals}</div><div class="fut-stat-lbl">GOL</div></div>
                    <div class="fut-stat-box"><div class="fut-stat-val" style="color:var(--accent-cyan);">${p.assists}</div><div class="fut-stat-lbl">ASS</div></div>
                </div>
            </div>
        `).join('');
    }
}

function initNextGameTimer() {
    const now = new Date();
    let nextGame = new Date();
    nextGame.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
    nextGame.setHours(16, 0, 0, 0);
    
    if (now > nextGame) {
        nextGame.setDate(nextGame.getDate() + 7);
    }
    
    function updateCountdown() {
        const diff = nextGame - new Date();
        if (diff <= 0) {
            const el = document.getElementById('next-game-timer');
            if (el) el.innerText = "⚡ O BABA COMEÇOU!";
            return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        const el = document.getElementById('next-game-timer');
        if (el) el.innerText = `${days}d ${hours}h ${mins}m restantes`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 60000);
}

// Modal de Novo Jogador
function openAddPlayerModal() {
    const modal = document.getElementById('modal-add-player');
    if (modal) modal.classList.add('active');
}

function closeAddPlayerModal() {
    const modal = document.getElementById('modal-add-player');
    if (modal) modal.classList.remove('active');
}

function confirmAddPlayer() {
    const name = document.getElementById('inp-name').value;
    const nickname = document.getElementById('inp-nickname').value || name;
    const pos = document.getElementById('inp-pos').value;
    const stars = document.getElementById('inp-stars').value;
    const status = document.getElementById('inp-status').value;
    const avatar = document.getElementById('inp-avatar').value;
    
    if (!name) {
        showToast("Digite o nome completo do jogador!", "error");
        return;
    }
    
    addPlayer({ name, nickname, pos, stars, status, avatar });
    closeAddPlayerModal();
    
    // Limpa campos
    document.getElementById('inp-name').value = '';
    document.getElementById('inp-nickname').value = '';
    document.getElementById('inp-avatar').value = '';
    
    if (document.getElementById('view-players')?.classList.contains('active')) {
        renderPlayersGrid();
    } else {
        switchTab('players');
    }
    showToast(`🎉 Jogador ${nickname} cadastrado com sucesso!`, 'success');
}

// Limpeza e Restauração de Dados
function resetDemoData() {
    if (confirm("Deseja restaurar os jogadores e transações originais de demonstração?")) {
        localStorage.removeItem('fut_demo_cleared');
        localStorage.removeItem('fut_players');
        localStorage.removeItem('fut_transactions');
        
        if (window.supabaseClient) {
            window.supabaseClient.from('players').delete().neq('id', 0).then(() => {
                window.supabaseClient.from('players').insert(INITIAL_PLAYERS);
            });
        }
        showToast("Demonstração restaurada!", "success");
        setTimeout(() => location.reload(), 600);
    }
}

function clearAllSystemData() {
    if (confirm("⚠️ Atenção: Deseja ZERAR completamente o elenco e caixa para começar seu Baba do zero?")) {
        localStorage.setItem('fut_demo_cleared', 'true');
        localStorage.setItem('fut_players', JSON.stringify([]));
        localStorage.setItem('fut_transactions', JSON.stringify([]));
        
        if (window.supabaseClient) {
            window.supabaseClient.from('players').delete().neq('id', 0).then(() => {});
            window.supabaseClient.from('transactions').delete().neq('id', 0).then(() => {});
        }
        showToast("Sistema zerado com sucesso!", "success");
        setTimeout(() => location.reload(), 600);
    }
}
