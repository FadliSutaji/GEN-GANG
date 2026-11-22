const base = 'https://vmohfkgienabqhgznbhx.supabase.co';
const bucket = '/storage/v1/object/high-mfs-media/';
const types = {'video/mp4':'mp4','video/webm':'webm','image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
module.exports = async function handler(req,res){
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const invite = process.env.UPLOAD_CODE;
  if(req.method !== 'POST') return res.status(405).end();
  if(!key || !invite) return res.status(503).json({error:'Konfigurasi upload Vercel belum lengkap.'});
  const {action,code,type,path,caption,id} = req.body || {};
  const headers = {apikey:key,'Content-Type':'application/json'};
  if (!key.startsWith('sb_secret_')) headers.Authorization = 'Bearer ' + key;
  async function call(route,method,body){
    const response = await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
    if(!response.ok) throw Error('Supabase '+response.status);
    return response;
  }
  try {
    if(action==='rename'){
      if(!process.env.ADMIN_CODE || code!==process.env.ADMIN_CODE) return res.status(403).end();
      const title=req.body.title;
      if(!/^[a-f0-9-]{36}$/.test(id)||typeof title!=='string'||!title.trim()||title.length>90) return res.status(400).end();
      headers.Prefer='return=representation';
      const rows=await (await call('/rest/v1/media_kiriman?id=eq.'+id+'&jenis=eq.foto','PATCH',{judul:title.trim()})).json();
      return rows.length ? res.json({ok:true}) : res.status(404).end();
    }
    if(action==='delete'){
      if(!process.env.ADMIN_CODE || code!==process.env.ADMIN_CODE) return res.status(403).end();
      if(!/^[0-9a-f-]{36}$/.test(id)) return res.status(400).end();
      const route='/rest/v1/media_kiriman?id=eq.'+id;
      const [row]=await (await call(route,'GET')).json();
      if(row){
        await call('/storage/v1/object/high-mfs-media','DELETE',{prefixes:[row.lokasi_file]});
        await call(route,'DELETE');
      }
      return res.json({ok:true});
    }
    if(code!==invite) return res.status(403).json({error:'Kode undangan salah.'});
    if(!Object.hasOwn(types,type)) return res.status(400).json({error:'Format file belum didukung.'});
    if(action==='sign'){
      const path=require('node:crypto').randomUUID()+'.'+types[type];
      const {url}=await (await call('/storage/v1/object/upload/sign/high-mfs-media/'+path,'POST',{})).json();
      return res.json({path,url:base+'/storage/v1'+url});
    }
    if(action!=='finish'||typeof path!=='string'|| !/^[a-f0-9-]{36}\.(mp4|webm|jpg|png|webp)$/.test(path)||!path.endsWith('.'+types[type])) return res.status(400).end();
    const foto=type.startsWith('image/');
    if(foto && (typeof caption!=='string'||!caption.trim()||caption.length>600)) return res.status(400).end();
    await call(bucket+path,'HEAD');
    headers.Prefer='return=representation';
    const stored=await call('/rest/v1/media_kiriman','POST',{jenis:foto?'foto':'video',lokasi_file:path,caption:foto?caption.trim():null,...(foto && req.body.title ? {judul:String(req.body.title).trim().slice(0,90)} : {})});
    res.json((await stored.json())[0]);
  }catch{res.status(502).json({error:'Proses media di Supabase gagal.'});}
};
