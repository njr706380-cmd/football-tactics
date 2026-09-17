// ai-coach.js - منطق مدرب AI (فيديو عبر File API)

let selectedFile = null;
let videoObjectUrl = null;

document.addEventListener("DOMContentLoaded", () => {
    setupUpload();
    setupButton();
});

function setupUpload() {
    const box = document.getElementById("uploadBox");
    const input = document.getElementById("fileInput");

    box.addEventListener("click", () => input.click());

    box.addEventListener("dragover", (e) => {
        e.preventDefault();
        box.style.borderColor = "#D4AF37";
    });

    box.addEventListener("dragleave", () => {
        box.style.borderColor = "rgba(212, 175, 55, 0.3)";
    });

    box.addEventListener("drop", (e) => {
        e.preventDefault();
        box.style.borderColor = "rgba(212, 175, 55, 0.3)";
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    if (!file.type.startsWith("video/")) {
        showError("الملف لازم يكون فيديو");
        return;
    }

    if (file.size > 100 * 1024 * 1024) {
        showError("الحجم كبير (الحد 100 ميجا)");
        return;
    }

    selectedFile = file;

    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    videoObjectUrl = URL.createObjectURL(file);

    document.getElementById("previewVideo").src = videoObjectUrl;
    document.getElementById("previewName").textContent =
        `${file.name} • ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    document.getElementById("preview").classList.add("show");
    document.getElementById("analyzeBtn").disabled = false;
    hideError();
    document.getElementById("results").classList.remove("show");
}

function setupButton() {
    document.getElementById("analyzeBtn").addEventListener("click", analyzeMatch);
}

// ============ التحليل عبر File API ============
async function analyzeMatch() {
    if (!selectedFile) {
        showError("ارفع فيديو أولاً");
        return;
    }

    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("results").classList.remove("show");
    document.getElementById("loading").classList.add("show");
    hideError();

    try {
        // 1) ابدأ رفع الفيديو (resumable upload)
        showProgress(10, "جاري بدء رفع الفيديو...");

        const uploadUrl = await startUpload(selectedFile);

        // 2) ارفع الفيديو
        showProgress(30, "جاري رفع الفيديو...");

        const fileUri = await uploadFile(uploadUrl, selectedFile);

        // 3) انتظر Gemini يعالج الفيديو
        showProgress(70, "جاري معالجة الفيديو...");

        await waitForProcessing(fileUri);

        // 4) حلل الفيديو
        showProgress(85, "AI يحلل المباراة...");

        const result = await analyzeVideo(fileUri);

        showProgress(100, "اكتمل!");
        setTimeout(() => {
            hideProgress();
            document.getElementById("loading").classList.remove("show");
            showResults(result);
        }, 500);

    } catch (err) {
        console.error(err);
        hideProgress();
        document.getElementById("loading").classList.remove("show");
        showError("حدث خطأ: " + err.message);
    } finally {
        document.getElementById("analyzeBtn").disabled = false;
    }
}

// ============ 1) بدء الرفع ============
async function startUpload(file) {
    const url = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_CONFIG.API_KEY}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Goog-Upload-Protocol": "resumable",
            "X-Goog-Upload-Command": "start",
            "X-Goog-Upload-Header-Content-Length": file.size,
            "X-Goog-Upload-Header-Content-Type": file.type,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            file: { display_name: file.name }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`فشل بدء الرفع: ${response.status}`);
    }

    const uploadUrl = response.headers.get("X-Goog-Upload-URL");
    if (!uploadUrl) {
        throw new Error("ما قدرنا نحصل على رابط الرفع");
    }

    return uploadUrl;
}

// ============ 2) رفع الفيديو ============
async function uploadFile(uploadUrl, file) {
    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "Content-Length": file.size,
            "X-Goog-Upload-Offset": "0",
            "X-Goog-Upload-Command": "upload, finalize"
        },
        body: file
    });

    if (!response.ok) {
        throw new Error(`فشل رفع الفيديو: ${response.status}`);
    }

    const data = await response.json();
    if (!data.file || !data.file.uri) {
        throw new Error("ما قدرنا نحصل على رابط الملف");
    }

    return data.file;
}

// ============ 3) انتظار المعالجة ============
async function waitForProcessing(file) {
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        await sleep(2000);

        const url = `https://generativelanguage.googleapis.com/v1beta/${file.name}?key=${GEMINI_CONFIG.API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.state === "ACTIVE") {
            return;
        }

        if (data.state === "FAILED") {
            throw new Error("فشلت معالجة الفيديو");
        }

        attempts++;
        const percent = 70 + Math.min(15, Math.floor(attempts / 3));
        showProgress(percent, `جاري المعالجة... (${attempts}/${maxAttempts})`);
    }

    throw new Error("المعالجة أخذت وقت طويل");
}

// ============ 4) تحليل الفيديو ============
async function analyzeVideo(file) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${GEMINI_CONFIG.API_KEY}`;

    const prompt = buildPrompt();

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        file_data: {
                            mime_type: file.mimeType,
                            file_uri: file.uri
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000
            }
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = errData.error?.message || `خطأ HTTP ${response.status}`;
        throw new Error(errMsg);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
        throw new Error("لم يرجع AI أي رد");
    }

    return data.candidates[0].content?.parts?.[0]?.text || "ما قدرنا نحلل الفيديو";
}

// ============ أدوات مساعدة ============
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function buildPrompt() {
    return `أنت مدرب كرة قدم خبير متخصص في لعبة eFootball من Konami.
هذا فيديو من مباراة eFootball. شاهده بعناية وحلل الوضع بشكل مفصل.

المطلوب باللغة العربية الفصحى:

1. **الوضع العام:**
   - شنو تشوف بالمقطع؟
   - التشكيلة الظاهرة (4-3-3، 4-4-2...)
   - النتيجة والوقت إن وُجد

2. **نقاط القوة (3-5)**

3. **نقاط الضعف (3-5)**

4. **التحليل التكتيكي:**
   - التمركزات
   - التحولات
   - الضغط
   - البناء

5. **النصائح (3-5):**
   - نصائح عملية

6. **التوصية النهائية:**
   - أي مدرب يناسبه؟ (من: بيب، كرويف، كلوب، مورينهو، تشافي ألونسو، فليك، دي شامب، أموريم، لامبارد)

اكتب بأسلوب واضح ومباشر.`;
}

function showProgress(percent, text) {
    document.getElementById("progressContainer").classList.add("show");
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").textContent = text;
}

function hideProgress() {
    document.getElementById("progressContainer").classList.remove("show");
    document.getElementById("progressFill").style.width = "0%";
}

function showResults(text) {
    document.getElementById("resultContent").textContent = text;
    document.getElementById("results").classList.add("show");
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
}

function showError(message) {
    const box = document.getElementById("errorBox");
    box.textContent = message;
    box.classList.add("show");
}

function hideError() {
    document.getElementById("errorBox").classList.remove("show");
}

function resetAll() {
    selectedFile = null;
    if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
        videoObjectUrl = null;
    }
    document.getElementById("fileInput").value = "";
    document.getElementById("preview").classList.remove("show");
    document.getElementById("results").classList.remove("show");
    document.getElementById("analyzeBtn").disabled = true;
    hideError();
    hideProgress();
}
