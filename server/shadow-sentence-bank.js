const learners = [
  ['Alice','爱丽丝'],['Ben','本'],['Cathy','凯茜'],['David','大卫'],['Emma','艾玛'],['Frank','弗兰克'],['Grace','格蕾丝'],['Henry','亨利'],['Ivy','艾薇'],['Jack','杰克'],
  ['Kelly','凯莉'],['Leo','利奥'],['Mia','米娅'],['Noah','诺亚'],['Olivia','奥利维娅'],['Peter','彼得'],['Ruby','鲁比'],['Sam','萨姆'],['Tina','蒂娜'],['Victor','维克托'],
  ['Wendy','温迪'],['Aaron','亚伦'],['Bella','贝拉'],['Colin','科林'],['Diana','戴安娜'],['Eric','埃里克'],['Fiona','菲奥娜'],['George','乔治'],['Helen','海伦'],['Jason','杰森']
];
const patterns = [
  ['reads a book every evening.','每天晚上读一本书。','日常'],['walks to school on sunny days.','在晴天步行去学校。','校园'],['drinks a glass of water after breakfast.','早餐后喝一杯水。','健康'],
  ['practices English for thirty minutes a day.','每天练习三十分钟英语。','学习'],['helps prepare dinner for the family.','帮家人准备晚餐。','家庭'],['takes the bus to work every morning.','每天早上乘公交车上班。','交通'],
  ['listens to music while cleaning the room.','打扫房间时听音乐。','日常'],['buys fresh fruit at the weekend market.','在周末市场购买新鲜水果。','购物'],['calls a friend after finishing work.','下班后给朋友打电话。','社交'],
  ['writes important plans in a notebook.','把重要计划写在笔记本里。','学习'],['visits the library twice a week.','每周去图书馆两次。','学习'],['cooks a healthy meal on Sunday.','星期天做一顿健康的饭。','饮食'],
  ['checks the weather before leaving home.','出门前查看天气。','日常'],['keeps the bedroom clean and tidy.','保持卧室干净整洁。','家庭'],['answers emails before the morning meeting.','在晨会前回复邮件。','职场'],
  ['wears a warm coat on cold days.','在寒冷的日子穿暖和的外套。','生活'],['shares useful ideas with the team.','与团队分享有用的想法。','职场'],['orders a cup of tea at the cafe.','在咖啡馆点一杯茶。','餐饮'],
  ['spends time with the family after work.','下班后陪伴家人。','家庭'],['goes for a short walk before bedtime.','睡觉前散一会儿步。','健康']
];
function buildShadowSentenceBank(){const result=[];for(const [name,chineseName] of learners){for(let index=0;index<patterns.length;index+=1){const [english,chinese,tag]=patterns[index];result.push({text:`${name} ${english}`,chinese:`${chineseName}${chinese}`,level:index<7?0:(index<14?1:2),tag,category:tag,source:'curated-bank'});}}return result;}
module.exports={buildShadowSentenceBank};