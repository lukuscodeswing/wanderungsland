/**
 * video-loader.js
 * Sorgt für ruckelfreies Abspielen von Hintergrundvideos.
 * Lädt das Video vor und blendet es erst ein, wenn es flüssig abspielbar ist.
 */

(function() {
    document.addEventListener("DOMContentLoaded", function() {
        console.log("LOG: VideoLoader wird gestartet.");
        // Wir prüfen, ob wir mobil oder auf Desktop sind, basierend auf deiner CSS-Logik (768px Breakpoint)
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        // Wähle nur das Video aus, das auch wirklich angezeigt werden soll
        const videoSelector = isMobile ? '.bg-video-mobile' : '.bg-video-desktop';
        const video = document.querySelector(videoSelector);

        if (!video) {
            console.log("LOG: Kein passendes Video-Element für diese Ansicht gefunden.");
            return;
        }
        console.log("LOG: Video-Element gefunden:", video);

        // Funktion zum Starten und Einblenden
        const startVideo = () => {
            console.log("LOG: Video ist bereit zum Abspielen. 'startVideo' wird aufgerufen.");
            video.play().then(() => {
                console.log("LOG: video.play() war erfolgreich. Video startet jetzt.");
                // Wenn Play erfolgreich war, Klasse für Fade-In hinzufügen
                video.classList.add('is-playing');
            }).catch(error => {
                console.warn("LOG: Autoplay wurde verhindert oder Video konnte nicht gestartet werden:", error);
                // Fallback: Trotzdem einblenden, damit man zumindest das erste Frame sieht (falls geladen)
                video.classList.add('is-playing');
            });
        };

        // Überprüfen, ob das Video vielleicht schon im Cache und bereit ist
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA oder HAVE_ENOUGH_DATA
            console.log("LOG: Video war bereits im Cache und ist abspielbereit (readyState >= 3).");
            startVideo();
        } else {
            console.log("LOG: Video ist noch nicht ausreichend geladen. Setze Event Listener für 'canplaythrough'.");
            video.addEventListener('canplaythrough', startVideo, { once: true });
            // Fehler-Listener hinzufügen, falls der Pfad falsch ist (404)
            video.addEventListener('error', function(e) {
                console.error("LOG: Fehler beim Laden des Videos. Pfad prüfen!", video.error);
            });

            // Ladevorgang explizit anstoßen
            video.load();
        }
    });
})();
