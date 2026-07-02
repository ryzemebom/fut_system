// Configuração e Diagnóstico do Cliente Supabase via CDN Global
const SUPABASE_URL = "https://ghqjbdjzvhdogtofcqmr.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iiyONAeKY5PRcUDbWhlfnA_nigUET48";

window.supabaseClient = null;
window.supabaseStatus = 'connecting';
window.supabaseLastError = null;

try {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log("✅ Supabase Client inicializado com sucesso.");
        
        // Dispara teste diagnóstico em segundo plano
        setTimeout(testSupabaseConnection, 500);
    } else {
        console.warn("⚠️ SDK CDN do Supabase ainda não carregado ou indisponível.");
        window.supabaseStatus = 'offline';
        updateSupabaseBadge();
    }
} catch (e) {
    console.error("Erro ao inicializar Supabase Client:", e);
    window.supabaseStatus = 'error';
    window.supabaseLastError = e.message;
    updateSupabaseBadge();
}

/**
 * Testa conexão e permissões (RLS) nas tabelas do Supabase
 */
async function testSupabaseConnection() {
    if (!window.supabaseClient) {
        window.supabaseStatus = 'offline';
        updateSupabaseBadge();
        return;
    }
    
    try {
        const { error: errPlayers } = await window.supabaseClient.from('players').select('id').limit(1);
        const { error: errTrans } = await window.supabaseClient.from('transactions').select('id').limit(1);
        
        if (errPlayers || errTrans) {
            window.supabaseStatus = 'setup_required';
            window.supabaseLastError = (errPlayers?.message || errTrans?.message);
            console.warn("⚠️ Supabase conectado, mas tabelas necessitam de configuração SQL ou permissão RLS:", window.supabaseLastError);
        } else {
            window.supabaseStatus = 'connected';
            window.supabaseLastError = null;
            console.log("🟢 Conexão com Supabase e tabelas verificada com sucesso!");
        }
    } catch (e) {
        window.supabaseStatus = 'error';
        window.supabaseLastError = e.message;
    }
    updateSupabaseBadge();
}

/**
 * Atualiza o badge visual na interface sobre o status da nuvem
 */
function updateSupabaseBadge() {
    const badge = document.getElementById('btn-supabase-status');
    const txt = document.getElementById('supabase-status-txt');
    if (!badge || !txt) return;
    
    if (window.supabaseStatus === 'connected') {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        badge.style.color = 'var(--primary)';
        badge.innerHTML = `<i class="fa-solid fa-cloud"></i> <span>Nuvem Online</span>`;
    } else if (window.supabaseStatus === 'setup_required') {
        badge.style.background = 'rgba(245, 158, 11, 0.15)';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        badge.style.color = '#f59e0b';
        badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Configurar Banco</span>`;
    } else {
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        badge.style.color = '#ef4444';
        badge.innerHTML = `<i class="fa-solid fa-cloud-bolt"></i> <span>Modo Offline</span>`;
    }
}

/**
 * Abre o modal de diagnóstico e configuração do Supabase
 */
function openSupabaseModal() {
    let modal = document.getElementById('modal-supabase');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-supabase';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    const statusColor = window.supabaseStatus === 'connected' ? 'var(--primary)' : window.supabaseStatus === 'setup_required' ? '#f59e0b' : '#ef4444';
    const statusLabel = window.supabaseStatus === 'connected' ? '🟢 Operacional & Conectado' : window.supabaseStatus === 'setup_required' ? '🟡 Tabelas / RLS Pendentes' : '🔴 Desconectado';
    
    const sqlCode = `-- Execute no SQL Editor do painel do Supabase
CREATE TABLE IF NOT EXISTS public.players (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    pos TEXT NOT NULL DEFAULT 'MEI',
    stars INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'paid',
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    matches INTEGER NOT NULL DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT PRIMARY KEY,
    date TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'IN',
    val NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acesso público total em players" ON public.players;
CREATE POLICY "Permitir acesso público total em players" ON public.players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso público total em transactions" ON public.transactions;
CREATE POLICY "Permitir acesso público total em transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);`;

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 650px;">
            <div class="modal-header">
                <div class="modal-title"><i class="fa-solid fa-database" style="color: var(--primary);"></i> Conexão Nuvem Supabase</div>
                <button class="close-modal" onclick="document.getElementById('modal-supabase').classList.remove('active')">&times;</button>
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.06);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--text-muted);">URL da Nuvem:</span>
                    <span style="font-family: monospace; font-size: 12px; color: #fff;">ghqjbdjzvhdogtofcqmr.supabase.co</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 13px; color: var(--text-muted);">Status Atual:</span>
                    <span style="font-weight: 700; color: ${statusColor};">${statusLabel}</span>
                </div>
                ${window.supabaseLastError ? `<div style="margin-top: 10px; font-size: 12px; color: #ef4444; background: rgba(239,68,68,0.1); padding: 8px; border-radius: 6px;">Detalhe: ${window.supabaseLastError}</div>` : ''}
            </div>
            
            <div style="margin-bottom: 16px;">
                <h4 style="font-size: 14px; color: #fff; margin-bottom: 8px;">🔧 Configuração das Tabelas e Permissões (SQL Setup)</h4>
                <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 12px;">
                    Para que o banco funcione 100% sem bloqueios de segurança (RLS), copie o script abaixo e execute na aba <b>SQL Editor</b> do seu painel Supabase:
                </p>
                <div style="position: relative;">
                    <textarea readonly id="supabase-sql-box" style="width: 100%; height: 180px; background: #080c14; color: #a5b4fc; border: 1px solid var(--border-glow); border-radius: 8px; padding: 12px; font-family: monospace; font-size: 11px; resize: none;">${sqlCode}</textarea>
                    <button class="btn btn-sm btn-primary" style="position: absolute; top: 10px; right: 10px;" onclick="copySupabaseSQL()">
                        <i class="fa-solid fa-copy"></i> Copiar SQL
                    </button>
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="btn btn-secondary" onclick="testSupabaseConnection()">
                    <i class="fa-solid fa-rotate"></i> Testar Conexão Agora
                </button>
                <button class="btn btn-primary" onclick="document.getElementById('modal-supabase').classList.remove('active')">
                    Concluído
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function copySupabaseSQL() {
    const box = document.getElementById('supabase-sql-box');
    if (box) {
        box.select();
        navigator.clipboard.writeText(box.value);
        if (typeof showToast === 'function') showToast("Script SQL copiado! Cole no painel do Supabase.", "success");
        else alert("Script SQL copiado!");
    }
}
