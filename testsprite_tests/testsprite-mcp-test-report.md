# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** crm-next
- **Date:** 2026-06-18
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

### Requirement: User Authentication
- **Description:** Verifies user access controls, login behavior, and validation of credentials.

#### Test TC001 Login with email and password
- **Test Code:** [TC001_Login_with_email_and_password.py](./tmp/TC001_Login_with_email_and_password.py)
- **Test Error:** TEST BLOCKED: Valid sales representative credentials were not available to bypass the login gate.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/23f764d1-84de-48c7-acf5-0230ca65d2fa)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** The test could not authenticate using the default mock credentials (`example@gmail.com` / `password123`) because registration in the CRM is invite-only, and no active user existed with these credentials. The page correctly displayed "Email ou senha incorretos."

---

#### Test TC013 Reject invalid login credentials
- **Test Code:** [TC013_Reject_invalid_login_credentials.py](./tmp/TC013_Reject_invalid_login_credentials.py)
- **Test Error:** None
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/f6108907-1c9d-43b4-a2e5-7677ba0a8f18)
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** The application correctly rejects invalid credentials, displays the expected error feedback message "Email ou senha incorretos.", and maintains the user on the login screen.

---

### Requirement: Pipeline Kanban Board
- **Description:** Verifies moving deal cards across stages and creating deals from the board view.

#### Test TC002 Move a deal to another pipeline stage
- **Test Code:** [TC002_Move_a_deal_to_another_pipeline_stage.py](./tmp/TC002_Move_a_deal_to_another_pipeline_stage.py)
- **Test Error:** TEST BLOCKED: Pipeline interface is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/db6b0640-63cf-438f-8067-d556dd6b8155)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Because navigating to dashboard and pipeline routes requires an active authenticated session, this interaction could not be reached.

---

#### Test TC009 Create a new deal from the pipeline
- **Test Code:** [TC009_Create_a_new_deal_from_the_pipeline.py](./tmp/TC009_Create_a_new_deal_from_the_pipeline.py)
- **Test Error:** TEST BLOCKED: Board interface is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/35815bc6-d766-47ca-af32-469608e7fa1e)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Deal creation flow was blocked due to failed login at the initial step.

---

### Requirement: Proposal Management
- **Description:** Verifies client portals, creating proposals with line items, and sending proposals.

#### Test TC003 Complete client proposal review and signature in the portal
- **Test Code:** [TC003_Complete_client_proposal_review_and_signature_in_the_portal.py](./tmp/TC003_Complete_client_proposal_review_and_signature_in_the_portal.py)
- **Test Error:** TEST BLOCKED: Proposal portal is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/ca627bb5-5c58-4860-a61e-8e2f2bc85a69)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Direct attempts to navigate to the client portal page (`/portal`) resulted in redirecting back to the login gate, blocking the verification of portal proposals and signature components.

---

#### Test TC007 Create a proposal with product line items
- **Test Code:** [TC007_Create_a_proposal_with_product_line_items.py](./tmp/TC007_Create_a_proposal_with_product_line_items.py)
- **Test Error:** TEST BLOCKED: Proposal manager is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/e4f3ba66-2d25-4bd2-b903-5332be18d179)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** The test was unable to log in and create a proposal. Self-signup is blocked since the app emphasizes "O cadastro no sistema é feito exclusivamente por convite."

---

#### Test TC011 Send a proposal to a client
- **Test Code:** [TC011_Send_a_proposal_to_a_client.py](./tmp/TC011_Send_a_proposal_to_a_client.py)
- **Test Error:** TEST BLOCKED: Proposals screen is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b53227c1-4df5-4bc0-8eda-d99ec10dbdcf)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Proposal list and send actions could not be tested because login failed.

---

### Requirement: Dashboard Overview
- **Description:** Verifies dashboard rendering, KPI cards, funnel metrics, and activities.

#### Test TC004 Open the dashboard after login
- **Test Code:** [TC004_Open_the_dashboard_after_login.py](./tmp/TC004_Open_the_dashboard_after_login.py)
- **Test Error:** TEST BLOCKED: Dashboard screen is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/ea549627-5762-4804-9b0e-5e547f9de1f2)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** KPI overview cards and dashboard layout could not be evaluated since user session authorization is required.

---

#### Test TC005 Review dashboard metrics and funnel
- **Test Code:** [TC005_Review_dashboard_metrics_and_funnel.py](./tmp/TC005_Review_dashboard_metrics_and_funnel.py)
- **Test Error:** TEST BLOCKED: Metrics are unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/578fd443-4fe6-4980-bc34-acce95d455c8)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Visual chart rendering for funnel metrics could not be verified.

---

### Requirement: Contract Management
- **Description:** Verifies generating contracts, signing them digitally, and status workflows.

#### Test TC006 Capture a digital signature on a contract
- **Test Code:** [TC006_Capture_a_digital_signature_on_a_contract.py](./tmp/TC006_Capture_a_digital_signature_on_a_contract.py)
- **Test Error:** TEST BLOCKED: Contracts list is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b22762ac-5501-4743-94cf-53940e7f5dcc)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** The digital signature canvas/components could not be tested because login failed.

---

#### Test TC012 Create a contract and send it for signature
- **Test Code:** [TC012_Create_a_contract_and_send_it_for_signature.py](./tmp/TC012_Create_a_contract_and_send_it_for_signature.py)
- **Test Error:** TEST BLOCKED: Contracts interface is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/0e615f92-06bb-4a0b-9f8a-edf5f71144ae)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Contract creation form details and save validation rules could not be analyzed due to login requirements.

---

### Requirement: Goals and Commissions
- **Description:** Verifies setting sales targets and toggling commission privacy options.

#### Test TC008 Hide and reveal commission values
- **Test Code:** [TC008_Hide_and_reveal_commission_values.py](./tmp/TC008_Hide_and_reveal_commission_values.py)
- **Test Error:** TEST BLOCKED: Goals page is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b97e4cd1-4eb0-4893-aa19-344ac37f2cf2)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Privacy toggles and mask states for commissions could not be evaluated since access to `/goals` was blocked.

---

#### Test TC015 Create sales goals for a seller
- **Test Code:** [TC015_Create_sales_goals_for_a_seller.py](./tmp/TC015_Create_sales_goals_for_a_seller.py)
- **Test Error:** TEST BLOCKED: Goals management is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/3e91ae4e-4a35-4f12-b28d-14c0cb8b732f)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** The test could not authenticate as a manager, blocking evaluation of target editing and save flows.

---

### Requirement: Lead Management
- **Description:** Verifies lead creation, detailed updates, and converting qualified leads.

#### Test TC010 Convert a qualified lead into a deal
- **Test Code:** [TC010_Convert_a_qualified_lead_into_a_deal.py](./tmp/TC010_Convert_a_qualified_lead_into_a_deal.py)
- **Test Error:** TEST BLOCKED: Leads flow is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/b34be28d-6f90-43da-9ead-a9942708484d)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Reached credentials block at step 1.

---

#### Test TC014 Create a new lead
- **Test Code:** [TC014_Create_a_new_lead.py](./tmp/TC014_Create_a_new_lead.py)
- **Test Error:** TEST BLOCKED: Leads dashboard is unreachable because login failed.
- **Test Visualization and Result:** [View Result](https://www.testsprite.com/dashboard/mcp/tests/cb2dba40-a99c-4741-a672-43fdb581e0ae/df7f1b04-5c7f-4c6a-b013-84c3704e82b9)
- **Status:** ⚠️ BLOCKED
- **Severity:** HIGH
- **Analysis / Findings:** Could not interact with lead creation forms.

---

## 3️⃣ Coverage & Matching Metrics

- **6.67%** of tests passed (1 of 15 tests)

| Requirement | Total Tests | ✅ Passed | ❌ Failed | ⚠️ Blocked |
| :--- | :---: | :---: | :---: | :---: |
| User Authentication | 2 | 1 | 0 | 1 |
| Pipeline Kanban Board | 2 | 0 | 0 | 2 |
| Proposal Management | 3 | 0 | 0 | 3 |
| Dashboard Overview | 2 | 0 | 0 | 2 |
| Contract Management | 2 | 0 | 0 | 2 |
| Goals and Commissions | 2 | 0 | 0 | 2 |
| Lead Management | 2 | 0 | 0 | 2 |
| **Total** | **15** | **1** | **0** | **14** |

---

## 4️⃣ Key Gaps / Risks

> **6.67% of tests passed fully.**
> 
> ### Key Gaps Identified:
> 1. **Lack of Test Credentials:** The automated test runner used generic default credentials (`example@gmail.com` / `password123`) which were rejected. The system operates on an invite-only model, and no user had been seeded or created for testing.
> 2. **Authentication Gate Block:** The entire suite of tests (except TC013, which verifies rejection of invalid inputs) was blocked at step 1, leaving the dashboard, pipeline, leads, proposals, and contracts unverified.
> 
> ### Risks:
> - **Zero Coverage of Critical Business Workflows:** Because login was blocked, there is no validation for data processing, database connection stability, state management, or UI performance for authenticated areas.
> - **Security and Validation Gaps:** The invite-only signup mechanism effectively protects user creation but requires seeded test accounts on local/dev databases to permit integration tests.
