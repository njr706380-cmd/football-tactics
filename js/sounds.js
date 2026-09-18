// sounds.js — أصوات النقر (Web Audio API - بدون ملفات)

(function() {
    let audioCtx = null;

    function getCtx() {
        if (!audioCtx) {
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                return null;
            }
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    // 1. نقرة ناعمة
    function playSoftClick() {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
    }

    // 2. نبض رقمي
    function playBlip() {
        const ctx = getCtx();
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
    }

    // ربط الأصوات تلقائياً
    function attachSounds() {
        // جميع الأزرار والروابط
        document.querySelectorAll('a, button, .btn, .style-card, .nav-link, .suggestion-btn, .mode-tab, .social-circle').forEach(function(el) {
            if (el.dataset.soundAttached) return;
            el.dataset.soundAttached = 'true';

            el.addEventListener('click', function() {
                // الروابط الخارجية أو الأزرار الكبيرة = نبض رقمي
                if (el.tagName === 'A' || el.classList.contains('btn') || el.classList.contains('social-circle')) {
                    playBlip();
                } else {
                    // الأزرار العادية = نقرة ناعمة
                    playSoftClick();
                }
            });
        });
    }

    // تشغيل عند تحميل الصفحة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(attachSounds, 100);
        });
    } else {
        setTimeout(attachSounds, 100);
    }

    // إعادة الربط بعد أي تغييرات DOM
    const observer = new MutationObserver(function() {
        setTimeout(attachSounds, 50);
    });
    document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.body, { childList: true, subtree: true });
    });

    // كشف الدوال (اختياري)
    window.FTSounds = {
        click: playSoftClick,
        blip: playBlip
    };
})();
