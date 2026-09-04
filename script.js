// ==========================================
// SIMPLE PORTFOLIO INTERACTION
// ==========================================

const cards = document.querySelectorAll(".skill-card");

cards.forEach((card) => {

    card.addEventListener("mouseenter", () => {
        card.style.cursor = "pointer";
    });

});


// ==========================================
// NAVBAR SCROLL EFFECT
// ==========================================

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if (window.scrollY > 50) {
        navbar.style.boxShadow = "0 5px 0 #111";
    } else {
        navbar.style.boxShadow = "none";
    }

});


// ==========================================
// PROJECT CARD HOVER
// ==========================================

const projectCards = document.querySelectorAll(".project-card");

projectCards.forEach((card) => {

    card.addEventListener("mouseenter", () => {
        card.style.transform = "translate(-4px, -4px)";
    });

    card.addEventListener("mouseleave", () => {
        card.style.transform = "translate(0, 0)";
    });

});