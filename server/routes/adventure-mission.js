const express = require('express');
const { db } = require('../db');

const router = express.Router();
let schemaReady;

function ensureSchema() {
  if (!schemaReady) schemaReady = db.pool.query(`CREATE TABLE IF NOT EXISTS adventure_mission_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,user_id INT NOT NULL,mission_key VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',best_score INT NOT NULL DEFAULT 0,
    stars INT NOT NULL DEFAULT 0,attempts INT NOT NULL DEFAULT 0,completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_adventure_mission (user_id, mission_key),INDEX idx_adventure_mission_user (user_id, status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
  return schemaReady;
}

const mission = { key:'restaurant-ordering-v1',title:'十分钟点餐挑战',scene:'餐厅点餐',objective:'为你和朋友点一份不辣的鸡肉套餐、一份意面和两杯饮料',estimatedMinutes:6,rewards:{xp:60,badge:'点餐新手'} };

router.get('/restaurant', async (req,res) => {
  try { await ensureSchema(); const progress=await db.prepare('SELECT status,best_score,stars,attempts,completed_at FROM adventure_mission_progress WHERE user_id=? AND mission_key=?').get(Number(req.query.userId),mission.key); res.json({code:0,data:{mission,progress:progress||{status:'not_started',best_score:0,stars:0,attempts:0}}}); }
  catch(error){console.error('加载餐厅任务失败:',error);res.status(500).json({code:500,message:'加载场景任务失败'});}
});

router.post('/restaurant/complete', async (req,res) => {
  try {
    await ensureSchema(); const userId=Number(req.body.userId); const steps=Array.isArray(req.body.steps)?req.body.steps:[];
    const allowed=['menu','dialogue','build','speech','boss'];
    const results=new Map(steps.filter(item=>allowed.includes(String(item.id))).map(item=>[String(item.id),item.passed===true]));
    const correct=allowed.filter(id=>results.get(id)===true).length;
    const score=Math.round(correct*100/allowed.length),passed=allowed.every(id=>results.has(id))&&correct>=4,stars=passed?(score===100?3:2):0;
    await db.prepare(`INSERT INTO adventure_mission_progress(user_id,mission_key,status,best_score,stars,attempts,completed_at) VALUES (?,?,?,?,?,1,IF(?=1,CURRENT_TIMESTAMP,NULL)) ON DUPLICATE KEY UPDATE status=IF(status='passed','passed',VALUES(status)),best_score=GREATEST(best_score,VALUES(best_score)),stars=GREATEST(stars,VALUES(stars)),attempts=attempts+1,completed_at=IF(completed_at IS NULL AND VALUES(status)='passed',CURRENT_TIMESTAMP,completed_at)`).run(userId,mission.key,passed?'passed':'learning',score,stars,passed?1:0);
    res.json({code:0,data:{passed,score,stars,correct,total:5,reward:passed?mission.rewards:null}});
  } catch(error){console.error('保存餐厅任务失败:',error);res.status(500).json({code:500,message:'保存场景任务失败'});}
});
module.exports=router;
