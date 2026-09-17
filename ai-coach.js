// ai-coach.js - منطق مدرب AI للفيديو

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
        showError("الملف لازم يكون فيديو (MP4، MOV، WebM...)");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showError("حجم الفيديو كبير (الحد 20 ميجا). قصّ الفيديو لأقصر.");
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

async function analyzeMatch() {
    if (!selectedFile) {
        showError("ارفع فيديو أولاً");
        return;
    }

    if (GEMINI_CONFIG.API_KEY === "ضع_المفتاح_هنا") {
        showError("⚠️ المفتاح غير مضبوط");
        return;
    }

    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("results").classList.remove("show");
    hideError();
    showProgress(0, "جاري تحويل الفيديو...");

    try {
        const base64Video = await fileToBase64(selectedFile);
        const base64Data = base64Video.split(",")[1];

        showProgress(30, "جاري رفع الفيديو لـ Gemini...");

        const prompt = buildPrompt();

        const response = await fetch(getGeminiUrl(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: selectedFile.type,
                                data: base64Data
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

        showProgress(80, "AI يحلل الفيديو...");

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || "خطأ في الاتصال");
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "ما قدرنا نحلل الفيديو";

        showProgress(100, "اكتمل!");
        hideProgress();
        showResults(text);

    } catch (err) {
        console.error(err);
        hideProgress();
        showError("حدث خطأ: " + err.message);
    } finally {
        document.getElementById("analyzeBtn").disabled = false;
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function buildPrompt() {
    return `أنت مدرب كرة قدم خبير متخصص في لعبة eFootball من Konami.
هذا فيديو من مباراة eFootball. شاهده بعناية وحلل الوضع بشكل مفصل.

المطلوب منك باللغة العربية الفصحى:

1. **الوضع العام:**
   - شنو تشوف بالمقطع؟
   - التشكيلة الظاهرة (4-3-3، 4-4-2، إلخ)
   - أسلوب اللعب العام

2. **نقاط القوة (3-5):**
   - اذكرها بوضوح

3. **نقاط الضعف (3-5):**
   - اذكرها بوضوح

4. **التحليل التكتيكي:**
   - التمركزات
   - التحولات
   - الضغط
   - البناء

5. **النصائح (3-5):**
   - نصائح عملية قابلة للتطبيق

6. **التوصية النهائية:**
   - أي مدرب تنصحه يتابعه؟
   - أي أسلوب يناسبه؟

اكتب بأسلوب واضح ومباشر، وركز على النقاط العملية.
لا تخترع معلومات مو موجودة بالفيديو.`;
}

function showProgress(percent, text) {
    document.getElementById("progressContainer").classList.add("show");
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").textContent = text + " " + percent + "%";
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
