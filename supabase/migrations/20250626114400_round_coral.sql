/*
  # Criar tabela de leads

  1. Nova Tabela
    - `leads`
      - `id` (uuid, primary key)
      - `nome_completo` (text)
      - `cpf` (text, unique)
      - `email` (text)
      - `telefone` (text)
      - `endereco` (text)
      - `produtos` (jsonb)
      - `valor_total` (decimal)
      - `meio_pagamento` (text)
      - `data_compra` (timestamptz)
      - `origem` (text) - 'vega' ou 'direto'
      - `etapa_atual` (integer, default 1)
      - `status_pagamento` (text, default 'pendente')
      - `order_bumps` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela `leads`
    - Adicionar políticas para operações CRUD
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  telefone text,
  endereco text,
  produtos jsonb DEFAULT '[]'::jsonb,
  valor_total decimal(10,2),
  meio_pagamento text,
  data_compra timestamptz DEFAULT now(),
  origem text DEFAULT 'direto' CHECK (origem IN ('vega', 'direto')),
  etapa_atual integer DEFAULT 1,
  status_pagamento text DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente', 'pago', 'cancelado')),
  order_bumps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de novos leads
CREATE POLICY "Permitir inserção de leads"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para permitir leitura de leads
CREATE POLICY "Permitir leitura de leads"
  ON leads
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Política para permitir atualização de leads
CREATE POLICY "Permitir atualização de leads"
  ON leads
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_leads_cpf ON leads(cpf);
CREATE INDEX IF NOT EXISTS idx_leads_origem ON leads(origem);
CREATE INDEX IF NOT EXISTS idx_leads_etapa_atual ON leads(etapa_atual);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();