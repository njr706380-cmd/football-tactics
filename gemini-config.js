// gemini-config.js
// إعدادات Gemini API

const GEMINI_CONFIG = {
    API_KEY: "AQ.Ab8RN6JXHgSl_DEnBupvxRQDowFLvYzqaQoXbMBh__vZp2Njqg",
    MODEL: "gemini-1.5-flash",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/"
};

function getGeminiUrl() {
    return GEMINI_CONFIG.API_URL + GEMINI_CONFIG.MODEL + ":generateContent?key=" + GEMINI_CONFIG.API_KEY;
}
