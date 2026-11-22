(async () => {
const asset = path => window.asetLokal?.[path] ?? path;
try {
    const [THREE, {GLTFLoader}] = await Promise.all([
        import('three'),
        import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js')
    ]);
    const host = document.querySelector('.stage3d');
    const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    host.append(renderer.domElement);

    const {scene:model} = await new GLTFLoader().loadAsync(asset('assets/televisi.glb'));
    const screen = model.getObjectByName('Screen_Video');
    if (!screen?.isMesh) throw new Error('Screen_Video missing');

    const surface = document.createElement('canvas');
    surface.width = 840;
    surface.height = 540;
    const ctx = surface.getContext('2d');
    const texture = new THREE.CanvasTexture(surface);
    texture.flipY = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    screen.material = new THREE.MeshBasicMaterial({map:texture, side:THREE.DoubleSide});

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x211039);
    scene.add(model, new THREE.HemisphereLight(0xffeddc, 0xa173ff, 2));
    model.position.y = 1.02;
    function rearLabel(x, y, z, width) {
        const ink = document.createElement('canvas');
        ink.width = 768;
        ink.height = 192;
        const painter = ink.getContext('2d');
        painter.fillStyle = '#ffec73';
        painter.font = '900 118px Arial';
        painter.textAlign = 'center';
        painter.textBaseline = 'middle';
        painter.fillText('HUUUUUUU', 384, 96, 730);
        const map = new THREE.CanvasTexture(ink);
        map.colorSpace = THREE.SRGBColorSpace;
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(width,width/4),
            new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false}));
        sign.position.set(x,y,z);
        sign.rotation.y = Math.PI;
        scene.add(sign);
    }
    const casing = model.getObjectByName('CRT casing') || model;
    const casingBounds = new THREE.Box3().setFromObject(casing);
    const casingCenter = casingBounds.getCenter(new THREE.Vector3());
    rearLabel(casingCenter.x,casingCenter.y,casingBounds.min.z-.015,
        Math.min(3.15,(casingBounds.max.x-casingBounds.min.x)*.76));

    const key = new THREE.DirectionalLight(0xffe4b0, 2.5);
    key.position.set(-3, 5, 7);
    scene.add(key);

    function block(color, dimensions, position) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...dimensions),
            new THREE.MeshStandardMaterial({color, roughness:0.67}));
        mesh.position.set(...position);
        scene.add(mesh);
        return mesh;
    }

    block(0x533295,[12,.25,9],[0,-.15,.7]);
    const backWall = block(0x6436a2,[12,7,.25],[0,3.4,-3.8]);
    const sideWall = block(0x452473,[.24,7,9],[-6,3.4,.7]);
    block(0xff9a34,[11.7,.13,.18],[0,.1,-3.6]);
    block(0x2c1548,[5.8,.9,2.45],[0,.48,.12]);
    block(0xff8035,[5.95,.19,2.55],[0,.95,.12]);
    block(0x813ff0,[5.5,.59,.12],[0,.51,1.38]);
    block(0xffd24b,[.64,.09,.13],[0,.55,1.48]);

    for(let row=0;row<3;row++){
        for(let col=0;col<8;col++){
            block((row+col)%2 ? 0xec7838 : 0xffcf54,
                [0.96,.035,.62],[(col-3.5)*.96,.01,2.05+row*.62]);
        }
    }
    block(0xffaf34,[2,.12,.8],[4.1,2.8,-3.1]);
    for(let i=0;i<6;i++){
        const height=.55+(i%3)*.16;
        block([0xfb843e,0xeab849,0xac75fa][i%3],[.21,height,.45],
            [3.48+i*.245,2.86+height/2,-3.08]);
    }
    const photoTexture = new THREE.TextureLoader().load(
        asset('assets/foto-grup.jpg'),
        texture => {
            const aspect = texture.image.width / texture.image.height;
            const width = Math.min(2.45, 2.35 * aspect);
            const height = width / aspect;
            block(0xffbd38,[width+.16,height+.16,.13],[-3.75,3.5,-2.35]);
            const portrait = new THREE.Mesh(new THREE.PlaneGeometry(width,height),
                new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));
            rearLabel(-3.75,3.5,-2.43,width*.86);
            portrait.position.set(-3.75,3.5,-2.27);
            scene.add(portrait);
        }
    );
    photoTexture.colorSpace = THREE.SRGBColorSpace;
    block(0x3a234d,[.64,.12,.64],[4.37,.08,0]);
    block(0xffa92e,[.09,3,.09],[4.37,1.5,0]);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(.26,.64,.65,32),
        new THREE.MeshStandardMaterial({color:0xffad36,emissive:0xef640b,emissiveIntensity:.5}));
    shade.position.set(4.37,3,0);
    scene.add(shade);
    const lamp = new THREE.PointLight(0xff9f49,20,8);
    lamp.position.set(4.37,2.6,.2);
    scene.add(lamp);


    async function placeProp(url, x, z, maxWidth, maxHeight, maxDepth, turn) {
        const {scene:prop} = await new GLTFLoader().loadAsync(asset(url));
        const mount = new THREE.Group();
        mount.add(prop);
        prop.rotation.y = turn;
        prop.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(prop);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        prop.position.set(-center.x, -bounds.min.y, -center.z);
        mount.scale.setScalar(Math.min(maxWidth/size.x,maxHeight/size.y,maxDepth/size.z));
        mount.position.set(x, 1.046, z);
        scene.add(mount);
    }
    Promise.allSettled([
        placeProp('assets/soto-pak-muhni.glb', -2.39, .96, .96, .50, .82, .10),
        placeProp('assets/tengkorak.glb', 2.43, .99, .83, .91, .68, -.17),
    ]).then(results => {
        for (const result of results) if (result.status === 'rejected')
            console.warn('Could not load cabinet prop', result.reason);
    });

    const camera = new THREE.PerspectiveCamera(42,1,.1,60);
    const focus = new THREE.Vector3(0,2.25,0);
    let angle = .29, elevation = .19, zoom = 1, baseDistance = 12;
    function pose(){
        const distance = baseDistance * zoom;
        camera.position.set(Math.sin(angle)*distance,
            focus.y + distance*elevation, Math.cos(angle)*distance);
        camera.lookAt(focus);
        backWall.visible = camera.position.z > -3.65;
        sideWall.visible = camera.position.x > -5.86;
    }
    document.addEventListener('reset-tv-orbit', () => {
        angle = .29;
        elevation = .19;
        zoom = 1;
        pose();
    });
    const fingers = new Map();
    function span(){
        const [a,b] = fingers.values();
        return Math.hypot(a.x-b.x,a.y-b.y);
    }
    host.addEventListener('pointerdown', event => {
        fingers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        host.setPointerCapture(event.pointerId);
    });
    host.addEventListener('pointermove', event => {
        const prev = fingers.get(event.pointerId);
        if (!prev) return;
        const distance = fingers.size === 2 ? span() : 0;
        fingers.set(event.pointerId,{x:event.clientX,y:event.clientY});
        if (fingers.size === 1){
            angle -= (event.clientX-prev.x)*.008;
            elevation = THREE.MathUtils.clamp(elevation+(event.clientY-prev.y)*.004,.02,.5);
        } else if(distance > 1 && span() > 1){
            zoom = THREE.MathUtils.clamp(zoom*distance/span(),.67,1.55);
        }
        pose();
    });
    host.addEventListener('lostpointercapture', event => fingers.delete(event.pointerId));
    host.addEventListener('wheel', event => {
        event.preventDefault();
        zoom = THREE.MathUtils.clamp(zoom*Math.exp(event.deltaY*.001),.67,1.55);
        pose();
    }, {passive:false});

    const playback = document.createElement('button');
    playback.className = 'wide';
    playback.textContent = 'Putar / jeda video';
    playback.hidden = true;
    playback.onclick = () => video.paused ? video.play().catch(()=>{}) : video.pause();
    el('guide').before(playback);

    function resize(){
        const width = host.clientWidth;
        const height = host.clientHeight;
        if (!width || !height) return;
        camera.aspect = width / height;
        baseDistance = Math.max(12, 14 / camera.aspect);
        pose();
        camera.updateProjectionMatrix();
        renderer.setSize(width,height,false);
    }

    document.querySelector('.tv').classList.add('ready');
    new ResizeObserver(resize).observe(host);
    resize();
    host.tabIndex = 0;
    host.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        angle += event.key === 'ArrowLeft' ? -.16 : .16;
        pose();
    });
    el('roomHint').textContent = matchMedia("(pointer:coarse)").matches ? "Geser 360° · Cubit untuk zoom" : 'Geser 360° • Scroll untuk zoom';

    const tvBounds = new THREE.Box3().setFromObject(model);
    const tvCenter = tvBounds.getCenter(new THREE.Vector3());
    const tvSize = tvBounds.getSize(new THREE.Vector3());
    const normalEye = new THREE.Vector3();
    const closeEye = new THREE.Vector3();
    const animatedFocus = new THREE.Vector3();
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let cinematicBlend = 0;
    let previousFrame = null;
    renderer.setAnimationLoop(time => {
        pose();
        const isCinema = host.closest('.tv').classList.contains('cinema');
        const targetBlend = Number(isCinema);
        const elapsed = previousFrame === null ? 16 : Math.min(time - previousFrame, 64);
        previousFrame = time;
        cinematicBlend = reducedMotion.matches ? targetBlend :
            THREE.MathUtils.damp(cinematicBlend, targetBlend, 5.5, elapsed / 1000);
        if (cinematicBlend > .001) {
            const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
            const distance = Math.max(tvSize.y, tvSize.x / camera.aspect) * .58 / Math.tan(halfFov) + tvSize.z * .5;
            closeEye.copy(tvCenter).add(new THREE.Vector3(0,.12,distance));
            normalEye.copy(camera.position);
            const orbitRadius = Math.hypot(normalEye.x,normalEye.z);
            const theta = Math.atan2(normalEye.x,normalEye.z) * (1 - cinematicBlend);
            const radius = THREE.MathUtils.lerp(orbitRadius, closeEye.z, cinematicBlend);
            camera.position.set(Math.sin(theta)*radius, THREE.MathUtils.lerp(normalEye.y,closeEye.y,cinematicBlend),Math.cos(theta)*radius);
            camera.lookAt(animatedFocus.copy(focus).lerp(tvCenter,cinematicBlend));
            backWall.visible = camera.position.z > -3.65;
            sideWall.visible = camera.position.x > -5.86;
        }
        playback.hidden = !on || video.hidden;
        ctx.fillStyle = on ? '#241139' : '#243845';
        ctx.fillRect(0,0,840,540);
        if (on && !video.hidden && video.readyState >= 2 && video.videoWidth) {
            const scale = Math.min(840/video.videoWidth,540/video.videoHeight);
            const width = video.videoWidth*scale;
            const height = video.videoHeight*scale;
            ctx.drawImage(video,(840-width)/2,(540-height)/2,width,height);
        } else if(on) {
            ctx.fillStyle = '#ffe74b';
            ctx.font = 'bold 62px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(el('headline').textContent,420,270,740);
        }
        texture.needsUpdate = true;
        renderer.render(scene,camera);
    });
} catch (error) {
    document.querySelector('.tv').classList.remove('ready');
    el('roomHint').textContent = matchMedia("(pointer:coarse)").matches ? "Geser 360° · Cubit untuk zoom" : '3D gagal dimuat. Cek internet dan WebGL.';
    console.warn('3D preview unavailable', error);
}

})();