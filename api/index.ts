import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);

const blockedNameWords = ['fuck','fucker','fucking','shit','bitch','asshole','bastard','dick','pussy','cunt','whore','slut','motherfucker','bullshit','dumbass','sonofabitch','كس','شرموط','شرموطة','متناك','متناكة','منيك','منيكه','نيك','خول','قحبة','قحب','وسخ','وسخة','زب','طيز','عرص','عاهرة','كلب'];

function normalizeForNameMatch(text:string){ return text.trim().replace(/\s+/g,' '); }
function normalizeForModeration(text:string){ return text.normalize('NFKC').toLowerCase().replace(/[\u064B-\u065F\u0670\u0640\u200B-\u200D\uFEFF]/g,'').replace(/[أإآٱ]/g,'ا').replace(/[ى]/g,'ي').replace(/[ة]/g,'ه').replace(/[ؤ]/g,'و').replace(/[ئ]/g,'ي').replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[01345789]/g,d=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g'}[d]??d)).replace(/[^a-z\u0600-\u06FF]/g,''); }
function containsBlockedName(text:string){ const n=normalizeForModeration(text); return blockedNameWords.some(w=>n===normalizeForModeration(w)); }

async function seed(){
  const {data:users}=await supabase.from('users').select('*').limit(1);
  if(!users?.length){
    await supabase.from('users').insert([
      {name:'Student',email:'student@school.local',password:'student123',role:'student',class_name:'Grade 7B'},
      {name:'Admin',email:'admin@school.local',password:'admin123',role:'admin'}
    ]);
  }
  const {data:exams}=await supabase.from('exams').select('*').limit(1);
  if(!exams?.length){
    const {data:created}=await supabase.from('exams').insert([
      {title:'Unit 1 - Hello World',unit:'Unit 1',duration:30,published:true},
      {title:'Unit 2 - Families and Friends',unit:'Unit 2',duration:25,published:true},
      {title:'Unit 3 - Around Town',unit:'Unit 3',duration:30,published:true}
    ]).select('id');
    const first=created?.[0]?.id;
    if(first) await supabase.from('questions').insert([
      {exam_id:first,text:'She ______ to school every day.',options:['go','goes','going','gone'],correct_index:1,kind:'quiz'},
      {exam_id:first,text:'They ______ English at school.',options:['study','studies','studying','studied'],correct_index:0,kind:'quiz'},
      {exam_id:first,text:'I ______ a student.',options:['am','is','are','be'],correct_index:0,kind:'quiz'}
    ]);
  }
}
function fail(res:any,message:string,status:number){ return res.status(status).json({error:message}); }
function userOut(u:any){ return {id:u.id,name:u.name,email:u.email,role:u.role,className:u.class_name}; }
async function handler(req:any,res:any){
  try{
    await seed();
    const url=new URL(req.url,'http://localhost');
    const requestedPath=url.searchParams.get('path');
    const path=requestedPath ? '/api/'+requestedPath.replace(/^\/+/, '') : url.pathname;
    const method=req.method||'GET';
    if(method==='GET'&&path==='/api/_healthcheck') return res.status(200).json({message:'Success'});
    if(method==='POST'&&path==='/api/login'){
      const input=req.body||{};
      if(input.role==='student'&&(!input.name?.trim()||containsBlockedName(input.name))) return fail(res,'Please enter a valid name',400);
      const {data:items}=await supabase.from('users').select('*').limit(200);
      let user:any;
      if(input.role==='student'){
        const clean=normalizeForNameMatch(input.name||'');
        user=items?.find((x:any)=>x.role==='student'&&normalizeForNameMatch(x.name).toLowerCase()===clean.toLowerCase());
        if(!user){
          const safe=(clean.toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')||'student');
          const email= safe+'.'+Date.now()+'@student.local';
          const {data:newUser,error}=await supabase.from('users').insert({name:clean,email,password:'',role:'student',class_name:'Grade 7B'}).select('*').single();
          if(error||!newUser) return fail(res,'Could not register student',500);
          user=newUser;
        }
      }else user=items?.find((x:any)=>x.role==='admin'&&x.password===input.code);
      if(!user) return fail(res,'Invalid teacher code',401);
      return res.status(200).json({user:userOut(user)});
    }
    if(method==='GET'&&path==='/api/exams'){
      const {data,error}=await supabase.from('exams').select('*').order('created_at',{ascending:true});
      if(error) return fail(res,error.message,500);
      return res.status(200).json({exams:(data||[]).map((e:any)=>({id:e.id,title:e.title,unit:e.unit,duration:e.duration,published:e.published}))});
    }
    if(method==='POST'&&path==='/api/exams'){
      const i=req.body||{}; if(!i.title||!i.unit) return fail(res,'Title and unit are required',400);
      const {data,error}=await supabase.from('exams').insert({title:i.title,unit:i.unit,duration:i.duration??30,published:i.published??false}).select('id').single();
      if(error||!data) return fail(res,'Could not create exam',500); return res.status(200).json({id:data.id});
    }
    const examMatch=path.match(/^\/api\/exams\/([^/]+)$/);
    if(method==='PUT'&&examMatch){ const i=req.body||{}; if(i.published===undefined)return fail(res,'Published state is required',400); const {error}=await supabase.from('exams').update({published:i.published}).eq('id',examMatch[1]); if(error)return fail(res,error.message,500); return res.status(200).json({updated:true}); }
    if(method==='DELETE'&&examMatch){ const {data}=await supabase.from('exams').delete().eq('id',examMatch[1]).select('id'); return data?.length?res.status(200).json({deleted:true}):fail(res,'Exam not found',404); }
    const qMatch=path.match(/^\/api\/exams\/([^/]+)\/questions$/);
    if(method==='GET'&&qMatch){ const {data,error}=await supabase.from('questions').select('*').eq('exam_id',qMatch[1]).order('created_at',{ascending:true}); if(error)return fail(res,error.message,500); return res.status(200).json({questions:(data||[]).map((q:any)=>({id:q.id,text:q.text,options:q.options||[],kind:q.kind||'quiz',answer:q.kind==='flashcard'?q.answer:undefined}))}); }
    if(method==='POST'&&qMatch){ const i=req.body||{},kind=i.kind??'quiz'; if(!i.text?.trim())return fail(res,'Question text is required',400); if(kind==='flashcard'&&!i.answer?.trim())return fail(res,'Flashcard answer is required',400); if(kind==='quiz'&&(!i.options||i.options.length!==4||i.correctIndex===undefined))return fail(res,'Quiz question needs four options and a correct answer',400); const {data,error}=await supabase.from('questions').insert({exam_id:qMatch[1],kind,text:i.text.trim(),answer:kind==='flashcard'?i.answer.trim():null,options:kind==='quiz'?i.options:[],correct_index:kind==='quiz'?i.correctIndex:0}).select('id').single(); if(error||!data)return fail(res,'Could not create question',500); return res.status(200).json({id:data.id}); }
    const qDelete=path.match(/^\/api\/questions\/([^/]+)$/);
    if(method==='DELETE'&&qDelete){ const {data}=await supabase.from('questions').delete().eq('id',qDelete[1]).select('id'); return data?.length?res.status(200).json({deleted:true}):fail(res,'Question not found',404); }
    if(method==='GET'&&path==='/api/students'){ const {data,error}=await supabase.from('users').select('*').eq('role','student').order('created_at',{ascending:true}); if(error)return fail(res,error.message,500); return res.status(200).json({students:(data||[]).map(userOut)}); }
    if(method==='POST'&&path==='/api/students'){ const i=req.body||{}; if(!i.name?.trim()||containsBlockedName(i.name))return fail(res,'Please enter a valid student name',400); const clean=normalizeForNameMatch(i.name); const {data:existing}=await supabase.from('users').select('*').eq('role','student'); if(existing?.some((u:any)=>normalizeForNameMatch(u.name).toLowerCase()===clean.toLowerCase()))return fail(res,'Student name already exists',409); const safe=(clean.toLowerCase().replace(/[^a-z0-9]+/g,'.').replace(/^\.|\.$/g,'')||'student'); const {data,error}=await supabase.from('users').insert({name:clean,email:safe+'.'+Date.now()+'@student.local',password:'',role:'student',class_name:i.className??'Grade 7B'}).select('id').single(); if(error||!data)return fail(res,'Could not create student',500); return res.status(200).json({id:data.id}); }
    const sDelete=path.match(/^\/api\/students\/([^/]+)$/);
    if(method==='DELETE'&&sDelete){ const {data}=await supabase.from('users').delete().eq('id',sDelete[1]).select('id'); return data?.length?res.status(200).json({deleted:true}):fail(res,'Student not found',404); }
    if(method==='DELETE'&&path==='/api/attempts'){ const {data,error}=await supabase.from('attempts').delete().not('id','is',null).select('id'); if(error)return fail(res,error.message,500); return res.status(200).json({deleted:data?.length||0}); }
    if(method==='GET'&&path==='/api/attempts'){ const [a,u,e]=await Promise.all([supabase.from('attempts').select('*').order('submitted_at',{ascending:true}),supabase.from('users').select('id,name'),supabase.from('exams').select('id,title')]); const users=new Map((u.data||[]).map((x:any)=>[x.id,x.name])); const exams=new Map((e.data||[]).map((x:any)=>[x.id,x.title])); return res.status(200).json({attempts:(a.data||[]).map((x:any)=>({id:x.id,student:users.get(x.user_id)||'Unknown',exam:exams.get(x.exam_id)||'Unknown',score:x.score,total:x.total,submittedAt:x.submitted_at}))}); }
    if(method==='POST'&&path==='/api/attempts'){ const i=req.body||{}; if(!i.userId||!i.examId||!Array.isArray(i.answers))return fail(res,'Attempt data is required',400); const {data:qs,error}=await supabase.from('questions').select('*').eq('exam_id',i.examId).eq('kind','quiz').order('created_at',{ascending:true}); if(error)return fail(res,error.message,500); const questions=qs||[]; const score=questions.reduce((sum:any,q:any,index:number)=>sum+(i.answers[index]===q.correct_index?1:0),0); const {data:attempt,error:insertError}=await supabase.from('attempts').insert({user_id:i.userId,exam_id:i.examId,score,total:questions.length,answers:i.answers}).select('id').single(); if(insertError||!attempt)return fail(res,'Could not save attempt',500); return res.status(200).json({id:attempt.id,score,total:questions.length,percentage:questions.length?Math.round(score/questions.length*100):0}); }
    return fail(res,'Not found',404);
  }catch(e:any){ return res.status(500).json({error:e?.message||'Server error'}); }
}
export default handler;