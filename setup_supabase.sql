-- ====================================================================
-- FUTSYSTEM PRO - SCRIPT DE CONFIGURAÇÃO DO BANCO DE DADOS SUPABASE
-- ====================================================================
-- Execute este script no "SQL Editor" do painel de administração
-- do Supabase (https://app.supabase.com) para criar as tabelas
-- e liberar as permissões de acesso do sistema do Baba.
-- ====================================================================

-- 1. Tabela de Jogadores (Elenco)
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

-- 2. Tabela de Transações Financeiras (Caixa do Baba)
-- Nota: "desc" está entre aspas duplas por ser palavra reservada do PostgreSQL
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT PRIMARY KEY,
    date TEXT NOT NULL,
    "desc" TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'IN',
    val NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Acesso Público (Permitir leitura e escrita via chave pública)
DROP POLICY IF EXISTS "Permitir acesso público total em players" ON public.players;
CREATE POLICY "Permitir acesso público total em players" 
ON public.players FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir acesso público total em transactions" ON public.transactions;
CREATE POLICY "Permitir acesso público total em transactions" 
ON public.transactions FOR ALL 
USING (true) 
WITH CHECK (true);

-- ====================================================================
-- SUCESSO! Agora seu banco de dados está pronto e 100% compatível.
-- ====================================================================
