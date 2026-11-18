/* Offline browser fixture: all write operations forbidden. */
export async function updateUserGoals() { throw new Error('QA fixture forbids goal mutations'); }
