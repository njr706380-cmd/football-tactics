// video-analyzer.js

let selectedVideoFile = null;
let extractedFrames = [];

const WORKER_URL = "https://tactics-ai.njr706380.workers.dev";
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_DURATION = 90;
const FRAME_COUNT = 12;
const FRAME_MAX_WIDTH = 480;

let $fileInput, $analyzeBtn, $progress, $framesGrid, $error, $status, $uploadText;

function initVideoAnalyzer() {
    console.log("[VA] init");
    $fileInput  = document.getElementById("videoFileInput");
    $analyzeBtn = document.getElementById("analyzeVideoBtn");
    $progress   = document.getElementById("videoProgress");
    $framesGrid = document.getElementById("framesGrid");
    $error      = document.getElementById("videoError");
    $status     = document.getElementById("videoStatus");
    $uploadText = document.getElementById("uploadText");

    if (!$fileInput || !$analyzeBtn) { console.log("[VA] missing elements"); return; }

    $fileInput.addEventListener("change", (e) => {
        console.log("[VA] change fired, files:", e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            handleVideoFile(e.target.files[0]);
        }
    });

    $analyzeBtn.addEventListener("click", analyzeVideo);
    console.log("[VA] ready");
}

function showError(msg) {
    console.log("[VA] error:", msg);
    if (!$error) return;
    $error.textContent = "❌ " + msg;
    $error.style.display = "block";
    if ($status) $status.style.display = "none";
    $error.scrollIntoView({ behavior: "smooth", block: "center" });
}

function showStatus(msg) {
    console.log("[VA] status:", msg);
    if (!$status) return;
    $status.textContent = "✅ " + msg;
    $status.style.display = "block";
    if ($error) $error.style.display = "none";
}

function hideMessages() {
    if ($error) $error.style.display = "none";
    if ($status) $status.style.display = "none";
}

function handleVideoFile(file) {
    console.log("[VA] handleVideoFile:", file.name, file.size, file.type);
    hideMessages();
    extractedFrames = [];
    if ($framesGrid) $framesGrid.innerHTML = "";
    const title = document.getElementById("framesTitle");
    if (title) title.classList.remove("show");
    const existing = document.getElementById("analysisResult");
    if (existing) existing.remove();

    const sizeMB = file.size / (1024 * 1024);
    console.log("[VA] size MB:", sizeMB.toFixed(2));

    if (sizeMB > MAX_VIDEO_SIZE_MB) {
        showError("حجم الفيديو كبير (" + sizeMB.toFixed(1) + " ميجابايت). الحد " + MAX_VIDEO_SIZE_MB + " ميجابايت.");
        return;
    }

    selectedVideoFile = file;
    $analyzeBtn.disabled = false;

    if ($uploadText) {
        $uploadText.textContent = "✅ " + file.name;
    }
    showStatus("الفيديو جاهز — اضغط (استخراج اللقطات)");
    console.log("[VA] file accepted, button enabled");
}

async function analyzeVideo() {
    console.log("[VA] analyzeVideo");
    if (!selectedVideoFile) return;
    hideMessages();
    extractedFrames = [];
    if ($framesGrid) $framesGrid.innerHTML = "";
    $analyzeBtn.disabled = true;

    if ($progress) { $progress.style.display = "block"; $progress.value = 0; }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1;";
    document.body.appendChild(video);

    const url = URL.createObjectURL(selectedVideoFile);
    video.src = url;

    try {
        console.log("[VA] waiting metadata");
        await waitMetadata(video);
        console.log("[VA] duration:", video.duration, "dims:", video.videoWidth, "x", video.videoHeight);

        if (video.duration > MAX_VIDEO_DURATION) {
            showError("مدة الفيديو طويلة (" + Math.round(video.duration) + " ثانية). الحد " + MAX_VIDEO_DURATION + " ثانية.");
            cleanup(video, url);
            resetUI();
            return;
        }

        showStatus("جاري استخراج اللقطات...");
        const frames = await extractFrames(video, FRAME_COUNT);
        console.log("[VA] extracted:", frames.length);
        extractedFrames = frames;
        renderFrames(frames);

        if ($progress) $progress.style.display = "none";
        cleanup(video, url);

        showStatus("تم استخراج " + frames.length + " لقطة — جاري إرسالها للتحليل...");
        await sendFramesToWorker(frames);

    } catch (err) {
        console.error("[VA] error:", err);
        showError("تعذر معالجة الفيديو: " + err.message);
        cleanup(video, url);
        resetUI();
    }
}

function cleanup(video, url) {
    try {
        video.pause();
        video.removeAttribute("src");
        video.load();
        if (video.parentNode) video.parentNode.removeChild(video);
        if (url) URL.revokeObjectURL(url);
    } catch (e) {}
}

function resetUI() {
    if ($progress) $progress.style.display = "none";
    if ($analyzeBtn) $analyzeBtn.disabled = false;
}

function waitMetadata(video) {
    return new Promise((resolve, reject) => {
        if (video.readyState >= 1 && video.duration) { resolve(); return; }
        let done = false;
        const ok = () => { if (done) return; done = true; clean(); resolve(); };
        const err = () => { if (done) return; done = true; clean(); reject(new Error("فشل تحميل الفيديو")); };
        const clean = () => {
            video.removeEventListener("loadedmetadata", ok);
            video.removeEventListener("error", err);
            clearTimeout(t);
        };
        video.addEventListener("loadedmetadata", ok);
        video.addEventListener("error", err);
        const t = setTimeout(() => {
            if (done) return; done = true; clean();
            if (video.videoWidth && video.duration) resolve();
            else reject(new Error("انتهت المهلة"));
        }, 8000);
    });
}

async function extractFrames(video, count) {
    const canvas = document.createElement("canvas");
    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 360;
    const ratio = vw / vh;
    const width = Math.min(FRAME_MAX_WIDTH, vw);
    const height = Math.round(width / ratio);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    const duration = video.duration;
    const frames = [];

    for (let i = 0; i < count; i++) {
        const t = (duration * (i + 0.5)) / count;
        await seek(video, t);
        ctx.drawImage(video, 0, 0, width, height);
        frames.push({ timestamp: t, dataUrl: canvas.toDataURL("image/jpeg", 0.7) });
        if ($progress) $progress.value = ((i + 1) / count) * 100;
        console.log("[VA] frame", i + 1, "at", t.toFixed(1) + "s");
    }
    return frames;
}

function seek(video, time) {
    return new Promise((resolve) => {
        let done = false;
        const ok = () => { if (done) return; done = true; video.removeEventListener("seeked", ok); resolve(); };
        video.addEventListener("seeked", ok);
        try { video.currentTime = time; } catch(e) { resolve(); return; }
        setTimeout(() => { if (done) return; done = true; video.removeEventListener("seeked", ok); resolve(); }, 2000);
    });
}

function renderFrames(frames) {
    if (!$framesGrid) return;
    $framesGrid.innerHTML = "";
    const title = document.getElementById("framesTitle");
    if (title) title.classList.add("show");
    frames.forEach((f, i) => {
        const div = document.createElement("div");
        div.className = "frame-item";
        div.innerHTML = '<img src="' + f.dataUrl + '" alt="' + (i + 1) + '"><span class="frame-time">' + fmtTime(f.timestamp) + '</span>';
        $framesGrid.appendChild(div);
    });
}

function fmtTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
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
        console.log("[VA] worker response:", data);

        if (!res.ok || !data.success) {
            showError("فشل التحليل: " + (data.details || data.error || "خطأ غير معروف"));
            return;
        }

        hideMessages();
        renderAnalysis(data.analysis);
    } catch (err) {
        console.error("[VA] worker error:", err);
        loading.remove();
        showError("تعذر الاتصال بالخدمة: " + err.message);
    } finally {
        resetUI();
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
