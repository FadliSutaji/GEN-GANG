const dock = document.createElement('nav');
dock.className = 'desktop-dock';
dock.style.zIndex = 10001;
dock.setAttribute('aria-label','Taskbar HIGH MFS');
const icons = document.createElement('nav');
icons.className = 'os-icons';
icons.setAttribute('aria-label','Aplikasi desktop');
const start = document.createElement('section');
start.className = 'os-start';
start.hidden = true;
const appList = document.createElement('div');
const shortcuts = document.createElement('div');
const searchApps = document.createElement('input');
searchApps.type = 'search';
searchApps.placeholder = 'Cari aplikasi';
searchApps.setAttribute('aria-label','Cari aplikasi');
start.append(appList,shortcuts,searchApps);
document.body.append(icons,start,dock);
let level = 3;

function button(label, action) {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = label;
    item.onclick = action;
    return item;
}
function showStart(show) {
    start.hidden = !show;
    startButton.setAttribute('aria-expanded',String(show));
    if (show) searchApps.focus();
}
const startButton = button('✦ Start', () => showStart(start.hidden));
startButton.setAttribute('aria-expanded','false');
const tasks = document.createElement('div');
tasks.style.display = 'flex';
tasks.style.gap = '6px';
const clock = document.createElement('time');
function updateClock(){clock.textContent = new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});}
updateClock();
setInterval(updateClock,15000);
dock.append(startButton,tasks,clock);
shortcuts.append(button('Reset sudut', () => {
    document.dispatchEvent(new Event('reset-tv-orbit'));
    showStart(false);
}));
document.addEventListener('pointerdown', event => {
    if (!start.contains(event.target) && !startButton.contains(event.target)) showStart(false);
});
searchApps.addEventListener('input', () => {
    for (const item of appList.children)
        item.hidden = !item.textContent.toLowerCase().includes(searchApps.value.trim().toLowerCase());
});
document.addEventListener('keydown',event => {if(event.key==='Escape') showStart(false);});

function createWindow(name, symbol, children, offset, launcher = true) {
    const win = document.createElement('section');
    win.className = 'os-window';
    win.setAttribute('aria-label',name);
    win.style.top = (13 + offset) + 'vh';
    win.hidden = true;
    const bar = document.createElement('div');
    bar.className = 'os-title';
    const title = document.createElement('strong');
    title.textContent = name;
    const content = document.createElement('div');
    content.className = 'os-content';
    content.append(...children);
    const task = button(name, () => {
        if (!win.hidden && Number(win.style.zIndex) === level) minimize();
        else open();
    });
    task.hidden = true;
    function raise() {
        win.style.zIndex = ++level;
        for (const item of tasks.children) item.setAttribute('aria-pressed',String(item===task));
    }
    function open() {
        showStart(false);
        win.hidden = false;
        fitVisible();
        task.hidden = false;
        raise();
    }
    function minimize() {
        win.hidden = true;
        task.setAttribute('aria-pressed','false');
    }
    function close() {
        minimize();
        task.hidden = true;
        win.classList.remove('maximized');
    }
    function maximize(){win.classList.toggle('maximized');}
    const controls = [
        ['−','Minimalkan',minimize],['□','Maksimalkan atau pulihkan',maximize],['×','Tutup',close]
    ].map(([glyph,label,action]) => {
        const control=button(glyph,action);
        control.setAttribute('aria-label',label+' '+name);
        return control;
    });
    bar.append(title,...controls);
    bar.ondblclick = event => {if(!event.target.closest('button')) maximize();};
    const grip = document.createElement('button');
    grip.className = 'window-grip';
    grip.textContent = '↘';
    grip.title = 'Geser untuk mengubah ukuran';
    grip.setAttribute('aria-label','Ubah ukuran '+name+' dengan geser atau tombol panah');
    function fit(width,height){
        const box = win.getBoundingClientRect();
        const w = Math.min(Math.max(270,width),innerWidth-8);
        const h = Math.min(Math.max(145,height),Math.max(145,dock.getBoundingClientRect().top-8));
        win.style.width = w+'px';
        win.style.height = h+'px';
        win.style.left = Math.max(0,Math.min(box.left,innerWidth-w-4))+'px';
        win.style.top = Math.max(0,Math.min(box.top,dock.getBoundingClientRect().top-h-4))+'px';
    }
    grip.onpointerdown = event => {
        if(event.button !== 0 || !event.isPrimary) return;
        const box = win.getBoundingClientRect();
        grip.setPointerCapture(event.pointerId);
        grip.onpointermove = move => {
            if(move.pointerId === event.pointerId)
                fit(box.width+move.clientX-event.clientX,box.height+move.clientY-event.clientY);
        };
        grip.onlostpointercapture = () => { grip.onpointermove=null; };
    };
    grip.onkeydown = event => {
        const step = {ArrowLeft:[-24,0],ArrowRight:[24,0],ArrowUp:[0,-24],ArrowDown:[0,24]}[event.key];
        if(!step) return;
        event.preventDefault();
        fit(win.offsetWidth+step[0],win.offsetHeight+step[1]);
    };
    function fitVisible(){
        if(!win.hidden && !win.classList.contains('maximized')) fit(win.offsetWidth,win.offsetHeight);
    }
    window.addEventListener('resize',fitVisible);
    for(const side of ['left','right','top','bottom']){
        const edge=document.createElement('div');
        edge.className='resize-edge';
        edge.dataset.side=side;
        edge.onpointerdown=event=>{
            if(event.button!==0 || !event.isPrimary) return;
            const box=win.getBoundingClientRect();
            const bound=dock.getBoundingClientRect().top;
            const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
            edge.setPointerCapture(event.pointerId);
            edge.onpointermove=move=>{
                if(move.pointerId!==event.pointerId) return;
                const dx=move.clientX-event.clientX, dy=move.clientY-event.clientY;
                let {left,right,top,bottom}=box;
                if(side==='left') left=clamp(left+dx,0,right-270);
                if(side==='right') right=clamp(right+dx,left+270,innerWidth);
                if(side==='top') top=clamp(top+dy,0,bottom-145);
                if(side==='bottom') bottom=clamp(bottom+dy,top+145,bound);
                Object.assign(win.style,{left:left+'px',top:top+'px',width:(right-left)+'px',height:(bottom-top)+'px'});
            };
            edge.onlostpointercapture=()=>{edge.onpointermove=null};
        };
        win.append(edge);
    }    win.append(bar,content,grip);
    win.addEventListener('pointerdown',raise);
    bar.addEventListener('pointerdown',event => {
        if(event.button!==0 || event.target.closest('button') || win.classList.contains('maximized')) return;
        const box = win.getBoundingClientRect();
        const dx = event.clientX - box.left;
        const dy = event.clientY - box.top;
        bar.setPointerCapture(event.pointerId);
        bar.onpointermove = move => {
            win.style.left = Math.max(0,Math.min(innerWidth-win.offsetWidth,move.clientX-dx))+'px';
            win.style.top = Math.max(0,Math.min(innerHeight-105,move.clientY-dy))+'px';
        };
        bar.onlostpointercapture = () => {bar.onpointermove=null;};
    });
    const icon = button(name,open);
    const graphic = document.createElement('span');
    graphic.textContent = symbol;
    graphic.setAttribute('aria-hidden','true');
    icon.prepend(graphic);
    if (launcher) {
        icons.append(icon);
        appList.append(button(name,open));
    }
    tasks.append(task);
    document.body.append(win);
    return {open,minimize,close};
}
