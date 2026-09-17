// gemini-config.js
// إعدادات Gemini API - النسخة المحسّنة

const GEMINI_CONFIG = {
    API_KEY: "AQ.Ab8RN6L5bMY3nGh5YKGiFO0uVMHLvYzqaQoXbMBh__vZp2Njqg",
    MODEL: "gemini-1.5-flash",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/"
};

// رابط بدون مفتاح (المفتاح يروح بالـ Header)
function getGeminiUrl() {
    return GEMINI_CONFIG.API_URL + GEMINI_CONFIG.MODEL + ":generateContent";
}

// الـ Headers المطلوبة
function getGeminiHeaders() {
    return {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_CONFIG.API_KEY
    };
}
