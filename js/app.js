// Controlador Principal da Aplicação (FutSystem Pro)

function checkAuthStatus() {
    const logged = localStorage.getItem('fut_logged_user');
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');

    if (logged === 'arthur') {
        if (loginScreen) loginScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
    } else {
        if (loginScreen) loginScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
    }
}

function doLogin() {
    const user = document.getElementById('login-user')?.value || '';
    const pass = document.getElementById('login-pass')?.value || '';

    if (user.trim().toLowerCase() === 'arthur' && pass === '1234') {
        localStorage.setItem('fut_logged_user', 'arthur');
        checkAuthStatus();
        if (typeof showToast === 'function') showToast("🎉 Bem-vindo de volta, Arthur!", "success");
    } else {
        if (typeof showToast === 'function') showToast("❌ Usuário ou senha incorretos!", "error");
        const card = document.querySelector('.login-card');
        if (card) {
            card.style.transform = 'scale(0.96)';
            setTimeout(() => card.style.transform = 'scale(1)', 150);
        }
    }
}

function doLogout() {
    if (confirm("Deseja sair do sistema e trancar a tela?")) {
        localStorage.removeItem('fut_logged_user');
        checkAuthStatus();
        if (typeof showToast === 'function') showToast("🔒 Sessão encerrada com segurança.", "info");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();

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
    } else if (tabId === 'agenda') {
        if (typeof renderAgenda === 'function') renderAgenda();
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
    const cfg = typeof getAgendaConfig === 'function' ? getAgendaConfig() : null;
    let nextGame = new Date();

    if (cfg && cfg.date && cfg.time) {
        const [year, month, day] = cfg.date.split('-').map(Number);
        const [hours, mins] = cfg.time.split(':').map(Number);
        nextGame = new Date(year, month - 1, day, hours || 16, mins || 0, 0);
    } else {
        const now = new Date();
        nextGame.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
        nextGame.setHours(16, 0, 0, 0);
        if (now > nextGame) nextGame.setDate(nextGame.getDate() + 7);
    }

    const elTitle = document.getElementById('next-game-title');
    if (elTitle && cfg) {
        const dateFormatted = typeof formatDateBr === 'function' ? formatDateBr(cfg.date) : cfg.date;
        elTitle.innerText = `${cfg.title || 'Baba'} (${dateFormatted} • ${cfg.time})`;
    }

    function updateCountdown() {
        const diff = nextGame - new Date();
        const el = document.getElementById('next-game-timer');
        if (!el) return;

        if (diff <= 0) {
            el.innerText = "⚡ O BABA É HOJE/AGORA!";
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        el.innerText = `${days}d ${hours}h ${mins}m restantes`;
    }

    updateCountdown();
    if (window.nextGameInterval) clearInterval(window.nextGameInterval);
    window.nextGameInterval = setInterval(updateCountdown, 30000);
}

// Modal de Novo Jogador
// Modal de Novo Jogador / Edição
function openAddPlayerModal() {
    window.editingPlayerId = null;
    const modal = document.getElementById('modal-add-player');
    const titleEl = modal?.querySelector('.modal-title');
    const btnSubmit = modal?.querySelector('.btn-primary');

    if (titleEl) titleEl.innerHTML = `➕ Cadastrar Jogador no Baba`;
    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Salvar e Adicionar ao Elenco`;

    document.getElementById('inp-name').value = '';
    document.getElementById('inp-nickname').value = '';
    document.getElementById('inp-avatar').value = '';
    document.getElementById('inp-pos').value = 'MEI';
    document.getElementById('inp-stars').value = '3';
    document.getElementById('inp-status').value = 'paid';

    if (modal) modal.classList.add('active');
}

function closeAddPlayerModal() {
    window.editingPlayerId = null;
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

    if (window.editingPlayerId !== null && window.editingPlayerId !== undefined) {
        updatePlayer(window.editingPlayerId, { name, nickname, pos, stars, status, avatar });
        showToast(`✏️ Jogador ${nickname} atualizado com sucesso!`, 'success');
        window.editingPlayerId = null;
    } else {
        addPlayer({ name, nickname, pos, stars, status, avatar });
        showToast(`🎉 Jogador ${nickname} cadastrado com sucesso!`, 'success');
    }

    closeAddPlayerModal();

    if (document.getElementById('view-players')?.classList.contains('active')) {
        renderPlayersGrid();
    } else {
        switchTab('players');
    }
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

/**
 * Abre modal simplificado de opções para usuários leigos
 */
function openSystemOptionsModal() {
    let modal = document.getElementById('modal-system-options');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-system-options';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <div class="modal-title">⚙️ Opções e Ajustes do Sistema</div>
                <button class="close-modal" onclick="document.getElementById('modal-system-options').classList.remove('active')">&times;</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 10px;">
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px;">
                    <div>
                        <div style="font-weight: 800; color: #ef4444; font-size: 15px;">🗑️ Começar Meu Baba do Zero</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Apaga os jogadores fictícios de exemplo para você cadastrar os seus amigos reais.</div>
                    </div>
                    <button class="btn" style="background: #ef4444; color: #fff; font-weight: 700; align-self: flex-start;" onclick="document.getElementById('modal-system-options').classList.remove('active'); clearAllSystemData();">
                        Zerar e Cadastrar Meus Amigos
                    </button>
                </div>

                <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.1); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px;">
                    <div>
                        <div style="font-weight: 800; color: #fff; font-size: 15px;">🔄 Restaurar Exemplo (Demonstração)</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Recarrega os 14 jogadores fictícios para você testar sorteio, placar e artilharia.</div>
                    </div>
                    <button class="btn btn-secondary" style="align-self: flex-start;" onclick="document.getElementById('modal-system-options').classList.remove('active'); resetDemoData();">
                        Restaurar Jogadores de Teste
                    </button>
                </div>

                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 10px;">
                    <div>
                        <div style="font-weight: 800; color: var(--primary); font-size: 15px;">☁️ Status do Salvamento na Nuvem</div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Verifique a conexão automática ou copie o script do banco de dados.</div>
                    </div>
                    <button class="btn" style="background: rgba(16, 185, 129, 0.2); color: var(--primary); font-weight: 700; align-self: flex-start;" onclick="document.getElementById('modal-system-options').classList.remove('active'); openSupabaseModal();">
                        Ver Detalhes do Banco
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}
