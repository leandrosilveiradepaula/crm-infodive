import { describe, expect, it } from 'vitest';
import { rollbackOptimisticStageMove } from './pipeline-optimistic-move';
import type { Deal } from '@/types/deal';
const deal=(id:string,stage:string,value=0)=>({id,stage,value}) as Deal;
describe('optimistic Kanban recovery',()=>{
    it('reverts the failed card without discarding unrelated changes',()=>{
        const before=deal('a','qualification',100);
        const result=rollbackOptimisticStageMove([
            deal('a','won',100), deal('b','proposal',250),
        ],before,'won');
        expect(result[0]).toBe(before);
        expect(result[1]).toMatchObject({id:'b',stage:'proposal',value:250});
    });
    it('leaves cards alone if a later move already superseded the failed one',()=>{
        const result=rollbackOptimisticStageMove([deal('a','proposal')],deal('a','qualification'),'won');
        expect(result[0].stage).toBe('proposal');
    });
});
