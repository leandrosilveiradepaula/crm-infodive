-- CRM Infodive #214 B4: synthetic-only QA fixtures
-- TARGET: lwpjiufsetnpjuoyline (never original/prod).
-- Demo names and .invalid addresses are intentionally fictitious.
-- Seed only after QA identity and commercial bootstrap. No auth.users insert.
BEGIN;
SET LOCAL statement_timeout='45s';
DO $qa_seed$
DECLARE
  org1 uuid;
  org2 uuid;
  account1 uuid;
  account2 uuid;
  accountOther uuid;
  product1 uuid;
  product2 uuid;
  deal1 uuid;
  deal2 uuid;
  dealOther uuid;
  proposal1 uuid;
  sales1 uuid;
  service1 uuid;
BEGIN
  IF to_regclass('crm_qa_internal.tenant_fixture') IS NULL
     OR to_regclass('public.profiles') IS NULL
     OR to_regclass('public.deals') IS NULL
     OR EXISTS (SELECT 1 FROM auth.users)
     OR EXISTS (SELECT 1 FROM public.accounts)
  THEN RAISE EXCEPTION 'QA synthetic seed denied: baseline absent, users present or fixtures already loaded';
  END IF;
  SELECT id INTO STRICT org1
    FROM crm_qa_internal.tenant_fixture WHERE label='CRM Infodive QA / fictitious-only';
  INSERT INTO crm_qa_internal.tenant_fixture(label)
    VALUES ('CRM QA isolation control / fictitious-only') RETURNING id INTO org2;

  INSERT INTO public.accounts(organization_id,name,segment,status,relationship_type,city,state)
    VALUES (org1,'Empresa Exemplo Aurora','Tecnologia','Ativo','Cliente','Cidade Fictícia','RS')
    RETURNING id INTO account1;
  INSERT INTO public.accounts(organization_id,name,segment,status,relationship_type,city,state)
    VALUES (org1,'Empresa Exemplo Horizonte','Serviços','Ativo','Cliente','Cidade Exemplo','SC')
    RETURNING id INTO account2;
  INSERT INTO public.accounts(organization_id,name,segment,status,relationship_type)
    VALUES (org2,'Empresa Controle de Isolamento','Testes','Ativo','Cliente')
    RETURNING id INTO accountOther;

  INSERT INTO public.account_contacts(organization_id,account_id,name,email,role,is_primary)
    VALUES (org1,account1,'Contato Fictício Aurora','aurora@example.invalid','Compras',true),
           (org1,account2,'Contato Fictício Horizonte','horizonte@example.invalid','Tecnologia',true),
           (org2,accountOther,'Contato Fictício Controle','controle@example.invalid','Teste',true);

  INSERT INTO public.products(organization_id,name,category,brand,sku,price)
    VALUES (org1,'Servidor Demonstrativo','Hardware','Marca Fictícia','QA-SRV-001',7500)
    RETURNING id INTO product1;
  INSERT INTO public.products(organization_id,name,category,brand,sku,price)
    VALUES (org1,'Licença Demonstrativa','Software','Marca Fictícia','QA-SW-002',1200)
    RETURNING id INTO product2;
  INSERT INTO public.products(organization_id,name,category,sku,price)
    VALUES (org2,'Produto Isolado','Serviços','QA-ISOLATED-003',300);

  INSERT INTO public.deals(organization_id,account_id,title,company,stage,value,probability,expected_close_date)
    VALUES (org1,account1,'Oportunidade Fictícia Servidores','Empresa Exemplo Aurora','Proposta',15000,65,current_date+21)
    RETURNING id INTO deal1;
  INSERT INTO public.deals(organization_id,account_id,title,company,stage,value,probability,expected_close_date)
    VALUES (org1,account2,'Oportunidade Fictícia Licenças','Empresa Exemplo Horizonte','Qualificação',3600,30,current_date+35)
    RETURNING id INTO deal2;
  INSERT INTO public.deals(organization_id,account_id,title,company,stage,value,probability,expected_close_date)
    VALUES (org2,accountOther,'Oportunidade Controle Isolamento','Empresa Controle de Isolamento','Lead',500,5,current_date+60)
    RETURNING id INTO dealOther;

  INSERT INTO public.deal_products(organization_id,deal_id,product_id,name,price,quantity,category)
    VALUES (org1,deal1,product1,'Servidor Demonstrativo',7500,2,'Hardware'),
           (org1,deal2,product2,'Licença Demonstrativa',1200,3,'Software');

  INSERT INTO public.deal_activities(organization_id,deal_id,type,description,user_name)
    VALUES (org1,deal1,'note','Atividade fictícia para QA','QA');
  INSERT INTO public.activities(organization_id,title,description,type,status,priority,"dueDate",account_id,deal_id)
    VALUES (org1,'Reunião de demonstração','Agenda fictícia','meeting','pending','medium',current_date+7,account1,deal1),
           (org1,'Enviar material demonstrativo','Tarefa fictícia','task','pending','low',current_date+10,account2,deal2);

  INSERT INTO public.leads(organization_id,name,email,company,status,source)
    VALUES (org1,'Lead Fictício A','lead-a@example.invalid','Empresa Prospecto Fictícia','Novo','QA'),
           (org1,'Lead Fictício B','lead-b@example.invalid','Empresa Teste Fictícia','Em contato','QA'),
           (org2,'Lead Controle Segregação','segregacao@example.invalid','Empresa Isolada','Novo','QA');

  INSERT INTO public.pipeline_stages(organization_id,name,color,order_index)
    VALUES (org1,'Lead','#3b82f6',0),(org1,'Qualificação','#eab308',1),
           (org1,'Proposta','#8b5cf6',2),(org1,'Negociação','#f97316',3),
           (org1,'Fechado Ganho','#10b981',4),
           (org2,'Lead','#3b82f6',0);
  INSERT INTO public.app_settings(organization_id,key,value)
    VALUES (org1,'organization','{"name":"Empresa QA Fictícia","support_email":"qa@example.invalid"}'::jsonb),
           (org2,'organization','{"name":"Empresa Controle QA","support_email":"controle@example.invalid"}'::jsonb);

  INSERT INTO public.proposals(organization_id,deal_id,title,customer_name,status,total,content)
    VALUES (org1,deal1,'Proposta Fictícia Aurora','Empresa Exemplo Aurora','draft',15000,'{"note":"FICTITIOUS QA ONLY"}'::jsonb)
    RETURNING id INTO proposal1;
  INSERT INTO public.contracts(organization_id,deal_id,proposal_id,title,company_name,value,status)
    VALUES (org1,deal1,proposal1,'Contrato Fictício de Demonstração','Empresa Exemplo Aurora',15000,'draft');

  INSERT INTO public.sales_orders(organization_id,deal_id,status,total_value)
    VALUES (org1,deal1,'pending',15000) RETURNING id INTO sales1;
  INSERT INTO public.sales_order_items(organization_id,sales_order_id,product_name,product_sku,quantity,unit_price)
    VALUES (org1,sales1,'Servidor Demonstrativo','QA-SRV-001',2,7500);
  INSERT INTO public.sales_order_installments(organization_id,sales_order_id,amount,due_date)
    VALUES (org1,sales1,15000,current_date+30);

  INSERT INTO public.service_contracts(organization_id,account_id,deal_id,title,status)
    VALUES (org1,account1,deal1,'Suporte Fictício QA','active') RETURNING id INTO service1;
  INSERT INTO public.customer_assets(organization_id,account_id,service_contract_id,manufacturer,name_model)
    VALUES (org1,account1,service1,'Marca Fictícia','Servidor Demonstrativo');
  INSERT INTO public.automations(organization_id,name,description,status,is_active)
    VALUES (org1,'Fluxo Inativo de Demonstração','Não executar; fixture QA','draft',false);
  INSERT INTO public.email_templates(organization_id,name,subject,body)
    VALUES (org1,'Modelo de Teste','Mensagem fictícia','Sem envio: QA');
  INSERT INTO public.integrations(organization_id,name,provider,status)
    VALUES (org1,'Conector Não Configurado','demo','disconnected');
  INSERT INTO public.scenarios(organization_id,name,year,revenue_goal)
    VALUES (org1,'Cenário Fictício',extract(year from current_date)::int,100000);
  INSERT INTO public.campaigns(organization_id,name,status,start_date,end_date)
    VALUES (org1,'Campanha Fictícia','draft',current_date,current_date+60);
END;
$qa_seed$;
COMMIT;