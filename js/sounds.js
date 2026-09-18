// sounds.js — نظام أصوات ذكي (Web Audio API)
// تصميم احترافي بأحجام منخفضة حتى لا يتعب المستخدم

(function() {
    'use strict';

    let audioCtx = null;
    let masterVolume = 0.6; // تحكم عام (0-1)

    function getCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { return null; }
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    // ============ 1. نقرة زر ناعمة (0.08s — واطية جداً) ============
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
        gain.gain.linearRampToValueAtTime(0.035 * masterVolume, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    // ============ 2. اختيار/تفعيل (Tick — 0.05s) ============
    function playTick() {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.03);

        gain.gain.setValueAtTime(0.045 * masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // ============ 3. AI — نبض فوتوري (0.15s) ============
    function playAI() {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // نغمة أولى
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(900, now);
        osc1.frequency.exponentialRampToValueAtTime(1400, now + 0.1);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.05 * masterVolume, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        // نغمة ثانية (توافق)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1800, now + 0.03);
        osc2.frequency.exponentialRampToValueAtTime(2200, now + 0.13);
        gain2.gain.setValueAtTime(0, now + 0.03);
        gain2.gain.linearRampToValueAtTime(0.025 * masterVolume, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.03);
        osc2.stop(now + 0.17);
    }

    // ============ 4. بدء التحليل (Deep + whoosh — 0.35s) ============
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
        gain.gain.linearRampToValueAtTime(0.06 * masterVolume, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);

        // Whoosh — ضجيج أبيض مع فلتر
        const bufferSize = ctx.sampleRate * 0.3;
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
        nGain.gain.linearRampToValueAtTime(0.035 * masterVolume, now + 0.2);
        nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(ctx.destination);
        noise.start(now + 0.1);
        noise.stop(now + 0.4);
    }

    // ============ 5. نجاح — نغمة ثلاثية (0.6s) ============
    function playSuccess() {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5-E5-G5

        notes.forEach(function(freq, i) {
            const t = now + i * 0.09;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.045 * masterVolume, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.42);
        });
    }

    // ============ 6. خطأ — نبض منخفض (0.18s) ============
    function playError() {
        const ctx = getCtx();
        if (!ctx) return;
        const now = ctx.currentTime;

        // نبضتين متتاليتين
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
            gain.gain.linearRampToValueAtTime(0.04 * masterVolume, t + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.09);
        });
    }

    // ============ ربط تلقائي بالعناصر ============
    function attachSounds() {
        // النقرات العادية (أزرار، روابط)
        document.querySelectorAll(
            'button, a.btn, .btn, .nav-link, .footer-links a, .style-card, .feature'
        ).forEach(function(el) {
            if (el.dataset.sndBound === 'click') return;
            el.dataset.sndBound = 'click';
            el.addEventListener('click', playClick);
        });

        // الاقتراحات والتبويبات (Tick)
        document.querySelectorAll(
            '.suggestion-btn, .mode-tab, .social-circle, [data-sound="tick"]'
        ).forEach(function(el) {
            if (el.dataset.sndBound === 'tick') return;
            el.dataset.sndBound = 'tick';
            el.addEventListener('click', playTick);
        });

        // أزرار AI (نغمة فوتورية)
        document.querySelectorAll(
            '[data-sound="ai"], .ai-avatar, .send-btn'
        ).forEach(function(el) {
            if (el.dataset.sndBound === 'ai') return;
            el.dataset.sndBound = 'ai';
            el.addEventListener('click', playAI);
        });

        // أزرار بدء التحليل
        document.querySelectorAll(
            '#analyzeVideoBtn, #pickBtn, [data-sound="start"]'
        ).forEach(function(el) {
            if (el.dataset.sndBound === 'start') return;
            el.dataset.sndBound = 'start';
            el.addEventListener('click', playStart);
        });
    }

    // تشغيل عند التحميل
    function boot() {
        attachSounds();
        const observer = new MutationObserver(function() {
            setTimeout(attachSounds, 50);
        });
        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                attachSounds();
                observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setTimeout(boot, 100); });
    } else {
        setTimeout(boot, 100);
    }

    // ============ API عام ============
    window.FTSounds = {
        click: playClick,
        tick: playTick,
        ai: playAI,
        start: playStart,
        success: playSuccess,
        error: playError,
        setVolume: function(v) { masterVolume = Math.max(0, Math.min(1, v)); },
        getVolume: function() { return masterVolume; }
    };
})();
