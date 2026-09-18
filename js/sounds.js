// sounds.js — نظام أصوات رسمي (Web Audio API)
// Event Delegation — يعمل دائماً بدون إعادة ربط

(function() {
    'use strict';

    let audioCtx = null;
    const masterVolume = 0.55;

    function getCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(function(){});
        }
        return audioCtx;
    }

    // ============ 🔘 Button Click (0.08s — واطي جداً) ============
    function playClick() {
        const ctx = getCtx();
        if (!ctx) return;
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

    // ============ ✨ UI Tick (0.05s) ============
    function playTick() {
        const ctx = getCtx();
        if (!ctx) return;
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

    // ============ 🧠 AI Subtle Futuristic Beep (0.15s) ============
    function playAI() {
        const ctx = getCtx();
        if (!ctx) return;
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

    // ============ ⚽ Deep Click + Whoosh (0.35s) ============
    function playStart() {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // نقرة عميقة
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

        // Whoosh — ضجيج أبيض + فلتر
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

    // ============ ✅ Soft Success Chime (0.6s) ============
    function playSuccess() {
        const ctx = getCtx();
        if (!ctx) return;
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

    // ============ ⚠️ Short Low Beep (0.18s) ============
    function playError() {
        const ctx = getCtx();
        if (!ctx) return;
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

    // ============ خريطة الأصوات ============
    const SOUNDS = {
        click: playClick,
        tick: playTick,
        ai: playAI,
        start: playStart,
        success: playSuccess,
        error: playError
    };

    // ============ Event Delegation — يشتغل دائمًا ============
    function playByName(name) {
        const fn = SOUNDS[name];
        if (fn) fn();
    }

    // نقرة عامة على أي عنصر تفاعلي
    document.addEventListener('click', function(e) {
        // تجاوز لو العنصر عليه data-sound
        const explicit = e.target.closest('[data-sound]');
        if (explicit) {
            const soundName = explicit.getAttribute('data-sound');
            // منع التكرار
            if (!explicit.dataset._soundPlayed) {
                explicit.dataset._soundPlayed = '1';
                setTimeout(function() { delete explicit.dataset._soundPlayed; }, 50);
                playByName(soundName);
            }
            return;
        }

        // الكشف التلقائي حسب النوع
        const el = e.target.closest(
            'button, a, .btn, .style-card, .nav-link, .suggestion-btn, .mode-tab, .social-circle, .feature'
        );

        if (!el) return;

        // منع التكرار السريع (double click protection)
        if (el.dataset._sndLock) return;
        el.dataset._sndLock = '1';
        setTimeout(function() { delete el.dataset._sndLock; }, 40);

        // الكشف عن النوع حسب الـ class
        if (el.classList.contains('suggestion-btn') ||
            el.classList.contains('mode-tab') ||
            el.classList.contains('social-circle')) {
            playTick();
        } else if (el.classList.contains('send-btn') ||
                   el.classList.contains('ai-avatar')) {
            playAI();
        } else {
            playClick();
        }
    }, true);

    // ============ API عام ============
    window.FTSounds = {
        click: playClick,
        tick: playTick,
        ai: playAI,
        start: playStart,
        success: playSuccess,
        error: playError,
        play: playByName
    };

    // تنظيف أيقونات قديمة عند التحميل
    console.log('[FTSounds] ready');
})();
