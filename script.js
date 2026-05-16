// Gestion du Menu Mobile
const menuToggle = document.querySelector('#mobile-menu');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle) { // On vérifie que l'élément existe pour éviter les erreurs
    menuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('is-active');
    });
}

// Fermer le menu au clic sur un lien
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('is-active');
    });
});