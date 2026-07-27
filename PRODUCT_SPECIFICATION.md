# CRM Next Gen — Product Specification Document

## 1. Product Overview

**Product Name:** CRM Next Gen (crm-next)
**Type:** B2B Sales CRM (Customer Relationship Management)
**Platform:** Web Application (SPA)
**Tech Stack:** Next.js 16, React 19, Supabase (Auth + PostgreSQL + Storage), Tailwind CSS v4, TypeScript 5, TanStack React Query, Zustand, Framer Motion
**Target Users:** Sales teams, sales managers, and administrators in B2B technology distribution companies (Brazil market)
**Language:** Brazilian Portuguese (pt-BR) for UI labels and data; English for code
**Authentication:** Supabase Auth with email/password + Office 365 (Azure AD) OAuth
**Multi-tenancy:** Organization-based (`organization_id` on all tables)

---

## 2. User Roles & Permissions

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **admin** | Full system access | All permissions, user management, pipeline configuration |
| **manager** | Team oversight | View all leads/deals, manage team goals, reports |
| **vendedor** (seller) | Individual sales rep | View own leads/deals, create/edit deals, generate proposals |
| **support** | Post-sales support | View accounts, manage service contracts and assets |

### Permission System
- `leads:view_all`, `leads:create`, `leads:edit`, `leads:delete`
- `deals:view_all`, `deals:create`, `deals:edit`, `deals:delete`, `deals:change_owner`
- `products:create`, `products:edit`, `products:delete`
- `clients:view_all`
- `settings:manage_users`, `settings:configure_pipeline`

---

## 3. Application Structure & Routes

The application uses Next.js App Router. All authenticated pages are under the `/(dashboard)` layout group. The login page is at `/login`.

### 3.1 Navigation Structure

| Route | Module | Description |
|-------|--------|-------------|
| `/login` | Auth | Login page (email/password + Office 365 OAuth) |
| `/dashboard` | Dashboard | Main overview with KPIs, charts, and activity feed |
| `/pipeline` | Pipeline (Deals) | Kanban board for sales pipeline management |
| `/leads` | Leads | Lead management (list/table view) |
| `/accounts` | Accounts | Company/account management |
| `/contacts` | Contacts | Contact people management |
| `/customers` | Customers | Legacy customer view |
| `/products` | Products | Product catalog management |
| `/proposals` | Proposals | Commercial proposal generation and management |
| `/contracts` | Contracts | Contract management with digital signatures |
| `/activities` | Activities | Tasks, meetings, calls, emails, notes |
| `/sales` | Sales | Sales tracking and post-sales |
| `/sales-orders` | Sales Orders | Sales order management and fulfillment |
| `/purchases` | Purchases | Purchase order management (supply chain) |
| `/price-lists` | Price Lists | Price list management with distributor pricing |
| `/goals` | Goals | Sales goals and commission calculator |
| `/goals-commissions` | Goals & Commissions | Advanced goal scenarios and commission tracking |
| `/reports` | Reports | Analytics dashboards and report generation |
| `/automations` | Automations | Workflow automation rules (triggers, conditions, actions) |
| `/gamification` | Gamification | Sales gamification features |
| `/inbox` | Inbox | Email integration (Office 365) |
| `/integrations` | Integrations | Third-party integrations, API keys, webhooks |
| `/settings` | Settings | System settings, user management, pipeline config |
| `/portal` | Client Portal | External-facing portal for clients to view proposals |
| `/proposals/[id]/editor` | Proposal Editor | Full-screen proposal creation wizard |

---

## 4. Module Specifications

### 4.1 Authentication & Login (`/login`)

**Purpose:** Authenticate users into the CRM.

**Features:**
- Email and password login via Supabase Auth
- Office 365 (Azure AD) OAuth login with Microsoft Graph API integration
- Session management with `@supabase/ssr`
- Middleware-based route protection (`src/middleware.ts`)
- Auto-redirect to `/dashboard` after successful login
- Auth callback handler at `/auth/callback`

**User Flow:**
1. User visits `/login`
2. Enters email/password OR clicks "Login with Office 365"
3. On success → redirected to `/dashboard`
4. On failure → error message displayed

---

### 4.2 Dashboard (`/dashboard`)

**Purpose:** Provide an executive overview of sales performance and pending activities.

**Features:**
- KPI cards: total pipeline value, deals won, conversion rate, revenue
- Sales funnel visualization (Recharts)
- Recent activities feed
- Deals by stage chart
- Performance comparison widgets
- Commission widget with privacy toggle (blur values)
- Responsive layout with animated cards (Framer Motion)

**Data Sources:** `DashboardService.ts`, `useDashboardMetrics.ts`

---

### 4.3 Pipeline / Deals (`/pipeline`)

**Purpose:** Visual Kanban board for managing the sales pipeline.

**Features:**
- **Kanban Board:** Drag-and-drop deal cards between stages using `@hello-pangea/dnd`
- **Deal Stages:** Configurable pipeline stages (e.g., Prospecção → Qualificação → Proposta → Negociação → Garantido → Ganho/Perdido)
- **Deal Card:** Shows title, company, value (BRL), probability, owner avatar, days in stage, health score, stagnation indicator
- **Deal Details Modal/Slide:** Full deal information with tabs
- **Deal Room:** Collaborative space per deal (`useDealRoom.ts`)
- **Quotes System:** Multiple quotes per deal with products (`DealQuote`)
- **Health Score:** Auto-calculated deal health with trend indicators (stable/improving/declining)
- **Risk Factors:** Automatic risk assessment
- **Filters:** By stage, owner, value range, date range, tags
- **Bulk actions:** Move, assign, delete multiple deals

**Deal Data Model:**
- `id`, `title`, `company`, `value`, `probability`, `stage`, `owner`
- `tags[]`, `description`, `days_in_stage`, `expected_close_date`
- `health_score`, `health_trend`, `risk_factors[]`
- `billing_type` (direct/indirect), `distributor_id`, `lead_source`
- `commission_deduction`, `is_new_client`, `custom_fields`
- Relations: `deal_products[]`, `deal_quotes[]`, `deal_activities[]`, `account`

**Deal Products:**
- Products with `quantity`, `unit_price`, `cost`, `margin`
- USD/BRL pricing with `exchange_rate`
- `billing_type` (direct/indirect), `distributor_id`
- `pricing_model` (one_time/monthly/annual)
- Technical details, categories, subcategories, manufacturer
- `is_optional`, `is_bid` flags
- Display configuration for proposals (`show_sku_on_proposal`, `display_name`, `custom_label`)

**Services:** `DealService.ts` (32KB — largest service, extensive CRUD + business logic)

---

### 4.4 Leads (`/leads`)

**Purpose:** Capture and qualify potential sales opportunities before they enter the pipeline.

**Features:**
- Lead listing with table view
- Lead creation form (company, contact info, address, CNPJ/IE)
- Lead status management: `Novo` → `Qualificado` → `Convertido` / `Perdido`
- Lead-to-Deal conversion flow
- Address fields: ZIP, street, number, complement, neighborhood, city, state
- Owner assignment

**Lead Data Model:**
- `company`, `contact_name`, `email`, `phone`
- `status`: Novo | Convertido | Qualificado | Perdido
- `interest`, `cnpj`, `ie`, address fields
- `owner`, `account_id`

**Services:** `LeadService.ts`

---

### 4.5 Accounts (`/accounts`)

**Purpose:** Manage B2B client companies (corporate accounts).

**Features:**
- Account listing with search and filters
- Account detail view with tabs (info, contacts, branches, assets, contracts, deals, documents)
- Multiple branches per account (`AccountBranch`) — each with own CNPJ, address, payment terms
- Multiple contacts per account (`AccountContact`) with primary flag
- Tags and relationship type classification
- Segment categorization
- Status: `Ativo` / `Inativo`
- Logo upload
- Payment terms configuration
- Document management per account (Contrato Social, Financeiro, Fiscal, Certificado, etc.)

**Account Data Model:**
- `name`, `cnpj`, `ie`, `segment`, `status`
- Full address fields
- `contacts[]`, `branches[]`, `tags[]`
- `relationship_type`, `logo_url`, `payment_terms`, `description`

**Services:** `AccountService.ts` (18KB)

---

### 4.6 Contacts (`/contacts`)

**Purpose:** Manage individual contact people associated with accounts.

**Features:**
- Contact listing with search
- Contact creation/editing form
- Link contacts to accounts
- Multiple phone types: `mobile_phone`, `landline_phone`
- LinkedIn profile URL
- Primary contact flag per account
- Signature parser modal (analyze business card/email signature images)

**Contact Data Model:**
- `name`, `email`, `mobile_phone`, `landline_phone`
- `role`, `linkedin`, `account_id`, `is_primary`

**Services:** `ContactService.ts`

---

### 4.7 Products (`/products`)

**Purpose:** Product catalog for sales quoting and proposal generation.

**Features:**
- Product listing with filtering by category, subcategory, brand
- Product CRUD with detailed form
- SKU management
- Category and subcategory classification
- Brand/manufacturer association
- Margin configuration
- Proposal display settings (`show_sku_on_proposal`)
- Product details drawer (slide panel)

**Product Data Model:**
- `name`, `category`, `subcategory`, `brand`, `icon`
- `description`, `sku`, `margin`
- `show_sku_on_proposal`

**Services:** `ProductService.ts`

---

### 4.8 Proposals (`/proposals`)

**Purpose:** Generate, manage, and send commercial proposals to clients.

**Features:**
- Proposal listing with status tracking
- **Full-screen Proposal Editor** (`/proposals/[id]/editor`): Multi-step wizard for creating proposals
- AI-powered proposal generation (Google Gemini integration via `@google/genai`)
- AI summary generation for proposals
- Proposal Intelligence (`useProposalIntelligence.ts`)
- Multi-format export:
  - **PDF** generation (`useProposalPdf.ts`, `jspdf`)
  - **DOCX** generation (`useProposalDocx.ts`, `docx` library)
  - **PPTX** generation (`useProposalPpt.ts`, `pptxgenjs`)
- Proposal versioning (multiple versions per proposal)
- Digital signature support (`public_token`, `allow_signature`, `signature_required`)
- Proposal status workflow: `draft` → `sent` → `viewed` → `signed` / `rejected`
- Client portal for external viewing (`/portal`)
- Product line items with subtotal, discount, tax, total calculations
- Terms and conditions configuration
- Logo and branding options
- Validity period (`validUntil`)

**Proposal Data Model:**
- `title`, `status`, `number`, `template`, `version`
- `deal_id`, `account_id`, `lead_id`, `customer_id`
- `content` (JSON with AI summary, config, etc.)
- Financial: `subtotal`, `discount`, `discountPercentage`, `tax`, `taxPercentage`, `total`
- `products[]`, `sections[]`, `versions[]`
- Signature: `public_token`, `allow_signature`, `signature_required`
- Display: `includeTerms`, `includeLogo`, `includeSignature`, `terms`

**Services:** `ProposalService.ts`, 5 hooks for proposal workflows

---

### 4.9 Contracts (`/contracts`)

**Purpose:** Manage sales contracts with digital signature capabilities.

**Features:**
- Contract listing with status filters
- Contract viewer with document preview
- Contract types: `service`, `nda`, `sales`
- Status workflow: `draft` → `sent` → `viewed` → `signed` / `declined`
- Digital signature with React Signature Canvas
- Link contracts to deals and proposals
- Contract content stored as JSON (`content_json`)

**Contract Data Model:**
- `title`, `company`, `value`, `status`, `type`
- `signerName`, `signerRole`
- `dealId`, `proposalId`
- `content_json`, `signature_image`

**Services:** `ContractService.ts`

---

### 4.10 Activities (`/activities`)

**Purpose:** Track tasks, meetings, calls, emails, and notes related to deals and customers.

**Features:**
- Activity listing with filters (type, status, priority, assignee, date range)
- Calendar view for scheduling
- Activity types: `task`, `meeting`, `call`, `email`, `note`
- Priority levels: `low`, `medium`, `high`, `urgent`
- Status tracking: `pending`, `in_progress`, `completed`, `cancelled`
- Reminders (minutes before due)
- Meeting details: location, attendees, duration
- Activity outcomes and next steps
- Source tracking: `manual`, `automation`, `ai_suggestion`
- AI-powered activity suggestions (`ActivityAiService.ts`)
- Activity statistics dashboard (total, pending, completed, overdue, today, this week)
- Link activities to deals and customers

**Activity Data Model:**
- `type`, `title`, `description`, `status`, `priority`
- `dealId`, `customerId`, `assignedTo`
- `dueDate`, `dueTime`, `completedAt`
- `reminder`, `location`, `attendees[]`, `duration`
- `outcome`, `nextSteps`, `source`

**Services:** `ActivityService.ts`, `ActivityAiService.ts`

---

### 4.11 Sales & Sales Orders (`/sales`, `/sales-orders`)

**Purpose:** Track completed sales, manage sales orders, and post-sales operations.

**Features:**
- Sales tracking and revenue monitoring
- Sales order creation and management
- Order fulfillment workflow
- Post-sales service contracts
- Customer asset management

**Post-Sales Data Models:**

**ServiceContract:**
- `account_id`, `deal_id`, `title`
- Types: `support`, `warranty_extension`, `subscription`
- `start_date`, `end_date`, `monthly_value`, `coverage_details`
- Status: `active`, `expired`, `pending_renewal`, `canceled`

**CustomerAsset:**
- `account_id`, `service_contract_id`
- Types: `hardware`, `software_license`, `cloud_subscription`
- `manufacturer`, `name_model`, `serial_number_or_key`
- `purchase_date`, `warranty_expires_at`
- Status: `active`, `in_maintenance`, `retired`

**Services:** `SalesService.ts`, `ServiceContractService.ts`, `AssetService.ts`

---

### 4.12 Purchases (`/purchases`)

**Purpose:** Manage purchase orders from distributors (supply chain).

**Features:**
- Purchase order creation and tracking
- Distributor connection and management
- Order status tracking

**Services:** `DistributorOrderService.ts`, `distributorConnect.ts`

---

### 4.13 Price Lists (`/price-lists`)

**Purpose:** Manage pricing tables with distributor-specific pricing.

**Features:**
- Price list CRUD
- Distributor-specific pricing
- Currency support (USD/BRL with exchange rates)
- Excel import/export (`exceljs`, `xlsx`)

**Hooks:** `usePriceLists.ts`

---

### 4.14 Goals & Commissions (`/goals`, `/goals-commissions`)

**Purpose:** Set sales targets and calculate commissions.

**Features:**
- Yearly and monthly sales goals per user
- Quarterly goal breakdowns (Q1–Q4)
- Commission rules by product category:
  - Hardware: base rate + new client rate
  - Software: base rate + new client rate
  - Services: base rate + new client rate
- Goal scenarios with financial modeling:
  - Fixed costs, variable costs, desired margin
  - Headcount and staff roles with salaries
  - Revenue goal calculation modes: `revenue`, `profit_absolute`, `profit_percent`
  - Quarterly distribution percentages
  - Seller weight distribution
  - Payroll tax consideration
- Campaign-based commissions (time-limited bonus percentages)
- Commission privacy toggle (blur/show values)

**Data Models:** `UserGoalData`, `CommissionRules`, `Scenario`, `Campaign`

---

### 4.15 Reports (`/reports`)

**Purpose:** Analytics and business intelligence dashboards.

**Features:**
- Sales performance reports
- Pipeline analytics
- Revenue forecasting
- Team performance comparison
- Custom date range filtering
- Chart visualizations (Recharts)
- Report export capabilities

**Hooks:** `useReports.ts`

---

### 4.16 Automations (`/automations`)

**Purpose:** Configure workflow automation rules to reduce manual tasks.

**Features:**
- Automation rule builder with trigger → condition → action pattern
- **Triggers:** `deal_moved`, `deal_created`, `activity_created`, `proposal_sent`, `time_based`, `field_updated`, `deal_stagnant`, `proposal_not_viewed`, `deal_value_zero`, `deal_no_products`
- **Conditions:** Field-based filters with operators (equals, not_equals, contains, greater_than, less_than, is_empty, etc.) with AND/OR logic
- **Actions:** `create_task`, `send_email`, `send_notification`, `update_field`, `create_activity`, `move_deal`, `assign_to`
- Action delay configuration (minutes)
- Categories: followup, alert, welcome, reminder, escalation, celebration, custom
- Email templates for automated emails (welcome, followup, proposal, thank_you, reengagement, reminder)
- Execution tracking: count, success rate, last run
- Enable/disable toggle per automation

**Services:** `AutomationService.ts`

---

### 4.17 Inbox / Email (`/inbox`)

**Purpose:** Integrated email functionality via Office 365 / Microsoft Graph API.

**Features:**
- Read emails from connected Office 365 account
- Send emails directly from CRM
- Email threading and conversation view
- Link emails to deals and contacts

**Components:** `src/components/email/`

---

### 4.18 Integrations (`/integrations`)

**Purpose:** Manage third-party connections, API keys, and webhooks.

**Features:**
- Integration management (IBM Cloud, Lenovo, WhatsApp, Slack, Google, etc.)
- Integration status: connected, disconnected, error
- Last sync timestamp
- **API Keys:** Generate and manage API keys with token prefixes, revocation
- **Webhooks:** Configure webhook URLs with event subscriptions, status tracking (active/inactive/failed)
- Audit logs (`useAuditLogs.ts`)

**Data Models:** `Integration`, `ApiKey`, `Webhook`

---

### 4.19 Settings (`/settings`)

**Purpose:** System configuration and administration.

**Features:**
- User management (create, edit, deactivate users)
- Role assignment (admin, manager, vendedor, support)
- Pipeline stage configuration
- Organization settings
- Profile management

**Services:** `SettingsService.ts`, `UserService.ts`

---

### 4.20 Client Portal (`/portal`)

**Purpose:** External-facing portal for clients to view and sign proposals.

**Features:**
- Public proposal viewing via unique token (`public_token`)
- Digital signature capture (React Signature Canvas)
- Proposal acceptance/rejection workflow
- No authentication required (token-based access)

---

### 4.21 Gamification (`/gamification`)

**Purpose:** Sales team gamification to boost engagement.

**Features:**
- Leaderboards and rankings
- Achievement badges
- Performance challenges

---

### 4.22 Documents System

**Purpose:** File management attached to deals, accounts, and contacts.

**Features:**
- File upload to Supabase Storage
- Document categorization per entity type:
  - **Deal documents:** Configuração, Preços Aprovados, Proposta, Espelho de NF, Pedido, Contrato, Ata, Nota Fiscal, Técnico, Outro
  - **Account documents:** Contrato Social, Financeiro/DRE, Fiscal/CNPJ, Certificado, Contrato, Nota Fiscal, Outro
- Document versioning (`version`, `parent_id`)
- Quote-specific documents (`quote_id`)
- File metadata: name, description, file_path, file_type, file_size

**Services:** `DocumentService.ts`

---

### 4.23 Handover System

**Purpose:** Manage deal handover between sales reps.

**Features:**
- Handover initiation and approval workflow
- Ownership transfer of deals

**Services:** `HandoverService.ts`, `useHandover.ts`

---

## 5. Cross-Cutting Concerns

### 5.1 AI Integration
- **Google Gemini** (`@google/genai`, `@google/generative-ai`) for:
  - Proposal content generation
  - Activity suggestions
  - Proposal intelligence/analysis
  - AI summaries

### 5.2 Design System
- **Tailwind CSS v4** with OKLCH color system
- **Radix UI** primitives (Dialog, Dropdown, Select, Tabs, Tooltip, Checkbox, Switch, etc.)
- **shadcn/ui** components (configured via `components.json`)
- **Framer Motion** animations (layout transitions, spring physics, AnimatePresence)
- **Glassmorphism** effects (backdrop-blur)
- **Dark/Light mode** via `next-themes`
- **Geist** font family
- **Lucide React** icon library
- **Sonner** for toast notifications

### 5.3 State Management
- **TanStack React Query** for server state (data fetching, caching, mutations)
- **Zustand** for client state
- Custom hooks pattern for all data operations

### 5.4 Data Export
- **Excel** export via `exceljs` and `xlsx`
- **PDF** generation via `jspdf` and `@react-pdf/renderer`
- **DOCX** generation via `docx`
- **PPTX** generation via `pptxgenjs`
- **Screenshot** capture via `modern-screenshot`

### 5.5 Multi-currency Support
- BRL (Brazilian Real) as primary currency
- USD support with configurable exchange rates
- Per-product currency configuration

### 5.6 Brazilian Business Fields
- CNPJ (company tax ID)
- IE (state registration)
- Brazilian address format (CEP, bairro, complemento)
- Nota Fiscal (invoice) document types

---

## 6. API Routes

The application uses Next.js API routes under `/api/` and Supabase server actions under `/actions/` for backend operations. All data operations go through Supabase client SDK.

---

## 7. Database

**Provider:** Supabase (PostgreSQL)
**ORM:** Supabase JS Client (direct queries, no ORM)
**Storage:** Supabase Storage (for documents and files)
**Auth:** Supabase Auth (email/password + OAuth)
**Real-time:** Supabase Realtime subscriptions (for deal room, notifications)

All tables are scoped by `organization_id` for multi-tenancy.

---

## 8. Key User Flows

### 8.1 Lead-to-Deal Conversion
1. Create lead → 2. Qualify lead → 3. Convert to deal (creates deal + account) → 4. Deal enters pipeline

### 8.2 Deal-to-Proposal-to-Contract
1. Create/manage deal in pipeline → 2. Add products to deal → 3. Generate proposal (AI-assisted) → 4. Send proposal to client → 5. Client views/signs proposal → 6. Generate contract → 7. Client signs contract

### 8.3 Goal & Commission Tracking
1. Admin sets yearly/quarterly goals per seller → 2. Commission rules defined by product category → 3. System tracks deals won → 4. Commission calculated automatically → 5. Dashboard shows progress vs. goal

### 8.4 Automation Workflow
1. Admin creates automation rule → 2. Defines trigger (e.g., deal moved to stage) → 3. Sets conditions (e.g., value > X) → 4. Configures actions (e.g., create follow-up task) → 5. System executes automatically when conditions met
