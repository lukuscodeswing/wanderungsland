/**
 * video-loader.js
 * Sorgt für ruckelfreies Abspielen von Hintergrundvideos.
 * Version 3: Datengetriebene Logik.
 * Liest die Dateipfade für Video und Fallback-Bild aus data-Attributen im HTML.
 * Funktioniert über IDs: #bg-video, #video-source, #fallback-image
 * und erwartet data-Attribute am .video-background-Container.
 */

(function() {
    document.addEventListener("DOMContentLoaded", function() {
        console.log("LOG: VideoLoader v3 wird gestartet.");

        const video = document.getElementById('bg-video');
        const videoSource = document.getElementById('video-source');
        const fallbackImage = document.getElementById('fallback-image');
        const videoContainer = document.querySelector('.video-background');

        // Prüfen, ob die neuen Elemente existieren. Wenn nicht, bricht das Skript ab.
        if (!video || !videoSource || !fallbackImage || !videoContainer) {
            console.log("LOG: Eines der benötigten Elemente (bg-video, video-source, fallback-image, .video-background) wurde nicht gefunden. Video-Logik wird nicht ausgeführt.");
            return;
        }

        // Lese die Dateipfade aus den data-Attributen
        const sources = videoContainer.dataset;
        
        // Prüfen, ob die benötigten data-Attribute vorhanden sind
        if (!sources.videoDesktop || !sources.videoMobile || !sources.fallbackDesktop || !sources.fallbackMobile) {
            console.error("LOG: Eines oder mehrere der benötigten data-Attribute (data-video-desktop, data-video-mobile, data-fallback-desktop, data-fallback-mobile) fehlen am .video-background Container. Video kann nicht geladen werden.");
            return;
        }

        const isMobile = window.matchMedia("(max-width: 768px)").matches;

        // Wähle die passenden Quellen basierend auf dem Gerät aus
        const videoSrc = isMobile ? sources.videoMobile : sources.videoDesktop;
        const imageSrc = isMobile ? sources.fallbackMobile : sources.fallbackDesktop;

        console.log(`LOG: Gerät als ${isMobile ? 'Mobile' : 'Desktop'} erkannt. Lade: ${videoSrc} und ${imageSrc}`);

        // 1. Fallback-Bild sofort setzen
        fallbackImage.src = imageSrc;

        // 2. Video-Quelle setzen
        videoSource.src = videoSrc;

        // Funktion zum Starten und Einblenden
        const startVideo = () => {
            console.log("LOG: Video ist bereit zum Abspielen. 'startVideo' wird aufgerufen.");
            video.play().then(() => {
                console.log("LOG: video.play() war erfolgreich. Video startet jetzt.");
                video.classList.add('is-playing'); // Fade-In via CSS
            }).catch(error => {
                console.warn("LOG: Autoplay wurde verhindert oder Video konnte nicht gestartet werden:", error);
                // Das Fallback-Bild ist bereits sichtbar, also ist hier keine weitere Aktion nötig.
            });
        };

        // Überprüfen, ob das Video vielleicht schon im Cache und bereit ist
        if (video.readyState >= 3) { // HAVE_FUTURE_DATA oder HAVE_ENOUGH_DATA
            console.log("LOG: Video war bereits im Cache und ist abspielbereit (readyState >= 3).");
            startVideo();
        } else {
            console.log("LOG: Video ist noch nicht ausreichend geladen. Setze Event Listener für 'canplaythrough'.");
            video.addEventListener('canplaythrough', startVideo, { once: true });
            video.addEventListener('error', function() {
                console.error("LOG: Fehler beim Laden des Videos. Pfad prüfen!", video.error);
            });

            // Ladevorgang explizit anstoßen, nachdem die Quelle gesetzt wurde
            video.load();
        }
    });
})();
