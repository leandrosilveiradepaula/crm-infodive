# CRM #22 — correção de isolamento na sincronização de e-mail

## Lacuna comprovada no código da main 5072e0ea311e27ce4b5e2382e32399deece5adf8

A rota `src/app/api/email/sync/route.ts` consultava `account_contacts`
e `contact_blacklists` pelo e-mail sem escopo de organização, usando
`createAdminClient()` (contorna RLS). Assim, um remetente cadastrado em
outro tenant era tratado como já existente neste tenant, interferindo na
criação de sugestões e possibilitando inferência cruzada. Um erro de consulta
também era tratado como lista vazia, permitindo continuar a extração de IA
e a escrita posterior.

## Correção

- `account_contacts` não possui `organization_id` próprio: o filtro usa
  relação interna obrigatória com `accounts.organization_id`.
- `contact_blacklists` usa seu `organization_id` explícito.
- Falhas e resultados malformados bloqueiam a etapa de sugestão antes de
  qualquer extração paga de assinatura e antes de qualquer escrita.
- Testes Vitest verificam ambos os filtros, erros de consulta e tenant
  inválido. A identidade do tenant continua derivada da sessão server-side.

Nenhuma migration, alteração de RLS, credencial, chamada paga, execução
de e-mail real ou merge de produção faz parte deste commit. O Preview e
o CI precisam ser verificados no SHA exato antes de certificação.
