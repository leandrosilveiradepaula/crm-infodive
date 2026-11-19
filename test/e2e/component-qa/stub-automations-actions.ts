/* Offline browser fixture: no CRM account, authentication or backend calls. */
export async function toggleAutomation() { throw new Error('QA fixture forbids automation mutations'); }
export async function createAutomation() { throw new Error('QA fixture forbids automation mutations'); }
export async function updateAutomation() { throw new Error('QA fixture forbids automation mutations'); }
export async function deleteAutomation() { throw new Error('QA fixture forbids automation mutations'); }
