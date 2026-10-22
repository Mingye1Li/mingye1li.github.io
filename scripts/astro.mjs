import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Use the project-local runtime on both Windows and Unix; never replace system Node.
const localNode=fileURLToPath(new URL(`../node_modules/node/bin/node${process.platform==='win32'?'.exe':''}`,import.meta.url));
const cli=fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs',import.meta.url));
const child=spawn(existsSync(localNode)?localNode:process.execPath,[cli,...process.argv.slice(2)],{
  stdio:'inherit',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},windowsHide:true,
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
