// gemini-config.js

const GEMINI_CONFIG = {
    API_KEY: "AQ.Ab8RN6IU8JjpP3MnCDVN8ufTqJHV0YT",
    MODEL: "gemini-1.5-flash",
    API_URL: "https://generativelanguage.googleapis.com/v1beta/models/"
};

function getGeminiUrl() {
    return GEMINI_CONFIG.API_URL + GEMINI_CONFIG.MODEL + ":generateContent";
}

function getGeminiHeaders() {
    return {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_CONFIG.API_KEY
    };
}
