const express=require('express');
const router=express.Router();
const {db}=require('../db');
router.get('/list',async(_req,res)=>{try{const rows=await db.prepare('SELECT MIN(id) id, MAX(icon) icon, name, MAX(description) description, MAX(initial_prompt) initial_prompt, MIN(sort_order) sort_order FROM dialogue_scenes GROUP BY name ORDER BY sort_order').all();res.json({code:0,data:rows});}catch(e){res.status(500).json({code:500,message:'加载场景失败'});}});
router.get('/detail/:id',async(req,res)=>{try{const row=await db.prepare('SELECT * FROM dialogue_scenes WHERE id=?').get(req.params.id);if(!row)return res.status(404).json({code:404,message:'场景不存在'});res.json({code:0,data:row});}catch(e){res.status(500).json({code:500,message:'加载场景失败'});}});
module.exports=router;
