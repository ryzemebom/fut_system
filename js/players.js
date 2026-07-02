// Módulo de Gerenciamento de Jogadores (Elenco) - Híbrido Rápido (Local + Supabase Cloud)

const INITIAL_PLAYERS = [
    { id: 1, name: "Carlos Eduardo", nickname: "Paredão", pos: "GOL", stars: 5, status: "paid", goals: 0, assists: 3, matches: 12, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" },
    { id: 2, name: "Marcos Silva", nickname: "Gata Mansa", pos: "GOL", stars: 4, status: "paid", goals: 0, assists: 1, matches: 10, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80" },
    { id: 3, name: "Roberto Mendes", nickname: "Xerife", pos: "ZAG", stars: 5, status: "paid", goals: 4, assists: 2, matches: 12, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80" },
    { id: 4, name: "Diego Souza", nickname: "Açougueiro", pos: "ZAG", stars: 3, status: "unpaid", goals: 1, assists: 0, matches: 8, avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80" },
    { id: 5, name: "Lucas Pereira", nickname: "Motorzinho", pos: "LAT", stars: 4, status: "paid", goals: 6, assists: 9, matches: 11, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { id: 6, name: "Fernando Lima", nickname: "Canhoto", pos: "LAT", stars: 3, status: "paid", goals: 3, assists: 5, matches: 9, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" },
    { id: 7, name: "Gabriel Henrique", nickname: "Maestro", pos: "MEI", stars: 5, status: "paid", goals: 14, assists: 18, matches: 12, avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80" },
    { id: 8, name: "Rodrigo Alves", nickname: "Toca y Me Voy", pos: "MEI", stars: 4, status: "paid", goals: 8, assists: 11, matches: 10, avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80" },
    { id: 9, name: "Gustavo Rocha", nickname: "Bruxo", pos: "MEI", stars: 5, status: "paid", goals: 12, assists: 15, matches: 11, avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80" },
    { id: 10, name: "Matheus Santos", nickname: "Cansado", pos: "MEI", stars: 2, status: "unpaid", goals: 2, assists: 2, matches: 7, avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80" },
    { id: 11, name: "Rafael Costa", nickname: "Romário", pos: "ATA", stars: 5, status: "paid", goals: 22, assists: 4, matches: 12, avatar: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80" },
    { id: 12, name: "Felipe Oliveira", nickname: "Broca", pos: "ATA", stars: 4, status: "paid", goals: 16, assists: 7, matches: 11, avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80" },
    { id: 13, name: "Bruno Martins", nickname: "Poste", pos: "ATA", stars: 3, status: "paid", goals: 9, assists: 3, matches: 10, avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80" },
    { id: 14, name: "Thiago Ribeiro", nickname: "Fominha", pos: "ATA", stars: 3, status: "unpaid", goals: 7, assists: 1, matches: 9, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80" }
];

let cachedPlayers = null;

/**
 * Retorna a lista de jogadores de forma instantânea (síncrona).
 */
function getPlayers(forceRefresh = false) {
    if (cachedPlayers === null) {
        const stored = localStorage.getItem('fut_players');
        if (stored) {
            try { cachedPlayers = JSON.parse(stored); } catch(e) { cachedPlayers = [...INITIAL_PLAYERS]; }
        } else if (!localStorage.getItem('fut_demo_cleared')) {
            cachedPlayers = [...INITIAL_PLAYERS];
            localStorage.setItem('fut_players', JSON.stringify(cachedPlayers));
        } else {
            cachedPlayers = [];
        }
    }

    if (forceRefresh) {
        loadPlayersFromSupabase();
    }

    return cachedPlayers;
}

/**
 * Sincroniza com o Supabase em segundo plano.
 */
async function loadPlayersFromSupabase() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient.from('players').select('*');
        if (error) {
            console.warn("⚠️ Erro ao consultar tabela players no Supabase:", error.message);
            window.supabaseStatus = 'setup_required';
            window.supabaseLastError = error.message;
            if (typeof updateSupabaseBadge === 'function') updateSupabaseBadge();
        } else if (data) {
            window.supabaseStatus = 'connected';
            window.supabaseLastError = null;
            if (typeof updateSupabaseBadge === 'function') updateSupabaseBadge();
            
            if (data.length > 0) {
                cachedPlayers = data;
                localStorage.setItem('fut_players', JSON.stringify(cachedPlayers));
                window.dispatchEvent(new CustomEvent('playersUpdated'));
            } else if (!localStorage.getItem('fut_demo_cleared')) {
                // Sincroniza elenco inicial na nuvem
                window.supabaseClient.from('players').insert(INITIAL_PLAYERS).then(({ error: errIns }) => {
                    if (errIns) console.warn("Aviso ao semear Supabase:", errIns.message);
                });
            }
        }
    } catch (e) {
        console.warn("Sem conexão com nuvem no momento. Usando cache local.", e);
    }
}

/**
 * Salva jogadores localmente e sincroniza evento.
 */
function saveLocalPlayers(list) {
    cachedPlayers = list;
    localStorage.setItem('fut_players', JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('playersUpdated'));
}

/**
 * Adiciona um novo jogador.
 */
function addPlayer(playerData) {
    const defaultAvatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;
    const newId = cachedPlayers && cachedPlayers.length > 0 ? Math.max(...cachedPlayers.map(p => p.id || 0)) + 1 : Date.now();
    const newPlayer = {
        id: newId,
        name: playerData.name || "Jogador",
        nickname: playerData.nickname || playerData.name || "Jogador",
        pos: playerData.pos || "MEI",
        stars: parseInt(playerData.stars) || 3,
        status: playerData.status || "paid",
        goals: 0,
        assists: 0,
        matches: 0,
        avatar: playerData.avatar || defaultAvatar
    };

    const list = getPlayers();
    list.push(newPlayer);
    saveLocalPlayers(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('players').insert(newPlayer).then(({ error }) => {
            if (error) {
                console.error("Erro no Supabase ao inserir jogador:", error.message);
                if (typeof showToast === 'function') showToast("Salvo localmente (Nuvem pendente de permissão RLS)", "error");
            }
        });
    }
    return newPlayer;
}

/**
 * Exclui um jogador.
 */
function deletePlayer(id) {
    if (!confirm("Tem certeza que deseja remover este jogador do elenco?")) return;
    let list = getPlayers();
    list = list.filter(p => p.id !== id);
    saveLocalPlayers(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('players').delete().eq('id', id).then(({ error }) => {
            if (error) console.error("Erro no Supabase ao remover jogador:", error.message);
        });
    }
}

/**
 * Atualiza dados de um jogador existente.
 */
function updatePlayer(id, updatedData) {
    const list = getPlayers();
    const index = list.findIndex(p => p.id === id);
    if (index === -1) return;

    list[index] = {
        ...list[index],
        name: updatedData.name || list[index].name,
        nickname: updatedData.nickname || updatedData.name || list[index].nickname,
        pos: updatedData.pos || list[index].pos,
        stars: parseInt(updatedData.stars) || list[index].stars,
        status: updatedData.status || list[index].status,
        avatar: updatedData.avatar || list[index].avatar
    };

    saveLocalPlayers(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('players').update({
            name: list[index].name,
            nickname: list[index].nickname,
            pos: list[index].pos,
            stars: list[index].stars,
            status: list[index].status,
            avatar: list[index].avatar
        }).eq('id', id).then(({ error }) => {
            if (error) console.error("Erro no Supabase ao atualizar jogador:", error.message);
        });
    }
}

/**
 * Abre o modal preenchido para edição do jogador.
 */
function openEditPlayerModal(id) {
    const p = getPlayerById(id);
    if (!p) return;

    window.editingPlayerId = id;

    const modal = document.getElementById('modal-add-player');
    const titleEl = modal?.querySelector('.modal-title');
    const btnSubmit = modal?.querySelector('.btn-primary');

    if (titleEl) titleEl.innerHTML = `✏️ Editar Jogador: <b>${p.nickname}</b>`;
    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-check"></i> Salvar Alterações`;

    document.getElementById('inp-name').value = p.name || '';
    document.getElementById('inp-nickname').value = p.nickname || '';
    document.getElementById('inp-pos').value = p.pos || 'MEI';
    document.getElementById('inp-stars').value = p.stars || 3;
    document.getElementById('inp-status').value = p.status || 'paid';
    document.getElementById('inp-avatar').value = p.avatar || '';

    if (modal) modal.classList.add('active');
}

/**
 * Modal de jogador.
 */
function openPlayerModal(id) {
    const p = getPlayerById(id);
    if (!p) return;
    const statusTxt = p.status === 'paid' ? 'Em dia 🟢' : 'Pendente 🔴';
    if (typeof showToast === 'function') {
        showToast(`⚡ ${p.nickname} (${p.pos}) | ${p.goals} gols • ${p.assists} passes | ${statusTxt}`, 'success');
    } else {
        alert(`Jogador: ${p.name} (${p.nickname})\nPosição: ${p.pos} | Nível: ${p.stars} Estrelas\nPartidas: ${p.matches} | Gols: ${p.goals} | Assistências: ${p.assists}\nStatus financeiro: ${statusTxt}`);
    }
}

/**
 * Busca jogador por ID.
 */
function getPlayerById(id) {
    const list = getPlayers();
    return list.find(p => p.id === id);
}

/**
 * Atualiza estatísticas do jogador (partidas, gols, assistências).
 */
function updatePlayerStats(id, addGoals = 0, addAssists = 0, addMatch = 0) {
    const list = getPlayers();
    const player = list.find(p => p.id === id);
    if (!player) return;

    player.goals = (player.goals || 0) + addGoals;
    player.assists = (player.assists || 0) + addAssists;
    player.matches = (player.matches || 0) + addMatch;

    saveLocalPlayers(list);

    if (window.supabaseClient) {
        window.supabaseClient.from('players').update({
            goals: player.goals,
            assists: player.assists,
            matches: player.matches
        }).eq('id', id).then(({ error }) => {
            if (error) console.error("Erro no Supabase ao atualizar stats:", error.message);
        });
    }
}

/**
 * Renderiza a grade de FUT Cards na aba Elenco.
 */
function renderPlayersGrid(filterPos = "ALL", searchQuery = "") {
    const container = document.getElementById('players-grid');
    if (!container) return;

    let players = getPlayers();
    if (filterPos !== "ALL") {
        players = players.filter(p => p.pos === filterPos);
    }
    if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        players = players.filter(p => p.name.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q));
    }

    players.sort((a, b) => b.stars - a.stars || (b.goals || 0) - (a.goals || 0));

    if (players.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhum jogador encontrado no elenco para este filtro.</div>`;
        return;
    }

    container.innerHTML = players.map(p => {
        const starsStr = "★".repeat(p.stars) + "☆".repeat(5 - p.stars);
        const statusClass = p.status === 'paid' ? 'status-paid' : 'status-unpaid';
        const statusTitle = p.status === 'paid' ? 'Mensalidade em Dia' : 'Mensalidade Pendente';

        return `
            <div class="fut-card" style="position: relative;">
                <div style="position: absolute; top: 10px; right: 10px; z-index: 10; display: flex; gap: 6px;">
                    <button class="btn" style="background: rgba(0,0,0,0.75); color: #38bdf8; width: 30px; height: 30px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(56,189,248,0.3);" onclick="event.stopPropagation(); openEditPlayerModal(${p.id})" title="Editar Jogador">
                        <i class="fa-solid fa-pen" style="font-size: 12px;"></i>
                    </button>
                    <button class="btn" style="background: rgba(0,0,0,0.75); color: #ef4444; width: 30px; height: 30px; border-radius: 50%; padding: 0; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(239,68,68,0.3);" onclick="event.stopPropagation(); deletePlayer(${p.id})" title="Excluir Jogador">
                        <i class="fa-solid fa-trash" style="font-size: 12px;"></i>
                    </button>
                </div>
                <div class="player-status-badge ${statusClass}" title="${statusTitle}"></div>
                <div class="fut-top">
                    <div class="fut-rating">${p.stars * 18 + 10}</div>
                    <div class="fut-pos">${p.pos}</div>
                </div>
                <div class="fut-avatar" style="background-image: url('${p.avatar}')"></div>
                <div class="fut-name">${p.nickname}</div>
                <div class="fut-stars">${starsStr}</div>
                <div class="fut-stats">
                    <div class="fut-stat-box">
                        <div class="fut-stat-val">${p.matches}</div>
                        <div class="fut-stat-lbl">JOG</div>
                    </div>
                    <div class="fut-stat-box">
                        <div class="fut-stat-val" style="color: var(--primary);">${p.goals}</div>
                        <div class="fut-stat-lbl">GOL</div>
                    </div>
                    <div class="fut-stat-box">
                        <div class="fut-stat-val" style="color: var(--accent-cyan);">${p.assists}</div>
                        <div class="fut-stat-lbl">ASS</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
