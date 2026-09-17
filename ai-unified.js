// ai-unified.js - منطق موحد للشات وتحليل الفيديو

let conversationHistory = [];
let isProcessing = false;
let selectedFile = null;
let videoObjectUrl = null;

const SYSTEM_PROMPT = `أنت "المدرب الذكي"، محلل كروي خبير متخصص في لعبة eFootball.

شخصيتك:
- تتكلم بالعربية الفصحى المبسطة
- ودود ومتحمس
- محلل تكتيكي عميق
- تعطي نصائح عملية فورية

خبرتك:
- كل أساليب اللعب (استحواذ، مرتدات، ضغط عالي، كرة طويلة)
- كل الخطط (4-3-3، 4-4-2، 3-2-4-1، إلخ)
- كل المدربين (بيب، كلوب، مورينهو، كرويف، تشافي ألونسو، فليك، دي شامب، أموريم، لامبارد)
- تحليل الخصوم
- التبديلات التكتيكية

قواعدك:
1. لا تخترع معلومات
2. اعطي إجابات مفصلة ومباشرة
3. اذكر السبب وراء كل نصيحة
4. اقترح مدرب مناسب إذا مناسب
5. استخدم الإيموجي باعتدال

طريقة الإجابة:
- حلل الوضع
- توصيات مرقمة
- بديل لو النصيحة ما نفعت

كن مختصراً وشامل.`;

// ============ التبديل بين الأوضاع ============
function switchMode(mode) {
    const chatTab = document.getElementById("chatTab");
    const videoTab = document.getElementById("videoTab");
    const chatMode = document.getElementById("chatMode");
    const videoMode = document.getElementById("videoMode");
    const clearBtn = document.getElementById("clearBtn");

    if (mode === "chat") {
        chatTab.classList.add("active");
        videoTab.classList.remove("active");
        chatMode.classList.add("active");
        videoMode.classList.remove("active");
        clearBtn.onclick = clearChat;
    } else {
        videoTab.classList.add("active");
        chatTab.classList.remove("active");
        videoMode.classList.add("active");
        chatMode.classList.remove("active");
        clearBtn.onclick = resetVideo;
    }
}

function clearCurrent() {
    // الحالي راح يشتغل حسب الوضع
}

// ============ CHAT ============
document.addEventListener("DOMContentLoaded", () => {
    setupChat();
    setupVideo();
});

function setupChat() {
    const input = document.getElementById("userInput");
    const btn = document.getElementById("sendBtn");

    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 120) + "px";
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    btn.addEventListener("click", sendMessage);
}

function quickAsk(text) {
    document.getElementById("userInput").value = text;
    sendMessage();
}

async function sendMessage() {
    if (isProcessing) return;

    const input = document.getElementById("userInput");
    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.style.height = "auto";

    const welcome = document.getElementById("welcome");
    if (welcome) welcome.style.display = "none";

    addMessage("user", text);
    conversationHistory.push({ role: "user", parts: [{ text: text }] });

    isProcessing = true;
    document.getElementById("sendBtn").disabled = true;

    const typingId = showTyping();

    try {
        const response = await callGeminiChat();
        removeTyping(typingId);
        addMessage("ai", response);
        conversationHistory.push({ role: "model", parts: [{ text: response }] });
    } catch (err) {
        removeTyping(typingId);
        addMessage("ai", "❌ عذراً، صار خطأ: " + err.message);
    } finally {
        isProcessing = false;
        document.getElementById("sendBtn").disabled = false;
    }
}

async function callGeminiChat() {
    if (typeof GEMINI_CONFIG === "undefined") throw new Error("الإعدادات غير محملة");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${GEMINI_CONFIG.API_KEY}`;

    const contents = [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "تمام، أنا المدرب الذكي. اسألني عن أي شي في eFootball." }] },
        ...conversationHistory
    ];

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: contents,
            generationConfig: {
                temperature: 0.85,
                maxOutputTokens: 2000,
                topP: 0.95,
                topK: 40
            }
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `خطأ ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("رد فارغ");
    return text.trim();
}

function addMessage(role, text) {
    const chatArea = document.getElementById("chatArea");
    const msg = document.createElement("div");
    msg.className = "message " + role;
    const avatar = role === "user" ? "👤" : "🤖";
    msg.innerHTML = `
        <div class="msg-avatar">${avatar}</div>
        <div class="msg-content"></div>
    `;
    msg.querySelector(".msg-content").textContent = text;
    chatArea.appendChild(msg);
    scrollChatToBottom();
}

function showTyping() {
    const chatArea = document.getElementById("chatArea");
    const id = "typing-" + Date.now();
    const msg = document.createElement("div");
    msg.className = "message ai";
    msg.id = id;
    msg.innerHTML = `
        <div class="msg-avatar">🤖</div>
        <div class="msg-content">
            <div class="typing"><span></span><span></span><span></span></div>
        </div>
    `;
    chatArea.appendChild(msg);
    scrollChatToBottom();
    return id;
}

function removeTyping(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function scrollChatToBottom() {
    const chatArea = document.getElementById("chatArea");
    setTimeout(() => { chatArea.scrollTop = chatArea.scrollHeight; }, 50);
}

function clearChat() {
    if (!confirm("تمسح المحادثة؟")) return;
    conversationHistory = [];
    const chatArea = document.getElementById("chatArea");
    chatArea.innerHTML = `
        <div class="welcome" id="welcome">
            <span class="welcome-icon">⚽</span>
            <h2>أهلاً بك في المدرب الذكي</h2>
            <p>اسألني عن أي شي في eFootball: خطط، مدربين، تبديلات، تكتيكات...</p>
        </div>
    `;
}

// ============ VIDEO ============
function setupVideo() {
    const box = document.getElementById("uploadBox");
    const input = document.getElementById("fileInput");

    if (!box) return;

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
        if (e.dataTransfer.files.length > 0) handleVideoFile(e.dataTransfer.files[0]);
    });

    input.addEventListener("change", (e) => {
        if (e.target.files.length > 0) handleVideoFile(e.target.files[0]);
    });
}

function handleVideoFile(file) {
    if (!file.type.startsWith("video/")) {
        showVideoError("الملف لازم يكون فيديو");
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showVideoError("الحجم كبير (الحد 20 ميجا)");
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
    hideVideoError();
    document.getElementById("results").classList.remove("show");
}

async function analyzeVideo() {
    if (!selectedFile) {
        showVideoError("ارفع فيديو أولاً");
        return;
    }

    document.getElementById("analyzeBtn").disabled = true;
    document.getElementById("results").classList.remove("show");
    document.getElementById("loading").classList.add("show");
    hideVideoError();
    showProgress(10, "جاري تحويل الفيديو...");

    try {
        const base64 = await fileToBase64(selectedFile);
        const base64Data = base64.split(",")[1];

        showProgress(40, "جاري الإرسال...");

        const prompt = `أنت مدرب كرة قدم خبير في eFootball. حلل هذا الفيديو وأعطني:

1. الوضع العام: شنو تشوف؟ التشكيلة؟ النتيجة؟
2. نقاط القوة (3-5)
3. نقاط الضعف (3-5)
4. التحليل التكتيكي: التمركزات، الضغط، البناء
5. النصائح (3-5)
6. التوصية النهائية: أي مدرب يناسبه؟

اكتب بالعربية الفصحى.`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${GEMINI_CONFIG.API_KEY}`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: selectedFile.type, data: base64Data } }
                    ]
                }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 3000 }
            })
        });

        showProgress(85, "AI يحلل...");

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `خطأ ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "ما قدرنا نحلل";

        showProgress(100, "اكتمل!");
        setTimeout(() => {
            hideProgress();
            document.getElementById("loading").classList.remove("show");
            showVideoResults(text);
        }, 500);

    } catch (err) {
        console.error(err);
        hideProgress();
        document.getElementById("loading").classList.remove("show");
        showVideoError("حدث خطأ: " + err.message);
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

function showProgress(percent, text) {
    document.getElementById("progressContainer").classList.add("show");
    document.getElementById("progressFill").style.width = percent + "%";
    document.getElementById("progressText").textContent = text + " " + percent + "%";
}

function hideProgress() {
    document.getElementById("progressContainer").classList.remove("show");
}

function showVideoResults(text) {
    document.getElementById("resultContent").textContent = text;
    document.getElementById("results").classList.add("show");
}

function showVideoError(message) {
    const box = document.getElementById("errorBox");
    box.textContent = message;
    box.classList.add("show");
}

function hideVideoError() {
    document.getElementById("errorBox").classList.remove("show");
}

function resetVideo() {
    selectedFile = null;
    if (videoObjectUrl) {
        URL.revokeObjectURL(videoObjectUrl);
        videoObjectUrl = null;
    }
    document.getElementById("fileInput").value = "";
    document.getElementById("preview").classList.remove("show");
    document.getElementById("results").classList.remove("show");
    document.getElementById("analyzeBtn").disabled = true;
    hideVideoError();
    hideProgress();
}
