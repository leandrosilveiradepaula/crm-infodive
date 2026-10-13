import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('contract persistence hardening', () => {
  it('persists contracts through the tenant-scoped server action instead of a mock success', () => {
    const modal = readFileSync('src/components/pipeline/ViewDealModal.tsx', 'utf8');
    expect(modal).toContain('createContract');
    expect(modal).toContain('if (!result.success)');
    expect(modal).not.toContain('Contrato salvo (Mock)');
    expect(modal).not.toContain("console.log('Saving contract'");
  });

  it('removes all company-specific hardcoded branding from unsigned contract drafts', () => {
    const builder = readFileSync('src/components/contracts/ContractBuilder.tsx', 'utf8');
    expect(builder).not.toContain('IBM BRASIL');
    expect(builder).not.toContain('IBM Global Services');
    expect(builder).not.toContain('IBM / Lenovo');
    expect(builder).not.toContain('CONTRATADA: INFODIVE');
    expect(builder).toContain('persistedContractText(contract?.content_json)');
    expect(builder).not.toContain('Este contrato entra em vigor na data de sua assinatura');
    expect(builder).not.toMatch(/text-\[(?:8|9|10|11)px\]/);
  });

  it('keeps contract creation tenant-scoped on the server', () => {
    const actions = readFileSync('src/app/(dashboard)/contracts/actions.ts', 'utf8');
    const service = readFileSync('src/services/ContractService.ts', 'utf8');
    expect(actions).toContain("requirePermission('deals:edit')");
    expect(actions).toContain('ContractService.createContract(organizationId, contract, canViewAll ? undefined : userId)');
    expect(service).toContain('organization_id: organizationId');
  });
});
