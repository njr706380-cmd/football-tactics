(function () {
    if (typeof THREE === 'undefined') return;
    var canvas = document.getElementById('worldBg');
    if (!canvas) return;

    var isM = window.innerWidth < 768;
    var W = window.innerWidth, H = window.innerHeight;

    var renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: !isM, alpha: true,
        powerPreference: 'low-power'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isM ? 1.5 : 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x02030a, 1);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02030a, 0.008);

    var camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 600);
    camera.position.set(0, 15, 55);
    camera.lookAt(0, 6, 0);

    scene.add(new THREE.AmbientLight(0x1a2540, 0.9));
    var l1 = new THREE.PointLight(0x00B8FF, 1.5, 150, 2);
    l1.position.set(-40, 30, 0); scene.add(l1);
    var l2 = new THREE.PointLight(0xD4AF37, 1.2, 150, 2);
    l2.position.set(40, 30, 0); scene.add(l2);

    // Ground
    var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(500, 500),
        new THREE.MeshBasicMaterial({ color: 0x061019 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    var grid = new THREE.GridHelper(500, 120, 0x00B8FF, 0x0a2840);
    grid.material.opacity = 0.22;
    grid.material.transparent = true;
    scene.add(grid);

    // Stadiums
    var stadiums = [];
    function mkStadium(x, z, s, col) {
        var g = new THREE.Group();
        var r1 = new THREE.Mesh(
            new THREE.RingGeometry(s * 3, s * 4, 48),
            new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
        );
        r1.rotation.x = -Math.PI / 2;
        g.add(r1);
        var r2 = new THREE.Mesh(
            new THREE.RingGeometry(s * 1.4, s * 1.8, 32),
            new THREE.MeshBasicMaterial({ color: 0x00F0FF, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
        );
        r2.rotation.x = -Math.PI / 2;
        r2.position.y = 0.1;
        g.add(r2);
        var c = new THREE.Mesh(
            new THREE.CircleGeometry(s * 1.3, 32),
            new THREE.MeshBasicMaterial({ color: 0x082033, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
        );
        c.rotation.x = -Math.PI / 2;
        c.position.y = 0.05;
        g.add(c);
        g.position.set(x, 0, z);
        scene.add(g);
        return { ring1: r1, ring2: r2, phase: Math.random() * 6.28 };
    }

    var stCount = isM ? 6 : 12;
    for (var i = 0; i < stCount; i++) {
        var ang = (i / stCount) * Math.PI * 2 + Math.random() * 0.5;
        var rad = 70 + Math.random() * 100;
        var st = mkStadium(Math.cos(ang) * rad, Math.sin(ang) * rad - 40, 3 + Math.random() * 4, Math.random() > 0.5 ? 0x00B8FF : 0xD4AF37);
        stadiums.push(st);
    }

    // Robots
    var robots = [];
    function mkRobot(x, z, col, sc) {
        var g = new THREE.Group();
        var matB = new THREE.MeshStandardMaterial({ color: 0x0a1520, emissive: col, emissiveIntensity: 0.35, metalness: 0.9, roughness: 0.3 });
        var matH = new THREE.MeshStandardMaterial({ color: 0x0a1520, emissive: col, emissiveIntensity: 0.7, metalness: 0.9, roughness: 0.2 });
        var body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.4, 0.6), matB);
        body.position.y = 0.9; g.add(body);
        var head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), matH);
        head.position.y = 1.9; g.add(head);
        var eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00F0FF }));
        eye.position.set(0, 1.95, 0.33); g.add(eye);
        var legMat = new THREE.MeshStandardMaterial({ color: 0x0a1520, metalness: 0.9, roughness: 0.3 });
        var lA = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.6, 6), legMat);
        lA.position.set(-0.22, 0.3, 0); g.add(lA);
        var lB = lA.clone(); lB.position.x = 0.22; g.add(lB);
        var arm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 6), legMat);
        arm.position.set(-0.55, 1.1, 0); g.add(arm);
        var arm2 = arm.clone(); arm2.position.x = 0.55; g.add(arm2);
        g.scale.setScalar(sc);
        g.position.set(x, 0, z);
        scene.add(g);
        return g;
    }

    var rCount = isM ? 6 : 15;
    for (var j = 0; j < rCount; j++) {
        var a2 = Math.random() * Math.PI * 2;
        var r2 = 25 + Math.random() * 55;
        var rx = Math.cos(a2) * r2, rz = Math.sin(a2) * r2 - 25;
        var rc = Math.random() > 0.5 ? 0x00B8FF : 0xD4AF37;
        var mesh = mkRobot(rx, rz, rc, 0.8 + Math.random() * 0.5);
        robots.push({ mesh: mesh, baseX: rx, baseZ: rz, phase: Math.random() * 6.28, radius: 1.5 + Math.random() * 3, angle: Math.random() * 6.28 });
    }

    // Particles
    var pCount = isM ? 200 : 450;
    var pGeo = new THREE.BufferGeometry();
    var pPos = new Float32Array(pCount * 3);
    var pCol = new Float32Array(pCount * 3);
    for (var p = 0; p < pCount; p++) {
        pPos[p * 3] = (Math.random() - 0.5) * 320;
        pPos[p * 3 + 1] = Math.random() * 40 + 2;
        pPos[p * 3 + 2] = (Math.random() - 0.5) * 320 - 40;
        if (Math.random() > 0.5) { pCol[p * 3] = 0; pCol[p * 3 + 1] = 0.72; pCol[p * 3 + 2] = 1; }
        else { pCol[p * 3] = 0.83; pCol[p * 3 + 1] = 0.69; pCol[p * 3 + 2] = 0.22; }
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    var particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
        size: 0.4, vertexColors: true, transparent: true, opacity: 0.75,
        sizeAttenuation: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(particles);

    // Animation
    var clock = new THREE.Clock();
    var camA = 0;
    function animate() {
        requestAnimationFrame(animate);
        var t = clock.getElapsedTime();
        camA += 0.0008;
        var cR = 55 + Math.sin(t * 0.05) * 5;
        camera.position.x = Math.cos(camA) * cR;
        camera.position.z = Math.sin(camA) * cR;
        camera.position.y = 15 + Math.sin(t * 0.15) * 2;
        camera.lookAt(0, 5, 0);

        for (var i = 0; i < stadiums.length; i++) {
            var s = stadiums[i];
            var pu = 0.4 + Math.sin(t * 0.8 + s.phase) * 0.3;
            s.ring1.material.opacity = pu;
            s.ring2.material.opacity = pu * 0.7;
        }

        for (var r = 0; r < robots.length; r++) {
            var ro = robots[r];
            ro.angle += 0.004;
            ro.mesh.position.x = ro.baseX + Math.cos(ro.angle) * ro.radius;
            ro.mesh.position.z = ro.baseZ + Math.sin(ro.angle) * ro.radius;
            ro.mesh.position.y = Math.abs(Math.sin(t * 2 + ro.phase)) * 0.08;
            ro.mesh.rotation.y = -ro.angle + Math.PI / 2;
        }

        particles.rotation.y = t * 0.008;
        l1.position.x = Math.cos(t * 0.15) * 50;
        l1.position.z = Math.sin(t * 0.15) * 50;
        l2.position.x = Math.cos(t * 0.15 + Math.PI) * 50;
        l2.position.z = Math.sin(t * 0.15 + Math.PI) * 50;

        renderer.render(scene, camera);
    }

    window.addEventListener('resize', function () {
        var nW = window.innerWidth, nH = window.innerHeight;
        camera.aspect = nW / nH;
        camera.updateProjectionMatrix();
        renderer.setSize(nW, nH);
    });

    animate();
})();
