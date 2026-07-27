
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** crm-next
- **Date:** 2026-06-17
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Login with email and password
- **Test Code:** [TC001_Login_with_email_and_password.py](./TC001_Login_with_email_and_password.py)
- **Test Error:** TEST BLOCKED

The test could not be run — valid sales rep credentials were not available to complete the login and reach the dashboard.

Observations:
- After submitting the default credentials, the page displays the error message 'Email ou senha incorretos.'
- The login form and error alert remain visible; the dashboard was not displayed.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/23f764d1-84de-48c7-acf5-0230ca65d2fa
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Move a deal to another pipeline stage
- **Test Code:** [TC002_Move_a_deal_to_another_pipeline_stage.py](./TC002_Move_a_deal_to_another_pipeline_stage.py)
- **Test Error:** TEST BLOCKED

The test could not be run — login to the application failed and access to the pipeline cannot be obtained.

Observations:
- After submitting the login form the page displays the error banner: 'EMAIL OU SENHA INCORRETOS.'
- The application remained on the login screen and did not navigate to any authenticated area (pipeline unavailable).
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/db6b0640-63cf-438f-8067-d556dd6b8155
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Complete client proposal review and signature in the portal
- **Test Code:** [TC003_Complete_client_proposal_review_and_signature_in_the_portal.py](./TC003_Complete_client_proposal_review_and_signature_in_the_portal.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the portal could not be accessed because login failed.

Observations:
- The login page displayed a visible error: 'EMAIL OU SENHA INCORRETOS.' after the login attempt.
- Direct navigation attempts to /portal were redirected to the login screen, preventing access to portal content or shared proposals.
- Default credentials used (example@gmail.com / password123) were rejected; no valid credentials or invitation are available in this session.

Because the portal and shared-proposal features cannot be reached without valid credentials or an invite, the verification steps (open shared proposal, review, accept/reject, provide digital signature, and confirm status) cannot be executed. To proceed, valid portal credentials or an active invitation must be provided.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/ca627bb5-5c58-4860-a61e-8e2f2bc85a69
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Open the dashboard after login
- **Test Code:** [TC004_Open_the_dashboard_after_login.py](./TC004_Open_the_dashboard_after_login.py)
- **Test Error:** TEST BLOCKED

The test could not be run — authentication with the provided credentials failed and prevented access to the dashboard.

Observations:
- The login form displayed the error message: 'Email ou senha incorretos.'
- The page remained on the login screen and the dashboard (where KPI cards and recent activity would appear) was not reached.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/ea549627-5762-4804-9b0e-5e547f9de1f2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Review dashboard metrics and funnel
- **Test Code:** [TC005_Review_dashboard_metrics_and_funnel.py](./TC005_Review_dashboard_metrics_and_funnel.py)
- **Test Error:** TEST BLOCKED

The dashboard cannot be reached because login with the provided credentials was rejected.

Observations:
- The login page shows the error message 'Email ou senha incorretos.' after two login attempts.
- The login form remains visible with the email field populated; no access to the dashboard was obtained.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/578fd443-4fe6-4980-bc34-acce95d455c8
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Capture a digital signature on a contract
- **Test Code:** [TC006_Capture_a_digital_signature_on_a_contract.py](./TC006_Capture_a_digital_signature_on_a_contract.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the UI prevents access because login with the provided credentials fails, so the contract signing flow cannot be reached.

Observations:
- The login page displays the error message 'EMAIL OU SENHA INCORRETOS.' after submitting credentials.
- The application remains on the login screen and no alternative access (password recovery or demo account) is visible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b22762ac-5501-4743-94cf-53940e7f5dcc
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Create a proposal with product line items
- **Test Code:** [TC007_Create_a_proposal_with_product_line_items.py](./TC007_Create_a_proposal_with_product_line_items.py)
- **Test Error:** TEST BLOCKED

O teste não pôde ser executado — o acesso à aplicação não foi possível com as credenciais de teste e o sistema exige cadastro por convite.

Observations:
- A página mostrou a mensagem de erro 'Email ou senha incorretos.' após a tentativa de login.
- A página indica explicitamente 'O cadastro no sistema é feito exclusivamente por convite', impedindo a criação de uma conta de teste.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/e4f3ba66-2d25-4bd2-b903-5332be18d179
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Hide and reveal commission values
- **Test Code:** [TC008_Hide_and_reveal_commission_values.py](./TC008_Hide_and_reveal_commission_values.py)
- **Test Error:** TEST BLOCKED

The test could not be run — authentication failed and the Goals page could not be reached.

Observations:
- The login form displayed the error message 'Email ou senha incorretos.'
- A login attempt was made with email example@gmail.com and password password123, which was rejected
- The authenticated area (e.g., Goals) was not accessible, so commission privacy could not be verified
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b97e4cd1-4eb0-4893-aa19-344ac37f2cf2
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Create a new deal from the pipeline
- **Test Code:** [TC009_Create_a_new_deal_from_the_pipeline.py](./TC009_Create_a_new_deal_from_the_pipeline.py)
- **Test Error:** TEST BLOCKED

The test could not be run because the application would not accept the provided credentials and prevented access to the pipeline board.

Observations:
- The login page displayed the error message: 'Email ou senha incorretos.'
- The login attempt used the provided test credentials (example@gmail.com / password123) but authentication failed.
- Access to the pipeline and deal creation is not possible without a successful login, so the remaining test steps cannot be performed.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/35815bc6-d766-47ca-af32-469608e7fa1e
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Convert a qualified lead into a deal
- **Test Code:** [TC010_Convert_a_qualified_lead_into_a_deal.py](./TC010_Convert_a_qualified_lead_into_a_deal.py)
- **Test Error:** TEST BLOCKED

The test could not be run because valid credentials to access the application are not available.

Observations:
- Submitting the login form returned the visible error message 'Email ou senha incorretos.'
- The page remained on the login screen after the submit attempt, so no authenticated session was established.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b34be28d-6f90-43da-9ead-a9942708484d
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Send a proposal to a client
- **Test Code:** [TC011_Send_a_proposal_to_a_client.py](./TC011_Send_a_proposal_to_a_client.py)
- **Test Error:** TEST BLOCKED

The test could not be run — the user cannot log in with the available credentials, so the proposal-send flow cannot be reached.

Observations:
- The login page displays the error message 'Email ou senha incorretos.'
- The login attempt used example@gmail.com / password123 and the application remained on the login screen
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b53227c1-4df5-4bc0-8eda-d99ec10dbdcf
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Create a contract and send it for signature
- **Test Code:** [TC012_Create_a_contract_and_send_it_for_signature.py](./TC012_Create_a_contract_and_send_it_for_signature.py)
- **Test Error:** TEST BLOCKED

The test could not be run — access to the application requires an invited account, so creating and sending a contract cannot be performed.

Observations:
- The login page showed 'EMAIL OU SENHA INCORRETOS.' after submitting credentials.
- The page displayed the message 'O CADASTRO NO SISTEMA É FEITO EXCLUSIVAMENTE POR CONVITE', indicating registration is invite-only.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/0e615f92-06bb-4a0b-9f8a-edf5f71144ae
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 Reject invalid login credentials
- **Test Code:** [TC013_Reject_invalid_login_credentials.py](./TC013_Reject_invalid_login_credentials.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/f6108907-1c9d-43b4-a2e5-7677ba0a8f18
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Create a new lead
- **Test Code:** [TC014_Create_a_new_lead.py](./TC014_Create_a_new_lead.py)
- **Test Error:** TEST BLOCKED

The test could not be run because valid login credentials are not available and the provided credentials were rejected.

Observations:
- After submitting the credentials, the login page displayed the error message 'Email ou senha incorretos.'
- The application remained on the login screen and access to the leads functionality could not be reached.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/df7f1b04-5c7f-4c6a-b013-84c3704e82b9
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Create sales goals for a seller
- **Test Code:** [TC015_Create_sales_goals_for_a_seller.py](./TC015_Create_sales_goals_for_a_seller.py)
- **Test Error:** TEST BLOCKED

O teste não pôde ser executado — credenciais válidas de gerente não estão disponíveis para efetuar login.

Observations:
- A página de login exibiu a mensagem 'Email ou senha incorretos.'
- A tela permaneceu no formulário de login com os campos 'Email Corporativo' e 'Senha' visíveis
- A página indica que o cadastro é feito exclusivamente por convite, portanto não é possível criar uma conta para prosseguir
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/3e91ae4e-4a35-4f12-b28d-14c0cb8b732f
- **Status:** BLOCKED
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **6.67** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---