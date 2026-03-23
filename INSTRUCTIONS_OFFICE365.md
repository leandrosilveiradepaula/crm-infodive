# Configuração do Office 365 (Azure AD) no Supabase

Para permitir que o CRM acesse seus emails, você precisa criar um "Aplicativo" no portal do Azure e conectá-lo ao Supabase.

## Passo 1: Criar Aplicativo no Azure Portal

1.  Acesse o [Portal do Azure](https://portal.azure.com/).
2.  Pesquise por **"App registrations"** (Registros de aplicativo) e selecione.
3.  Clique em **"New registration"** (Novo registro).
4.  **Name**: CRM Next Gen (ou o nome que preferir).
5.  **Supported account types**:
    *   Se for apenas para sua empresa: *Accounts in this organizational directory only*.
    *   Se for para qualquer empresa (SaaS): *Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant)*.
6.  **Redirect URI** (Web):
    *   Vá no seu painel do Supabase -> Authentication -> URL Configuration.
    *   Copie a **Site URL** (ex: `https://seu-projeto.supabase.co`).
    *   No Azure, cole essa URL e adicione `/auth/v1/callback` no final.
    *   Exemplo: `https://abcdefgh.supabase.co/auth/v1/callback`
7.  Clique em **Register**.

## Passo 2: Configurar Segredos e Permissões

1.  No menu lateral do seu app no Azure, vá em **"Certificates & secrets"**.
2.  Clique em **"New client secret"**.
3.  Adicione uma descrição e validade. Copie o **Value** (Valor) gerado IMEDIATAMENTE. Você não poderá vê-lo depois.
4.  Vá em **"API Permissions"**.
5.  Clique em **"Add a permission"** -> **"Microsoft Graph"** -> **"Delegated permissions"**.
6.  Adicione as seguintes permissões:
    *   `Mail.Read` (Ler emails)
    *   `Mail.Send` (Enviar emails)
    *   `User.Read` (Ler perfil do usuário)
    *   `Offline_access` (Manter acesso mesmo offline)
7.  Clique em **"Grant admin consent"** se possível (opcional, mas recomendado para evitar popups constantes).

## Passo 3: Configurar no Supabase

1.  Vá no Dashboard do Supabase -> **Authentication** -> **Providers**.
2.  Encontre e habilite **Azure (Microsoft)**.
3.  **Client ID**: Copie o "Application (client) ID" da tela "Overview" do seu app no Azure.
4.  **Client Secret**: Cole o "Value" do segredo que você criou no Passo 2.
5.  **Tenant URL** (opcional): Deixe em branco se escolheu "Multitenant". Caso contrário, coloque a URL do seu Azure AD (geralmente `https://login.microsoftonline.com/common` ou seu Tenant ID específico).
6.  Clique em **Save**.

## Passo 4: Redirecionamento Local (Importante para Desenvolvimento)

Se você estiver rodando localmente (`localhost:3000`):
1.  No Supabase -> Authentication -> URL Configuration -> **Redirect URLs**.
2.  Adicione: `http://localhost:3000/auth/callback`
3.  No Azure -> Authentication -> Web -> Redirect URIs.
4.  Adicione: `http://localhost:3000/auth/callback` (pode ser necessário para testes locais).

Agora seu sistema está pronto para autenticar com Office 365!

## Solução de Problemas Comuns

### Erro AADSTS50011: The redirect URI does not match
Se você vir este erro, significa que a URL de callback configurada no Azure **não é idêntica** à que o Supabase está usando.

**Correção:**
1.  Olhe a mensagem de erro com atenção. Ela dirá algo como: `The redirect URI 'https://xxx.supabase.co/auth/v1/callback' specified in the request...`
2.  Copie **exatamente** essa URL da mensagem de erro.
3.  Vá no Portal do Azure -> App Registration (seu app) -> Authentication -> Web -> Redirect URIs.
4.  Adicione essa URL à lista.
5.  Salve e tente novamente.

### Erro: Error getting user email from external provider
Isso acontece quando o Azure não envia o email do usuário no login.

**Correção:**
1.  Vá no Portal do Azure -> App Registration -> **"Token configuration"**.
2.  Clique em **"Add optional claim"**.
3.  Tipo de token: **ID**, Selecione **email**, **upn**, **given_name**, **family_name**. Clique em Add.
4.  Aceite a opção de adicionar permissões do Graph API se perguntar.
5.  Vá em **"API permissions"**.
6.  **MUITO IMPORTANTE:** Se `email` e `profile` não tiverem um "check" verde na coluna Status, clique no botão **"Grant admin consent for [Sua Empresa]"** (Conceder consentimento do administrador) na parte superior da tabela. Isso é obrigatório para liberar o acesso.
