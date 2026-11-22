const collage = document.createElement('div');
collage.className = 'letter-collage';
const letterDetail = document.createElement('article');
letterDetail.className = 'letter-detail';
const postcardWindow = createWindow('Kartu Pos','✉',[collage],10);
const letterWindow = createWindow('Foto & Surat','✉',[letterDetail],4,false);
letterDetail.closest('.os-window').classList.add('letter-window');
collage.closest('.os-window').classList.add('collage-window');
let openLetterEntry = null;
function addCollageCard(entry, prepend = false) {
    const card = button('', () => {
        const photo = document.createElement('img');
        photo.src = entry.photo;
        photo.alt = entry.title;
        const paper = document.createElement('div');
        paper.className = 'letter-paper';
        const heading = document.createElement('h2');
        heading.textContent = entry.title;
        paper.append(heading);
        if(entry.id) paper.append(button('Edit judul',async()=>{
            const next=prompt('Judul kartu',entry.title)?.trim();
            if(!next || next===entry.title)return;
            if(next.length>90){alert('Judul maksimal 90 karakter.');return}
            if(await window.renameShared(entry.id,next)){
                entry.title=next;
                title.textContent=heading.textContent=photo.alt=next;
            }
        }));
        for (const line of entry.lines) {
            const paragraph = document.createElement('p');
            paragraph.textContent = line;
            paper.append(paragraph);
        }
        letterDetail.replaceChildren(photo,paper);
        openLetterEntry = entry;
        if (entry.photo) paper.append(button('Hapus kartu', removeCard));
        letterWindow.open();
        letterDetail.parentElement.scrollTop = 0;
    });
    const preview = document.createElement('img');
    preview.src = entry.photo;
    preview.alt = '';
    preview.loading = 'lazy';
    const title = document.createElement('strong');
    title.textContent = entry.title;
    const label = document.createElement('small');
    label.textContent = entry.tag;
    card.append(preview,title,label);
    if (entry.photo) {
        const captionPreview = document.createElement('small');
        captionPreview.className = 'caption-preview';
        captionPreview.textContent = entry.lines[0];
        card.append(captionPreview);
    }
    const tile = document.createElement('div');
    tile.className = 'collage-tile';
    tile.append(card);
    function removeCard() {
        if(entry.id) return window.deleteShared(entry.id);
        if (!window.confirm('Hapus foto, judul, dan caption ini?')) return;
        if (openLetterEntry === entry) {
            letterWindow.close();
            letterDetail.replaceChildren();
            openLetterEntry = null;
        }
        tile.remove();
        URL.revokeObjectURL(entry.photo);
    }
    if (entry.photo) tile.append(button('Hapus foto', removeCard));
    if (prepend) collage.prepend(tile);
    else collage.append(tile);
}


const addPhoto = document.createElement('details');
addPhoto.className = 'add-collage-photo';
addPhoto.innerHTML = '<summary>＋ Tambah foto &amp; caption</summary><form><label>Foto<input type="file" accept="image/*" required></label><label>Judul (opsional)<input type="text" maxlength="90"></label><label>Caption<textarea required maxlength="600" rows="3" placeholder="Tulis caption foto"></textarea></label><button type="submit">Tambahkan ke kolase</button><p role="status"></p></form>';
collage.before(addPhoto);
const photoForm = addPhoto.querySelector('form');
const fileInput = photoForm.querySelector('input');
const captionInput = photoForm.querySelector('textarea');
const titleInput = photoForm.querySelector('input[type=text]');
const photoStatus = photoForm.querySelector('[role="status"]');
photoForm.onsubmit = async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    const caption = captionInput.value.trim();
    const title = titleInput.value.trim();
    if (!file || !title || !caption) {
        photoStatus.textContent = 'Pilih foto, lalu isi judul dan caption.';
        return;
    }
    const photo = URL.createObjectURL(file);
    const image = new Image();
    image.src = photo;
    try {
        await image.decode();
    } catch {
        URL.revokeObjectURL(photo);
        photoStatus.textContent = 'Foto belum bisa dibuka. Coba JPG, PNG, atau WebP.';
        return;
    }
    addCollageCard({title,tag:'Foto baru',lines:[caption],photo},true);
    photoForm.reset();
    photoStatus.textContent = '';
    addPhoto.open = false;
};
const openChannelList = el('guide').onclick;
el('guide').onclick = () => openChannelList();
icons.children[1].onclick = () => el('guide').click();
appList.children[1].onclick = () => el('guide').click();
