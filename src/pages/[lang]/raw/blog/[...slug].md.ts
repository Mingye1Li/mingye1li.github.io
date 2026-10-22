import type {APIContext} from 'astro';
import {locales,defaultLocale} from '../../../../i18n';
import {getPosts} from '../../../../lib/content';
export async function getStaticPaths(){
  return (await Promise.all(locales.filter(code=>code!==defaultLocale).map(async lang=>(await getPosts(lang)).map(post=>({params:{lang,slug:post.id},props:{body:post.body??''}}))))).flat();
}
export function GET({props}:APIContext){return new Response(props.body,{headers:{'Content-Type':'text/markdown; charset=utf-8'}});}
