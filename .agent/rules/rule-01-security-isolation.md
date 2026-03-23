---
description: Garante isolamento de segurança entre frontend e backend,
  impedindo vazamento de chaves sensíveis e escrita direta no banco via
  client-side.
enabled: true
name: security-isolation-smith
priority: high
scope: code
---

# LEI 01 --- Isolamento de Segurança Smith

## OBJETIVO

Prevenir exposição de chaves sensíveis, uso indevido de privilégios
administrativos, escrita direta no banco a partir do client-side e
bypass da camada de validação do backend.

Esta regra é obrigatória para qualquer modificação relacionada a
frontend, autenticação ou acesso a dados.

------------------------------------------------------------------------

## GATILHO

Aplicar automaticamente quando:

-   Criar ou modificar arquivos em /app
-   Criar ou modificar arquivos em /components
-   Implementar integração com Supabase
-   Implementar acesso a banco de dados
-   Criar rotas /api/\*
-   Implementar middleware

------------------------------------------------------------------------

## RESTRIÇÕES INEGOCIÁVEIS

### 1. Proibição de Service Role no Frontend

É estritamente proibido utilizar:

SUPABASE_SERVICE_ROLE_KEY

em qualquer código executado no client-side.

Nunca sob nenhuma circunstância.

------------------------------------------------------------------------

### 2. Zero Escrita Direta via Supabase no Client

O frontend NÃO pode executar operações de insert, update ou delete
diretamente via cliente Supabase.

Toda modificação de estado deve obrigatoriamente:

1.  Passar por uma rota /api/\*
2.  Validar sessão no backend
3.  Executar a lógica segura exclusivamente no servidor

------------------------------------------------------------------------

### 3. Headers de Segurança Obrigatórios

Toda nova rota ou middleware deve manter:

-   CSP configurado corretamente
-   Proteção Anti-Clickjacking

Regras obrigatórias:

-   frame-ancestors 'none' para áreas administrativas
-   frame-ancestors '\*' apenas para /embed

------------------------------------------------------------------------

## PADRÃO DE AUTENTICAÇÃO

É obrigatório utilizar:

-   getIronSession
-   Criptografia AES-256-GCM
-   Validação explícita de permissões (ex: session.user?.isAdmin)

Nenhuma operação sensível pode ocorrer sem validação explícita de
sessão.

------------------------------------------------------------------------

## EXEMPLO INCORRETO (PROIBIDO)

    // app/components/AdminPanel.tsx
    import { createClient } from '@supabase/supabase-js'

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    export function AdminPanel() {
      const deleteUser = async (id: string) => {
        await supabase.from('users').delete().eq('id', id)
      }
    }

Motivo da violação:

-   Uso de Service Role no client
-   Escrita direta no banco
-   Ausência de validação de sessão

------------------------------------------------------------------------

## EXEMPLO CORRETO (OBRIGATÓRIO)

    // app/components/AdminPanel.tsx
    export function AdminPanel() {
      const deleteUser = async (id: string) => {
        await fetch('/api/admin/users', {
          method: 'DELETE',
          body: JSON.stringify({ userId: id }),
          credentials: 'include'
        })
      }
    }

    // app/api/admin/users/route.ts
    import { getIronSession } from 'iron-session'
    import { cookies } from 'next/headers'
    import { createClient } from '@supabase/supabase-js'

    export async function DELETE(req: Request) {
      const session = await getIronSession(cookies(), sessionOptions)

      if (!session.user?.isAdmin) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }

      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Execução segura no servidor
    }

------------------------------------------------------------------------

## COMPORTAMENTO ESPERADO DO AGENT

Se detectar:

-   Uso de SUPABASE_SERVICE_ROLE_KEY no client
-   Operações de escrita via Supabase no frontend
-   Ausência de validação de sessão em rota sensível

Deve:

1.  Bloquear a implementação
2.  Sugerir refatoração via rota /api/\*
3.  Exigir validação de sessão antes da execução

------------------------------------------------------------------------

Esta regra possui prioridade máxima e não pode ser ignorada.
