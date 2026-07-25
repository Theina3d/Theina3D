// Initialisation EmailJS avec la VRAIE Public Key de la capture d'écran
(function() {
    emailjs.init("I9NWueyLjG2wrl9j0");
})();

document.addEventListener('DOMContentLoaded', () => {
    const formDevis = document.getElementById('form-devis');
    if (formDevis) {
        formDevis.addEventListener('submit', function(event) {
            event.preventDefault();

            const btn = document.getElementById('btn-envoyer');
            const messageStatut = document.getElementById('statut-envoi');
            
            btn.textContent = 'Envoi en cours...';
            btn.disabled = true;

            const serviceID = 'service_3y8lnhx';
            const templateID = 'template_ovql54x'; 

            emailjs.sendForm(serviceID, templateID, this)
                .then(() => {
                    btn.textContent = 'Envoyer ma demande';
                    btn.disabled = false;
                    messageStatut.style.color = '#2E7D32';
                    messageStatut.textContent = '✅ Message envoyé avec succès ! Nous vous répondrons rapidement.';
                    formDevis.reset();
                }, (err) => {
                    btn.textContent = 'Envoyer ma demande';
                    btn.disabled = false;
                    messageStatut.style.color = '#D32F2F';
                    messageStatut.textContent = '❌ Erreur lors de l\'envoi. Veuillez réessayer.';
                    console.error('EmailJS Error:', err);
                });
        });
    }
});