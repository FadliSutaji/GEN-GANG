(async function(){
    const config=window.supabaseConfig;
    const publicRoot=config.url+'/storage/v1/object/public/high-mfs-media/';
    async function api(body){
        const response=await fetch('/api/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
        if(!response.ok) throw Error(response.status===403?'Kode salah.':'Gagal menyimpan. Periksa konfigurasi Vercel dan ukuran file.');
        return response.json();
    }
    const seen=new Set();
    function showRow(row){
        if(seen.has(row.id)) return;
        seen.add(row.id);
        const url=publicRoot+row.lokasi_file;
        if(row.jenis==='video'){
            channels.push({id:row.id,title:'Video ucapan',uploadedAt:row.dibuat_pada,url});
            renderVideoList(el('list'),()=>videoWindow.minimize());
            renderVideoList(cinemaEntries,closeCinemaList);
        }else addCollageCard({id:row.id,title:row.judul||'Kartu pos',uploadedAt:row.dibuat_pada,tag:'',lines:[row.caption],photo:url},true);
    }
    window.renameShared=async(id,title)=>{
        const code=prompt('Kode admin untuk mengedit judul');
        if(!code)return false;
        try{await api({action:'rename',id,title,code});return true}
        catch(e){alert(e.message);return false}
    };
    async function upload(file,caption,code,title){
        const {path,url}=await api({action:'sign',code,type:file.type});
        const response=await fetch(url,{method:'PUT',headers:{'Content-Type':file.type},body:file});
        if(!response.ok) throw Error('Upload file gagal. Periksa format dan ukuran file.');
        showRow(await api({action:'finish',code,path,type:file.type,caption,title}));
    }
    const picker=document.querySelector('.upload input');
    const status=document.createElement('p');
    status.setAttribute('role','status');
    picker.closest('.upload').after(status);
    picker.onchange=async()=>{
        const code=prompt('Kode undangan');
        if(!code){picker.value='';return}
        picker.disabled=true;
        try{
            for(const file of picker.files){status.textContent='Mengirim '+file.name+'…';await upload(file,null,code)}
            status.textContent='Video terkirim.';
        }catch(e){status.textContent=e.message}finally{picker.disabled=false;picker.value=''}
    };
    photoForm.onsubmit=async event=>{
        event.preventDefault();
        const code=prompt('Kode undangan');
        if(!code)return;
        const submit=photoForm.querySelector('button');
        submit.disabled=true;
        photoStatus.textContent='Mengirim foto…';
        try{await upload(fileInput.files[0],captionInput.value,code,titleInput.value);photoForm.reset();photoStatus.textContent='Foto terkirim.'}
        catch(e){photoStatus.textContent=e.message}finally{submit.disabled=false}
    };
    window.deleteShared=async id=>{
        const code=prompt('Kode admin untuk menghapus kiriman');
        if(!code)return false;
        try{await api({action:'delete',code,id});seen.add(id);return true}
        catch(e){alert(e.message);return false}
    };
    try{
        const response=await fetch(config.url+'/rest/v1/media_kiriman?select=*&order=dibuat_pada.asc,id.asc',{headers:{apikey:config.publishableKey}});
        if(!response.ok)throw Error();
        for(const row of await response.json()) showRow(row);
    }catch{el('list').textContent='Daftar kiriman belum bisa dimuat.'}
})();
