/* Fixed labelled corpus. No external dependencies. Browser: EmotionTests.run(Emotion.analyze).
 * Node: node outputs/emotion-test.js --show dev --out work/results.json
 * Labels describe the dominant CURRENT feeling, not clinical diagnoses.
 * Context-only and one-word labels are provisional human judgements.
 * Frozen stratified split: 21 development + 9 holdout examples per class.
 * Do not use holdout mistakes to tune this version.
 */
(function (root) {
  'use strict';
  const CLASSES = ['anxious', 'sad', 'angry', 'tired', 'calm'];
  const DATA = {
    anxious: [
      ['明天要答辩，我还没写完', 'event'],
      ['一想到考试就紧张得手心冒汗', 'direct'],
      ['我特别担心这次面试会失败', 'direct'],
      ['要交作品了，我心里七上八下', 'direct'],
      ['完了完了，进度要崩了', 'slang'],
      ['救命，ddl要到了，我心态炸了', 'slang,multilingual'],
      ['这次真要寄了，复试马上开始', 'slang,event'],
      ['不是难过，是害怕明天的结果', 'negation,contrast'],
      ['我不累，就是担心交不上作业', 'negation,mixed'],
      ['没有生气，只是怕赶不上车', 'negation'],
      ['本来很平静，但是马上轮到我演讲了，心慌', 'contrast'],
      ['昨晚睡好了，不过现在又开始焦虑', 'contrast'],
      ['以为准备好了，结果材料还缺两页，来不及了', 'contrast,event'],
      ['距提交截止还有十分钟，文件还没导出来', 'event'],
      ['明早的高铁，现在还没找到身份证', 'event'],
      ['下周查成绩，我可能挂科', 'event'],
      ['明天要上台汇报，PPT才做了一半', 'event'],
      ['紧张得睡不着，还很难过', 'mixed'],
      ['累是累，但更害怕论文交不上', 'mixed,contrast'],
      ['又担心又生气，担心的事一件接一件', 'mixed'],
      ['睡不着', 'short'],
      ['慌', 'short'],
      ['怎么办啊', 'short'],
      ['坐立不安', 'short'],
      ['deadline 快到了 ddl', 'multilingual,event'],
      ['PANIC!! I am so nervous', 'multilingual'],
      ['面试前 😰😰', 'multilingual'],
      ['明天 presentation，心跳快得不行 (；´д｀)ゞ', 'multilingual'],
      ['焦虑焦虑焦虑，完全静不下来！！！', 'direct'],
      ['快要迟到了，打车一直没人接单', 'event']
    ],
    sad: [
      ['失恋了，一个人好孤独', 'direct,event'],
      ['今天真的很难过，眼泪停不下来', 'direct'],
      ['努力了这么久还是失望', 'direct'],
      ['听到这件事心里很委屈', 'direct'],
      ['半夜又emo了', 'slang,multilingual'],
      ['看到旧照片直接破防，想哭', 'slang'],
      ['被拉黑了，心都碎成渣了', 'slang,event'],
      ['我并不生气，只是伤心', 'negation'],
      ['不是累，是心里空落落的', 'negation'],
      ['没有紧张，就是有些失落', 'negation'],
      ['本来很生气，不过现在只剩难过', 'contrast'],
      ['以为有人记得，结果生日一个祝福也没有', 'contrast,event'],
      ['昨天还开心，可是今天他们把我忘了', 'contrast,event'],
      ['我们分手了', 'event'],
      ['所有人都被邀请了，唯独没有我', 'event'],
      ['发出去的消息一直没有回复', 'event'],
      ['一个人过生日，蛋糕也没人一起吃', 'event'],
      ['我好累，也很伤心，真的很想哭', 'mixed'],
      ['虽然担心工作，但更难过朋友离开了', 'mixed,contrast'],
      ['又孤独又委屈，生气也没用了', 'mixed'],
      ['好难受', 'short'],
      ['心酸', 'short'],
      ['失落', 'short'],
      ['😭', 'short,multilingual'],
      ['I feel lonely，没人能说话', 'multilingual'],
      ['sad到不想说话了', 'multilingual,slang'],
      ['今天只想躲起来 T_T', 'multilingual'],
      ['为什么又是我被丢下 😢', 'multilingual,event'],
      ['想念一个再也见不到的人', 'direct'],
      ['明明在场却被所有人忽视', 'event']
    ],
    angry: [
      ['老板又改需求，气死我了！！', 'direct,event'],
      ['凭什么让我背这个锅', 'direct,event'],
      ['这种不公平的事真的让我愤怒', 'direct'],
      ['你怎么能这样说话，我很生气', 'direct'],
      ['甲方反复横跳，我心态炸了', 'slang,event'],
      ['这操作给我整无语了', 'slang'],
      ['我真服了，纯纯大冤种', 'slang'],
      ['我不难过，就是气不过', 'negation'],
      ['没有很累，但有人插队让我火大', 'negation,mixed'],
      ['不是担心，是对这种行为恼火', 'negation'],
      ['本来想算了，但是越想越气', 'contrast'],
      ['刚刚还挺平静，结果又被甩锅了', 'contrast,event'],
      ['我本来很难过，可是现在只想骂人', 'contrast'],
      ['报告被打回第三次', 'event'],
      ['没带伞，鞋全湿了', 'event'],
      ['明明不是我的错，却当众被骂', 'event'],
      ['排队半小时，被人直接插到前面', 'event'],
      ['又累又气', 'mixed,short'],
      ['伤心归伤心，可这也太不公平了', 'mixed,contrast'],
      ['有点焦虑，但最烦的是他们一直改需求', 'mixed,contrast'],
      ['烦', 'short'],
      ['火大', 'short'],
      ['气炸了', 'short,slang'],
      ['😡', 'short,multilingual'],
      ['I am ANGRY，别再惹我了!!!', 'multilingual'],
      ['WTF 又是谁删了我的文档', 'multilingual,slang'],
      ['什么破规定啊 (╯°□°）╯︵ ┻━┻', 'multilingual'],
      ['气得头疼 🤬', 'multilingual'],
      ['烦烦烦，这事没完了吗？？？', 'direct'],
      ['白做了一整天，他们说全部推翻', 'event']
    ],
    tired: [
      ['连续加班三天，累到不行', 'direct,event'],
      ['眼皮都睁不开了，我好困', 'direct'],
      ['身体疲惫，连说话都没力气', 'direct'],
      ['我现在只想休息一下', 'direct'],
      ['电量见底，想摆烂', 'slang'],
      ['人已经麻了，连手指都不想动', 'slang'],
      ['打工人已下线，彻底没电', 'slang'],
      ['不生气了，就是累', 'negation'],
      ['不是焦虑，我只是没睡够', 'negation'],
      ['没有难过，单纯疲倦', 'negation'],
      ['本来很紧张，不过忙完后只剩疲惫', 'contrast'],
      ['早上还有精神，结果加班到现在撑不住了', 'contrast,event'],
      ['刚才挺气的，但是现在困得睁不开眼', 'contrast'],
      ['通宵赶完报告，早晨又去上班', 'event'],
      ['三天一共睡了六小时', 'event'],
      ['站了一整天，腿抬不起来', 'event'],
      ['连续值班，午饭也顾不上吃', 'event'],
      ['有点委屈，但更累得不想动', 'mixed,contrast'],
      ['难过了一晚上，现在只剩困', 'mixed,contrast'],
      ['又气又累，只想补觉', 'mixed'],
      ['困', 'short'],
      ['累', 'short'],
      ['没劲', 'short'],
      ['想躺平', 'short,slang'],
      ['so exhausted，真的扛不住了', 'multilingual'],
      ['battery low，今天到此为止', 'multilingual,slang'],
      ['😮‍💨 今天连轴转', 'multilingual,event'],
      ['工作完了只想睡觉 🥱', 'multilingual'],
      ['困困困，脑子转不动了', 'direct'],
      ['最近一直睡不够，像被掏空', 'event']
    ],
    calm: [
      ['今天天气不错', 'direct'],
      ['此刻感觉很平静', 'direct'],
      ['工作做完了，终于松了一口气', 'direct'],
      ['慢慢喝茶，享受这会儿的安静', 'direct'],
      ['稳了，问题已经搞定', 'slang'],
      ['今天佛系一点，不跟自己较劲', 'slang'],
      ['刚才emo，现在已经满血复活啦', 'slang,contrast'],
      ['我并不难过', 'negation'],
      ['没有很累', 'negation'],
      ['别担心，我真的没事', 'negation'],
      ['本来很紧张，不过现在好多了', 'contrast'],
      ['昨天很生气，但是今天已经释怀', 'contrast'],
      ['虽然刚开始有点慌，然而现在放心了', 'contrast'],
      ['按时交了报告，周末在家晒太阳', 'event'],
      ['朋友陪我散步，一起吃了晚饭', 'event'],
      ['忙完所有事情，坐下来看看书', 'event'],
      ['今天没有什么特别的事', 'event'],
      ['不累也不气，现在心情很舒畅', 'mixed,negation'],
      ['不再焦虑，也不觉得孤独了', 'mixed,negation'],
      ['担心和难过都过去了，现在挺好', 'mixed,contrast'],
      ['还好', 'short'],
      ['没事', 'short'],
      ['安心', 'short'],
      ['', 'short'],
      ['I feel relaxed，今天很自在', 'multilingual'],
      ['all good，事情解决啦', 'multilingual,slang'],
      ['没什么事，🙂', 'multilingual'],
      ['终于结束啦 (｡･ω･｡)ﾉ♡', 'multilingual'],
      ['   ', 'short'],
      ['在家整理书架，窗外的树叶在摇晃', 'event']
    ]
  };
  function shuffledIndices(size, seed) {
    const list = Array.from({ length: size }, (_, i) => i);
    for (let i = size - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1); [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }
  const cases = CLASSES.flatMap((emotion, index) => {
    const holdout = new Set(shuffledIndices(DATA[emotion].length, 20261017 + index * 997).slice(0, 9));
    return DATA[emotion].map(([text, tags], i) => ({ id: emotion + '-' + String(i + 1).padStart(2, '0'), text, expected: emotion, tags: tags.split(','), split: holdout.has(i) ? 'holdout' : 'dev' }));
  });
  function evaluate(analyze, split) {
    const selected = cases.filter(item => !split || item.split === split), matrix = CLASSES.map(() => CLASSES.map(() => 0)), errors = [];
    selected.forEach(item => {
      const result = analyze(item.text), actual = CLASSES.indexOf(result.emotion);
      if (actual < 0) throw new Error('Unknown emotion: ' + result.emotion);
      matrix[CLASSES.indexOf(item.expected)][actual]++;
      if (item.expected !== result.emotion) errors.push({ ...item, actual: result.emotion, result });
    });
    const perClass = Object.fromEntries(CLASSES.map((name, i) => {
      const correct = matrix[i][i], support = matrix[i].reduce((a, b) => a + b, 0), predicted = matrix.reduce((s, row) => s + row[i], 0);
      return [name, { precision: predicted ? correct / predicted : 0, recall: support ? correct / support : 0, correct, support, predicted }];
    }));
    return { total: selected.length, correct: selected.length - errors.length, accuracy: (selected.length - errors.length) / selected.length, classes: CLASSES, perClass, matrix, errors };
  }
  function run(analyze) { return { dev: evaluate(analyze, 'dev'), holdout: evaluate(analyze, 'holdout'), all: evaluate(analyze) }; }
  function coverage() {
    const tags = {};
    cases.forEach(c => c.tags.forEach(tag => { tags[tag] = (tags[tag] || 0) + 1; }));
    return { total: cases.length, perClass: Object.fromEntries(CLASSES.map(k => [k, cases.filter(c => c.expected === k).length])), tags };
  }
  root.EmotionTests = { cases, CLASSES, evaluate, run, coverage };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root.EmotionTests;
    if (require.main === module) {
      const fs = require('node:fs'), path = require('node:path'), args = process.argv.slice(2);
      const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
      const engine = require(path.resolve(option('--module', path.join(__dirname, 'emotion.js'))));
      const result = { coverage: coverage(), ...run(engine.analyze) }, out = option('--out', '');
      if (out) fs.writeFileSync(out, JSON.stringify(result, null, 2));
      const show = option('--show', 'all');
      console.log(JSON.stringify({ coverage: result.coverage, [show]: result[show] }, null, 2));
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
