# CRM — Gate RBAC server-side e trilha de auditoria (26/10/2026)

**Status:** candidato para PR na issue [#22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22), não entregue em produção. Não aplicar migrations nem executar merge automaticamente.

## Por que esta entrega é necessária

A PR [#198](https://github.com/leandrosilveiradepaula/crm-infodive/pull/198) foi mergeada humanamente e o Supabase recebeu a migration RLS `crm_authoritative_tenant_rls`. O deployment Vercel de produção `dpl_HALQE6fgfNRdBCH2maeKZx3RwgS4` alcançou `READY` no commit `adaea55f88eaa80d12a8b19596189398a3364837`. A camada RLS não controla operações realizadas pelo backend com `service_role`, que ignora RLS. Algumas Server Actions administrativas verificavam somente sessão e organização, não o papel do usuário, inclusive caminhos duplicados que contornavam o `PermissionGate` de UI.

**O fato de deployment estar READY não comprova login autenticado nem o comportamento das ações em produção.** Esse smoke permanece uma verificação real separada.

## Mudança de autorização

- `src/lib/permission-matrix.ts` é a única matriz de papéis da UI e do servidor; novos direitos de administração (integrações, configurações da organização, auditoria) são **exclusivos de admin**. `settings:configure_pipeline` continua disponível para `admin` e `manager`, como na UI anterior. Produto/preço segue `products:edit/delete`, respeitando os papéis anteriores.
- `requirePermission` primeiro revalida Iron Session e perfil ativo/tenant com `requireSessionContext` e depois verifica **novamente** o `role` real em `public.profiles`; valores de cookie cacheados, UI, corpo da ação e `user_metadata` não autorizam.
- Todas as variantes de Server Action de usuários, convites, alterações de perfil/roles, arquivamento, pipelines, configurações, integrações, API keys, webhooks e listas de preço passam por autorização no servidor **antes** de chamar serviços privilegiados.
- Arquivamentos com transferência exigem que o destinatário seja **ativo e do mesmo tenant**. O ator não pode se autoarquivar nesse fluxo. Upserts de etapas do pipeline recusam IDs já pertencentes a outra organização.
- `/api/auth/me` deixa de confiar no `organizationId` obsoleto da sessão: 401 se o perfil estiver ausente/inativo, sem tenant ou indisponível.
- Uma auditoria adicional encontrou `updateMyProfile` gravando `...data` diretamente por `service_role`, permitindo enviar no JSON de uma Server Action campos proibidos que o TypeScript não valida em runtime. O serviço agora **nega campos além de nome/telefone** e monta allowlist explícita; teste adversarial verifica `role`, `roles`, `status` e `organization_id` forjados.
- `createAuditLog` não aceita mais eventos arbitrários forjados por chamada direta. Eventos administrativos autorizados são registrados pelo próprio servidor **antes** da mutação, com identidade/organização verificadas, sem salvar payload ou credenciais. **São recibos de tentativa autorizada, NÃO prova de mudança concluída**.

## Limites e riscos que não podem ser ocultados

1. A trilha `authorized_attempt` é durável e vinculada ao ator, mas a gravação em `audit_logs` e a alteração de negócio ocorrem em transações separadas. **Não certifica log transacional de sucesso/falha final.** Completar auditoria de mudanças por trigger/RPC transacional requer desenho e gate de banco futuro se for critério de encerramento da issue #22.
2. A origem do papel é somente `profiles.role`; o legado `roles[]` não amplia privilégio. Um usuário com `roles` divergente de `role` não ganha admin implícito. A UI usa a mesma autoridade.
3. As 17 migrations históricas não aplicadas **não** são escopo desta entrega; não fazer replay. A situação do perfil ativo sem organização permanece fail-closed, sem backfill.
4. A PR #56 de release do CRM está aberta e deve ser reconciliada com essa correção antes de qualquer merge em produção. Não promover um Preview antigo como evidência do novo SHA.
5. Alguns avisos do Supabase permanecem após #198 (senhas vazadas, funções `SECURITY DEFINER` autenticadas e paths de funções não-Definer); exigem avaliação própria. Um check verde não substitui teste de autorização real em ambiente permitido.

## Aceite e sequência

- TypeScript, testes Vitest e build no SHA final em PR.
- Testes negativos **chamando as Server Actions diretamente**, incluindo os caminhos duplicados, sem confiar em UI oculta.
- Testes de papéis desconhecidos, perfil inativo/sem tenant, sessão revogada, injeção de role e tentativa de falsificar auditoria.
- Confirmar preview/review da PR. Nenhum merge automático. O merge de `main` é gate humano de produção.
- Após merge humano: identificar deployment exato `READY`, fazer smoke autenticado real (conta de teste autorizada) com permissões por papel e confirmar que erros de autorização não geram gravações privilegiadas. Registrar limitações na issue #22.
- Quando o CRM for considerado operacionalmente seguro, encerrar o parêntese e retornar ao [contrato de finalização da Factory](https://github.com/leandrosilveiradepaula/ai-product-factory/blob/main/docs/FINALIZATION_EXECUTION_CONTRACT.md), sem abrir novas frentes de CRM.
