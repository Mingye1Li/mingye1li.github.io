import { getSearchEntries } from '../lib/content';
export async function GET() { return new Response(JSON.stringify(await getSearchEntries()), { headers: { 'Content-Type':'application/json' } }); }
