const tvStage = document.querySelector('.tv');
const exitCinema = button('Keluar layar penuh', leaveCinema);
exitCinema.className = 'cinema-exit';
exitCinema.hidden = true;
tvStage.append(exitCinema);
const cinemaRemote = document.createElement('section');
cinemaRemote.className = 'cinema-remote';
cinemaRemote.setAttribute('aria-label', 'Remote layar penuh');
cinemaRemote.innerHTML = '<svg class="remote-hand" viewBox="0 0 160 175" aria-hidden="true"><path d="M74 174 62 133C39 123 28 96 32 80l3-34c1-12 17-13 20-2l3 35 19-17 19-36c8-14 25-7 22 4 15-7 27 6 20 16 16 0 21 13 13 22 10 5 11 17 4 25l-25 36 10 45Z" fill="#f6ab79" stroke="#391849" stroke-width="5" stroke-linejoin="round"/><path d="M56 86q9-8 25-7M124 123q-14 13-38 9" fill="none" stroke="#bb694d" stroke-width="4" stroke-linecap="round"/></svg><div class="remote-shell"></div>';
const shell = cinemaRemote.querySelector('.remote-shell');
const cinemaList = document.createElement('section');
cinemaList.className = 'cinema-video-list';
cinemaList.setAttribute('aria-label','List Video');
cinemaList.hidden = true;
const cinemaListHeading = document.createElement('strong');
cinemaListHeading.textContent = 'List Video';
const cinemaEntries = document.createElement('div');
const listToggle = button('List Video', () => {
    if (!cinemaList.hidden) { closeCinemaList(); return; }
    renderVideoList(cinemaEntries, closeCinemaList);
    cinemaList.hidden = false;
    listToggle.setAttribute('aria-expanded','true');
    cinemaEntries.querySelector('button')?.focus();
});
listToggle.setAttribute('aria-expanded','false');
function closeCinemaList() {
    const hadFocus = cinemaList.contains(document.activeElement);
    cinemaList.hidden = true;
    listToggle.setAttribute('aria-expanded','false');
    if (hadFocus) listToggle.focus();
}
function stepCinemaChannel(direction) {
    const playable = channels.map((channel,index) => channel.url ? index : -1).filter(index => index >= 0);
    if (!playable.length) return;
    const position = playable.indexOf(current);
    const next = position < 0 ? (direction > 0 ? 0 : playable.length - 1) :
        (position + direction + playable.length) % playable.length;
    tune(playable[next]);
}
const playbackCinema = button('Putar / Jeda', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
});
const remoteChannels = document.createElement('div');
remoteChannels.className = 'row';
remoteChannels.append(button('CH −', () => stepCinemaChannel(-1)),button('CH +', () => stepCinemaChannel(1)));
shell.append(playbackCinema,remoteChannels,listToggle);
cinemaList.append(cinemaListHeading,button('Tutup',closeCinemaList),cinemaEntries);
tvStage.append(cinemaRemote,cinemaList);

function leaveCinema() {
    closeCinemaList();
    tvStage.classList.remove('cinema');
    exitCinema.hidden = true;
    if (document.fullscreenElement === tvStage) document.exitFullscreen().catch(() => {});
    el('tv-fullscreen').focus();
}
el('tv-fullscreen').onclick = () => {
    const note = el('fullscreen-note');
    if (!on || video.hidden || !video.getAttribute('src')) {
        note.hidden = false;
        note.textContent = 'Pilih dan putar video ucapan dulu.';
        return;
    }
    note.hidden = true;
    tvStage.classList.add('cinema');
    exitCinema.hidden = false;
    exitCinema.focus();
    if (tvStage.requestFullscreen) tvStage.requestFullscreen().catch(() => {});
};
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && tvStage.classList.contains('cinema')) leaveCinema();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && tvStage.classList.contains('cinema')) leaveCinema();
});

const remotePanel = document.querySelector('.remote');
function buildTimeline() {
    const panel = document.createElement('div');
    panel.className = 'tv-timeline';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.step = '0.01';
    slider.setAttribute('aria-label','Posisi video');
    const time = document.createElement('span');
    const controls = document.createElement('div');
    controls.className = 'row';
    const backward = button('−10 dtk', () => seek(video.currentTime - 10));
    const forward = button('+10 dtk', () => seek(video.currentTime + 10));
    controls.append(backward,forward);
    let dragging = false;

    function available() {
        return on && !video.hidden && Number.isFinite(video.duration) && video.duration > 0;
    }
    function format(seconds) {
        const whole = Math.floor(seconds || 0);
        return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2,'0');
    }
    function seek(seconds) {
        if (!available()) return;
        video.currentTime = Math.max(0,Math.min(video.duration,seconds));
        sync();
    }
    function sync() {
        const ready = available();
        slider.disabled = backward.disabled = forward.disabled = !ready;
        slider.max = String(ready ? video.duration : 1);
        if (!dragging || !ready) slider.value = String(ready ? video.currentTime : 0);
        const position = ready ? Number(slider.value) : 0;
        time.textContent = format(position) + ' / ' + format(ready ? video.duration : 0);
        slider.setAttribute('aria-valuetext',format(position));
    }
    slider.addEventListener('pointerdown', () => { dragging = true; });
    for (const event of ['pointerup','pointercancel','blur'])
        slider.addEventListener(event, () => { dragging = false; sync(); });
    slider.addEventListener('input', () => seek(Number(slider.value)));
    for (const event of ['timeupdate','loadedmetadata','durationchange','emptied','seeking','ended','play','pause'])
        video.addEventListener(event,sync);
    new MutationObserver(sync).observe(video,{attributes:true,attributeFilter:['hidden','src']});
    panel.append(slider,time,controls);
    sync();
    return panel;
}
remotePanel.append(buildTimeline());
shell.append(buildTimeline());

const remoteWindow = createWindow('Remote TV','▣',[remotePanel],0);
const videoWindow = createWindow('Video Ucapan','▶',[el('list'),document.querySelector('.upload')],6);
