import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {asciiEngines,createAsciiEngine} from '../src/lib/ascii-engines';
import {fixtureContext,seededRandom,pointerFrame} from './helpers/ascii';

// Frozen traces captured from the public reference engine, not from our port.
const reference=JSON.parse(readFileSync(new URL('./fixtures/ascii-reference.json',import.meta.url),'utf8'));
for(const definition of asciiEngines)test(`ASCII ${definition.id} matches reference before, during and after pointer interaction`,()=>{
  const context=fixtureContext(),engine=createAsciiEngine(definition.id,context,seededRandom()),hash=createHash('sha256');
  for(let frame=0;frame<60;frame++){
    pointerFrame(engine,context,frame);engine.step(frame/60);
    hash.update(Buffer.from(context.grid.glyph.buffer));hash.update(Buffer.from(context.grid.alpha.buffer));
  }
  assert.equal(hash.digest('hex'),reference.traces[definition.id]);
});
