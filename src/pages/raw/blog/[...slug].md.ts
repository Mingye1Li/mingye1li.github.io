import type { APIContext } from 'astro';
import { getPosts } from '../../../lib/content';
export async function getStaticPaths() { return (await getPosts()).map(p => ({ params: { slug:p.id }, props: { body:p.body ?? '' } })); }
export function GET({ props }: APIContext) { return new Response(props.body, { headers: { 'Content-Type':'text/markdown; charset=utf-8' } }); }
