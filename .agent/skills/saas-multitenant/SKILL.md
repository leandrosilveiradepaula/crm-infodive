---
name: SaaS Multitenant Guard
description: Regras obrigatórias para garantir isolamento de dados por organização em todo o sistema CRM. Deve ser consultado ANTES de criar ou modificar qualquer código que interaja com o banco de dados.
---

# SaaS Multitenant Guard

> **REGRA DE OURO**: Nenhum dado pode ser lido, criado, modificado ou deletado sem validar o `organization_id` do usuário autenticado. Violações desta regra são consideradas **vulnerabilidades críticas de segurança**.

---

## 1. Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────┐
│  BROWSER (Client Components)                        │
│  → Nunca acessa o banco diretamente                 │
│  → Chama Server Actions via import                  │
└──────────────┬──────────────────────────────────────┘
               │ Server Action call
┌──────────────▼──────────────────────────────────────┐
│  MIDDLEWARE (src/middleware.ts)                      │
│  → Valida sessão (iron-session)                     │
│  → Injeta X-User-Id no header                       │
│  → Redireciona não-autenticados para /login         │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  SERVER ACTIONS (src/app/(dashboard)/*/actions.ts)   │
│  → Chama requireSessionContext()                    │
│  → Obtém { userId, organizationId }                 │
│  → Repassa para o Service                           │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  SERVICES (src/services/*.ts)                       │
│  → Usa createAdminClient() (service role, bypassa   │
│    RLS) portanto DEVE filtrar explicitamente por     │
│    organization_id em TODA query                    │
└──────────────┬──────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────┐
│  SUPABASE (Banco de Dados)                          │
│  → RLS habilitado como camada de defesa secundária  │
│  → Triggers auto-inject organization_id em INSERTs  │
└─────────────────────────────────────────────────────┘
```

---

## 2. Regras Obrigatórias para Server Actions

Todo arquivo `actions.ts` dentro de `src/app/(dashboard)/` **DEVE**:

```typescript
'use server';

import { requireSessionContext } from '@/lib/auth-server';
import { SeuService } from '@/services/SeuService';

export async function suaAction(args: any) {
    // ✅ OBRIGATÓRIO: Extrair contexto de sessão
    const { userId, organizationId } = await requireSessionContext();

    // ✅ OBRIGATÓRIO: Repassar organizationId ao Service
    return await SeuService.metodo(userId, organizationId, args);
}
```

### ❌ PROIBIDO em Server Actions:
- Importar `createAdminClient` diretamente
- Aceitar `organizationId` como parâmetro do cliente
- Confiar em dados do payload para identificar o tenant

---

## 3. Regras Obrigatórias para Services

Todo Service em `src/services/` **DEVE**:

### 3.1 Assinatura dos Métodos
Sempre incluir `userId` e `organizationId` como primeiros parâmetros:
```typescript
static async getItems(userId: string, organizationId: string) { ... }
static async createItem(userId: string, organizationId: string, data: any) { ... }
static async updateItem(userId: string, itemId: string, organizationId: string, updates: any) { ... }
static async deleteItem(userId: string, itemId: string, organizationId: string) { ... }
```

### 3.2 Filtros de Query (CRÍTICO)
**TODA** query ao banco **DEVE** incluir `.eq('organization_id', organizationId)`:

```typescript
// ✅ SELECT — filtrar pela organização
const { data } = await supabase
    .from('tabela')
    .select('*')
    .eq('organization_id', organizationId);

// ✅ INSERT — incluir organization_id no payload
const { data } = await supabase
    .from('tabela')
    .insert([{ ...payload, organization_id: organizationId }]);

// ✅ UPDATE — filtrar por ID + organização (dupla validação)
const { data } = await supabase
    .from('tabela')
    .update(updates)
    .eq('id', itemId)
    .eq('organization_id', organizationId);

// ✅ DELETE — filtrar por ID + organização (dupla validação)
const { error } = await supabase
    .from('tabela')
    .delete()
    .eq('id', itemId)
    .eq('organization_id', organizationId);
```

### ❌ NUNCA faça isso:
```typescript
// ❌ SELECT sem filtro de organização
const { data } = await supabase.from('tabela').select('*');

// ❌ UPDATE/DELETE sem validação de pertencimento
const { error } = await supabase.from('tabela').delete().eq('id', itemId);

// ❌ INSERT sem organization_id
const { data } = await supabase.from('tabela').insert([{ name: 'item' }]);
```

### 3.3 Whitelist para Updates
Ao implementar funções de atualização genéricas, use uma **whitelist** de campos permitidos:

```typescript
const allowedColumns = ['title', 'description', 'status', 'value'];

const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
    if (allowedColumns.includes(key)) {
        acc[key] = value === '' ? null : value;
    }
    return acc;
}, {} as Record<string, any>);
```

---

## 4. Regras para Tabelas Filhas (Child Tables)

Tabelas que dependem de uma tabela pai (ex: `deal_products` → `deals`):

### 4.1 Se a tabela filha TEM `organization_id`:
Filtrar diretamente: `.eq('organization_id', organizationId)`

### 4.2 Se a tabela filha NÃO TEM `organization_id`:
Validar via tabela pai antes de operar:
```typescript
// Primeiro, confirmar que o pai pertence à organização
const { data: parent } = await supabase
    .from('deals')
    .select('id')
    .eq('id', dealId)
    .eq('organization_id', organizationId)
    .single();

if (!parent) throw new Error('Deal not found or access denied');

// Depois, operar na tabela filha
const { data } = await supabase
    .from('deal_products')
    .select('*')
    .eq('deal_id', dealId);
```

---

## 5. Regras para Novos Módulos / Tabelas

### 5.1 Criação da Tabela (SQL)
Toda nova tabela **DEVE** incluir:

```sql
-- 1. Coluna obrigatória
ALTER TABLE public.nova_tabela ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Índice para performance
CREATE INDEX IF NOT EXISTS nova_tabela_organization_id_idx ON public.nova_tabela (organization_id);

-- 3. Habilitar RLS
ALTER TABLE public.nova_tabela ENABLE ROW LEVEL SECURITY;

-- 4. Política de isolamento
CREATE POLICY "Tenant Isolation" ON public.nova_tabela FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- 5. Trigger de auto-preenchimento (usa função existente)
CREATE TRIGGER set_nova_tabela_org_id 
BEFORE INSERT ON public.nova_tabela 
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
```

### 5.2 Backfill de Dados Existentes
Ao adicionar `organization_id` a uma tabela que já contém dados:

```sql
UPDATE public.tabela 
SET organization_id = (
    SELECT organization_id FROM public.profiles 
    WHERE organization_id IS NOT NULL LIMIT 1
) 
WHERE organization_id IS NULL;
```

### 5.3 Type Definition
O tipo TypeScript **DEVE** incluir `organization_id`:
```typescript
export interface NovaEntidade {
    id: string;
    organization_id: string;  // ← OBRIGATÓRIO
    // ... demais campos
}
```

---

## 6. Regras para Frontend (Client Components)

### ❌ PROIBIDO no Frontend:
- Importar `createAdminClient` ou qualquer client Supabase
- Fazer fetch direto ao banco de dados
- Armazenar `organizationId` em estado local ou localStorage
- Passar `organizationId` como prop entre componentes

### ✅ CORRETO no Frontend:
- Chamar Server Actions importadas de `actions.ts`
- O `organizationId` é sempre resolvido no servidor via `requireSessionContext()`

---

## 7. Checklist de Revisão (Use antes de finalizar qualquer PR)

- [ ] Todo SELECT tem `.eq('organization_id', organizationId)`?
- [ ] Todo INSERT inclui `organization_id: organizationId` no payload?
- [ ] Todo UPDATE/DELETE tem `.eq('organization_id', organizationId)` junto com `.eq('id', ...)`?
- [ ] O Server Action usa `requireSessionContext()` e NÃO aceita `organizationId` do cliente?
- [ ] O Service recebe `userId` e `organizationId` como parâmetros?
- [ ] A tabela no banco possui a coluna `organization_id`, índice, RLS e policy?
- [ ] Não existe nenhum import de Supabase client em componentes `'use client'`?
- [ ] Campos de update usam whitelist (não passam dados arbitrários do frontend)?

---

## 8. Exemplos de Referência

| Camada | Arquivo de Referência |
|---|---|
| Middleware | `src/middleware.ts` |
| Auth Context | `src/lib/auth-server.ts` → `requireSessionContext()` |
| Admin Client | `src/lib/supabase/admin.ts` → `createAdminClient()` |
| Server Action | `src/app/(dashboard)/pipeline/actions.ts` |
| Service (CRUD completo) | `src/services/ContactService.ts` |
| Service (com whitelist) | `src/services/DealService.ts` → `updateDeal()` |
| Service (Settings) | `src/services/SettingsService.ts` |
| Migração SQL | `supabase/migrations/20260221000000_enable_multitenancy.sql` |
| Backfill SQL | `supabase/migrations/20260304000001_backfill_leads_org.sql` |
