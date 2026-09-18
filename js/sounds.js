// sounds.js - نسخة محسّنة (unlock تلقائي متكرر)

(function() {
    'use strict';

    let audioCtx = null;
    let isUnlocked = false;
    const masterVolume = 0.55;

    function getCtx() {
        if (!audioCtx) {
            try {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return null;
                audioCtx = new AC();
            } catch (e) { return null; }
        }
        return audioCtx;
    }

    // unlock aggressively — يستدعى بكثرة
    function unlockAudio() {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
            ctx.resume().then(function() { isUnlocked = true; }).catch(function(){});
        } else {
            isUnlocked = true;
        }
    }

    // ============ 🔘 نقرة ناعمة ============
    function playClick() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.06);

        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.032 * masterVolume, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // ============ ✨ Tick ============
    function playTick() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.03);

        gain.gain.setValueAtTime(0.042 * masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // ============ 🧠 AI ============
    function playAI() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(900, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.048 * masterVolume, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1800, now + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.13);
        gain2.gain.setValueAtTime(0, now + 0.03);
        gain2.gain.linearRampToValueAtTime(0.024 * masterVolume, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.03);
        osc2.stop(now + 0.17);
    }

    // ============ ⚽ Start ============
    function playStart() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.15);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.058 * masterVolume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);

        const bufferSize = Math.floor(ctx.sampleRate * 0.3);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, now + 0.1);
        filter.frequency.exponentialRampToValueAtTime(2500, now + 0.3);
        filter.Q.value = 1;

        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0, now + 0.1);
        nGain.gain.linearRampToValueAtTime(0.032 * masterVolume, now + 0.2);
        nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now + 0.1);
        noise.stop(now + 0.4);
    }

    // ============ ✅ Success ============
    function playSuccess() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99];

        notes.forEach(function(freq, i) {
            const t = now + i * 0.09;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.042 * masterVolume, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.42);
        });
    }

    // ============ ⚠️ Error ============
    function playError() {
        unlockAudio();
        const ctx = getCtx();
        if (!ctx || ctx.state !== 'running') return;
        const now = ctx.currentTime;

        [0, 0.09].forEach(function(offset) {
            const t = now + offset;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, t);
            osc.frequency.exponentialRampToValueAtTime(160, t + 0.07);
            filter.type = 'lowpass';
            filter.frequency.value = 800;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.038 * masterVolume, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.09);
        });
    }

    const SOUNDS = {
        click: playClick,
        tick: playTick,
        ai: playAI,
        start: playStart,
        success: playSuccess,
        error: playError
    };

    function playByName(name) {
        try {
            const fn = SOUNDS[name];
            if (fn) fn();
        } catch (e) {}
    }

    function inferSound(el) {
        if (!el || !el.classList) return 'click';
        const c = el.classList;
        if (c.contains('suggestion-btn') || c.contains('mode-tab') ||
            c.contains('social-circle') || c.contains('tab') ||
            c.contains('coach-card') || c.contains('style-card') ||
            c.contains('feature') || c.contains('mode-btn') ||
            c.contains('side-btn') || c.contains('back-btn')) {
            return 'tick';
        }
        if (c.contains('send-btn') || c.contains('ai-avatar')) {
            return 'ai';
        }
        if (c.contains('analyze-btn') || c.contains('pick-btn')) {
            return 'start';
        }
        return 'click';
    }

    function findSoundElement(target) {
        let el = target;
        let depth = 0;
        while (el && el !== document.documentElement && depth < 10) {
            if (el.nodeType === 1) {
                if (el.getAttribute && el.getAttribute('data-sound')) {
                    return el.getAttribute('data-sound');
                }
                if (el.matches && el.matches(
                    'button, a[href], .btn, .tab, .coach-card, .style-card, ' +
                    '.nav-link, .suggestion-btn, .mode-tab, .social-circle, ' +
                    '.feature, .pick-btn, .analyze-btn, .send-btn, .back-btn, ' +
                    '.footer-links a, .mode-btn, .side-btn'
                )) {
                    return inferSound(el);
                }
            }
            el = el.parentElement;
            depth++;
        }
        return null;
    }

    let lastPlay = 0;
    const MIN_GAP = 20;

    // ========== click handler ==========
    document.addEventListener('click', function(e) {
        unlockAudio(); // أول شي نفعّل الصوت
        try {
            const now = Date.now();
            if (now - lastPlay < MIN_GAP) return;
            lastPlay = now;
            const sound = findSoundElement(e.target);
            if (sound) playByName(sound);
        } catch (err) {}
    }, true);

    // ========== unlock events — متعددة ==========
    ['touchstart', 'touchend', 'mousedown', 'mouseup', 'keydown', 'scroll', 'pointerdown'].forEach(function(evt) {
        document.addEventListener(evt, unlockAudio, { capture: true, passive: true });
    });

    // ========== unlock دوري ==========
    setInterval(unlockAudio, 3000);

    // ========== عند رجوع الصفحة ==========
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) unlockAudio();
    });
    window.addEventListener('focus', unlockAudio);
    window.addEventListener('pageshow', unlockAudio);

    // ========== API عام ==========
    window.FTSounds = {
        click: playClick,
        tick: playTick,
        ai: playAI,
        start: playStart,
        success: playSuccess,
        error: playError,
        play: playByName,
        unlock: unlockAudio
    };
})();
