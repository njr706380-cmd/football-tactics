// video-analyzer.js — Video created off-DOM only when needed

let selectedVideoFile = null;
let extractedFrames = [];

const WORKER_URL = "https://tactics-ai.njr706380.workers.dev";
const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION = 60;
const FRAME_COUNT = 12;
const FRAME_MAX_WIDTH = 480;

let $fileInput, $analyzeBtn, $progress, $framesGrid, $error;

function initVideoAnalyzer() {
    $fileInput  = document.getElementById("videoFileInput");
    $analyzeBtn = document.getElementById("analyzeVideoBtn");
    $progress   = document.getElementById("videoProgress");
    $framesGrid = document.getElementById("framesGrid");
    $error      = document.getElementById("videoError");

    if (!$fileInput) return;

    $fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) handleVideoFile(e.target.files[0]);
    });
    $analyzeBtn.addEventListener("click", analyzeVideo);
}

function showError(msg) {
    if (!$error) return;
    $error.textContent = msg;
    $error.style.display = "block";
}

function hideError() {
    if (!$error) return;
    $error.style.display = "none";
}

function handleVideoFile(file) {
    hideError();
    extractedFrames = [];
    if ($framesGrid) $framesGrid.innerHTML = "";

    if (!file.type.startsWith("video/")) {
        showError("الملف المختار ليس فيديو.");
        return;
    }
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        showError("حجم الفيديو كبير — الحد " + MAX_VIDEO_SIZE_MB + " ميجابايت.");
        return;
    }

    selectedVideoFile = file;
    $analyzeBtn.disabled = false;
}

async function analyzeVideo() {
    if (!selectedVideoFile) return;
    hideError();
    extractedFrames = [];
    if ($framesGrid) $framesGrid.innerHTML = "";
    $analyzeBtn.disabled = true;

    if ($progress) {
        $progress.style.display = "block";
        $progress.value = 0;
    }

    // ننشئ الفيديو داخل JS فقط — ما يلمس الصفحة
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(video);
    video.src = URL.createObjectURL(selectedVideoFile);

    try {
        await waitForMetadata(video);
        const duration = video.duration;

        if (duration > MAX_VIDEO_DURATION) {
            showError("مدة الفيديو طويلة — الحد " + MAX_VIDEO_DURATION + " ثانية.");
            cleanup(video);
            resetAnalyzeUI();
            return;
        }

        const frames = await extractFrames(video, FRAME_COUNT);
        extractedFrames = frames;
        renderFrames(frames);

        if ($progress) $progress.style.display = "none";

        // ننظف الفيديو قبل الإرسال
        cleanup(video);

        await sendFramesToWorker(frames);

    } catch (err) {
        console.error("Error:", err);
        cleanup(video);
        showError("تعذر معالجة الفيديو. حاول مرة أخرى.");
        resetAnalyzeUI();
    }
}

function cleanup(video) {
    try {
        video.pause();
        video.src = "";
        video.load();
        if (video.parentNode) video.parentNode.removeChild(video);
    } catch (e) { /* ignore */ }
}

function resetAnalyzeUI() {
    if ($progress) $progress.style.display = "none";
    if ($analyzeBtn) $analyzeBtn.disabled = false;
}

function waitForMetadata(video) {
    return new Promise((resolve, reject) => {
        if (video.readyState >= 1) return resolve();
        const onLoaded = () => { cleanup_listeners(); resolve(); };
        const onError = () => { cleanup_listeners(); reject(new Error("load error")); };
        const cleanup_listeners = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            video.removeEventListener("error", onError);
        };
        video.addEventListener("loadedmetadata", onLoaded);
        video.addEventListener("error", onError);
        setTimeout(() => { cleanup_listeners(); reject(new Error("timeout")); }, 5000);
    });
}

async function extractFrames(video, count) {
    const canvas = document.createElement("canvas");
    const ratio = video.videoWidth / video.videoHeight || 16 / 9;
    const width = Math.min(FRAME_MAX_WIDTH, video.videoWidth || 480);
    const height = Math.round(width / ratio);
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    const duration = video.duration;
    const frames = [];

    for (let i = 0; i < count; i++) {
        const t = (duration * (i + 0.5)) / count;
        await seekVideo(video, t);
        ctx.drawImage(video, 0, 0, width, height);
        frames.push({ timestamp: t, dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
        if ($progress) $progress.value = ((i + 1) / count) * 100;
    }

    return frames;
}

function seekVideo(video, time) {
    return new Promise((resolve) => {
        let done = false;
        const onSeeked = () => {
            if (done) return;
            done = true;
            video.removeEventListener("seeked", onSeeked);
            resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = time;
        setTimeout(() => {
            if (done) return;
            done = true;
            video.removeEventListener("seeked", onSeeked);
            resolve();
        }, 1500);
    });
}

function renderFrames(frames) {
    if (!$framesGrid) return;
    $framesGrid.innerHTML = "";
    frames.forEach((frame, i) => {
        const div = document.createElement("div");
        div.className = "frame-item";
        div.innerHTML =
            '<img src="' + frame.dataUrl + '" alt="' + (i + 1) + '">' +
            '<span class="frame-time">' + formatTime(frame.timestamp) + '</span>';
        $framesGrid.appendChild(div);
    });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

async function sendFramesToWorker(frames) {
    const videoMode = document.getElementById("videoMode");
    if (!videoMode) return;

    const loading = document.createElement("div");
    loading.id = "analysisLoading";
    loading.style.cssText = "text-align:center;padding:30px 15px;color:#D4AF37;font-size:14px;";
    loading.innerHTML = '<div style="font-size:40px;margin-bottom:10px;">🧠</div>جاري تحليل اللقطات بالذكاء الاصطناعي...<br><span style="font-size:11px;color:#888;">قد يستغرق 10-20 ثانية</span>';
    videoMode.appendChild(loading);

    try {
        const res = await fetch(WORKER_URL + "/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frames: frames })
        });

        const data = await res.json();
        loading.remove();

        if (!res.ok || !data.success) {
            showError("فشل التحليل: " + (data.details || data.error || "خطأ"));
            resetAnalyzeUI();
            return;
        }

        renderAnalysis(data.analysis);
    } catch (err) {
        console.error("Analysis error:", err);
        loading.remove();
        showError("تعذر الاتصال بالخدمة. حاول مرة أخرى.");
    } finally {
        resetAnalyzeUI();
    }
}

function renderAnalysis(text) {
    const videoMode = document.getElementById("videoMode");
    if (!videoMode) return;

    const existing = document.getElementById("analysisResult");
    if (existing) existing.remove();

    const card = document.createElement("div");
    card.id = "analysisResult";
    card.style.cssText = "background:rgba(20,20,20,0.95);border:1px solid rgba(212,175,55,0.4);border-radius:16px;padding:20px;margin-top:20px;text-align:right;direction:rtl;";

    const title = document.createElement("div");
    title.style.cssText = "color:#D4AF37;font-size:16px;font-weight:900;margin-bottom:15px;";
    title.textContent = "📊 التحليل التكتيكي";
    card.appendChild(title);

    const content = document.createElement("div");
    content.style.cssText = "color:#EEE;font-size:14px;line-height:1.9;white-space:pre-wrap;word-wrap:break-word;";
    content.textContent = text;
    card.appendChild(content);

    videoMode.appendChild(card);
    setTimeout(() => card.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideoAnalyzer);
} else {
    initVideoAnalyzer();
}
