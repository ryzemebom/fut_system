// Módulo de Cronômetro e Placar ao Vivo (Modo Jogo)

let timerInterval = null;
let secondsElapsed = 0;
let isRunning = false;
let matchDurationSeconds = 600; // Padrão: 10 minutos

let currentTeamA = { name: "Time Verde (A)", score: 0, players: [] };
let currentTeamB = { name: "Time Ouro (B)", score: 0, players: [] };
let matchEvents = [];

function loadLiveMatchData() {
    const storedA = localStorage.getItem('live_match_team_a');
    const storedB = localStorage.getItem('live_match_team_b');
    
    if (storedA) {
        const parsedA = JSON.parse(storedA);
        currentTeamA = { ...parsedA, score: currentTeamA.score || 0 };
    } else {
        // Se não veio do sorteador, pega os primeiros 5 jogadores do elenco
        const all = getPlayers();
        currentTeamA = { name: "Time Verde", score: 0, players: all.slice(0, 5) };
    }
    
    if (storedB) {
        const parsedB = JSON.parse(storedB);
        currentTeamB = { ...parsedB, score: currentTeamB.score || 0 };
    } else {
        const all = getPlayers();
        currentTeamB = { name: "Time Ouro", score: 0, players: all.slice(5, 10) };
    }
    
    renderScoreboard();
}

function renderScoreboard() {
    const elNameA = document.getElementById('sb-name-a');
    const elNameB = document.getElementById('sb-name-b');
    const elScoreA = document.getElementById('sb-score-a');
    const elScoreB = document.getElementById('sb-score-b');
    
    if (elNameA) elNameA.innerText = currentTeamA.name;
    if (elNameB) elNameB.innerText = currentTeamB.name;
    if (elScoreA) elScoreA.innerText = currentTeamA.score;
    if (elScoreB) elScoreB.innerText = currentTeamB.score;
    
    renderMatchEventsFeed();
}

function updateTimerDisplay() {
    const remaining = Math.max(0, matchDurationSeconds - secondsElapsed);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const display = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const el = document.getElementById('timer-display');
    if (el) el.innerText = display;
    
    if (remaining === 0 && isRunning) {
        pauseTimer();
        alert("⏰ Fim de Jogo! O apito final soou para esta partida!");
    }
}

function toggleTimer() {
    const btn = document.getElementById('btn-toggle-timer');
    if (isRunning) {
        pauseTimer();
        if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Continuar`;
    } else {
        startTimer();
        if (btn) btn.innerHTML = `<i class="fa-solid fa-pause"></i> Pausar`;
    }
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    if (timerInterval) clearInterval(timerInterval);
}

function resetTimer() {
    pauseTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
    const btn = document.getElementById('btn-toggle-timer');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-play"></i> Iniciar Cronômetro`;
}

function setMatchDuration(mins) {
    matchDurationSeconds = mins * 60;
    resetTimer();
}

// Modal Rápido de Registro de Gol
let scoringTeamSide = 'A';

function triggerGoalModal(side) {
    scoringTeamSide = side;
    const team = side === 'A' ? currentTeamA : currentTeamB;
    
    const modal = document.getElementById('modal-goal');
    const scorerSelect = document.getElementById('goal-scorer-select');
    const assistSelect = document.getElementById('goal-assist-select');
    const title = document.getElementById('goal-modal-title');
    
    if (title) title.innerText = `⚽ Gol para ${team.name}`;
    
    const allPlayers = typeof getPlayers === 'function' ? getPlayers() : [];
    const teamPlayerIds = team.players.map(p => p.id);
    const otherPlayers = allPlayers.filter(p => !teamPlayerIds.includes(p.id));
    const combined = [...team.players, ...otherPlayers];

    if (scorerSelect) {
        scorerSelect.innerHTML = combined.map(p => `<option value="${p.id}">${p.nickname} (${p.pos}) ${teamPlayerIds.includes(p.id) ? '★' : ''}</option>`).join('');
    }

    if (assistSelect) {
        assistSelect.innerHTML = `<option value="0">Sem Assistência (Individual / Rebote)</option>` +
            combined.map(p => `<option value="${p.id}">${p.nickname} (${p.pos})</option>`).join('');
    }

    if (modal) modal.classList.add('active');
}

function closeGoalModal() {
    const modal = document.getElementById('modal-goal');
    if (modal) modal.classList.remove('active');
}

function confirmGoalRegistration() {
    const scorerId = parseInt(document.getElementById('goal-scorer-select')?.value || 0);
    const assistId = parseInt(document.getElementById('goal-assist-select')?.value || 0);
    
    if (!scorerId) return closeGoalModal();
    
    const scorer = getPlayerById(scorerId);
    const assist = assistId ? getPlayerById(assistId) : null;
    
    if (scoringTeamSide === 'A') {
        currentTeamA.score++;
    } else {
        currentTeamB.score++;
    }
    
    // Atualiza estatísticas no elenco (persistência automática)
    updatePlayerStats(scorerId, 1, 0, 0);
    if (assistId && assistId !== scorerId) {
        updatePlayerStats(assistId, 0, 1, 0);
    }
    
    // Registra no feed
    const timeMins = Math.floor(secondsElapsed / 60);
    const eventText = `${timeMins}' ⚽ Gol de ${scorer ? scorer.nickname : 'Jogador'}` + (assist ? ` (Assistência: ${assist.nickname})` : '');
    matchEvents.unshift({ time: `${timeMins}'`, text: eventText, side: scoringTeamSide });
    
    renderScoreboard();
    closeGoalModal();
    
    if (typeof showToast === 'function') {
        showToast(`⚽ GOL DE ${scorer ? scorer.nickname.toUpperCase() : 'JOGADOR'}!`, 'success');
    }
}

function renderMatchEventsFeed() {
    const container = document.getElementById('match-events-feed');
    if (!container) return;
    
    if (matchEvents.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; padding: 20px;">O jogo começou! Registre os gols no placar acima para alimentar o feed em tempo real.</div>`;
        return;
    }
    
    container.innerHTML = matchEvents.map(evt => `
        <div style="display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,0.03); border-left: 3px solid ${evt.side === 'A' ? 'var(--primary)' : 'var(--accent-gold)'}; border-radius: 8px; margin-bottom: 8px;">
            <span style="font-family: monospace; font-weight: 800; color: var(--accent-gold);">${evt.time}</span>
            <span style="font-size: 14px; color: #fff;">${evt.text}</span>
        </div>
    `).join('');
}

function finishMatchAndSave() {
    if (!confirm("Deseja encerrar a partida atual e registrar +1 jogo no histórico dos jogadores de ambas as equipes?")) return;
    
    // Incrementa +1 partida para cada jogador que entrou em quadra
    const allPlayedIds = [...currentTeamA.players, ...currentTeamB.players].map(p => p.id);
    allPlayedIds.forEach(id => {
        updatePlayerStats(id, 0, 0, 1);
    });
    
    const finalMsg = `🏆 Partida encerrada! Placar: ${currentTeamA.name} ${currentTeamA.score} x ${currentTeamB.score} ${currentTeamB.name}`;
    if (typeof showToast === 'function') showToast(finalMsg, 'success');
    else alert(finalMsg);
    
    // Zera placar para o próximo Baba
    currentTeamA.score = 0;
    currentTeamB.score = 0;
    matchEvents = [];
    resetTimer();
    renderScoreboard();
}
