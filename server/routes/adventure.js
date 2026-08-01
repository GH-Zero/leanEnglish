const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { translateGrammarSentence } = require('../utils/grammar-translation');
const shuffle = values => [...values].sort(() => Math.random() - 0.5);
const parseOptions = value => { try { const parsed = typeof value === 'string' ? JSON.parse(value) : value; return Array.isArray(parsed) ? parsed : []; } catch (_) { return []; } };

router.get('/levels', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const levels = await db.prepare(`SELECT l.*,p.status,p.best_score,p.stars,p.attempts,p.passed_at FROM adventure_levels l LEFT JOIN user_adventure_progress p ON p.level_id=l.id AND p.user_id=? ORDER BY l.level_no`).all(userId);
    let previousPassed = true;
    const result = levels.map(level => { const unlocked = level.level_no === 1 || previousPassed; const passed = level.status === 'passed'; previousPassed = previousPassed && passed; return { ...level, unlocked, status: passed ? 'passed' : (unlocked ? (level.status || 'not_started') : 'locked'), stars:Number(level.stars||0), best_score:Number(level.best_score||0), attempts:Number(level.attempts||0) }; });
    const current = result.find(item => item.unlocked && item.status !== 'passed') || result[result.length - 1] || null;
    res.json({ code:0, data:{ levels:result, current, passedCount:result.filter(item=>item.status==='passed').length, total:result.length, stars:result.reduce((sum,item)=>sum+item.stars,0) } });
  } catch (error) { console.error('加载主线关卡失败:',error); res.status(500).json({code:500,message:'加载关卡失败'}); }
});

router.get('/level/:id/questions', async (req,res) => {
  try {
    const userId=Number(req.query.userId), levelId=Number(req.params.id);
    const level=await db.prepare('SELECT * FROM adventure_levels WHERE id=?').get(levelId);
    if(!level)return res.status(404).json({code:404,message:'关卡不存在'});
    const previous=level.level_no>1?await db.prepare('SELECT p.status FROM adventure_levels l LEFT JOIN user_adventure_progress p ON p.level_id=l.id AND p.user_id=? WHERE l.level_no=?').get(userId,level.level_no-1):{status:'passed'};
    if(level.level_no>1&&previous?.status!=='passed')return res.status(403).json({code:403,message:'请先通过上一关'});
    const total=level.is_boss?15:12, wordCount=level.is_boss?9:7, grammarCount=total-wordCount;
    const words=await db.prepare('SELECT id,word,phonetic_us,chinese FROM words WHERE level<=? AND chinese IS NOT NULL AND chinese<>\'\' ORDER BY RAND() LIMIT 24').all(Math.min(2,Math.floor((level.level_no-1)/3)));
    const meanings=words.map(item=>item.chinese);
    const wordQuestions=words.slice(0,wordCount).map((item,index)=>({ id:`w-${item.id}-${index}`,sourceId:item.id,type:index%3===1?'listen':'word',prompt:index%3===1?'听发音，选择正确的单词':item.word,audioText:index%3===1?item.word:'',phonetic:item.phonetic_us,translation:item.chinese,options:index%3===1?shuffle([item.word,...shuffle(words.filter(w=>w.id!==item.id).map(w=>w.word)).slice(0,3)]):shuffle([item.chinese,...shuffle(meanings.filter(value=>value!==item.chinese)).slice(0,3)]),answer:index%3===1?item.word:item.chinese,explanation:`${item.word}：${item.chinese}` }));
    const grammarRows=await db.prepare('SELECT q.* FROM grammar_questions q WHERE q.level<=? ORDER BY RAND() LIMIT ?').all(Math.min(2,Math.floor((level.level_no-1)/3)),grammarCount*3);
    const grammarQuestions=[];
    for(const item of grammarRows){const options=parseOptions(item.options);if(options.length<2||!options.includes(item.answer))continue;grammarQuestions.push({id:`g-${item.id}`,sourceId:item.id,type:'grammar',prompt:item.sentence,translation:translateGrammarSentence(item),options:shuffle(options),answer:item.answer,explanation:item.explanation||'请结合句意和语法规则选择。'});if(grammarQuestions.length>=grammarCount)break;}
    const questions=shuffle([...wordQuestions,...grammarQuestions]).slice(0,total);
    if(questions.length<total)return res.status(503).json({code:503,message:'当前关卡题库不足'});
    await db.prepare(`INSERT INTO user_adventure_progress(user_id,level_id,status,attempts) VALUES (?,?,'learning',0) ON DUPLICATE KEY UPDATE status=IF(status='passed',status,'learning'),updated_at=CURRENT_TIMESTAMP`).run(userId,levelId);
    res.json({code:0,data:{level,questions,passScore:Number(level.pass_score),total}});
  } catch(error){console.error('生成关卡题目失败:',error);res.status(500).json({code:500,message:'生成题目失败'});}
});

router.post('/level/:id/submit', async (req,res) => {
  try {
    const userId=Number(req.body.userId),levelId=Number(req.params.id),answers=Array.isArray(req.body.answers)?req.body.answers:[];
    const level=await db.prepare('SELECT * FROM adventure_levels WHERE id=?').get(levelId);if(!level)return res.status(404).json({code:404,message:'关卡不存在'});
    const total=answers.length,correct=answers.filter(item=>item.correct===true).length,score=total?Math.round(correct*100/total):0,passed=total>0&&score>=Number(level.pass_score);
    const stars=passed?(score>=90?2:1):0;
    const previous=await db.prepare('SELECT * FROM user_adventure_progress WHERE user_id=? AND level_id=?').get(userId,levelId);
    const best=Math.max(score,Number(previous?.best_score||0)),bestStars=Math.max(stars,Number(previous?.stars||0));
    await db.prepare(`INSERT INTO user_adventure_progress(user_id,level_id,status,best_score,stars,attempts,passed_at,last_attempt_at) VALUES (?,?,?,?,?,1,IF(?=1,CURRENT_TIMESTAMP,NULL),CURRENT_TIMESTAMP) ON DUPLICATE KEY UPDATE status=IF(status='passed','passed',VALUES(status)),best_score=GREATEST(best_score,VALUES(best_score)),stars=GREATEST(stars,VALUES(stars)),attempts=attempts+1,passed_at=IF(passed_at IS NULL AND VALUES(status)='passed',CURRENT_TIMESTAMP,passed_at),last_attempt_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP`).run(userId,levelId,passed?'passed':'learning',best,bestStars,passed?1:0);
    const wrong=answers.filter(item=>!item.correct).slice(0,20);
    for(const item of wrong)await db.prepare('INSERT INTO adventure_wrong_records(user_id,level_id,question_key,question_type,prompt,user_answer,correct_answer,explanation) VALUES (?,?,?,?,?,?,?,?)').run(userId,levelId,String(item.id||''),String(item.type||''),String(item.prompt||''),String(item.userAnswer||''),String(item.answer||''),String(item.explanation||''));
    const next=passed?await db.prepare('SELECT id,level_no,title FROM adventure_levels WHERE level_no=?').get(level.level_no+1):null;
    res.json({code:0,data:{passed,score,correct,total,stars:bestStars,bestScore:best,wrong,next}});
  } catch(error){console.error('提交关卡结果失败:',error);res.status(500).json({code:500,message:'保存闯关结果失败'});}
});
module.exports=router;