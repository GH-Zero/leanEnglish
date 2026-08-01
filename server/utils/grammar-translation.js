const phraseMap = [
  ['this morning','今天早上'],['every morning','每天早上'],['every day','每天'],['every night','每天晚上'],['last night','昨晚'],['last year','去年'],['last summer','去年夏天'],['next week','下周'],['next month','下个月'],['next year','明年'],['right now','此刻'],['at the moment','此刻'],['two days ago','两天前'],['ten minutes ago','十分钟前'],['after class','课后'],['before class','课前'],['on Sundays','每周日'],['on Monday','星期一'],['in the morning','早上'],['in the afternoon','下午'],['in the evening','晚上'],['at seven','七点'],['at eight','八点'],['at nine','九点'],['at ten','十点'],['go to school','去上学'],['to school','去学校'],['goes to school','去上学'],['went to school','去上学'],['come to school','来学校'],['get up','起床'],['gets up','起床'],['have breakfast','吃早饭'],['has breakfast','吃早饭'],['had breakfast','吃了早饭'],['eat breakfast','吃早饭'],['ate breakfast','吃了早饭'],['play basketball','打篮球'],['play football','踢足球'],['play tennis','打网球'],['play the piano','弹钢琴'],['do homework','做作业'],['is doing homework','正在做作业'],['watch TV','看电视'],['read books','读书'],['speak English','说英语'],['learn English','学习英语'],['study English','学习英语'],['listen to music','听音乐'],['take photos','拍照'],['make dinner','做晚饭'],['cook dinner','做晚饭'],['wait for the bus','等公交车'],['at the bus stop','在公交站'],['in the classroom','在教室里'],['in the park','在公园里'],['on the table','在桌子上'],['under the table','在桌子下面'],['under the chair','在椅子下面'],['in the east','在东方'],['very well','非常好'],['very tired','很累'],['very happy','很开心'],['a lot of','许多'],['how often','多久一次'],['how many','多少'],['how much','多少'],['what time','几点'],['there is','有'],['there are','有'],['there was','曾经有'],['there were','曾经有'],['there will be','将会有'],['would like','想要'],['be able to','能够'],['have to','必须'],['used to','过去常常'],['is going to','将要'],['are going to','将要'],['will be','将会'],['has been','已经'],['have been','已经']
];
const words = {
  i:'我',you:'你',he:'他',she:'她',it:'它',we:'我们',they:'他们',my:'我的',your:'你的',his:'他的',her:'她的',our:'我们的',their:'他们的',this:'这个',that:'那个',these:'这些',those:'那些',who:'谁',what:'什么',where:'哪里',when:'什么时候',why:'为什么',how:'怎样',which:'哪个',a:'一',an:'一',the:'',am:'是',is:'是',are:'是',was:'曾是',were:'曾是',be:'是',been:'是',being:'正在',have:'有',has:'有',had:'有',do:'',does:'',did:'',not:'不',no:'不',can:'能',could:'能',may:'可以',might:'可能',must:'必须',should:'应该',will:'将',would:'会',shall:'将',and:'和',or:'或者',but:'但是',because:'因为',if:'如果',than:'比',as:'像',for:'为了',from:'从',to:'到',at:'在',in:'在',on:'在',under:'在下面',over:'在上方',between:'在之间',with:'和',without:'没有',of:'的',by:'由',about:'关于',before:'之前',after:'之后',during:'期间',while:'当',tomorrow:'明天',yesterday:'昨天',today:'今天',now:'现在',often:'经常',usually:'通常',always:'总是',sometimes:'有时',never:'从不',already:'已经',yet:'还',just:'刚刚',soon:'很快',here:'这里',there:'那里',home:'家',school:'学校',class:'课',room:'房间',park:'公园',shop:'商店',bank:'银行',station:'车站',hospital:'医院',library:'图书馆',restaurant:'餐厅',teacher:'老师',student:'学生',students:'学生们',friend:'朋友',friends:'朋友们',father:'父亲',mother:'母亲',parents:'父母',sister:'姐姐',brother:'哥哥',children:'孩子们',child:'孩子',people:'人们',boy:'男孩',girl:'女孩',man:'男人',woman:'女人',cat:'猫',dog:'狗',bird:'鸟',book:'书',books:'书',letter:'信',letters:'信',table:'桌子',chair:'椅子',window:'窗户',door:'门',car:'汽车',bus:'公交车',train:'火车',bike:'自行车',food:'食物',water:'水',milk:'牛奶',coffee:'咖啡',tea:'茶',breakfast:'早饭',lunch:'午饭',dinner:'晚饭',work:'工作',meeting:'会议',movie:'电影',game:'比赛',party:'聚会',question:'问题',answer:'答案',lesson:'课程',English:'英语',english:'英语',Chinese:'中文',chinese:'中文',good:'好',better:'更好',best:'最好',happy:'开心',sad:'难过',beautiful:'漂亮',interesting:'有趣',important:'重要',easy:'简单',difficult:'困难',big:'大',small:'小',new:'新',old:'旧',young:'年轻',tall:'高',short:'矮',fast:'快',slow:'慢',hot:'热',cold:'冷',read:'读',reads:'读',reading:'阅读',write:'写',writes:'写',writing:'写',speak:'说',speaks:'说',talk:'交谈',talks:'交谈',talking:'交谈',say:'说',says:'说',said:'说了',go:'去',goes:'去',went:'去了',come:'来',comes:'来',came:'来了',see:'看见',sees:'看见',saw:'看见了',look:'看',looks:'看起来',watch:'观看',watches:'观看',watched:'观看了',play:'玩',plays:'玩',played:'玩了',study:'学习',studies:'学习',studied:'学习了',work:'工作',works:'工作',worked:'工作了',live:'居住',lives:'居住',lived:'居住过',like:'喜欢',likes:'喜欢',liked:'喜欢',want:'想要',wants:'想要',need:'需要',needs:'需要',help:'帮助',helps:'帮助',make:'制作',makes:'制作',made:'制作了',take:'拿',takes:'拿',took:'拿了',give:'给',gives:'给',gave:'给了',buy:'买',buys:'买',bought:'买了',eat:'吃',eats:'吃',ate:'吃了',drink:'喝',drinks:'喝',drank:'喝了',sing:'唱歌',sings:'唱歌',sang:'唱了',run:'跑',runs:'跑',ran:'跑了',walk:'走路',walks:'走路',walked:'走了',open:'打开',opens:'打开',opened:'打开了',close:'关闭',closes:'关闭',closed:'关闭了',finish:'完成',finished:'完成了',start:'开始',started:'开始了',arrive:'到达',arrives:'到达',arrived:'到达了',visit:'参观',visits:'参观',visited:'参观了',call:'打电话',calls:'打电话',called:'打了电话',wait:'等待',waiting:'正在等待',sleep:'睡觉',sleeping:'正在睡觉',cook:'做饭',cooking:'正在做饭',rain:'下雨',raining:'正在下雨',learn:'学习',learns:'学习',learned:'学会了'
};
function cleanSource(value) {
  return String(value || '').trim().replace(/^[\u4e00-\u9fff]{2,12}[：:]\s*/, '').replace(/\s+/g, ' ');
}
function translateComparison(source) {
  const names = { 'the blue line':'蓝线', 'the red one':'红线', 'the red line':'红线', 'tom':'汤姆', 'jim':'吉姆', 'jerry':'杰瑞', 'this book':'这本书', 'that one':'那本书', 'a car':'汽车', 'a bike':'自行车', 'today':'今天', 'yesterday':'昨天', 'this bag':'这个包', 'mine':'我的包', 'she':'她', 'me':'我' };
  const match = source.match(/^(.+?)\s+(?:is|are|was|were)\s+___\s+than\s+(.+?)[.!?]?$/i);
  if (!match) return '';
  const subject = names[match[1].toLowerCase()] || match[1];
  const object = names[match[2].toLowerCase()] || match[2];
  return `${subject}比${object}更 ___。`;
}
const verifiedTranslations = new Map([
  ['Please give the pen to ___.', '请把这支钢笔交给 ___。'],
  ['This book is ___.', '这本书是 ___ 的。'],
  ['___ is my best friend.', '___ 是我最好的朋友。'],
  ['The children enjoyed ___ at the party.', '孩子们在聚会上玩得很 ___。'],
  ['___ of the two answers is correct.', '两个答案中，___ 是正确的。'],
  ['The red bag belongs to ___.', '这个红色书包是 ___ 的。'],
  ['These seats are ___, not theirs.', '这些座位是 ___ 的，不是他们的。'],
  ['We made the cake by ___.', '我们 ___ 做了这个蛋糕。'],
  ['___ student must bring a pencil.', '___ 位学生都必须带一支铅笔。'],
  ['Is there ___ in the box?', '盒子里有 ___ 吗？'],
  ['She ___ a blue dress today.', '她今天 ___ 一条蓝色连衣裙。'],
  ['___ you help me, please?', '请问你 ___ 帮助我吗？'],
  ['___ I use your phone?', '我 ___ 用一下你的电话吗？'],
  ['Please wait ___ the bus stop.', '请在公交车站 ___ 等候。'],
  ['The car ___ is red is mine.', '那辆 ___ 是红色的汽车是我的。'],
  ['The girl ___ bag is red is Lucy.', '书包是红色的那个女孩是露西，她的书包 ___。'],
  ['Can you tell me ___ she lives?', '你能告诉我她住在 ___ 吗？'],
  ['Can you tell me where he ___?', '你能告诉我他住在哪里吗？'],
  ['There ___ a book on the desk.', '桌子上 ___ 一本书。'],
  ['___ there a bank near here?', '这附近 ___ 银行吗？'],
  ['There ___ some milk in the glass.', '杯子里 ___ 一些牛奶。'],
  ['There ___ two cats under the table.', '桌子下面 ___ 两只猫。'],
  ['___ the window, please.', '请 ___ 窗户。'],
  ['Please ___ quietly.', '请安静地 ___。'],
  ['He ___ play tennis on Mondays.', '他每周一 ___ 打网球。'],
  ['I ___ like spicy food.', '我 ___ 喜欢辛辣食物。'],
  ['I ___ my homework now.', '我现在正在 ___ 作业。'],
  ['They ___ dinner in the kitchen.', '他们正在厨房里 ___ 晚饭。'],
  ['The boy ___ is running is Tom.', '正在跑步的那个男孩是汤姆，空格处应填 ___。'],
  ['I visited the town ___ I was born.', '我参观了我出生的那个城镇，空格处应填 ___。'],
  ['I know ___ she is busy.', '我知道她很忙，空格处应填 ___。'],
  ['I wonder ___ he will come.', '我想知道他 ___ 会来。'],
  ['She is ___ doctor.', '她是一名 ___ 医生。'],
  ['I need ___ umbrella.', '我需要一把 ___ 雨伞。'],
  ['He can play ___ piano.', '他会弹 ___ 钢琴。'],
  ['___ moon goes around the earth.', '月亮绕着地球转，空格处应填 ___。'],
  ['We have lunch at ___ noon.', '我们在中午吃午饭，空格处应填 ___。'],
  ['The blue line is ___ than the red one.', '蓝线比红线更 ___。']
]);
function translateGrammarSentence(question = {}) {
  let source = cleanSource(question.sentence || question.question);
  source = source.replace(/___/g, '___');
  if (verifiedTranslations.has(source)) return verifiedTranslations.get(source);
  const comparison = translateComparison(source);
  if (comparison) return comparison;
  if (!source) return '';
  const exactPatterns = [
    [/^I ___ breakfast at seven this morning\.?$/i, '我今天早上七点 ___ 早饭。'],
    [/^I ___ breakfast at seven every day\.?$/i, '我每天七点 ___ 早饭。'],
    [/^Lucy ___ to school by bus\.?$/i, '露西乘公交车 ___ 上学。'],
    [/^We ___ basketball after class\.?$/i, '我们课后 ___ 篮球。'],
    [/^My father ___ coffee every morning\.?$/i, '我父亲每天早上 ___ 咖啡。']
  ];
  const exact = exactPatterns.find(([pattern]) => pattern.test(source));
  if (exact) return exact[1];
  let text = ` ${source.replace(/[’']/g, "'")} `;
  phraseMap.sort((a,b)=>b[0].length-a[0].length).forEach(([en,zh]) => { text = text.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'gi'), ` ${zh} `); });
  const tokens = text.match(/[\u4e00-\u9fff]+|___|[A-Za-z]+(?:'[A-Za-z]+)?|\d+|[^\sA-Za-z\u4e00-\u9fff]/g) || [];
  const translated = tokens.map(token => {
    if (/^[\u4e00-\u9fff]+$/.test(token) || token === '___' || /^\d+$/.test(token)) return token;
    const key = token.toLowerCase();
    return Object.prototype.hasOwnProperty.call(words, token) ? words[token] : (Object.prototype.hasOwnProperty.call(words, key) ? words[key] : token);
  }).filter(Boolean).join(' ').replace(/\s+([，。！？,.!?])/g,'$1').replace(/[.]+$/,'。').replace(/\s+/g,' ').trim();
  const natural = translated
    .replace(/^(我|你|他|她|我们|他们) (.+) (昨天|今天|明天|昨晚|今天早上|每天|每天早上)([。！？]?)$/, '$1 $3 $2$4')
    .replace(/ 到 学校/g, ' 去学校')
    .replace(/ 去学校 昨天/g, ' 昨天去学校');
  return natural || String(question.explanation || '').trim();
}
module.exports = { translateGrammarSentence, cleanSource };
