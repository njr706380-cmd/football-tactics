// video-analyzer.js — Client-side Frame Extraction
// يستخرج 12 إطار من الفيديو عبر Canvas API — بدون Backend، بدون ffmpeg

let selectedVideoFile = null;
let videoUrl = null;
let extractedFrames = [];

const MAX_VIDEO_SIZE_MB = 50;
const MAX_VIDEO_DURATION = 60;
const FRAME_COUNT = 12;
const FRAME_MAX_WIDTH = 480;

let $uploadArea, $fileInput, $videoPreview, $analyzeBtn, $progress, $framesGrid, $error;

function initVideoAnalyzer() {
    $uploadArea   = document.getElementById("uploadArea");
    $fileInput    = document.getElementById("videoFileInput");
    $videoPreview = document.getElementById("videoPreview");
    $analyzeBtn   = document.getElementById("analyzeVideoBtn");
    $progress     = document.getElementById("videoProgress");
    $framesGrid   = document.getElementById("framesGrid");
    $error        = document.getElementById("videoError");

    if (!$uploadArea) return; // الـ UI مو موجود — نتجاهل

    $uploadArea.addEventListener("click", () => $fileInput.click());

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
        showError("حجم الفيديو كبير — الحد الأقصى " + MAX_VIDEO_SIZE_MB + " ميجابايت.");
        return;
    }

    selectedVideoFile = file;

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = URL.createObjectURL(file);

    $videoPreview.src = videoUrl;
    $videoPreview.style.display = "block";
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

    try {
        await waitForMetadata($videoPreview);
        const duration = $videoPreview.duration;

        if (duration > MAX_VIDEO_DURATION) {
            showError(
                "مدة الفيديو طويلة — الحد الأقصى " +
                MAX_VIDEO_DURATION +
                " ثانية (فيديوك " +
                Math.round(duration) +
                " ثانية)."
            );
            resetAnalyzeUI();
            return;
        }

        const frames = await extractFrames($videoPreview, FRAME_COUNT);
        extractedFrames = frames;
        renderFrames(frames);

        if ($progress) $progress.style.display = "none";
        $analyzeBtn.disabled = false;

        // الخطوة التالية (Commit 6): إرسال الإطارات إلى Gemini عبر Worker
        // sendFramesToWorker(frames);

    } catch (err) {
        console.error("Frame extraction error:", err);
        showError("تعذر معالجة الفيديو. حاول مرة أخرى.");
        resetAnalyzeUI();
    }
}

function resetAnalyzeUI() {
    if ($progress) $progress.style.display = "none";
    if ($analyzeBtn) $analyzeBtn.disabled = false;
}

function waitForMetadata(video) {
    return new Promise((resolve) => {
        if (video.readyState >= 1) return resolve();
        video.addEventListener("loadedmetadata", () => resolve(), { once: true });
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        frames.push({ timestamp: t, dataUrl: dataUrl });

        if ($progress) $progress.value = ((i + 1) / count) * 100;
    }

    video.currentTime = 0;
    return frames;
}

function seekVideo(video, time) {
    return new Promise((resolve, reject) => {
        const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("error", onError);
            resolve();
        };
        const onError = () => {
            video.removeEventListener("seeked", onSeeked);
            video.removeEventListener("error", onError);
            reject(new Error("seek error"));
        };
        video.addEventListener("seeked", onSeeked);
        video.addEventListener("error", onError);
        video.currentTime = time;
    });
}

function renderFrames(frames) {
    if (!$framesGrid) return;
    $framesGrid.innerHTML = "";

    frames.forEach((frame, i) => {
        const div = document.createElement("div");
        div.className = "frame-item";
        div.innerHTML =
            '<img src="' + frame.dataUrl + '" alt="إطار ' + (i + 1) + '">' +
            '<span class="frame-time">' + formatTime(frame.timestamp) + '</span>';
        $framesGrid.appendChild(div);
    });
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

// Auto-init
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initVideoAnalyzer);
} else {
    initVideoAnalyzer();
}
