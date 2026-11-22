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
        paper.append(heading,uploadTime(entry.uploadedAt));
        function updateEdited(timestamp) {
            entry.editedAt = timestamp;
            edited.replaceWith(edited = uploadTime(timestamp,'Edited '));
            detailEdited.replaceWith(detailEdited = uploadTime(timestamp,'Edited '));
        }
        let detailEdited = uploadTime(entry.editedAt,'Edited ');
        paper.append(detailEdited);
        if(entry.id) paper.append(button('Edit caption',async()=>{
            const caption = prompt('Caption foto',entry.lines[0])?.trim();
            if (!caption || caption === entry.lines[0]) return;
            if (caption.length > 600) return alert('Caption maksimal 600 karakter.');
            const updated = await window.editShared({action:'edit-caption',id:entry.id,caption});
            if (!updated) return;
            entry.lines[0] = updated.caption;
            captionPreview.textContent = paragraph.textContent = updated.caption;
            updateEdited(updated.diedit_pada);
        }));
        if(entry.id) paper.append(button('Edit judul',async()=>{
            const next=prompt('Judul kartu',entry.title)?.trim();
            if(!next || next===entry.title)return;
            if(next.length>90){alert('Judul maksimal 90 karakter.');return}
            const updated = await window.editShared({action:'rename',id:entry.id,title:next});
            if(updated){
                updateEdited(updated.diedit_pada);
                entry.title=next;
                title.textContent=heading.textContent=photo.alt=next;
            }
        }));
        const paragraph = document.createElement('p');
        paragraph.textContent = entry.lines.join('\n');
        paper.append(paragraph);
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
    let edited = uploadTime(entry.editedAt,'Edited ');
    card.append(preview,title,label,uploadTime(entry.uploadedAt),edited);
    const captionPreview = document.createElement('small');
    if (entry.photo) {
        captionPreview.className = 'caption-preview';
        captionPreview.textContent = entry.lines[0];
        card.append(captionPreview);
    }
    const tile = document.createElement('div');
    tile.className = 'collage-tile';
    tile.append(card);
    async function removeCard() {
        if (!window.confirm('Hapus foto, judul, dan caption ini?')) return;
        if(entry.id && !await window.deleteShared(entry.id)) return;
        if (openLetterEntry === entry) {
            letterWindow.close();
            letterDetail.replaceChildren();
            openLetterEntry = null;
        }
        tile.remove();
        if(!entry.id) URL.revokeObjectURL(entry.photo);
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
