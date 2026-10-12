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