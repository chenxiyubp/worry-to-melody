# 声音设计与采样更换

## 听感调参表

每情绪参数集中于 Music.CONFIG；公共参数集中于 Music.MIX，均在 music.js 顶部定义。以下都是需要人工试听的项目，事件和峰值测试不代替耳朵判断。

| 需要试听确认 | 调参字段 | 当前值 / 作用 |
|---|---|---|
| 钢琴音头、力度是否合适 | MIX.sampleVolumes.melody、MIX.pianoRelease；CONFIG[情绪].pianoVelocity | 主旋律−7dB，释放0.9秒；愤怒系数1.16，疲惫0.82 |
| 大提琴是否过慢、过厚或移调感明显 | MIX.stringAttack/stringRelease；CONFIG[情绪].padTranspose、layers.pad.fromBar | 起音0.55秒、释放1.2秒；焦虑高八度、愤怒低八度 |
| 简化音色是否仍刺耳 | MIX.fallbackAttack/fallbackPadAttack/fallbackDetune/fallbackLowpassHz | 0.06/0.65秒、两层±6音分三角波、3200Hz低通 |
| 乐句起伏是否做作、重音是否明确 | MIX.phraseDynamics、velocityJitter；CONFIG[情绪].stages[].dynamics | 句内0.78→1→1.18→0.64，种子微扰±8%；阶段力度另乘 |
| 松紧是否像卡顿、句尾是否拖沓 | MIX.strongJitterMs/weakJitterMs/rubato | 强拍±10ms、弱拍±25ms；句尾减速3%–6% |
| 连奏是否浑浊或断裂 | MIX.legato/phraseEndBeats、pianoRelease | 普通旋律时值105%–120%，句尾至少2拍 |
| 分解和弦是否过散 | MIX.chordSpread；CONFIG[情绪].layers.harmony.velocity | 相邻和弦音错开20–60ms，由低到高，根音/五音/高八度三音开放排列 |
| 低音是否抢旋律 | MIX.sampleVolumes.bass/pad、CONFIG[情绪].layers.bass.velocity | 低音−21dB、铺底−25dB，每小节根音加五音，结尾只留根音 |
| 转折段上行是否有方向、高潮位置是否合适 | CONFIG[情绪].phrasing.turnMotif/motif、rhythms、maxLeap | 可编辑模进与节奏；相邻乐句节奏模板不同 |
| 星光与加倍是否太显眼 | MIX.sampleVolumes.octave/sparkle、CONFIG[情绪].layers.octave/sparkle.velocity | 均用高音钢琴采样；尾声高八度先释放 |
| 空间是否过湿、尾声是否切得太早 | MIX.reverbSeconds/preDelay/tailSeconds/finalFadeSeconds；CONFIG[情绪].stages[].reverbWet | 4.2秒脉冲、30ms预延迟、4.5秒尾音区、最后1秒淡出；湿度0.25→0.33，无PingPongDelay |
| 整体偏轻或高音刺耳 | MIX.masterGain/limiterDb/outputLowpassHz/sampleVolumes | 0.7、−3dB Limiter、7200Hz主低通；实测无削波不意味着音量主观上足够 |
| 长度与收束不合适 | CONFIG[情绪].duration；MIX.finalChordBeats/finalBassBeats | 34–39秒，末和弦4拍、低音4.5拍；改后重跑边界检查 |

强度1–2只有旋律与低音；3增加钢琴和声、弦乐铺底及末段高八度；4增加前段琶音和末段星光；5增加低音轻点。采样版的轻点也是钢琴低音，未接入电子鼓或失真。铺底入点分别为焦虑第4、难过第1、愤怒/平静第7、疲惫第13小节；各层门槛/范围仍由 layers 控制。原合成器模式保留旧音色设置，仅供对照；新采样版及简化回退不使用方波、锯齿波、FM或Distortion。

## 如何更换采样来源

1. 修改 MIX.samples.piano / strings 的 baseUrl 与 urls。urls 是“真实录音音高→确实存在的文件名”，不能靠拼接猜名字。钢琴采用 [Tone.js 官方 Sampler 示例](https://tonejs.github.io/examples/sampler) 的完整30键映射；例如 D#4 对应 Ds4.mp3。Sampler会对未直接采样的音高重采样。
2. 弦乐采用 [N. P. Brosowsky 的 tonejs-instruments 大提琴映射](https://github.com/nbrosowsky/tonejs-instruments)，选取C2/E2/A2至C4/E4/A4及C5共10键。未引入其加载器或新运行库。钢琴是 Alexander Holm 的 Salamander Grand Piano，[源仓库说明](https://github.com/Tonejs/audio/tree/master/salamander)及弦乐库均标注CC BY 3.0；保留作者、来源和[许可链接](https://creativecommons.org/licenses/by/3.0/)。本应用对播放音高、包络和混音作了调整，未编辑源文件。
3. 新地址需HTTPS、允许跨域、浏览器可解码，部署前逐个请求并解码验证。直接 file:// 运行不要改成本地 fetch 音频路径：不同浏览器可能拦截；可使用支持CORS的托管地址。项目仍无后端。
4. 加载器只获取本首曲目实际用到的最近采样键，最多6个并发，用文件处理数量显示进度（不是字节进度）。预取并共享解码后的AudioBuffer，再交给标准 Tone.Sampler({ urls, baseUrl, attack, release, volume })；这是为了支持取消、超时和进度，并避免各声部重复解码。全曲不跨播放保留采样节点，HTTP缓存由浏览器管理。
5. 每次准备最多12秒。某一乐器加载/解码失败，则该乐器全组退为慢起音、低通、双层微失谐三角波；另一组成功时仍可用采样。中文提示为“当前使用简化音色”。停止、切换音色、重新生成和离开页面均取消旧加载，晚到回调不能重启旧曲。
6. 此映射为每键一条音频，velocity改变播放增益，并不是16层力度采样引擎；没有真实踏板/共振或弦乐连续拉弓引擎。长音是否足够、移调是否明显仍需试听。替换采样后重做完整波形、资源回收与手机加载检查。

