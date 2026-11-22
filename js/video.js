const el=id=>document.getElementById(id);
const channels=['Selamat ulang tahun!','Breaking News Anak Kos','Klarifikasi Jam 2 Pagi'].map(title=>({title}));
const uploadDateFormat = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short'
});
function uploadTime(timestamp, prefix = '') {
    const time = document.createElement('time');
    const date = timestamp ? new Date(timestamp) : null;
    if (!date || Number.isNaN(date.getTime())) {
        time.hidden = true;
        return time;
    }
    time.dateTime = date.toISOString();
    time.textContent = prefix + uploadDateFormat.format(date) + ' WIB';
    return time;
}
const watched=new Set(), video=document.querySelector('video'), dialog=document.querySelector('dialog');
let current=0,on=false;
function tune(index){
 current=(index+channels.length)%channels.length;on=true;
 const channel=channels[current];video.pause();video.hidden=!channel.url;
 el('headline').textContent=channel.title;el('tag').textContent='★ CHANNEL CONTOH ★';
 el('station').textContent='● CH '+String(current+1).padStart(2,'0');el('power').textContent='⏻ Matikan TV';
 if(channel.url){video.crossOrigin=channel.id ? 'anonymous' : null;video.src=channel.url;video.play().catch(()=>{});}else{watched.add(current);}
}
video.onended=()=>watched.add(current);
el('power').onclick=()=>{if(!on){tune(current);return;}on=false;video.pause();video.hidden=true;el('headline').textContent='Bintang Hari Ini!';el('tag').textContent='★ BIRTHDAY BROADCAST ★';el('station').textContent='● STANDBY';el('power').textContent='⏻ Nyalakan TV';};
el('next').onclick=()=>tune(on?current+1:0);el('prev').onclick=()=>tune(current-1);
function renderVideoList(list, pick) {
    list.replaceChildren();
    const playable = channels.map((channel,index) => ({channel,index})).filter(item => item.channel.url);
    if (!playable.length) {
        const message = document.createElement('p');
        message.textContent = 'Belum ada video ucapan.';
        list.append(message);
        return;
    }
    for (const {channel,index} of playable) {
        const item = document.createElement('button');
        item.type = 'button';
        item.textContent = 'CH ' + (index + 1) + ' · ' + channel.title + (watched.has(index) ? ' ✓' : '');
        const timestamp = uploadTime(channel.uploadedAt);
        timestamp.style.display = timestamp.hidden ? 'none' : 'block';
        item.append(timestamp);
        if (channel.editedAt) {
            const edited = uploadTime(channel.editedAt, 'Edited ');
            edited.style.display = 'block';
            item.append(edited);
        }
        item.onclick = () => { tune(index); pick(); };
        const row = document.createElement('div');
        row.className = 'media-list-row';
        const remove = button('Hapus', async () => {
            if (!window.confirm('Hapus video "' + channel.title + '" dari daftar?')) return;
            if(channel.id && !await window.deleteShared(channel.id)) return;
            const activeChannel = channels[current];
            const removedIndex = channels.indexOf(channel);
            if(removedIndex < 0) return;
            const wasPlaying = on && activeChannel === channel;
            channels.splice(removedIndex,1);
            const previousWatched = [...watched];
            watched.clear();
            for (const entry of previousWatched) {
                if (entry !== removedIndex) watched.add(entry > removedIndex ? entry - 1 : entry);
            }
            if (wasPlaying || video.getAttribute('src') === channel.url) {
                video.pause();
                video.removeAttribute('src');
                video.load();
            }
            if(!channel.id) URL.revokeObjectURL(channel.url);
            if (wasPlaying) {
                const remaining = channels.findIndex(entry => entry.url);
                if (remaining >= 0) tune(remaining);
                else {
                    leaveCinema();
                    el('power').click();
                    current = 0;
                }
            } else {
                current = Math.max(0, channels.indexOf(activeChannel));
            }
            renderVideoList(list,pick);
            const otherList = list === el('list') ? cinemaEntries : el('list');
            const otherPick = list === el('list') ? closeCinemaList : () => videoWindow.minimize();
            renderVideoList(otherList,otherPick);
        });
        remove.setAttribute('aria-label','Hapus video '+channel.title);
        const actions = document.createElement('div');
        if (channel.id) actions.append(button('Edit judul', async () => {
            const title = prompt('Judul video', channel.title)?.trim();
            if (!title || title === channel.title) return;
            if (title.length > 90) return alert('Judul maksimal 90 karakter.');
            const updated = await window.editShared({action:'rename',kind:'video',id:channel.id,title});
            if (!updated) return;
            channel.title = updated.judul;
            channel.editedAt = updated.diedit_pada;
            if (on && channels[current] === channel) el('headline').textContent = channel.title;
            renderVideoList(el('list'), () => videoWindow.minimize());
            renderVideoList(cinemaEntries, closeCinemaList);
        }));
        actions.append(remove);
        row.append(item,actions);
        list.append(row);
    }
}
el('guide').onclick=()=>{renderVideoList(el('list'), () => videoWindow.minimize());videoWindow.open();};
el('close').onclick=()=>dialog.close();
document.querySelector('input').onchange=e=>{const first=channels.length;for(const file of e.target.files)channels.push({title:file.name.replace(/\.[^.]+$/,''),url:URL.createObjectURL(file)});if(channels.length>first)tune(first);e.target.value='';};
