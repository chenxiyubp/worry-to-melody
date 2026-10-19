(function (root) {
  'use strict';
  const CONFIG = {
    anxious: { root: 57, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 140, name: 'A 小调 → C 大调', instrument: '短音钢琴', healRoot: 60, heal: [0, 2, 4, 7, 9] },
    sad: { root: 62, scale: [0, 2, 3, 5, 7, 8, 10], bpm: 62, name: 'D 小调 → F 大调', instrument: '温柔弦乐', healRoot: 65, heal: [0, 2, 4, 7, 9] },
    angry: { root: 64, scale: [0, 1, 3, 5, 7, 8, 10], bpm: 120, name: 'E 弗里吉亚 → C 大调', instrument: '柔化方波', healRoot: 60, heal: [0, 2, 4, 7, 9] },
    tired: { root: 72, scale: [0, 2, 4, 7, 9], bpm: 60, name: 'C 五声音阶', instrument: '星光音乐盒', healRoot: 72, heal: [0, 2, 4, 7, 9] },
    calm: { root: 60, scale: [0, 2, 4, 5, 7, 9, 11], bpm: 76, name: 'C 大调 → C 五声音阶', instrument: '轻柔钢琴', healRoot: 60, heal: [0, 2, 4, 7, 9] }
  };
  // All editable sound/rhythm parameters live in CONFIG (per mood) or MIX (shared).
  const piano = { oscillator: { type: 'triangle' }, envelope: { attack: .008, decay: .22, sustain: .06, release: .45 }, volume: -10 };
  Object.assign(CONFIG.anxious, { beatsPerBar: 4, healStep: 1, maxLeap: 12, voice: 'Synth', synth: { ...piano } });
  Object.assign(CONFIG.sad, { beatsPerBar: 2, healStep: 2, maxLeap: 7, voice: 'FMSynth', gate: .95,
    synth: { harmonicity: 1.5, modulationIndex: 2, envelope: { attack: .18, decay: .3, sustain: .45, release: 1.4 }, modulation: { type: 'sine' }, modulationEnvelope: { attack: .3, decay: .4, sustain: .2, release: .8 }, volume: -12 } });
  Object.assign(CONFIG.angry, { beatsPerBar: 4, healStep: 1, maxLeap: 12, voice: 'MonoSynth', distortion: { distortion: .2, wet: .22 },
    synth: { oscillator: { type: 'square' }, filter: { Q: 1, type: 'lowpass', rolloff: -24 }, envelope: { attack: .012, decay: .15, sustain: .12, release: .3 }, filterEnvelope: { attack: .01, decay: .2, sustain: .15, release: .3, baseFrequency: 250, octaves: 2.5 }, volume: -17 } });
  Object.assign(CONFIG.tired, { beatsPerBar: 2, healStep: 2, maxLeap: 7, restEvery: 3, turnRestBars: [7], voice: 'Synth',
    synth: { oscillator: { type: 'sine' }, envelope: { attack: .008, decay: .65, sustain: .06, release: 1.2 }, volume: -10 } });
  Object.assign(CONFIG.calm, { beatsPerBar: 2, healStep: 1, maxLeap: 5, voice: 'Synth', synth: JSON.parse(JSON.stringify(piano)) });
  // Fractions are measured within one bar, not seconds. Each mood has 3 templates.
  const RHYTHMS = {
    anxious: [[0,.125,.25,.375,.5,.625,.75,.875], [0,.1875,.375,.5,.6875,.875], [0,.0625,.25,.3125,.5,.5625,.75,.875]],
    sad: [[0,.5], [.125,.625], [0,.25,.75]],
    angry: [[0,.25,.5,.75], [0,.375,.5,.875], [0,.125,.5,.625]],
    tired: [[0], [.25], [0,.625]],
    calm: [[0,.25,.5,.75], [0,.375,.75], [0,.125,.5,.875]]
  };
  for (const [emotion, config] of Object.entries(CONFIG)) {
    config.rhythms = RHYTHMS[emotion].map((positions, i) => ({ name: ['均匀', '切分', '长短交错'][i], positions }));
    config.phrasing = { bars: 4, responseShift: emotion === 'sad' ? -2 : 2, motif: emotion === 'sad' ? [4,3,2,1] : emotion === 'angry' ? [0,4,1,5] : [0,2,1,3] };
    // Human-readable, inclusive, ONE-based bar ranges. Low-intensity overrides are explicit.
    config.layers = {
      melody: { fromBar: 1, toBar: 16, minIntensity: 1, label: config.instrument, voices: 1 },
      bass: { fromBar: 7, toBar: 16, lowIntensityFromBar: 1, minIntensity: 1, label: '正弦低音', voices: 1, velocity: .32, voice: 'Synth', synth: { oscillator: { type: 'sine' }, envelope: { attack: .06, decay: .2, sustain: .5, release: .5 }, volume: -19 } },
      arpeggio: { fromBar: 1, toBar: 12, minIntensity: 4, label: '轻三角波琶音', voices: 1, velocity: .30, step: .5, thinFromBar: 9, thinStep: 1, fadeTo: 0, voice: 'Synth', synth: { oscillator: { type: 'triangle' }, envelope: { attack: .006, decay: .12, sustain: .04, release: .16 }, volume: -24 } },
      pad: { fromBar: 13, toBar: 16, minIntensity: 3, label: '慢起音三角波铺底', voices: 3, velocity: .25, voice: 'Synth', synth: { oscillator: { type: 'triangle' }, envelope: { attack: .55, decay: .3, sustain: .5, release: 1.2 }, volume: -24 } },
      octave: { fromBar: 13, toBar: 16, minIntensity: 3, label: '高八度正弦加倍', voices: 1, velocity: .32, voice: 'Synth', synth: { oscillator: { type: 'sine' }, envelope: { attack: .04, decay: .25, sustain: .12, release: .7 }, volume: -23 } },
      sparkle: { fromBar: 13, toBar: 15, minIntensity: 4, label: '高音FM星光', voices: 1, velocity: .22, voice: 'FMSynth', synth: { harmonicity: 2, modulationIndex: .8, envelope: { attack: .002, decay: .22, sustain: 0, release: .3 }, volume: -26 } },
      percussion: { fromBar: 1, toBar: 12, minIntensity: 5, label: '低音膜鼓轻点', voices: 1, velocity: .20, voice: 'MembraneSynth', synth: { pitchDecay: .025, octaves: 2, envelope: { attack: .002, decay: .1, sustain: 0, release: .1 }, volume: -29 } }
    };
    config.stages = [
      { name: 'tension', fromBar: 1, toBar: 6, filterHz: [1500,2100], reverbWet: [.035,.05], dynamics: [.66,.66] },
      { name: 'turn', fromBar: 7, toBar: 12, filterHz: [2100,3300], reverbWet: [.05,.15], dynamics: [.62,.38] },
      { name: 'healing', fromBar: 13, toBar: 16, filterHz: [3600,6500], reverbWet: [.18,.30], dynamics: [.42,.64,.32] }
    ];
  }
  const MIX = {
    bars: 16, turnBar: 6, healBar: 12, tempoEase: .22, tailSeconds: 2.5,
    rangeBase: 3, intensityRange: 1.9, rangeEase: .65, transitionMaxLeap: 5,
    velocityBase: .34, intensityVelocity: .075,
    masterGain: .7, limiterDb: -3, fadeSeconds: .025,
    reverbSeconds: 4.2, preDelay: .03, outputLowpassHz: 7200,
    sampleTimeoutMs: 12000, sampleConcurrency: 6, pianoRelease: .9, stringAttack: .55, stringRelease: 1.2,
    fallbackAttack: .06, fallbackPadAttack: .65, fallbackDetune: 6, fallbackLowpassHz: 3200,
    velocityJitter: .08, phraseDynamics: [.78, 1, 1.18, .64],
    strongJitterMs: 10, weakJitterMs: 25, rubato: [.03, .06], legato: [1.05, 1.2],
    chordSpread: [.02, .06], phraseEndBeats: 2, finalChordBeats: 4, finalBassBeats: 4.5,
    finalFadeSeconds: 1, voiceTailSeconds: 1.6, sampleVolumes: { melody: -7, harmony: -14, bass: -21, arpeggio: -20, pad: -25, octave: -22, sparkle: -26, percussion: -29 }
  };
  MIX.tailSeconds = 4.5;
  // Exact piano mapping from https://tonejs.github.io/examples/sampler (verified 2026-10-19).
  // Cello subset from nbrosowsky/tonejs-instruments/Tonejs-Instruments.js; CC BY 3.0.
  MIX.samples = {
    piano: { baseUrl: 'https://tonejs.github.io/audio/salamander/', urls: {
      A0:'A0.mp3', C1:'C1.mp3', 'D#1':'Ds1.mp3', 'F#1':'Fs1.mp3', A1:'A1.mp3', C2:'C2.mp3', 'D#2':'Ds2.mp3', 'F#2':'Fs2.mp3', A2:'A2.mp3',
      C3:'C3.mp3', 'D#3':'Ds3.mp3', 'F#3':'Fs3.mp3', A3:'A3.mp3', C4:'C4.mp3', 'D#4':'Ds4.mp3', 'F#4':'Fs4.mp3', A4:'A4.mp3',
      C5:'C5.mp3', 'D#5':'Ds5.mp3', 'F#5':'Fs5.mp3', A5:'A5.mp3', C6:'C6.mp3', 'D#6':'Ds6.mp3', 'F#6':'Fs6.mp3', A6:'A6.mp3',
      C7:'C7.mp3', 'D#7':'Ds7.mp3', 'F#7':'Fs7.mp3', A7:'A7.mp3', C8:'C8.mp3'
    } },
    strings: { baseUrl: 'https://nbrosowsky.github.io/tonejs-instruments/samples/cello/', urls: {
      C2:'C2.mp3', E2:'E2.mp3', A2:'A2.mp3', C3:'C3.mp3', E3:'E3.mp3', A3:'A3.mp3', C4:'C4.mp3', E4:'E4.mp3', A4:'A4.mp3', C5:'C5.mp3'
    } }
  };
  const naturalMoods = {
    anxious: { duration:35, instrument:'钢琴 · 高音弦乐', padFrom:4, padTranspose:12, bassBank:'piano', pianoVelocity:1 },
    sad: { duration:38, instrument:'钢琴 · 慢起音弦乐', padFrom:1, padTranspose:0, bassBank:'strings', pianoVelocity:.92 },
    angry: { duration:37, instrument:'强奏钢琴 · 低音弦乐', padFrom:7, padTranspose:-12, bassBank:'strings', pianoVelocity:1.16 },
    tired: { duration:39, instrument:'柔和高音钢琴', padFrom:13, padTranspose:0, bassBank:'piano', pianoVelocity:.82 },
    calm: { duration:34, instrument:'钢琴 · 温暖弦乐', padFrom:7, padTranspose:0, bassBank:'strings', pianoVelocity:.95 }
  };
  for (const [emotion, config] of Object.entries(CONFIG)) {
    config.legacyInstrument = config.instrument;
    Object.assign(config, naturalMoods[emotion]);
    config.phrasing.turnMotif = [0,1,0,2];
    config.layers.bass.fromBar = 1;
    config.layers.pad.fromBar = config.padFrom;
    config.layers.harmony = { fromBar:1, toBar:16, minIntensity:3, label:'开放排列钢琴和弦', voices:3, velocity:.38, voice:'Synth', synth:{ ...piano, volume:-19 } };
    config.stages.forEach((stage, i) => {
      stage.filterHz = [[2400,3200],[3200,4900],[4900,6800]][i];
      stage.reverbWet = [[.25,.26],[.26,.29],[.29,.33]][i];
    });
  }
  function hashText(text) { let hash = 2166136261; for (const ch of String(text)) { hash ^= ch.codePointAt(0); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
  function randomGenerator(seed) { let value = seed >>> 0; return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function noteName(midi) { const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']; return names[((midi % 12) + 12) % 12] + (Math.floor(midi / 12) - 1); }
  function scaleNote(base, scale, degree) { const octave = Math.floor(degree / scale.length); return noteName(base + scale[((degree % scale.length) + scale.length) % scale.length] + octave * 12); }
  function midiValue(note) { const match = /^([A-G])(#?)(-?\d+)$/.exec(note); return (Number(match[3]) + 1) * 12 + { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[match[1]] + (match[2] ? 1 : 0); }
  function leadNote(base, scale, degree, previous, maxLeap, range) {
    const desired = midiValue(scaleNote(base, scale, degree));
    if (previous === null || Math.abs(desired - previous) <= maxLeap) return noteName(desired);
    const candidates = Array.from({ length: range + 1 }, (_, n) => midiValue(scaleNote(base, scale, n)));
    const nearby = candidates.filter(n => Math.abs(n - previous) <= maxLeap);
    return noteName((nearby.length ? nearby : candidates).sort((a, b) => Math.abs(a - (nearby.length ? desired : previous)) - Math.abs(b - (nearby.length ? desired : previous)))[0]);
  }
  function curve(values, progress) {
    const p = Math.max(0, Math.min(1, progress)) * (values.length - 1), i = Math.min(values.length - 2, Math.floor(p));
    return values[i] + (values[i + 1] - values[i]) * (p - i);
  }
  function enabled(layer, bar, intensity) {
    const from = intensity <= 2 && layer.lowIntensityFromBar ? layer.lowIntensityFromBar : layer.fromBar;
    return intensity >= layer.minIntensity && bar + 1 >= from && bar + 1 <= layer.toBar;
  }
  function phrasePlan(config, rng) {
    let previous = -1;
    return ['提出', '回应', '变形', '收束'].map((role, index) => {
      const choices = config.rhythms.map((_, i) => i).filter(i => i !== previous);
      previous = choices[Math.floor(rng() * choices.length)];
      return { index, role, template: previous, name: config.rhythms[previous].name, rubato: curve(MIX.rubato, rng()) };
    });
  }
  function barPlan(config, phrases) {
    let cursor = 0;
    const bars = Array.from({ length: MIX.bars }, (_, bar) => {
      const phase = bar < MIX.turnBar ? 0 : bar < MIX.healBar ? 1 : 2, stage = config.stages[phase];
      const easing = bar < MIX.turnBar ? 0 : Math.min(1, (bar - MIX.turnBar + 1) / (MIX.healBar - MIX.turnBar + 1));
      const rubato = bar % 4 === 3 ? phrases[Math.floor(bar / 4)].rubato : 0;
      const bpm = config.bpm * (1 - MIX.tempoEase * easing), duration = config.beatsPerBar * 60 / bpm * (1 + rubato / (1 - rubato) / 2);
      const progress = (bar + 1 - stage.fromBar) / (stage.toBar - stage.fromBar + 1);
      const next = (bar + 2 - stage.fromBar) / (stage.toBar - stage.fromBar + 1);
      const result = { start: cursor, duration, bpm, rubato, phase, easing, phrase: Math.floor(bar / config.phrasing.bars),
        fill: (bar + 1) % config.phrasing.bars === 0,
        dynamics: curve(stage.dynamics, (progress + next) / 2),
        filterHz: [curve(stage.filterHz, progress), curve(stage.filterHz, next)],
        reverbWet: [curve(stage.reverbWet, progress), curve(stage.reverbWet, next)] };
      cursor += duration; return result;
    });
    // Fit the complete performance (including ending sustain/reverb) to an explicit duration.
    const factor = (config.duration - MIX.tailSeconds) / cursor;
    bars.forEach(info => { info.start *= factor; info.duration *= factor; info.bpm /= factor; info.endBpm = info.bpm * (1 - info.rubato); });
    return bars;
  }
  function performedTime(info, fraction) {
    const rate = info.rubato / (1 - info.rubato);
    return info.start + info.duration * (fraction + rate * fraction * fraction / 2) / (1 + rate / 2);
  }
  function melodyPositions(config, info, phrase, intensity, bar) {
    if (bar === MIX.bars - 1) return [0, .5];
    if (info.phase === 1 && config.turnRestBars?.includes(bar + 1)) return [];
    if (info.fill) return [0, .5];
    let positions = config.rhythms[phrase.template].positions;
    const healingNotes = Math.min(2, Math.max(1, Math.floor(config.beatsPerBar / config.healStep)));
    const stride = info.phase === 2 ? Math.ceil(positions.length / healingNotes) : info.phase === 1 ? Math.max(bar < 9 ? 2 : 3, intensity <= 2 ? positions.length : 1) : intensity <= 2 ? 2 : 1;
    positions = positions.filter((_, i) => i % stride === 0);
    if (bar === 2 || bar === 5) positions = [...new Set([0,.25,...positions])].sort((a,b) => a-b);
    return config.restEvery && info.phase < 2 && bar % config.restEvery === 1 && !info.fill ? [] : positions;
  }
  function addMelody(add, config, bars, phrases, motif, intensity, rng) {
    let previous = null;
    bars.forEach((info, bar) => {
      if (!enabled(config.layers.melody, bar, intensity)) return;
      const heal = info.phase === 2, final = bar === MIX.bars - 1, phrase = phrases[info.phrase];
      const base = heal ? config.healRoot : config.root, scale = heal ? [0,2,4,5,7,9,11] : config.scale;
      const positions = melodyPositions(config, info, phrase, intensity, bar);
      const range = Math.min(7, Math.max(info.phase===1?5:3, Math.round((MIX.rangeBase + intensity * MIX.intensityRange) * (1 - info.easing * MIX.rangeEase))));
      positions.forEach((pos, index) => {
        let degree = motif[(index + bar % 2) % motif.length];
        if (phrase.index === 1) degree += config.phrasing.responseShift;
        if (phrase.index === 2) degree += Math.floor((bar - 8) / 2) + 1;
        if (info.phase === 1) degree = 2 + config.phrasing.turnMotif[index%config.phrasing.turnMotif.length] + Math.floor((bar - MIX.turnBar) / 2);
        if (heal) degree = Math.max(0, 4 - (bar - MIX.healBar) - index);
        if (!info.fill) degree = Math.min(degree, range - 1);
        if (bar % 4 === 2 && index === positions.length-1) degree = range-1;
        if (info.fill) degree = index === 0 ? range : 1; // 3/4 phrase high point, then retreat
        if ((bar===1 || bar===4) && index===positions.length-1) degree=2; // approach the suspension by step
        if (bar===5 && index===positions.length-1) degree=2; // prepare the ascending sequence
        if (bar===14 && index===positions.length-1) degree=2;
        if (final && index===0) degree=Math.min(degree, scale.filter(n=>n<=config.maxLeap).length-1);
        degree = Math.abs(degree) % (range * 2);
        if (degree > range) degree = range * 2 - degree;
        // Two explicit 4–3 suspensions on a tonic harmony, then stepwise resolution.
        const suspension = (bar === 2 || bar === 5) && index < 2;
        if (suspension) degree = index === 0 ? 3 : 2;
        const tonic = final && index === positions.length-1;
        const note = tonic ? noteName(base) : suspension ? noteName(base+(index===0?5:scale[2])) : leadNote(base, scale, degree, previous, heal ? Math.min(config.maxLeap, MIX.transitionMaxLeap) : config.maxLeap, range);
        const gap = (positions[index + 1] ?? 1) - pos;
        const phraseProgress = (bar % 4 + pos) / 4;
        const phraseCurve = phraseProgress <= .75 ? curve(MIX.phraseDynamics.slice(0,3), phraseProgress / .75) : curve(MIX.phraseDynamics.slice(2), (phraseProgress - .75) / .25);
        const velocity = (MIX.velocityBase + intensity * MIX.intensityVelocity) * info.dynamics * phraseCurve * config.pianoVelocity * (1 + (rng()*2-1)*MIX.velocityJitter);
        const beat = 60 / info.bpm, strong = Math.abs(pos * config.beatsPerBar - Math.round(pos * config.beatsPerBar)) < .001;
        const jitter = (rng()*2-1) * (strong ? MIX.strongJitterMs : MIX.weakJitterMs) / 1000;
        const nominalTime = performedTime(info, pos), time = Math.max(info.start, nominalTime + jitter);
        const nominalDuration = performedTime(info, pos+gap) - nominalTime;
        let duration = nominalDuration * curve(MIX.legato, rng());
        if (info.fill && index === positions.length - 1) duration = Math.max(duration, MIX.phraseEndBeats * beat);
        if (info.fill && index === 0) duration = Math.max(duration, nominalDuration*1.2);
        add(time, note, duration, velocity, 'melody', bar, 0, { nominalTime, nominalDuration, jitter:time-nominalTime, phraseProgress, articulation:suspension ? (index===0?'4-suspension':'3-resolution') : tonic?'tonic':info.fill?(index===0?'phrase-peak':'phrase-ending'):'legato' });
        previous = midiValue(note);
      });
    });
  }
  function chordFor(config, emotion, bar) {
    const heal = bar >= MIX.healBar, base = (heal ? config.healRoot : config.root) - (emotion === 'tired' ? 24 : 12);
    const scale = heal || emotion === 'tired' ? [0,2,4,5,7,9,11] : config.scale;
    const degree = bar === 14 ? 4 : bar === 15 || bar === 2 || bar === 5 ? 0 : [0,3,4,0][bar % 4];
    // Open voicing: root, fifth, third an octave above (at least a tenth overall).
    return [degree, degree + 4, degree + 9].map(n => scaleNote(base, scale, n));
  }
  function addLayers(events, add, config, bars, intensity, emotion, rng) {
    bars.forEach((info, bar) => {
      const chord = chordFor(config, emotion, bar), beat = 60 / info.bpm;
      const layerOn = name => enabled(config.layers[name], bar, intensity);
      const velocity = name => config.layers[name].velocity * info.dynamics;
      const final = bar === MIX.bars-1;
      if (layerOn('bass')) {
        add(info.start, noteName(midiValue(chord[0]) - 12), final ? MIX.finalBassBeats * beat : info.duration * .7, velocity('bass'), 'bass', bar);
        if (!final) add(info.start + info.duration*.5, noteName(midiValue(chord[1])-12), info.duration*.5, velocity('bass')*.8, 'bass', bar);
      }
      if (layerOn('arpeggio')) {
        const layer = config.layers.arpeggio, step = bar + 1 >= layer.thinFromBar ? layer.thinStep : layer.step;
        const fade = info.phase === 1 ? curve([1, layer.fadeTo], (bar - MIX.turnBar + 1) / (MIX.healBar - MIX.turnBar)) : 1;
        for (let pos = 0, n = 0; pos < config.beatsPerBar && fade > .001; pos += step, n++)
          add(info.start + pos * beat, chord[n % 3], Math.min(step * beat * .65, info.duration - pos * beat), velocity('arpeggio') * fade, 'arpeggio', bar);
      }
      for (const track of ['harmony','pad']) if (layerOn(track)) {
        const spread = curve(MIX.chordSpread, rng());
        chord.forEach((note, voice) => {
          const offset = voice * spread, duration = final ? MIX.finalChordBeats*beat : info.duration*.95;
          const pitch = midiValue(note) + (track === 'pad' ? config.padTranspose : 0);
          // Penultimate V chord: sus4 resolves down to its third before the final tonic.
          if (bar === 14 && voice === 2) {
            add(info.start+offset, noteName(pitch+1), info.duration*.46, velocity(track), track, bar, voice);
            add(info.start+info.duration*.5+offset, noteName(pitch), info.duration*.45, velocity(track)*.85, track, bar, voice);
          } else add(info.start+offset, noteName(pitch), duration, velocity(track), track, bar, voice);
        });
      }
      if (layerOn('sparkle')) add(info.start + info.duration * .625, noteName(midiValue(chord[bar % 3]) + 24), info.duration * .18, velocity('sparkle'), 'sparkle', bar);
      if (layerOn('percussion')) add(info.start, 'C2', Math.min(.12, info.duration * .1), velocity('percussion') * (info.phase === 1 ? .6 : 1), 'percussion', bar);
    });
    // Snapshot before adding doubles: exactly one octave voice per healing melody event.
    events.filter(e => e.track === 'melody' && enabled(config.layers.octave, e.bar, intensity)).forEach(e =>
      add(e.time, noteName(midiValue(e.note) + 12), e.bar===15 ? e.duration*.7 : e.duration, e.velocity * config.layers.octave.velocity, 'octave', e.bar));
  }

  // Times are seconds. Pass seed: hashText(originalText); all musical choices are seeded.
  function generateMelody({ emotion = 'calm', intensity = 2, keywords = [], seed, text } = {}) {
    if (!Object.prototype.hasOwnProperty.call(CONFIG, emotion)) emotion = 'calm';
    intensity = Math.max(1, Math.min(5, Math.round(Number(intensity) || 1)));
    seed = seed === undefined ? hashText(text || keywords.join('|') || emotion) : typeof seed === 'string' ? hashText(seed) : seed >>> 0;
    const config = CONFIG[emotion], rng = randomGenerator(seed), events = [], phrases = phrasePlan(config, rng), bars = barPlan(config, phrases);
    const shift = Math.floor(rng() * 3);
    const motif = config.phrasing.motif.map(n => n + shift);
    const add = (time, note, duration, velocity, track, bar, voice = 0, expression = {}) => {
      if (velocity <= 0) return;
      if (track !== 'melody' && track !== 'octave') {
        const progress = (bar%4 + (time-bars[bar].start)/bars[bar].duration)/4;
        const envelope = progress<=.75 ? curve(MIX.phraseDynamics.slice(0,3),progress/.75) : curve(MIX.phraseDynamics.slice(2),(progress-.75)/.25);
        velocity *= envelope * (1+(rng()*2-1)*MIX.velocityJitter);
        if (track!=='harmony' && track!=='pad') {
          const nominalTime = time, beatPosition = (time-bars[bar].start)/bars[bar].duration*config.beatsPerBar;
          const limit = Math.abs(beatPosition-Math.round(beatPosition))<.001 ? MIX.strongJitterMs : MIX.weakJitterMs;
          time = Math.max(bars[bar].start,time+(rng()*2-1)*limit/1000);
          expression = {nominalTime,jitter:time-nominalTime};
        }
      }
      duration = Math.min(duration, config.duration - MIX.finalFadeSeconds - time);
      events.push({ time: +time.toFixed(5), note, duration: +duration.toFixed(5), velocity: +Math.min(.9, velocity).toFixed(4), track, bar, voice, ...expression });
    };
    addMelody(add, config, bars, phrases, motif, intensity, rng);
    addLayers(events, add, config, bars, intensity, emotion, rng);
    events.sort((a, b) => a.time - b.time);
    // Interval coloring reserves one voice per overlapping note + release tail. This also
    // avoids PolySynth's delayed allocation callbacks surviving disposal in Tone 14.7.77.
    const preceding = new Map();
    events.forEach(event => {
      const key = event.track, ends = preceding.get(key) || [];
      let slot = ends.findIndex(end => end <= event.time);
      if (slot < 0) slot = ends.length;
      ends[slot] = event.time + event.duration + Math.max(MIX.voiceTailSeconds,MIX.pianoRelease,MIX.stringRelease);
      event.voice = slot; preceding.set(key, ends);
    });
    const musicalDuration = bars[15].start + bars[15].duration;
    events.meta = { emotion, intensity, seed, bars, phrases, motif, duration: config.duration, musicalDuration, config };
    return events;
  }

  let nodes = [], scheduled = [], graph, running = false, paused = false, endTimer, loadController, playSerial = 0;
  let soundMode = 'sample', simplified = false;
  let activeEvents = [], activeBars = [], activeDuration = 0, volume = .65, cleanupErrors = 0;
  function disposeNodes(list) {
    let errors = 0;
    list.slice().reverse().forEach(node => { try { node.dispose(); } catch (_) { errors++; } });
    return errors;
  }
  function stop() {
    playSerial++; loadController?.abort(); loadController = undefined;
    clearInterval(endTimer); endTimer = undefined;
    if (root.Tone) { root.Tone.Transport.stop(); scheduled.forEach(id => root.Tone.Transport.clear(id)); root.Tone.Transport.seconds = 0; }
    scheduled = []; cleanupErrors = disposeNodes(nodes);
    nodes = []; activeEvents = []; activeBars = []; graph = undefined; running = paused = false;
    return cleanupErrors === 0;
  }
  function setVolume(value) {
    volume = Math.max(0, Math.min(1, Number(value) || 0));
    if (graph && !paused) playbackGain(root.Tone.now(),position());
  }
  function playbackGain(time, offset) {
    const remaining = activeDuration-offset, gain = graph.master.gain;
    gain.cancelAndHoldAtTime(time);
    if (remaining<=MIX.finalFadeSeconds) {
      gain.linearRampToValueAtTime(volume*MIX.masterGain*Math.max(0,remaining)/MIX.finalFadeSeconds,time+MIX.fadeSeconds);
      gain.linearRampToValueAtTime(0,time+Math.max(MIX.fadeSeconds,remaining));
    } else gain.rampTo(volume*MIX.masterGain,MIX.fadeSeconds);
  }
  function silenceVoice(voice, time) {
    if (voice.silence) return voice.silence(time);
    // Flush sources after the short master fade, so resume cannot unmute old release tails.
    if (typeof voice.release === 'number') {
      const release = voice.release; voice.release=0; voice.releaseAll(time); voice.release=release;
    } else {
      const release=voice.get().envelope.release; voice.set({envelope:{release:0}});
      voice.triggerRelease(time); voice.set({envelope:{release}});
    }
  }
  function impulse(T) {
    const context = T.getContext().rawContext, length = Math.ceil(context.sampleRate * MIX.reverbSeconds);
    const buffer = context.createBuffer(2, length, context.sampleRate), rng = randomGenerator(0x51A7);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (rng() * 2 - 1) * Math.pow(1 - i / length, 3);
    }
    return buffer;
  }
  function bankFor(config, track) { return track === 'pad' || track === 'bass' && config.bassBank === 'strings' ? 'strings' : 'piano'; }
  function emit(callback, value) { try { callback?.(value); } catch (_) { /* UI observers must not break cleanup. */ } }
  function abortError() { return new DOMException('播放已取消', 'AbortError'); }
  async function loadBanks(T, events, config, signal, onProgress) {
    const requested = { piano:new Set(), strings:new Set() }, banks = { piano:{}, strings:{} }, failed = new Set();
    for (const event of events) {
      const bank = bankFor(config, event.track), keys = Object.keys(MIX.samples[bank].urls);
      const nearest = keys.sort((a,b) => Math.abs(midiValue(a)-midiValue(event.note))-Math.abs(midiValue(b)-midiValue(event.note)))[0];
      requested[bank].add(nearest);
    }
    const jobs = Object.entries(requested).flatMap(([bank, keys]) => [...keys].map(note => ({bank,note}))), total = jobs.length;
    const controller = new AbortController(), abort = () => controller.abort();
    const cancelled = new Promise(resolve => controller.signal.addEventListener('abort',()=>resolve(null),{once:true}));
    signal.addEventListener('abort', abort, {once:true});
    if (signal.aborted) controller.abort();
    const timeout = setTimeout(abort, MIX.sampleTimeoutMs);
    let completed = 0;
    emit(onProgress, {completed,total,percent:0});
    try {
      await Promise.all(Array.from({length:Math.min(MIX.sampleConcurrency,total)}, async () => {
        while (jobs.length) {
          const {bank,note} = jobs.shift(), source = MIX.samples[bank];
          try {
            if (controller.signal.aborted || failed.has(bank)) { failed.add(bank); continue; }
            const response = await fetch(new URL(source.urls[note],source.baseUrl), {signal:controller.signal,credentials:'omit'});
            if (!response.ok) throw new Error('sample unavailable');
            const buffer = await Promise.race([T.getContext().rawContext.decodeAudioData(await response.arrayBuffer()),cancelled]);
            if (buffer && !controller.signal.aborted) banks[bank][note] = buffer;
            else failed.add(bank);
          } catch (_) { failed.add(bank); }
          finally { completed++; if (!signal.aborted) emit(onProgress,{completed,total,percent:Math.round(completed/total*100)}); }
        }
      }));
      if (signal.aborted) throw abortError();
      failed.forEach(bank => { banks[bank] = null; });
      return {banks,simplified:failed.size>0};
    } finally { clearTimeout(timeout); signal.removeEventListener('abort',abort); }
  }
  function fallbackVoice(T, own, input, track) {
    const pad = track === 'pad' || track === 'bass', filter = own(new T.Filter(MIX.fallbackLowpassHz,'lowpass'));
    filter.connect(input);
    const pair = [-1,1].map(sign => {
      const synth = own(new T.Synth({ oscillator:{type:'triangle'}, detune:sign*MIX.fallbackDetune,
        envelope:{attack:pad?MIX.fallbackPadAttack:MIX.fallbackAttack,decay:.45,sustain:pad?.4:.12,release:pad?MIX.stringRelease:MIX.pianoRelease},volume:MIX.sampleVolumes[track]-8 }));
      synth.connect(filter); return synth;
    });
    return { get disposed(){return pair[0].disposed;}, triggerAttackRelease(...args){pair.forEach(voice=>voice.triggerAttackRelease(...args));}, silence(time){pair.forEach(voice=>silenceVoice(voice,time));} };
  }
  function createGraph(T, config, events, level, mode = 'sample', banks = {}) {
    const resources = [], own = node => { resources.push(node); return node; };
    try {
      const master = own(new T.Gain(level * MIX.masterGain)), limiter = own(new T.Limiter(MIX.limiterDb)), outputFilter = own(new T.Filter(MIX.outputLowpassHz,'lowpass'));
      master.connect(outputFilter); outputFilter.connect(limiter); limiter.toDestination();
      const dry = own(new T.Gain(1)), wet = own(new T.Gain(0)), filter = own(new T.Filter(1500, 'lowpass'));
      dry.connect(master); wet.connect(master);
      // Native convolution works on file://; no AudioWorklet or downloaded impulse.
      const reverb = own(new T.Convolver(impulse(T))), preDelay = own(new T.Delay(MIX.preDelay));
      filter.connect(dry); filter.connect(preDelay); preDelay.connect(reverb); reverb.connect(wet);
      const voices = {};
      for (const track of new Set(events.map(e => e.track || 'melody'))) {
        const layer = config.layers[track] || config.layers.melody;
        const spec = track === 'melody' ? config : layer;
        const input = mode === 'legacy' && track === 'melody' && config.distortion ? own(new T.Distortion(config.distortion)) : filter;
        if (input !== filter) input.connect(filter);
        const count = Math.max(...events.filter(e=>e.track===track).map(e=>e.voice))+1;
        voices[track] = Array.from({length:count}, () => {
        if (mode === 'legacy') {
      const voice = own(new T[spec.voice](JSON.parse(JSON.stringify(spec.synth))));
          voice.connect(input); return voice;
        } else {
          const bank = bankFor(config,track), urls = banks[bank];
          if (urls && Object.keys(urls).length) {
            // Standard Sampler urls/release/baseUrl API. AudioBuffers are prefetched once per
            // performance to expose real file progress, support cancellation and share decoding.
            const voice = own(new T.Sampler({ urls, baseUrl:MIX.samples[bank].baseUrl,
              attack:bank==='strings'?(track==='bass'?.14:MIX.stringAttack):.003,
              release:bank==='strings'?MIX.stringRelease:MIX.pianoRelease, volume:MIX.sampleVolumes[track] }));
            voice.connect(input); return voice;
          } else return fallbackVoice(T,own,input,track);
        }
        });
      }
      return { resources, master, filter, dry, wet, voices };
    } catch (error) { disposeNodes(resources); throw error; }
  }
  function automate(g, info, time, fraction = 0) {
    const remaining = info.duration * (1 - fraction);
    for (const [param, endpoints] of [[g.filter.frequency, info.filterHz], [g.wet.gain, info.reverbWet], [g.dry.gain, info.reverbWet.map(v => 1 - v)]]) {
      // Hold the preceding ramp, then replace future ramps (also safe after seek/resume).
      param.cancelAndHoldAtTime(time);
      param.setValueAtTime(curve(endpoints, fraction), time);
      param.linearRampToValueAtTime(endpoints[1], time + remaining);
    }
  }
  function voiceFor(g, event) {
    const pool = g.voices[event.track || 'melody'];
    return pool[(event.voice || 0) % pool.length];
  }
  async function playMelody(events, params = {}) {
    if (!root.Tone) throw new Error('音频组件尚未载入，请联网后刷新页面。');
    const T = root.Tone;
    if (T.context.state !== 'running') throw new Error('请点击播放，允许浏览器开启声音。');
    if (!stop()) throw new Error('上一次声音未能完整释放，请刷新页面再试。');
    const serial = playSerial;
    try {
      volume = Math.max(0, Math.min(1, params.volume ?? .65));
      const config = CONFIG[params.emotion || events.meta?.emotion] || CONFIG.calm;
      soundMode = params.mode === 'legacy' ? 'legacy' : 'sample'; simplified = false;
      let banks = {};
      if (soundMode === 'sample') {
        loadController = new AbortController();
        const loaded = await loadBanks(T,events,config,loadController.signal,params.onProgress);
        if (serial !== playSerial) return null;
        loadController = undefined; banks = loaded.banks; simplified = loaded.simplified;
      }
      if (serial !== playSerial) return null;
      if (T.context.state !== 'running') throw new Error('声音已暂停，请再次点击播放。');
      emit(params.onSoundStatus,{mode:soundMode,simplified,message:simplified?'当前使用简化音色':soundMode==='sample'?'乐器采样已就绪':'原合成器对照版'});
      graph = createGraph(T, config, events, 0, soundMode, banks); nodes = graph.resources;
      graph.master.gain.rampTo(volume * MIX.masterGain, MIX.fadeSeconds);
      activeDuration = events.meta?.duration || Math.max(...events.map(e => e.time + e.duration)) + MIX.tailSeconds;
      activeBars = events.meta?.bars || [];
      activeBars.forEach(info => scheduled.push(T.Transport.schedule(time => { if (graph) automate(graph, info, time); }, info.start)));
      events.forEach(event => {
        const voice = voiceFor(graph, event);
        activeEvents.push({ event, voice });
        scheduled.push(T.Transport.schedule(time => { if (!voice.disposed) voice.triggerAttackRelease(event.note, event.duration, time, event.velocity); }, event.time));
      });
      scheduled.push(T.Transport.schedule(time => {
        if (graph) {
          graph.master.gain.setValueAtTime(volume * MIX.masterGain, time);
          graph.master.gain.linearRampToValueAtTime(0, time + MIX.finalFadeSeconds);
        }
      }, activeDuration - MIX.finalFadeSeconds));
      endTimer = setInterval(() => {
        if (running && !paused && position() >= activeDuration) {
          const clean = stop(); params.onComplete?.();
          if (!clean) params.onError?.('声音资源未能完整释放，请刷新页面。');
        }
      }, 100);
      running = true; T.Transport.start('+0.08'); return activeDuration;
    } catch (error) {
      if (serial !== playSerial || error.name === 'AbortError') return null;
      stop(); throw new Error('声音初始化失败，请重试；若仍无声，请刷新或换用系统浏览器。');
    }
  }
  function pause() {
    if (!running || paused) return;
    const T = root.Tone;
    T.Transport.pause(); graph.master.gain.cancelScheduledValues(T.now()); graph.master.gain.rampTo(0, MIX.fadeSeconds);
    Object.values(graph.voices).flat().forEach(voice => silenceVoice(voice,T.now()+MIX.fadeSeconds));
    for (const param of [graph.filter.frequency, graph.dry.gain, graph.wet.gain]) param.cancelAndHoldAtTime(T.now());
    paused = true;
  }
  function resume() {
    if (!running || !paused) return;
    const T = root.Tone, offset = T.Transport.seconds, when = T.now() + .05;
    const info = activeBars.find(bar => offset >= bar.start && offset < bar.start + bar.duration);
    if (info) automate(graph, info, when, (offset - info.start) / info.duration);
    for (const { event, voice } of activeEvents) {
      const remaining = event.time + event.duration - offset;
      if (event.time < offset && remaining > .01 && !voice.disposed) voice.triggerAttackRelease(event.note, remaining, when, event.velocity);
    }
    paused = false; playbackGain(when,offset); T.Transport.start(when);
  }
  function position() {
    if (!running) return 0;
    const T = root.Tone;
    return Math.max(0, T.Transport.getSecondsAtTime ? T.Transport.getSecondsAtTime(T.immediate()) : T.Transport.seconds);
  }
  // Diagnostic render shares the live graph and automation. Call only while stopped.
  async function renderOffline(events, { volume: level = 1, sampleRate = 44100, mode = 'sample' } = {}) {
    if (running || loadController) throw new Error('请先停止播放，再进行离线音频检查。');
    let rendered;
    try {
      const config = CONFIG[events.meta.emotion];
      const loaded = mode === 'sample' ? await loadBanks(root.Tone,events,config,new AbortController().signal) : {banks:{},simplified:mode==='fallback'};
      let result;
      result = await root.Tone.Offline(() => {
        rendered = createGraph(root.Tone, config, events, Math.max(0, Math.min(1, level)), mode, loaded.banks);
        events.meta.bars.forEach(info => automate(rendered, info, info.start));
        events.forEach(event => voiceFor(rendered, event).triggerAttackRelease(event.note, event.duration, event.time, event.velocity));
        rendered.master.gain.setValueAtTime(level * MIX.masterGain, events.meta.duration - MIX.finalFadeSeconds);
        rendered.master.gain.linearRampToValueAtTime(0, events.meta.duration);
      }, events.meta.duration, 2, sampleRate);
      result.soundStatus = {mode,simplified:loaded.simplified}; return result;
    } finally { if (rendered) disposeNodes(rendered.resources); }
  }
  function getPlaybackState() { return { running, paused, loading:!!loadController, mode:soundMode, simplified, nodes: nodes.length, scheduled: scheduled.length, timer: !!endTimer, cleanupErrors }; }
  root.Music = { CONFIG, MIX, hashText, generateMelody, playMelody, stop, pause, resume, setVolume, position, getPlaybackState, renderOffline };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Music;
})(typeof window !== 'undefined' ? window : globalThis);
