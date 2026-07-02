// Módulo de Sorteio Inteligente de Times para o Baba

let selectedPlayerIds = [];
let generatedTeams = [];

function initSorteio() {
    const players = getPlayers();
    const confirmed = players.filter(p => p.confirmed);
    if (confirmed.length > 0) {
        selectedPlayerIds = confirmed.map(p => p.id);
    } else {
        selectedPlayerIds = players.map(p => p.id);
    }
    renderPlayerSelector();
}

function renderPlayerSelector() {
    const container = document.getElementById('player-selector-list');
    const counter = document.getElementById('selected-players-count');
    if (!container) return;
    
    const players = getPlayers();
    if (counter) counter.innerText = `${selectedPlayerIds.length} selecionados`;
    
    container.innerHTML = players.map(p => {
        const isSel = selectedPlayerIds.includes(p.id);
        const posColor = p.pos === 'GOL' ? '#f59e0b' : p.pos === 'ATA' ? '#ef4444' : p.pos === 'MEI' ? '#06b6d4' : '#10b981';
        
        return `
            <div class="select-player-row ${isSel ? 'selected' : ''}" onclick="toggleSelectPlayer(${p.id})">
                <div class="sp-info">
                    <div class="sp-avatar" style="background-image: url('${p.avatar}')"></div>
                    <div>
                        <div style="font-weight: 700; color: #fff; font-size: 15px;">${p.nickname}</div>
                        <div style="font-size: 12px; color: var(--text-muted);">${p.name} • <span style="color: ${posColor}; font-weight: 800;">${p.pos}</span></div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #f59e0b; font-size: 13px;">${"★".repeat(p.stars)}</span>
                    <div style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid ${isSel ? 'var(--primary)' : 'var(--text-muted)'}; background: ${isSel ? 'var(--primary)' : 'transparent'}; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px;">
                        ${isSel ? '✓' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleSelectPlayer(id) {
    if (selectedPlayerIds.includes(id)) {
        selectedPlayerIds = selectedPlayerIds.filter(item => item !== id);
    } else {
        selectedPlayerIds.push(id);
    }
    renderPlayerSelector();
}

function selectAllPlayers(select) {
    const players = getPlayers();
    selectedPlayerIds = select ? players.map(p => p.id) : [];
    renderPlayerSelector();
}

function sortearTimes(modo = 'equilibrado') {
    if (selectedPlayerIds.length < 4) {
        alert("Selecione pelo menos 4 jogadores para realizar o sorteio!");
        return;
    }
    
    const numTeamsSelect = document.getElementById('num-teams-select');
    const numTeams = numTeamsSelect ? parseInt(numTeamsSelect.value) : 2;
    
    const allPlayers = getPlayers().filter(p => selectedPlayerIds.includes(p.id));
    
    // Separa goleiros dos jogadores de linha
    let goleiros = allPlayers.filter(p => p.pos === 'GOL');
    let linha = allPlayers.filter(p => p.pos !== 'GOL');
    
    // Inicializa estruturas dos times
    const teamNames = ["Time Verde (A)", "Time Ouro (B)", "Time Ciano (C)", "Time Roxo (D)"];
    const teamClasses = ["team-a", "team-b", "team-c", "team-d"];
    
    let teams = Array.from({ length: numTeams }, (_, i) => ({
        name: teamNames[i] || `Time ${i + 1}`,
        cls: teamClasses[i] || "team-a",
        players: [],
        totalStars: 0
    }));
    
    if (modo === 'aleatorio') {
        // Embaralha tudo aleatoriamente
        const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
        shuffled.forEach((player, idx) => {
            const teamIdx = idx % numTeams;
            teams[teamIdx].players.push(player);
            teams[teamIdx].totalStars += player.stars;
        });
    } else {
        // MODO EQUILIBRADO (Sorteio Inteligente)
        // 1. Distribui goleiros primeiro (um por time)
        goleiros.sort(() => Math.random() - 0.5);
        goleiros.forEach((gol, idx) => {
            const teamIdx = idx % numTeams;
            teams[teamIdx].players.push(gol);
            teams[teamIdx].totalStars += gol.stars;
        });
        
        // 2. Ordena jogadores de linha por estrelas (do maior para o menor) com leve fator aleatório em notas iguais
        linha.sort((a, b) => b.stars - a.stars || Math.random() - 0.5);
        
        // 3. Snake draft por menor soma atual de estrelas
        linha.forEach(player => {
            // Encontra o time com menos estrelas atualmente
            teams.sort((t1, t2) => t1.totalStars - t2.totalStars || t1.players.length - t2.players.length);
            teams[0].players.push(player);
            teams[0].totalStars += player.stars;
        });
        
        // Retorna ordem original dos times 1, 2, 3...
        teams.sort((a, b) => teamNames.indexOf(a.name) - teamNames.indexOf(b.name));
    }
    
    generatedTeams = teams;
    renderGeneratedTeams();
    
    // Toca som ou animação de sucesso visual
    const container = document.getElementById('generated-teams-container');
    if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

function renderGeneratedTeams() {
    const container = document.getElementById('generated-teams-container');
    if (!container) return;
    
    if (generatedTeams.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); background: rgba(0,0,0,0.2); border-radius: 20px;">
            <i class="fa-solid fa-wand-magic-sparkles" style="font-size: 32px; color: var(--accent-gold); margin-bottom: 12px; display: block;"></i>
            Clique em <b>"Sortear Times Equilibrados"</b> para gerar as equipes com equilíbrio técnico.
        </div>`;
        return;
    }
    
    container.innerHTML = generatedTeams.map((team, idx) => {
        const avgStars = (team.totalStars / (team.players.length || 1)).toFixed(1);
        
        return `
            <div class="team-card ${team.cls}">
                <div class="team-header">
                    <div class="team-name">${team.name}</div>
                    <div class="team-stars-avg">★ Média: ${avgStars}</div>
                </div>
                <div class="team-roster">
                    ${team.players.map(p => `
                        <div class="roster-item">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 28px; height: 28px; border-radius: 50%; background-image: url('${p.avatar}'); background-size: cover;"></div>
                                <div>
                                    <span style="font-weight: 700; color: #fff;">${p.nickname}</span>
                                    <span style="font-size: 11px; color: var(--text-muted); margin-left: 6px;">[${p.pos}]</span>
                                </div>
                            </div>
                            <span style="color: #f59e0b; font-size: 12px; font-weight: 700;">★ ${p.stars}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
    
    // Adiciona botão para mandar pro modo jogo ao vivo se houver ao menos 2 times
    if (generatedTeams.length >= 2) {
        const actionsContainer = document.getElementById('sorteio-actions-after');
        if (actionsContainer) {
            actionsContainer.innerHTML = `
                <div style="margin-top: 24px; text-align: center; background: rgba(16, 185, 129, 0.1); border: 1px solid var(--border-glow); padding: 20px; border-radius: 16px;">
                    <h4 style="font-family: var(--font-heading); font-size: 18px; color: #fff; margin-bottom: 8px;">Prontos para o Apito Inicial?</h4>
                    <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 16px;">Envie o confronto entre <b>${generatedTeams[0].name}</b> vs <b>${generatedTeams[1].name}</b> diretamente para o Modo Jogo Ao Vivo!</p>
                    <button class="btn btn-primary" onclick="startLiveMatchFromSorteio()">
                        <i class="fa-solid fa-play"></i> Iniciar Jogo no Placar Ao Vivo
                    </button>
                </div>
            `;
        }
    }
}

function startLiveMatchFromSorteio() {
    if (generatedTeams.length < 2) return;
    
    localStorage.setItem('live_match_team_a', JSON.stringify(generatedTeams[0]));
    localStorage.setItem('live_match_team_b', JSON.stringify(generatedTeams[1]));
    
    // Troca para a aba Jogo ao Vivo
    switchTab('match');
    if (typeof loadLiveMatchData === 'function') {
        loadLiveMatchData();
    }
}
