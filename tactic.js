// ============================================
// tactic.js - ملعب 3D (كرة صفراء نظيفة)
// ============================================

const FIELD_LENGTH = 140;
const FIELD_WIDTH = 90;
const PLAYER_RADIUS = 2;

let scene, camera, renderer, controls;
let ownPlayers = [];
let currentStyle = null;
let currentMode = "attacking";
let targetOwn = [];
let animationId = null;

let moveSpeed = 0.08;
let movePaused = false;
let arrowsGroup = null;
let demoRunning = false;
let demoTimers = [];

// ============ مواقع اللاعبين في كل خطة ============
const FORMATIONS = {
    "4-3-3": [
        { x: -62, z: 0 },
        { x: -45, z: -25 }, { x: -48, z: -8 }, { x: -48, z: 8 }, { x: -45, z: 25 },
        { x: -20, z: -18 }, { x: -22, z: 0 }, { x: -20, z: 18 },
        { x: 0, z: -28 }, { x: 18, z: 0 }, { x: 0, z: 28 }
    ],
    "3-2-4-1": [
        { x: -62, z: 0 },
        { x: -50, z: -18 }, { x: -52, z: 0 }, { x: -50, z: 18 },
        { x: -28, z: -12 }, { x: -28, z: 12 },
        { x: -5, z: -32 }, { x: -8, z: -8 }, { x: -8, z: 8 }, { x: -5, z: 32 },
        { x: 20, z: 0 }
    ],
    "4-2-3-1": [
        { x: -62, z: 0 },
        { x: -45, z: -25 }, { x: -48, z: -8 }, { x: -48, z: 8 }, { x: -45, z: 25 },
        { x: -25, z: -12 }, { x: -25, z: 12 },
        { x: -5, z: -25 }, { x: -3, z: 0 }, { x: -5, z: 25 },
        { x: 18, z: 0 }
    ],
    "4-4-2": [
        { x: -62, z: 0 },
        { x: -48, z: -28 }, { x: -50, z: -9 }, { x: -50, z: 9 }, { x: -48, z: 28 },
        { x: -28, z: -30 }, { x: -30, z: -10 }, { x: -30, z: 10 }, { x: -28, z: 30 },
        { x: -5, z: -10 }, { x: -5, z: 10 }
    ],
    "4-2-4": [
        { x: -62, z: 0 },
        { x: -42, z: -28 }, { x: -45, z: -9 }, { x: -45, z: 9 }, { x: -42, z: 28 },
        { x: -18, z: -12 }, { x: -18, z: 12 },
        { x: 5, z: -30 }, { x: 18, z: -8 }, { x: 18, z: 8 }, { x: 5, z: 30 }
    ],
    "2-3-5": [
        { x: -62, z: 0 },
        { x: -48, z: -12 }, { x: -48, z: 12 },
        { x: -25, z: -22 }, { x: -25, z: 0 }, { x: -25, z: 22 },
        { x: 5, z: -35 }, { x: 5, z: -12 }, { x: 10, z: 0 }, { x: 5, z: 12 }, { x: 5, z: 35 }
    ],
    "5-3-2": [
        { x: -62, z: 0 },
        { x: -52, z: -35 }, { x: -54, z: -18 }, { x: -55, z: 0 }, { x: -54, z: 18 }, { x: -52, z: 35 },
        { x: -32, z: -18 }, { x: -35, z: 0 }, { x: -32, z: 18 },
        { x: -12, z: -8 }, { x: -12, z: 8 }
    ],
    "3-4-3": [
        { x: -62, z: 0 },
        { x: -48, z: -22 }, { x: -50, z: 0 }, { x: -48, z: 22 },
        { x: -25, z: -32 }, { x: -28, z: -10 }, { x: -28, z: 10 }, { x: -25, z: 32 },
        { x: 5, z: -25 }, { x: 18, z: 0 }, { x: 5, z: 25 }
    ],
    "3-4-2-1": [
        { x: -62, z: 0 },
        { x: -48, z: -22 }, { x: -50, z: 0 }, { x: -48, z: 22 },
        { x: -28, z: -32 }, { x: -30, z: -10 }, { x: -30, z: 10 }, { x: -28, z: 32 },
        { x: -5, z: -15 }, { x: -5, z: 15 },
        { x: 18, z: 0 }
    ],
    "5-4-1": [
        { x: -62, z: 0 },
        { x: -52, z: -35 }, { x: -54, z: -18 }, { x: -55, z: 0 }, { x: -54, z: 18 }, { x: -52, z: 35 },
        { x: -32, z: -30 }, { x: -34, z: -10 }, { x: -34, z: 10 }, { x: -32, z: 30 },
        { x: -10, z: 0 }
    ],
    "4-1-2-3": [
        { x: -62, z: 0 },
        { x: -42, z: -28 }, { x: -45, z: -9 }, { x: -45, z: 9 }, { x: -42, z: 28 },
        { x: -28, z: 0 },
        { x: -12, z: -18 }, { x: -12, z: 18 },
        { x: 8, z: -28 }, { x: 20, z: 0 }, { x: 8, z: 28 }
    ]
};

// ============ بدء التطبيق ============
document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const styleId = params.get("style") || "possession";
    currentStyle = STYLES.find(s => s.id === styleId) || STYLES[0];

    document.getElementById("topTitle").textContent = currentStyle.name;
    document.getElementById("topIcon").textContent = currentStyle.icon;

    updateStyleInfo();
    initScene();
    createPitch();
    createPlayers();

    arrowsGroup = new THREE.Group();
    scene.add(arrowsGroup);

    ownPlayers.forEach((p, i) => {
        p.position.set(-60 + i * 0.5, 0, 0);
    });

    setMode("attacking");
    animate();

    setTimeout(() => {
        document.getElementById("loading").classList.add("hidden");
    }, 500);
});

// ============ إظهار/إخفاء اللوحة ============
function toggleInfo() {
    const panel = document.getElementById("styleInfo");
    const btn = document.getElementById("infoToggleBtn");
    panel.classList.toggle("hidden");
    btn.classList.toggle("active");
}

// ============ إظهار/إخفاء الأزرار ============
function toggleControls() {
    const controls = document.getElementById("bottomControls");
    const btn = document.getElementById("controlsToggleBtn");
    controls.classList.toggle("hidden");
    btn.classList.toggle("active");
}

// ============ معلومات الأسلوب ============
function updateStyleInfo() {
    const infoFormations = document.getElementById("infoFormations");
    infoFormations.innerHTML = currentStyle.formations
        .map(f => `<span class="formation-tag">${f}</span>`)
        .join("");

    const mode = currentMode === "attacking" ? currentStyle.attacking : currentStyle.defending;
    document.getElementById("currentMode").textContent = 
        currentMode === "attacking" ? "⚔️ هجوم" : "🛡️ دفاع";
    document.getElementById("currentFormation").textContent = mode.formation;
    document.getElementById("currentDesc").textContent = mode.description;
}

// ============ تهيئة المشهد ============
function initScene() {
    const container = document.getElementById("canvas-container");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 150, 280);

    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(0, 130, 130);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffee, 1);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const goldLight = new THREE.PointLight(0xD4AF37, 0.8, 200);
    goldLight.position.set(-60, 50, -60);
    scene.add(goldLight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 80;
    controls.maxDistance = 250;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.target.set(0, 0, 0);

    window.addEventListener("resize", onResize);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============ إنشاء الملعب ============
function createPitch() {
    const pitchGeo = new THREE.PlaneGeometry(FIELD_LENGTH, FIELD_WIDTH);
    const pitchMat = new THREE.MeshStandardMaterial({
        color: 0x1B5E20,
        roughness: 0.9,
        metalness: 0.1
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.receiveShadow = true;
    scene.add(pitch);

    drawBorder(0, 0, FIELD_LENGTH, FIELD_WIDTH);
    drawLine(0, -FIELD_WIDTH/2, 0, FIELD_WIDTH/2);
    drawCircle(0, 0, 12);
    drawRect(FIELD_LENGTH/2 - 20, 0, 20, 45);
    drawRect(-FIELD_LENGTH/2 + 20, 0, 20, 45);
    drawRect(FIELD_LENGTH/2 - 8, 0, 8, 22);
    drawRect(-FIELD_LENGTH/2 + 8, 0, 8, 22);
    drawPoint(FIELD_LENGTH/2 - 15, 0);
    drawPoint(-FIELD_LENGTH/2 + 15, 0);

    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
}

function drawLine(x1, z1, x2, z2) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const points = [
        new THREE.Vector3(x1, 0.05, z1),
        new THREE.Vector3(x2, 0.05, z2)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(new THREE.Line(geo, mat));
}

function drawBorder(cx, cz, w, h) {
    const hw = w / 2, hh = h / 2;
    drawLine(cx - hw, cz - hh, cx + hw, cz - hh);
    drawLine(cx + hw, cz - hh, cx + hw, cz + hh);
    drawLine(cx + hw, cz + hh, cx - hw, cz + hh);
    drawLine(cx - hw, cz + hh, cx - hw, cz - hh);
}

function drawCircle(cx, cz, r) {
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(cx + Math.cos(a) * r, 0.05, cz + Math.sin(a) * r));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(new THREE.Line(geo, mat));
}

function drawRect(cx, cz, w, h) {
    const hw = w / 2, hh = h / 2;
    drawLine(cx - hw, cz - hh, cx + hw, cz - hh);
    drawLine(cx + hw, cz - hh, cx + hw, cz + hh);
    drawLine(cx + hw, cz + hh, cx - hw, cz + hh);
    drawLine(cx - hw, cz + hh, cx - hw, cz - hh);
}

function drawPoint(x, z) {
    const geo = new THREE.CircleGeometry(0.6, 16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const point = new THREE.Mesh(geo, mat);
    point.rotation.x = -Math.PI / 2;
    point.position.set(x, 0.06, z);
    scene.add(point);
}

// ============ إنشاء لاعب (كرة صفراء نظيفة) ============
function createPlayer() {
    const group = new THREE.Group();

    const sphereGeo = new THREE.SphereGeometry(PLAYER_RADIUS, 24, 24);
    const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xD4AF37,
        roughness: 0.4,
        metalness: 0.6,
        emissive: 0xD4AF37,
        emissiveIntensity: 0.3
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.y = PLAYER_RADIUS;
    sphere.castShadow = true;
    group.add(sphere);

    const ringGeo = new THREE.RingGeometry(PLAYER_RADIUS + 0.5, PLAYER_RADIUS + 1, 24);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    group.add(ring);

    return group;
}

function createPlayers() {
    for (let i = 0; i < 11; i++) {
        const p = createPlayer();
        p.position.set(-60, 0, 0);
        scene.add(p);
        ownPlayers.push(p);
    }
}

// ============ نظام الأقرب ============
function matchPlayersToTargets() {
    const targets = targetOwn.map((t, i) => ({ x: t.x, z: t.z, taken: false }));
    const result = new Array(ownPlayers.length);

    // الحارس يظل حارس (لاعب 0)
    if (targets[0]) {
        result[0] = { x: targets[0].x, z: targets[0].z };
        targets[0].taken = true;
    }

    for (let i = 1; i < ownPlayers.length; i++) {
        const p = ownPlayers[i].position;
        let closestIdx = -1;
        let closestDist = Infinity;

        for (let j = 0; j < targets.length; j++) {
            if (targets[j].taken) continue;
            const dx = targets[j].x - p.x;
            const dz = targets[j].z - p.z;
            const dist = dx * dx + dz * dz;
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = j;
            }
        }

        if (closestIdx >= 0) {
            result[i] = { x: targets[closestIdx].x, z: targets[closestIdx].z };
            targets[closestIdx].taken = true;
        }
    }

    targetOwn = result;
}

// ============ تعيين الوضع ============
function setMode(mode) {
    currentMode = mode;
    document.getElementById("btnAttack").classList.toggle("active", mode === "attacking");
    document.getElementById("btnDefend").classList.toggle("active", mode === "defending");

    const data = mode === "attacking" ? currentStyle.attacking : currentStyle.defending;
    const formation = FORMATIONS[data.formation] || FORMATIONS["4-3-3"];

    targetOwn = formation.map(p => ({ x: p.x, z: p.z }));
    matchPlayersToTargets();
    updateStyleInfo();
}

// ============ إنشاء الأسهم ============
function createArrows() {
    clearArrows();

    ownPlayers.forEach((p, i) => {
        if (!targetOwn[i]) return;
        const from = new THREE.Vector3(p.position.x, 0.5, p.position.z);
        const to = new THREE.Vector3(targetOwn[i].x, 0.5, targetOwn[i].z);
        const dir = to.clone().sub(from);
        const len = dir.length();
        if (len < 2) return;

        const arrow = new THREE.ArrowHelper(
            dir.clone().normalize(),
            from,
            len,
            0xD4AF37,
            4,
            2.5
        );
        arrowsGroup.add(arrow);
    });
}

function clearArrows() {
    while (arrowsGroup.children.length) {
        const c = arrowsGroup.children[0];
        arrowsGroup.remove(c);
        if (c.geometry) c.geometry.dispose();
        if (c.material) c.material.dispose();
    }
}

// ============ وضع الشرح ============
function startDemo() {
    const btn = document.getElementById("demoBtn");

    if (demoRunning) {
        demoRunning = false;
        movePaused = false;
        moveSpeed = 0.08;
        demoTimers.forEach(t => clearTimeout(t));
        demoTimers = [];
        clearArrows();
        btn.classList.remove("active");
        btn.innerHTML = '<span>📽️</span><span>شرح التحرك</span>';
        return;
    }

    demoRunning = true;
    moveSpeed = 0.025;
    btn.classList.add("active");
    btn.innerHTML = '<span>⏸️</span><span>إيقاف الشرح</span>';

    const cycle = () => {
        if (!demoRunning) return;

        const nextMode = currentMode === "attacking" ? "defending" : "attacking";
        const data = nextMode === "attacking" ? currentStyle.attacking : currentStyle.defending;
        const formation = FORMATIONS[data.formation] || FORMATIONS["4-3-3"];

        targetOwn = formation.map(p => ({ x: p.x, z: p.z }));
        matchPlayersToTargets();

        movePaused = true;
        createArrows();

        document.getElementById("btnAttack").classList.toggle("active", nextMode === "attacking");
        document.getElementById("btnDefend").classList.toggle("active", nextMode === "defending");
        currentMode = nextMode;
        updateStyleInfo();

        demoTimers.push(setTimeout(() => {
            if (!demoRunning) return;
            clearArrows();
            movePaused = false;
            demoTimers.push(setTimeout(cycle, 5000));
        }, 2500));
    };

    cycle();
}

// ============ تحديث المواقع ============
function updatePositions() {
    if (movePaused) return;

    ownPlayers.forEach((p, i) => {
        if (!targetOwn[i]) return;
        p.position.x += (targetOwn[i].x - p.position.x) * moveSpeed;
        p.position.z += (targetOwn[i].z - p.position.z) * moveSpeed;
    });
}

// ============ حلقة الأنيميشن ============
function animate() {
    animationId = requestAnimationFrame(animate);
    updatePositions();

    const t = Date.now() * 0.001;
    ownPlayers.forEach(p => {
        p.children[0].position.y = PLAYER_RADIUS + Math.sin(t * 2 + p.position.x) * 0.15;
    });

    controls.update();
    renderer.render(scene, camera);
}

// ============ إعادة الكاميرا ============
function resetCamera() {
    camera.position.set(0, 130, 130);
    controls.target.set(0, 0, 0);
    controls.update();
}
