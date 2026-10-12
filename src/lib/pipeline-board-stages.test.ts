import { describe, expect, it } from 'vitest';
import { configuredBoardStages, isConfiguredMove } from './pipeline-board-stages';
const stage=(id: string,name: string,order_index=0)=>({id,name,color:'#abcdef',order_index});
describe('configured pipeline board contract',()=>{
 it('maps familiar stage names to stable legacy deal statuses',()=>{
  const cols=configuredBoardStages([stage('1','Qualificação'),stage('2','Proposta',1),stage('3','Negociação',2)],[]);
  expect(cols.map(x=>x.id)).toEqual(['qualification','proposal','negotiation','won','lost']);
 });
 it('displays custom stages and all previously persisted historical statuses',()=>{
  const cols=configuredBoardStages([stage('a','Descoberta')],[{stage:'legacy-unknown'}]);
  expect(cols.map(x=>x.id)).toEqual(['Descoberta','legacy-unknown','won','lost']);
  expect(cols.find(x=>x.id==='legacy-unknown')?.title).toContain('histórico');
 });
 it('never maps a renamed stage to terminal semantics',()=>{
  const cols=configuredBoardStages([stage('a','Ganho'),stage('b','Aprovação')],[]);
  expect(cols.map(x=>x.id)).toEqual(['Aprovação','won','lost']);
  expect(isConfiguredMove('other-tenant', [stage('a','Aprovação')])).toBe(false);
  expect(isConfiguredMove('Aprovação', [stage('a','Aprovação')])).toBe(true);
 });
});
describe('historical stage safety', () => {
 it('marks historical-only columns without offering them as a valid move target', () => {
  const config=[stage('1','Descoberta')];
  const stages=configuredBoardStages(config,[{stage:'descontinuada'}]);
  expect(stages.find(s=>s.id==='descontinuada')?.historical).toBe(true);
  expect(isConfiguredMove('descontinuada',config)).toBe(false);
  expect(isConfiguredMove('Descoberta',config)).toBe(true);
 });
 it('provides a valid default active stage when no configuration has been stored', () => {
  const stages=configuredBoardStages([],[]);
  expect(stages.slice(0,3).map(s=>s.id)).toEqual(['qualification','proposal','negotiation']);
  expect(isConfiguredMove('qualification',[])).toBe(true);
 });
});

describe('durable IDs across editable stage renames', () => {
 const stable='55555555-5555-4555-8555-555555555555';
 it('writes the same UUID when a custom stage name changes', () => {
  const before=configuredBoardStages([stage(stable,'Descoberta')],[]);
  const after=configuredBoardStages([stage(stable,'Análise técnica')],[{stage:stable}]);
  expect(before[0].id).toBe(stable);
  expect(after[0].id).toBe(stable);
  expect(after[0].title).toBe('Análise técnica');
  expect(after.filter(s=>s.id===stable)).toHaveLength(1);
  expect(isConfiguredMove(stable,[stage(stable,'Análise técnica')])).toBe(true);
  expect(isConfiguredMove('Descoberta',[stage(stable,'Análise técnica')])).toBe(false);
 });
 it('keeps legacy name-based deals visible in a separate historical column', () => {
  const cols=configuredBoardStages([stage(stable,'Nova etapa')],[{stage:'Etapa antiga'}]);
  expect(cols.map(s=>s.id)).toEqual([stable,'Etapa antiga','won','lost']);
  expect(cols.find(s=>s.id==='Etapa antiga')?.historical).toBe(true);
 });
});
