---
name: Application Security Guard
description: Regras obrigatórias de segurança para o CRM Next Gen. Deve ser consultado ANTES de criar ou modificar rotas de API, autenticação, manipulação de dados sensíveis ou integrações externas.
---

# Application Security Guard

> **REGRA DE OURO**: Todo acesso a dados ou funcionalidades deve ser autenticado via `iron-session`, autorizado via `organization_id`, e sanitizado contra injeção. Client Components **NUNCA** acessam o banco.

---

## 1. Arquitetura de Autenticação

```
┌──────────────────────────────────────────────────┐
│  LOGIN (Server Action: login/actions.ts)         │
│  → Autentica via Supabase Auth (email+senha)     │
│  → Cria iron-session com userId + organizationId │
│  → Armazena JWT em cookie httpOnly               │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│  IRON-SESSION (cookie: crm_iron_session)         │
│  → Encriptado com SESSION_SECRET (32+ chars)     │
│  → httpOnly: true (inacessível por JavaScript)   │
│  → secure: true (em produção)                    │
│  → sameSite: 'lax'                               │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│  MIDDLEWARE (src/middleware.ts)                   │
│  → Valida sessão em TODA requisição              │
│  → Injeta X-User-Id em header seguro             │
│  → Redireciona → /login se não autenticado       │
│  → Retorna 401 para APIs não autenticadas        │
└──────────────────────────────────────────────────┘
```

---

## 2. Autenticação — Regras

### 2.1 Padrão Obrigatório para Server Actions

```typescript
'use server';
import { requireSessionContext } from '@/lib/auth-server';

export async function minhaAction(args: any) {
    // ✅ SEMPRE extrair contexto do servidor
    const { userId, organizationId } = await requireSessionContext();
    // ... lógica
}
```

### 2.2 Padrão Obrigatório para API Routes

```typescript
import { requireSessionContext } from '@/lib/auth-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // ✅ Auth guard com try/catch
    try {
        const { userId, organizationId } = await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ... lógica
}
```

### ❌ PROIBIÇÕES

| Proibido | Por que |
|---|---|
| `createClient` de `@/utils/supabase/server` | Pattern obsoleto, não funciona com iron-session |
| `supabase.auth.getUser()` em API routes | Usa cookies que não existem mais |
| Aceitar `userId` ou `organizationId` do frontend | Pode ser falsificado pelo atacante |
| `localStorage` para tokens/sessão | Vulnerável a XSS |

---

## 3. Proteção de Rotas

### 3.1 Rotas Públicas (sem autenticação)
Apenas estas rotas são acessíveis sem login:

```typescript
// Definido no middleware.ts
'/login'
'/auth'
'/api/auth'
'/api/proposals/public'  // Apenas visualização pública de propostas
'/_next'
'/favicon.ico'
```

### 3.2 Nova Rota Pública
Se precisar adicionar uma rota pública:
1. Adicione ao array de rotas permitidas no `middleware.ts`
2. **Documente** o motivo no código com um comentário
3. **NUNCA** exponha dados de outras organizações em rotas públicas
4. Use tokens temporários (ex: `public_token` para propostas) em vez de IDs diretos

---

## 4. Cookies — Configuração Segura

### 4.1 Iron Session Cookie
```typescript
// src/lib/session.ts
cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // ✅ HTTPS em produção
    httpOnly: true,       // ✅ Inacessível via JavaScript
    sameSite: 'lax',      // ✅ Proteção contra CSRF básica
}
```

### 4.2 JWT Cookie (Supabase Access Token)
```typescript
// login/actions.ts
cookieStore.set('crm_access_token', token, {
    httpOnly: true,       // ✅ Inacessível via JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7  // 1 semana
});
```

### ❌ NUNCA
- Armazene tokens em cookies sem `httpOnly`
- Use `document.cookie` no frontend
- Defina `secure: false` em produção

---

## 5. Sanitização de Inputs

### 5.1 Server Actions — Whitelist de Campos
```typescript
// ✅ CORRETO: aceitar apenas campos esperados
const allowedColumns = ['title', 'description', 'status', 'value'];
const sanitized = Object.entries(updates).reduce((acc, [key, value]) => {
    if (allowedColumns.includes(key)) {
        acc[key] = value === '' ? null : value;
    }
    return acc;
}, {} as Record<string, any>);
```

### 5.2 Validação de Tipos

```typescript
// ✅ Sempre validar tipos e limites
const value = Number(formData.get('value'));
if (isNaN(value) || value < 0) {
    return { error: 'Valor inválido' };
}

const email = (formData.get('email') as string)?.trim().toLowerCase();
if (!email || !email.includes('@')) {
    return { error: 'Email inválido' };
}
```

### 5.3 Proteção contra SQL Injection
O Supabase client já parametriza queries automaticamente, mas:

```typescript
// ✅ Usar métodos do Supabase (parametrizados)
.eq('email', userInput)
.ilike('name', `%${searchTerm}%`)

// ❌ NUNCA concatenar SQL manualmente
.rpc('minha_funcao', { query: `SELECT * WHERE email = '${userInput}'` })
```

---

## 6. Proteção de Dados Sensíveis

### 6.1 Dados que NUNCA devem vazar para o frontend
- `SESSION_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- Senhas ou hashes de senhas
- Tokens de API de terceiros

### 6.2 Prefixos de Variáveis de Ambiente (Next.js)
```env
# ✅ Variáveis PRIVADAS (só server-side)
SESSION_SECRET=...
SUPABASE_SERVICE_ROLE_KEY=...
GEMINI_API_KEY=...

# ✅ Variáveis PÚBLICAS (expostas ao browser)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

> [!CAUTION]
> Variáveis sem prefixo `NEXT_PUBLIC_` são **privadas** por padrão no Next.js. **NUNCA** adicione `NEXT_PUBLIC_` a secrets como `SESSION_SECRET` ou `SERVICE_ROLE_KEY`.

### 6.3 Logging Seguro

```typescript
// ✅ Logar eventos sem dados sensíveis
console.log('Login attempt for user:', email);
console.error('Auth error:', error.message);

// ❌ NUNCA logar dados sensíveis
console.log('Password:', password);
console.log('Token:', accessToken);
console.log('Full session:', session);
```

---

## 7. Upload de Arquivos

```typescript
// ✅ Namespace por organização no storage
const fileName = `invoices/${organizationId}/${orderId}-${randomHash}-${file.name}`;

// ✅ Validar tipo e tamanho do arquivo
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: 'Tipo de arquivo não permitido' };
}
if (file.size > MAX_SIZE) {
    return { error: 'Arquivo muito grande (máx. 10MB)' };
}
```

---

## 8. Integrações com IA (Gemini)

### 8.1 Auth Guard Obrigatório

```typescript
// ✅ Toda rota /api/gemini/* DEVE ter auth guard
export async function POST(request: Request) {
    try {
        await requireSessionContext();
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // ... lógica da IA
}
```

### 8.2 Proteção de API Keys
- A `GEMINI_API_KEY` é usada **somente no servidor** (API routes)
- **NUNCA** faça chamadas diretas ao Gemini a partir de client components
- Use o padrão BFF: `Client → /api/gemini/* → Gemini API`

### 8.3 Sanitização de Responses da IA

```typescript
// ✅ Sempre fazer parse seguro de JSONs da IA
try {
    const parsed = JSON.parse(text);
} catch {
    return { error: 'Falha ao processar resposta da IA' };
}
```

---

## 9. Checklist de Segurança

Use antes de completar qualquer tarefa:

- [ ] Toda Server Action usa `requireSessionContext()`?
- [ ] Toda API Route tem auth guard com `try/catch`?
- [ ] Nenhuma rota usa `createClient` de `@/utils/supabase/server`?
- [ ] `userId` e `organizationId` vêm **exclusivamente** do servidor?
- [ ] Inputs do usuário são validados (tipo, tamanho, formato)?
- [ ] Updates usam whitelist de campos permitidos?
- [ ] Nenhum secret aparece no frontend (`NEXT_PUBLIC_` indevido)?
- [ ] Logs não contêm senhas, tokens ou dados de sessão?
- [ ] Uploads validam tipo e tamanho do arquivo?
- [ ] Novas rotas públicas foram documentadas e justificadas?

---

## 10. Referências

| Camada | Arquivo |
|---|---|
| Sessão | `src/lib/session.ts` |
| Auth Context | `src/lib/auth-server.ts` |
| Middleware | `src/middleware.ts` |
| Login/Signup | `src/app/login/actions.ts` |
| API Route (exemplo seguro) | `src/app/api/gemini/extract/route.ts` |
| Upload seguro | `src/app/(dashboard)/sales/actions.ts` → `uploadSalesOrderInvoice` |
| Skill complementar | `.agent/skills/saas-multitenant/SKILL.md` |
