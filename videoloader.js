/**
 * video-loader.js
 * Sorgt für ruckelfreies Abspielen von Hintergrundvideos.
 * Lädt das Video vor und blendet es erst ein, wenn es flüssig abspielbar ist.
 */

(function() {
    document.addEventListener("DOMContentLoaded", function() {
        // Wir prüfen, ob wir mobil oder auf Desktop sind, basierend auf deiner CSS-Logik (768px Breakpoint)
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // Wähle nur das Video aus, das auch wirklich angezeigt werden soll
        const videoSelector = isMobile ? '.bg-video-mobile' : '.bg-video-desktop';
        const video = document.querySelector(videoSelector);

        if (!video) return;

        // Funktion zum Starten und Einblenden
        const startVideo = () => {
            video.play().then(() => {
                // Wenn Play erfolgreich war, Klasse für Fade-In hinzufügen
                video.classList.add('is-playing');
            }).catch(error => {
                console.warn("Autoplay wurde verhindert oder Video konnte nicht geladen werden:", error);
                // Fallback: Trotzdem einblenden, damit man zumindest das erste Frame sieht (falls geladen)
                video.classList.add('is-playing');
            });
        };

        // Überprüfen, ob das Video vielleicht schon im Cache und bereit ist
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA oder HAVE_ENOUGH_DATA
            startVideo();
        } else {
            // Wenn nicht, warten wir auf das Event 'canplaythrough'
            // Das feuert, wenn der Browser denkt: "Ich kann jetzt ohne Puffer-Pause durchspielen"
            video.addEventListener('canplaythrough', startVideo, { once: true });
            
            // Ladevorgang explizit anstoßen
            video.load();
        }
    });
})();
