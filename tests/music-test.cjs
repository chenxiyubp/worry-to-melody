'use strict';
const assert=require('node:assert/strict');
const Music=require('../music.js');
const moods=Object.keys(Music.CONFIG);
for(let i=0;i<1000;i++){
  const params={emotion:moods[i%5],intensity:1+Math.floor(i/5)%5,seed:(i*2654435761)>>>0};
  const events=Music.generateMelody(params);
  assert.deepEqual(events,Music.generateMelody(params),'deterministic seed');
  assert.notEqual(JSON.stringify(events),JSON.stringify(Music.generateMelody({...params,seed:params.seed+1})),'seed variation');
  assert(events.meta.duration>=30&&events.meta.duration<=40,'duration');
  assert.equal(events.meta.bars.length,16);
  events.meta.bars.forEach((bar,n)=>assert.equal(bar.phase,n<6?0:n<12?1:2));
  events.meta.phrases.forEach((phrase,n)=>{if(n)assert.notEqual(phrase.template,events.meta.phrases[n-1].template);});
  for(const event of events){
    assert([event.time,event.duration,event.velocity].every(Number.isFinite));
    assert(event.time>=0&&event.duration>0&&event.velocity>0&&event.velocity<=1);
    assert(event.time+event.duration<=events.meta.duration+1e-5);
  }
}
console.log('PASS: 1000 deterministic melody cases; 16 bars; 30–40 seconds; finite, bounded events.');
