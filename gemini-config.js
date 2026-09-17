// gemini-config.js

const GEMINI_CONFIG = {
    API_KEY: "AQ.Ab8RN6J7lI7SHMjFaagl2EAfu5CAedPgm8Q08nAEx7v6bguLbQ",
    MODEL: "gemini-2.0-flash-exp",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/"
};

function getGeminiUrl() {
    return GEMINI_CONFIG.API_URL + GEMINI_CONFIG.MODEL + ":generateContent?key=" + GEMINI_CONFIG.API_KEY;
}

function getGeminiHeaders() {
    return { "Content-Type": "application/json" };
}
