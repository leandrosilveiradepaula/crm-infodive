// End-to-end product readiness; no mocks and no hosted services.
// Setup writes are explicitly labelled fixtures. Mutation proof must come
// through the actual Next.js UI/API and independent database readback.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, statSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const env = process.env;
if (env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321' ||
    env.CRM_E2E_BASE_URL !== 'http://127.0.0.1:3000' ||
    env.CRM_E2E_TEST_TARGET !== 'isolated' || env.CRM_E2E_BACKEND_ISOLATED !== 'true' ||
    env.CRM_E2E_ENFORCE_PASS !== 'true' || !env.CRM_E2E_ACCOUNTS_FILE ||
    !env.SUPABASE_SERVICE_ROLE_KEY || !env.CRM_E2E_ARTIFACT_DIR ||
    (statSync(env.CRM_E2E_ACCOUNTS_FILE).mode & 0o077) !== 0) {
    throw new Error('PRODUCT_QA_UNSAFE_TARGET');
}
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const accounts = JSON.parse(readFileSync(env.CRM_E2E_ACCOUNTS_FILE, 'utf8'));
const findAccount = email => accounts.find(a => a.email === email);
const adminAccount = findAccount('qa-admin@example.invalid');
const isolatedAccount = findAccount('qa-isolation@example.invalid');
if (accounts.length !== 4 || !adminAccount || !isolatedAccount) throw Error('PRODUCT_QA_AUTH_FIXTURES');
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const require = createRequire(import.meta.url);
const axe = readFileSync(env.CRM_QA_AXE_MIN_PATH || require.resolve('axe-core/axe.min.js'), 'utf8');
const { chromium } = await import(env.PLAYWRIGHT_CORE_PATH || 'playwright-core');
const browser = await chromium.launch({ headless: true, ...(env.CHROME_PATH ? { executablePath: env.CHROME_PATH } : {}) });
const evidence = resolve(env.CRM_E2E_ARTIFACT_DIR, 'product-readiness');
await mkdir(evidence, { recursive: true });
const result = { candidateSha: sha, target: 'local-isolated', checks: [], failures: [],
    fixtureMode: 'QA schema plus exact checked-in RPCs; not full migration replay',
    untested: ['production deployment', 'external services', 'signature execution', 'full migration replay', 'all create/update/delete permutations'] };
const suffix = randomBytes(3).toString('hex');
const companyName = 'Empresa Jornada ' + suffix;
const contactName = 'Contato Jornada ' + suffix;
const leadCompany = 'Prospect Jornada ' + suffix;
const dealName = 'Oportunidade Jornada ' + suffix;
const activityName = 'Atividade Jornada ' + suffix;
const draftTitle = 'Proposta Jornada ' + suffix;
const publicTitle = 'Proposta Pública Fictícia';
const base = env.CRM_E2E_BASE_URL;
const devices = [{ name:'desktop',width:1440,height:960 }, {name:'tablet',width:768,height:1024}, {name:'mobile',width:390,height:844}];
const token = () => randomBytes(16).toString('hex');
function check(ok, code) { if (!ok) throw new Error('PRODUCT_QA_' + code); }
function read(response, code) { check(!response.error, code); return response.data; }
async function one(query, code) { const data = read(await query.maybeSingle(), code); check(data, code); return data; }
async function persisted(makeQuery, code) {
    for (let i=0; i<25; i++) {
        const response = await makeQuery().maybeSingle();
        check(!response.error, code + '_QUERY');
        if (response.data) return response.data;
        await new Promise(resolve => setTimeout(resolve, 400));
    }
    throw Error('PRODUCT_QA_' + code + '_NOT_PERSISTED');
}
async function scenario(name, fn) {
    try {
        const details = await fn();
        result.checks.push({ name, status:'passed', ...(details || {}) });
        console.log('CRM_PRODUCT_QA_PASS=' + name);
    } catch (error) {
        const code = error instanceof Error ? error.message.match(/^PRODUCT_QA_[A-Z0-9_]+/)?.[0] : null;
        const failure = { name, status:'failed', code: code || (error?.name === 'TimeoutError' ? 'TIMEOUT' : 'ASSERTION_OR_RUNTIME') };
        result.failures.push(failure); result.checks.push(failure);
        console.error('CRM_PRODUCT_QA_FAIL=' + JSON.stringify(failure));
    } finally {
        await writeFile(resolve(evidence,'results.json'), JSON.stringify(result,null,2) + '\n');
    }
}
async function go(page, path) {
    const response = await page.goto(base + path, { waitUntil:'networkidle' });
    check(response && response.ok(), 'PAGE_HTTP');
    check(new URL(page.url()).origin === base && !new URL(page.url()).pathname.startsWith('/login'), 'UNEXPECTED_LOGIN');
}
async function login(page, account) {
    await page.goto(base + '/login', { waitUntil:'networkidle' });
    await page.locator('input[name="email"]').fill(account.email);
    await page.locator('input[name="password"]').fill(account.password);
    await page.getByRole('button', { name:'Entrar no Sistema' }).click();
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout:20000 });
}
async function capture(page,name) {
    // Never capture the login form, credentials or live data.
    check(!new URL(page.url()).pathname.startsWith('/login'), 'CAPTURE_LOGIN');
    await page.screenshot({ path:resolve(evidence,name+'.png'), fullPage:true });
}
async function audit(page,name) {
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await capture(page,name);
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    check(fits,'DOCUMENT_OVERFLOW');
    if (!(await page.evaluate(() => Boolean(window.axe)))) await page.addScriptTag({content:axe});
    const report = await page.evaluate(async () => {
        window.axe.reset();
        const a = await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa']}});
        // Record only bounded, synthetic-safe diagnostics, never text, HTML,
        // raw selectors, credentials, tokens, or user records.
        const color = value => typeof value === 'string' &&
            /^(?:#[0-9a-f]{3,8}|(?:rgb|rgba|hsl|hsla|lab|lch|oklab|oklch)\([0-9 .,%/+-]+\))$/i.test(value)
            ? value : null;
        const summarize = rule => ({rule:rule.id,count:rule.nodes.length,samples:rule.nodes.slice(0,6).map(node=>{
            let el = null;
            try { if(typeof node.target[0] === 'string') el=document.querySelector(node.target[0]); } catch {}
            if(!el) return {resolved:false};
            const style=getComputedStyle(el), bounds=el.getBoundingClientRect();
            const region = el.closest('[data-slot="proposal-editor"],[data-slot="public-proposal"],[data-slot="customer-portal"]')?.getAttribute('data-slot') || 'other';
            const checks=[...node.any,...node.all,...node.none].filter(c=>c.data && typeof c.data==='object');
            return {resolved:true,region,tag:el.tagName.toLowerCase(),bounds:[bounds.x,bounds.y,bounds.width,bounds.height].map(Math.round),
                foreground:color(style.color),background:color(style.backgroundColor),opacity:Number(style.opacity),
                contrast:checks.slice(0,4).map(c=>({fg:color(c.data.fgColor),bg:color(c.data.bgColor),ratio:Number.isFinite(c.data.contrastRatio)?c.data.contrastRatio:null}))};
        })});
        return { violations:a.violations.map(summarize), incomplete:a.incomplete.map(summarize) };
    });
    if (report.violations.length || report.incomplete.length) {
        result.failures.push({name,kind:'axe',...report});
        console.error('CRM_PRODUCT_QA_AXE_DETAIL='+JSON.stringify({name,...report}));
        throw new Error('PRODUCT_QA_AXE_FINDINGS');
    }
}
async function assertEditorPrimaryButton(page) {
    const button = page.getByRole('button', { name: 'Gerar PDF', exact: true });
    await button.waitFor({ state: 'visible' });
    check(await button.isEnabled(), 'EDITOR_PRIMARY_DISABLED');
    await page.mouse.move(1, 1);
    // Wait for any hover/colour transition before comparing computed styles.
    await page.waitForTimeout(250);
    const proof = await button.evaluate(element => {
        const probe = document.createElement('span');
        probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;color:var(--primary-foreground);background-color:var(--primary)';
        element.appendChild(probe);
        try {
            const actual = getComputedStyle(element);
            const expected = getComputedStyle(probe);
            return {
                variant: element.getAttribute('data-variant') === 'default',
                foregroundMatches: actual.color === expected.color,
                backgroundMatches: actual.backgroundColor === expected.backgroundColor
            };
        } finally {
            probe.remove();
        }
    });
    check(proof.variant && proof.foregroundMatches && proof.backgroundMatches, 'EDITOR_PRIMARY_TOKEN_PAIR');
    return proof;
}
async function theme(page, wanted, authenticated) {
    if (authenticated) {
        if (await page.locator('html').evaluate(n=>n.classList.contains('dark')) !== (wanted==='dark'))
            await page.getByTitle('Alternar Tema').click();
        await page.waitForFunction(dark=>document.documentElement.classList.contains('dark')===dark,wanted==='dark');
    } else {
        // Public routes have no theme switch. This is a visual-only CSS
        // exercise, not a persisted preference or an authentication bypass.
        await page.locator('html').evaluate((n,dark)=>n.classList.toggle('dark',dark),wanted==='dark');
    }
    await page.waitForTimeout(900);
}
const contexts = [];
async function newPage() {
    const ctx = await browser.newContext({viewport:{width:1440,height:960}});
    contexts.push(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    page.on('dialog', d => d.dismiss());
    // The isolated test must not call external AI, mail, CRM or other services.
    await ctx.route('**/*', route => {
        const url = new URL(route.request().url());
        return ['http:','https:'].includes(url.protocol) &&
            !['http://127.0.0.1:3000','http://127.0.0.1:54321'].includes(url.origin)
            ? route.abort() : route.continue();
    });
    return page;
}
let page, external, other, org, otherOrg, seedDeal, foreignDeal, company, contact, createdDeal, activity, draft, room, emptyRoom, inactiveRoom, sentProposal, originalDraft, order;
try {
    await scenario('synthetic-fixture-boundaries', async () => {
        const admin = await one(db.from('profiles').select('id,organization_id').eq('email',adminAccount.email),'ADMIN');
        const isolated = await one(db.from('profiles').select('id,organization_id').eq('email',isolatedAccount.email),'ISOLATED');
        org=admin.organization_id; otherOrg=isolated.organization_id;
        check(org!==otherOrg,'TENANTS_NOT_ISOLATED');
        seedDeal=await one(db.from('deals').select('*').eq('organization_id',org).eq('title','Oportunidade Fictícia Servidores'),'SEED_DEAL');
        foreignDeal=await one(db.from('deals').select('id,title').eq('organization_id',otherOrg).eq('title','Oportunidade Controle Isolamento'),'FOREIGN_DEAL');
        originalDraft=await one(db.from('proposals').select('id,public_token,status').eq('deal_id',seedDeal.id).eq('organization_id',org).eq('status','draft'),'ORIGINAL_DRAFT');
        check(originalDraft.public_token && originalDraft.status==='draft','DRAFT_TOKEN');
        const products=read(await db.from('deal_products').select('*').eq('deal_id',seedDeal.id).eq('organization_id',org),'PRODUCTS');
        check(products.length>0,'PRODUCT_FIXTURES_EMPTY');
        for(const p of products) read(await db.from('deal_products').update({unit_price:p.price}).eq('id',p.id).eq('organization_id',org),'FIXTURE_UNIT_PRICE');
        const price=products.reduce((sum,p)=>sum+Number(p.price)*Number(p.quantity),0);
        const emptyDeal=read(await db.from('deals').insert({organization_id:org,title:'Oportunidade Fictícia Sem Itens',company:'Cliente Fictício Sem Itens',stage:'qualification',value:0}).select('id').single(),'EMPTY_DEAL');
        const createRoom=async (id,active)=>read(await db.from('deal_rooms').insert({organization_id:org,deal_id:id,access_token:token(),is_active:active}).select('id,access_token').single(),'ROOM');
        room=await createRoom(seedDeal.id,true); emptyRoom=await createRoom(emptyDeal.id,true); inactiveRoom=await createRoom(seedDeal.id,false);
        sentProposal=read(await db.from('proposals').insert({
            organization_id:org,deal_id:seedDeal.id,title:publicTitle,number:'QA-PUBLIC',status:'sent',
            public_token:token(),allow_signature:false,version:1,total:price,subtotal:price,discount:0,
            company_name:seedDeal.company,products_json:products.map(p=>({...p,unit_price:p.price})),
            content_json:{activeSections:['cover','custom_notes'],config:{template:'executivo'},editableTexts:{proposalTitle:publicTitle,customNotesTitle:'Notas QA',customNotesContent:'Conteúdo público fictício'}}
        }).select('id,public_token').single(),'SENT_PROPOSAL');
        order=await one(db.from('sales_orders').select('id,total_value').eq('organization_id',org).eq('deal_id',seedDeal.id),'ORDER');
        read(await db.from('sales_orders').update({status:'nf_emitida',billed_at:new Date().toISOString()}).eq('id',order.id).eq('organization_id',org),'ORDER_FIXTURE');
        return { tenants:2,publicFixtures:4,realRpcDefinitions:3,fixturePrice:price };
    });
    await scenario('authenticate-administrator',async()=>{ page=await newPage(); await login(page,adminAccount); });
    await scenario('create-company-through-form',async()=>{
        check(page&&org,'DEPENDENCY');
        await go(page,'/customers');
        await page.getByRole('button',{name:'Novo Cadastro',exact:true}).click();
        const modal=page.getByRole('dialog').last();
        await modal.getByPlaceholder('Ex: Minha Empresa Ltda').fill(companyName);
        await modal.getByRole('button',{name:'Cadastrar Empresa'}).click();
        company=await persisted(()=>db.from('accounts').select('id,name').eq('organization_id',org).ilike('name',companyName),'COMPANY');
        await go(page,'/customers'); await page.getByText(company.name,{exact:true}).first().waitFor({state:'visible'});
        await capture(page,'journey-company');
    });
    await scenario('create-contact-linked-to-company',async()=>{
        check(company,'DEPENDENCY');
        await go(page,'/contacts');
        await page.getByRole('button',{name:'Novo Contato',exact:true}).click();
        const modal=page.getByRole('dialog').last();
        await modal.getByRole('combobox',{name:'Empresa'}).click();
        await page.getByRole('option',{name:company.name,exact:true}).click();
        await modal.getByRole('textbox',{name:/Nome Completo/}).fill(contactName);
        await modal.getByRole('textbox',{name:/Email/}).fill('journey-'+suffix+'@example.invalid');
        await modal.getByRole('button',{name:'Cadastrar Contato'}).click();
        contact=await persisted(()=>db.from('account_contacts').select('id,account_id,name').eq('organization_id',org).eq('email','journey-'+suffix+'@example.invalid'),'CONTACT');
        check(contact.account_id===company.id,'CONTACT_WRONG_COMPANY');
        await go(page,'/contacts'); await page.getByText(contact.name,{exact:true}).first().waitFor({state:'visible'});
        await capture(page,'journey-contact');
    });
    await scenario('create-lead-through-form',async()=>{
        check(page&&org,'DEPENDENCY');
        await go(page,'/leads');
        await page.getByRole('button',{name:'Novo Lead',exact:true}).click();
        const modal=page.getByRole('dialog').last();
        await modal.getByPlaceholder('Nome da empresa').fill(leadCompany);
        await modal.getByPlaceholder('Nome completo').fill('Pessoa Fictícia');
        await modal.getByPlaceholder('email@empresa.com').fill('lead-'+suffix+'@example.invalid');
        await modal.getByRole('button',{name:'Cadastrar Lead'}).click();
        const lead=await persisted(()=>db.from('leads').select('id,company,status').eq('organization_id',org).eq('email','lead-'+suffix+'@example.invalid'),'LEAD');
        check(lead.status==='Novo','LEAD_STATUS');
        await go(page,'/leads'); await page.getByText(lead.company,{exact:true}).first().waitFor({state:'visible'});
        await capture(page,'journey-lead');
    });
    await scenario('create-opportunity-linked-to-company',async()=>{
        check(company,'DEPENDENCY');
        await go(page,'/pipeline');
        await page.getByRole('button',{name:'Nova Oportunidade',exact:true}).click();
        const modal=page.getByRole('dialog').last();
        await modal.getByPlaceholder('Ex: Renovação Datacenter').fill(dealName);
        await modal.getByRole('combobox').first().click();
        await page.getByRole('option',{name:company.name,exact:true}).click();
        const closeDate = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        await modal.locator('#value').fill('1500000');
        await modal.locator('#expected_close_date').fill(closeDate);
        check(await modal.locator('form').evaluate(form => form.checkValidity()),'DEAL_FORM_INVALID');
        await modal.getByRole('button',{name:'Criar Nova Oportunidade'}).click();
        createdDeal=await persisted(()=>db.from('deals').select('id,title,account_id,stage,value,expected_close_date').eq('organization_id',org).ilike('title',dealName),'DEAL');
        check(createdDeal.account_id===company.id,'DEAL_WRONG_COMPANY');
        check(Number(createdDeal.value)===15000 && String(createdDeal.expected_close_date).slice(0,10)===closeDate,'DEAL_FORM_VALUES');
        await go(page,'/pipeline'); await page.getByText(createdDeal.title,{exact:true}).first().waitFor({state:'visible'});
        await capture(page,'journey-opportunity');
    });
    await scenario('create-activity-linked-to-opportunity',async()=>{
        check(company&&createdDeal,'DEPENDENCY');
        await go(page,'/activities');
        await page.getByRole('button',{name:'Nova Atividade',exact:true}).click();
        await page.getByPlaceholder('Ex: Reunião de Alinhamento, Follow-up...').fill(activityName);
        const clientSelect=page.locator('select').filter({has:page.locator('option[value="'+company.id+'"]')});
        const dealSelect=page.locator('select').filter({has:page.locator('option[value="'+createdDeal.id+'"]')});
        await clientSelect.selectOption(company.id); await dealSelect.selectOption(createdDeal.id);
        await page.getByRole('button',{name:'Criar Atividade',exact:true}).click();
        activity=await persisted(()=>db.from('activities').select('id,title,account_id,deal_id').eq('organization_id',org).ilike('title',activityName),'ACTIVITY');
        check(activity.account_id===company.id&&activity.deal_id===createdDeal.id,'ACTIVITY_LINKS');
        await go(page,'/activities'); await page.getByText(activity.title,{exact:true}).first().waitFor({state:'visible'});
        await capture(page,'journey-activity');
    });
    await scenario('save-and-reopen-proposal-draft',async()=>{
        check(seedDeal,'DEPENDENCY');
        const url='/pipeline/proposals/editor/'+seedDeal.id;
        await go(page,url);
        await page.locator('[data-slot="proposal-editor"]').waitFor({state:'visible'});
        const title=page.getByRole('textbox',{name:'Título da proposta',exact:true});
        await title.fill(draftTitle);
        const response=page.waitForResponse(res=>new URL(res.url()).pathname==='/api/proposals/save-draft'&&res.request().method()==='POST');
        await page.getByRole('button',{name:'Salvar',exact:true}).click();
        check((await response).ok(),'DRAFT_SAVE_HTTP');
        draft=await persisted(()=>db.from('proposals').select('id,deal_id,status,total,version,content_json,number').eq('organization_id',org).eq('title',draftTitle),'DRAFT');
        check(draft.deal_id===seedDeal.id&&draft.status==='draft'&&Number(draft.total)===15000&&draft.number&&draft.content_json?.editableTexts?.proposalTitle===draftTitle,'DRAFT_PERSISTED_VALUES');
        await go(page,url+'?sourceProposalId='+draft.id);
        await title.waitFor({state:'visible'});
        check(await title.inputValue()===draftTitle,'DRAFT_REOPEN_CONTENT');
        await capture(page,'journey-draft-reopened');
    });
    await scenario('real-orders-list-and-status-write',async()=>{
        check(order&&seedDeal,'DEPENDENCY');
        await go(page,'/sales-orders');
        const row=page.getByRole('row').filter({hasText:seedDeal.title}).first();
        await row.waitFor({state:'visible'});
        await row.getByRole('button',{name:'Mudar para Entregue'}).click();
        const changed=await persisted(()=>db.from('sales_orders').select('id,status,total_value').eq('organization_id',org).eq('id',order.id).eq('status','entregue'),'ORDER_STATUS');
        check(Number(changed.total_value)===Number(order.total_value),'ORDER_AMOUNT_CHANGED');
        await go(page,'/sales-orders'); await page.getByRole('row').filter({hasText:seedDeal.title}).first().getByText('Entregue',{exact:true}).waitFor({state:'visible'});
        await capture(page,'journey-order-reopened');
    });
    await scenario('independent-tenant-and-api-boundary',async()=>{
        check(seedDeal&&foreignDeal&&org&&otherOrg,'DEPENDENCY');
        other=await newPage(); await login(other,isolatedAccount);
        await go(other,'/pipeline');
        await other.getByText(foreignDeal.title,{exact:true}).first().waitFor({state:'visible'});
        check(await other.getByText(seedDeal.title,{exact:true}).count()===0,'CROSS_TENANT_LIST');
        const attempt=await other.request.post(base+'/api/proposals/save-draft',{data:{
            dealId:seedDeal.id,activeSections:['cover'],editableTexts:{proposalTitle:'Forbidden '+suffix},config:{template:'executivo'}
        }});
        check(attempt.status()===404,'CROSS_TENANT_SAVE_DENIED');
        const rows=read(await db.from('proposals').select('id').eq('title','Forbidden '+suffix),'CROSS_TENANT_READBACK');
        check(rows.length===0,'CROSS_TENANT_UNEXPECTED_WRITE');
        await go(other,'/customers');
        if(company) check(await other.getByText(company.name,{exact:true}).count()===0,'CROSS_TENANT_COMPANY');
        await capture(other,'journey-tenant-boundary');
    });
    await scenario('foreign-editor-denied', async()=>{
        check(other&&seedDeal,'DEPENDENCY');
        await other.goto(base+'/pipeline/proposals/editor/'+seedDeal.id,{waitUntil:'networkidle'});
        await other.getByText('Algo deu errado no sistema',{exact:true}).waitFor({state:'visible'});
        check(await other.locator('[data-slot="proposal-editor"]').count()===0,'FOREIGN_EDITOR_VISIBLE');
        await capture(other,'editor-access-denied');
    });
    await scenario('anonymous-root-protection',async()=>{
        external=await newPage();
        await external.goto(base+'/',{waitUntil:'networkidle'});
        await external.waitForURL(url=>url.pathname==='/login');
    });
    await scenario('anonymous-token-denial-and-view-receipt',async()=>{
        check(room&&inactiveRoom&&sentProposal&&originalDraft,'DEPENDENCY');
        check(external,'DEPENDENCY');
        const bad=await external.request.get(base+'/api/proposals/public/'+token());
        const unpublished=await external.request.get(base+'/api/proposals/public/'+originalDraft.public_token);
        check(bad.status()===404&&unpublished.status()===404,'PUBLIC_INVALID_OR_DRAFT');
        const before=await one(db.from('proposals').select('status,viewed_at').eq('id',sentProposal.id),'VIEW_BEFORE');
        check(before.status==='sent'&&!before.viewed_at,'VIEW_FIXTURE');
        await go(external,'/proposals/public/'+sentProposal.public_token);
        await external.getByRole('heading',{name:publicTitle,exact:true}).first().waitFor({state:'visible'});
        await external.locator('#proposal-cover-page').waitFor({state:'visible'});
        await external.getByText('Conteúdo público fictício',{exact:true}).waitFor({state:'visible'});
        const viewed=await persisted(()=>db.from('proposals').select('viewed_at,status').eq('id',sentProposal.id).eq('status','viewed'),'VIEW_RECEIPT');
        check(viewed.viewed_at,'VIEW_TIMESTAMP');
        await go(external,'/portal/'+inactiveRoom.access_token);
        await external.getByRole('heading',{name:/Acesso Restrito/}).waitFor({state:'visible'});
        await capture(external,'portal-inactive');
        await go(external,'/portal/'+room.access_token);
        await external.getByText(seedDeal.title,{exact:true}).first().waitFor({state:'visible'});
        const accessed=await one(db.from('deal_rooms').select('last_accessed_at').eq('id',room.id),'ROOM_RECEIPT');
        check(accessed.last_accessed_at,'ROOM_ACCESS_TIMESTAMP');
    });
    for(const device of devices) for(const wanted of ['light','dark']) {
        const name=device.name+'-'+wanted;
        await scenario('editor-'+name,async()=>{
            check(page&&seedDeal,'DEPENDENCY');
            await page.setViewportSize(device);
            await go(page,'/pipeline/proposals/editor/'+seedDeal.id+(draft?'?sourceProposalId='+draft.id:''));
            await theme(page,wanted,true);
            await page.locator('[data-slot="proposal-editor"]').waitFor({state:'visible'});
            const panels=await page.locator('[data-slot="proposal-editor"]').evaluate(n=>{
                return [...n.querySelectorAll(':scope > header, :scope > div > aside, :scope > div > section')].every(e=>{
                    const b=e.getBoundingClientRect(); return b.width>0&&b.left>=-1&&b.right<=innerWidth+1;
                });
            });
            check(panels,'EDITOR_PANELS_CLIPPED');
            await page.getByRole('button',{name:'Próxima seção'}).click();
            await page.getByRole('button',{name:'Seção anterior'}).click();
            await audit(page,'editor-'+name);
            return { primaryButton: await assertEditorPrimaryButton(page) };
        });
        await scenario('public-proposal-'+name,async()=>{
            check(external&&sentProposal,'DEPENDENCY');
            await external.setViewportSize(device);
            await go(external,'/proposals/public/'+sentProposal.public_token);
            await external.locator('[data-slot="public-proposal"]').waitFor({state:'visible'});
            await theme(external,wanted,false);
            await external.locator('#proposal-cover-page').waitFor({state:'visible'});
            check(await external.getByRole('button',{name:'Assinar Proposta'}).count()===0,'SIGNATURE_NOT_ALLOWED');
            await audit(external,'public-proposal-'+name);
        });
        await scenario('customer-portal-'+name,async()=>{
            check(external&&room,'DEPENDENCY');
            await external.setViewportSize(device);
            await go(external,'/portal/'+room.access_token);
            await external.locator('[data-slot="customer-portal"]').waitFor({state:'visible'});
            await theme(external,wanted,false);
            await external.getByText(seedDeal.title,{exact:true}).first().waitFor({state:'visible'});
            await audit(external,'customer-portal-'+name);
        });
    }
    await scenario('portal-empty-product-and-owner-state',async()=>{
        check(external&&emptyRoom,'DEPENDENCY');
        await external.setViewportSize({width:390,height:844});
        await go(external,'/portal/'+emptyRoom.access_token);
        await external.getByText('Os detalhes dos itens serão adicionados em breve.',{exact:true}).waitFor({state:'visible'});
        await external.getByText('Responsável não informado',{exact:true}).last().waitFor({state:'visible'});
        await audit(external,'portal-empty');
    });
    await scenario('public-proposal-loading-and-invalid-ui',async()=>{
        check(external&&sentProposal,'DEPENDENCY');
        const unknown=token();
        await external.route('**/api/proposals/public/*',async route=>{
            // Delay the actual localhost request; never fulfill it with fake data.
            await new Promise(resolve=>setTimeout(resolve,1600)); await route.continue();
        });
        await external.goto(base+'/proposals/public/'+unknown,{waitUntil:'domcontentloaded'});
        await external.getByRole('status').filter({hasText:'Carregando proposta'}).waitFor({state:'visible'});
        await capture(external,'public-proposal-loading');
        await external.getByRole('heading',{name:'Proposta Não Encontrada'}).waitFor({state:'visible'});
        await audit(external,'public-proposal-invalid');
        await external.unroute('**/api/proposals/public/*');
    });
} finally {
    for(const ctx of contexts) await ctx.close().catch(()=>{});
    await browser.close();
    await writeFile(resolve(evidence,'results.json'),JSON.stringify(result,null,2)+'\n');
}
console.log('CRM_PRODUCT_QA_RESULT='+JSON.stringify({sha,passed:result.checks.filter(x=>x.status==='passed').length,failed:result.checks.filter(x=>x.status==='failed').length}));
if(result.failures.length||result.checks.length!==33) process.exitCode=1;
