// video-analyzer.js — with debug alerts

alert("[1] video-analyzer.js LOADED");

let selectedVideoFile = null;
let extractedFrames = [];

const WORKER_URL = "https://tactics-ai.njr706380.workers.dev";
const MAX_VIDEO_SIZE_MB = 100;
const MAX_VIDEO_DURATION = 90;
const FRAME_COUNT = 12;
const FRAME_MAX_WIDTH = 480;

let $fileInput, $analyzeBtn, $progress, $framesGrid, $error, $status, $uploadText;

function initVideoAnalyzer() {
    alert("[2] initVideoAnalyzer CALLED");

    $fileInput  = document.getElementById("videoFileInput");
    $analyzeBtn = document.getElementById("analyzeVideoBtn");
    $progress   = document.getElementById("videoProgress");
    $framesGrid = document.getElementById("framesGrid");
    $error      = document.getElementById("videoError");
    $status     = document.getElementById("videoStatus");
    $uploadText = document.getElementById("uploadText");

    if (!$fileInput) { alert("[ERROR] videoFileInput NOT FOUND"); return; }
    if (!$analyzeBtn) { alert("[ERROR] analyzeVideoBtn NOT FOUND"); return; }

    alert("[3] elements found. attaching listeners...");

    $fileInput.addEventListener("change", (e) => {
        alert("[4] CHANGE EVENT FIRED. files: " + (e.target.files ? e.target.files.length : "null"));
        if (e.target.files && e.target.files.length > 0) {
            handleVideoFile(e.target.files[0]);
        }
    });

    $analyzeBtn.addEventListener("click", () => {
        alert("[5] ANALYZE BUTTON CLICKED");
        analyzeVideo();
    });

    alert("[6] listeners attached. READY!");
}

function showError(msg) {
    if ($error) {
        $error.textContent = "❌ " + msg;
        $error.style.display = "block";
    }
    if ($status) $status.style.display = "none";
}

function showStatus(msg) {
    if ($status) {
        $status.textContent = "✅ " + msg;
        $status.style.display = "block";
    }
    if ($error) $error.style.display = "none";
}

function hideMessages() {
    if ($error) $error.style.display = "none";
    if ($status) $status.style.display = "none";
}

function handleVideoFile(file) {
    alert("[7] handleVideoFile: " + file.name + " | " + (file.size / 1024 / 1024).toFixed(2) + " MB");
    hideMessages();
    extractedFrames = [];
    if ($framesGrid) $framesGrid.innerHTML = "";
    const title = document.getElementById("framesTitle");
    if (title) title.classList.remove("show");
    const existing = document.getElementById("analysisResult");
    if (existing) existing.remove();

    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > MAX_VIDEO_SIZE_MB) {
        showError("حجم الفيديو كبير (" + sizeMB.toFixed(1) + " MB). الحد " + MAX_VIDEO_SIZE_MB + " MB.");
        return;
    }

    selectedVideoFile = file;
    $analyzeBtn.disabled = false;

    if ($uploadText) $uploadText.textContent = "✅ " + file.name;

    showStatus("الفيديو جاهز — اضغط (استخراج اللقطات)");
    alert("[8] file accepted, button enabled");
}

async function analyzeVideo() {
    alert("[9] analyzeVideo started");

    if (!selectedVideoFile) {
        alert("[ERROR] no file selected");
        return;
    }
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
        alert("[10] waiting for metadata...");
        await waitMetadata(video);
        alert("[11] metadata loaded. duration=" + video.duration.toFixed(1) + "s dims=" + video.videoWidth + "x" + video.videoHeight);

        if (video.duration > MAX_VIDEO_DURATION) {
            showError("مدة الفيديو طويلة (" + Math.round(video.duration) + "s). الحد " + MAX_VIDEO_DURATION + "s.");
            cleanup(video, url);
            resetUI();
            return;
        }

        showStatus("جاري استخراج اللقطات...");
        alert("[12] extracting frames...");
        const frames = await extractFrames(video, FRAME_COUNT);
        alert("[13] extracted " + frames.length + " frames");
        extractedFrames = frames;
        renderFrames(frames);

        if ($progress) $progress.style.display = "none";
        cleanup(video, url);

        showStatus("تم استخراج " + frames.length + " لقطة — جاري إرسالها للتحليل...");
        alert("[14] sending to worker...");
        await sendFramesToWorker(frames);

    } catch (err) {
        alert("[ERROR] " + err.message);
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
        alert("[15] worker response received. ok=" + res.ok + " success=" + data.success);
        loading.remove();

        if (!res.ok || !data.success) {
            showError("فشل التحليل: " + (data.details || data.error || "خطأ غير معروف"));
            return;
        }

        hideMessages();
        alert("[16] rendering analysis!");
        renderAnalysis(data.analysis);
    } catch (err) {
        alert("[ERROR worker] " + err.message);
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
