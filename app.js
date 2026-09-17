// app.js - منطق الواجهة الرئيسية

document.addEventListener("DOMContentLoaded", () => {
    loadStyles();
});

function loadStyles() {
    const grid = document.getElementById("stylesGrid");
    if (!grid) return;

    grid.innerHTML = "";

    STYLES.forEach((style, index) => {
        const card = createStyleCard(style, index);
        grid.appendChild(card);
    });
}

function createStyleCard(style, index) {
    const card = document.createElement("a");
    card.className = "style-card";
    card.href = `tactic.html?style=${style.id}`;
    card.style.setProperty("--card-color", style.color);
    card.style.setProperty("--card-color-alpha", style.colorAlpha);
    card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s both`;

    const formationsHTML = style.formations
        .map(f => `<span class="formation-tag">${f}</span>`)
        .join("");

    card.innerHTML = `
        <span class="style-card-icon">${style.icon}</span>
        <h3 class="style-card-title">${style.name}</h3>
        <p class="style-card-coaches">👤 ${style.coaches}</p>
        <p class="style-card-desc">${style.desc}</p>
        <div class="style-card-footer">
            <div class="style-card-formations">
                ${formationsHTML}
            </div>
            <span class="style-card-arrow">←</span>
        </div>
    `;

    return card;
}
