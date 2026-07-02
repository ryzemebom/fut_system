// Módulo de Ranking, Hall da Fama e Estatísticas do Baba

function renderRanking(filterType = 'GOALS') {
    const players = getPlayers();
    const podiumContainer = document.getElementById('ranking-podium');
    const tableBody = document.getElementById('ranking-table-body');
    const titleEl = document.getElementById('ranking-table-title');
    
    if (!tableBody) return;
    
    let sorted = [...players];
    let statLabel = "GOLS";
    
    if (filterType === 'GOALS') {
        sorted.sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.matches || 0) - (a.matches || 0));
        statLabel = "GOLS";
        if (titleEl) titleEl.innerText = "⚡ Tabela de Artilharia (Chuteira de Ouro)";
    } else if (filterType === 'ASSISTS') {
        sorted.sort((a, b) => (b.assists || 0) - (a.assists || 0) || (b.matches || 0) - (a.matches || 0));
        statLabel = "ASSISTÊNCIAS";
        if (titleEl) titleEl.innerText = "🎩 Garçons da Temporada (Rei do Passe)";
    } else if (filterType === 'STARS') {
        sorted.sort((a, b) => b.stars - a.stars || (b.goals || 0) - (a.goals || 0));
        statLabel = "ESTRELAS";
        if (titleEl) titleEl.innerText = "👑 Geral por Nível Técnico (Estrelas)";
    }
    
    // Pódio (Top 3)
    if (podiumContainer && sorted.length >= 3) {
        const top1 = sorted[0];
        const top2 = sorted[1];
        const top3 = sorted[2];
        
        const getVal = p => filterType === 'GOALS' ? p.goals : filterType === 'ASSISTS' ? p.assists : `★ ${p.stars}`;
        
        podiumContainer.innerHTML = `
            <div class="podium-item podium-2">
                <div style="width: 64px; height: 64px; border-radius: 50%; border: 3px solid #94a3b8; background-image: url('${top2.avatar}'); background-size: cover; margin-bottom: 8px;"></div>
                <div style="font-weight: 800; color: #fff; font-size: 15px;">${top2.nickname}</div>
                <div style="color: #94a3b8; font-weight: 700; font-size: 13px; margin-bottom: 6px;">2º • ${getVal(top2)}</div>
                <div class="podium-block">2º</div>
            </div>
            <div class="podium-item podium-1">
                <i class="fa-solid fa-crown" style="color: #f59e0b; font-size: 24px; margin-bottom: 4px; animation: float 3s infinite;"></i>
                <div style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid #f59e0b; background-image: url('${top1.avatar}'); background-size: cover; margin-bottom: 8px; box-shadow: 0 0 20px rgba(245,158,11,0.5);"></div>
                <div style="font-weight: 900; color: #fff; font-size: 18px;">${top1.nickname}</div>
                <div style="color: #f59e0b; font-weight: 800; font-size: 14px; margin-bottom: 6px;">🏆 1º • ${getVal(top1)}</div>
                <div class="podium-block">1º</div>
            </div>
            <div class="podium-item podium-3">
                <div style="width: 58px; height: 58px; border-radius: 50%; border: 3px solid #b45309; background-image: url('${top3.avatar}'); background-size: cover; margin-bottom: 8px;"></div>
                <div style="font-weight: 800; color: #fff; font-size: 15px;">${top3.nickname}</div>
                <div style="color: #b45309; font-weight: 700; font-size: 13px; margin-bottom: 6px;">3º • ${getVal(top3)}</div>
                <div class="podium-block">3º</div>
            </div>
        `;
    }
    
    // Tabela completa
    tableBody.innerHTML = sorted.map((p, index) => {
        const val = filterType === 'GOALS' ? p.goals : filterType === 'ASSISTS' ? p.assists : `★ ${p.stars}`;
        const posBadgeColor = index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'rgba(255,255,255,0.1)';
        const textColor = index < 3 ? '#fff' : varTextMuted();
        
        return `
            <tr>
                <td>
                    <span style="display: inline-block; width: 26px; height: 26px; border-radius: 6px; background: ${posBadgeColor}; color: ${index < 3 ? '#111827' : '#fff'}; font-weight: 800; text-align: center; line-height: 26px;">
                        ${index + 1}º
                    </span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background-image: url('${p.avatar}'); background-size: cover;"></div>
                        <div>
                            <div style="font-weight: 700; color: #fff; font-size: 15px;">${p.nickname}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">${p.name} (${p.pos})</div>
                        </div>
                    </div>
                </td>
                <td><span style="font-weight: 700;">${p.matches}</span></td>
                <td><span style="color: var(--primary); font-weight: 700;">${p.goals}</span></td>
                <td><span style="color: var(--accent-cyan); font-weight: 700;">${p.assists}</span></td>
                <td><span style="color: #f59e0b; font-weight: 800; font-size: 16px;">${val}</span></td>
            </tr>
        `;
    }).join('');
}

function varTextMuted() {
    return '#9ca3af';
}
