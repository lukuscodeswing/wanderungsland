// Wir packen alles in eine Funktion, die wir sofort aufrufen (IIFE).
(function() {
    // Alle Variablen hier drin sind privat für diese Grafik.
    // Diese Selektoren sind spezifisch für diese Grafik und sollten beibehalten werden.
    const container = d3.select('#scrolly-presidents .scrolly-vis');
    const scrollyText = d3.select('#scrolly-presidents .scrolly-text');
    const steps = scrollyText.selectAll('.step');
    const isMobile = window.innerWidth < 768;
    
    // Wartet, bis das gesamte HTML-Dokument geladen ist, bevor die Grafik initialisiert wird.
    document.addEventListener('DOMContentLoaded', function() {
        // Initialisiere den Scroller und konfiguriere ihn
        const scroller = scrollama();

        // --- 2. DATEN LADEN UND GRAFIK ERSTELLEN ---
        d3.csv('presidents_sentiment.csv').then(function (data) {
            console.log("Presidents_Schritt B: CSV-Daten wurden geladen.", data);
            // Konvertiere die Daten in die richtigen Typen (Zahlen und Daten)
            data.forEach(d => {
                d.year = d3.timeParse("%Y")(d.year); // Jahr in ein Datumsobjekt umwandeln
                // WICHTIG: Die Sentiment-Spalte muss auch in eine Zahl umgewandelt werden.
                d.sentiment = +d.sentiment;
            });

            // --- D3.js Grafik-Setup ---
            // Definiere eine "logische" Größe für unser internes Koordinatensystem.
            const margin = isMobile
                ? { top: 30, right: 10, bottom: 20, left: 10 } // Kleinere Ränder für Mobile
                : { top: 30, right: 40, bottom: 20, left: 40 }; // Originale Ränder für Desktop
            const logicalWidth = 600;
            const logicalHeight = 450; // Ein 4:3 Seitenverhältnis
            const width = logicalWidth - margin.left - margin.right;
            const height = logicalHeight - margin.top - margin.bottom;

            // Definition der Farben für die Parteien
            const partyColors = {
                "Demokrat": "#00AEF3",
                "Republikaner": "#E81B23"
            }

            // Füge die Einleitung unter dem Header ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-intro')
                .style('font-size', '0.8rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1.5rem') // Mehr Abstand zur Grafik
                .html(`Tendenz migrationspolitischer Reden <b style="background:${partyColors["Demokrat"]}; color:#ffffff;">&nbsp;demokratischer&nbsp;</b> und <b style="background:${partyColors["Republikaner"]}; color:#ffffff;">&nbsp;republikanischer&nbsp;</b> US-Präsidenten seit 1945. Überwiegt der Anteil der positiven Reden oder der der negativen?`);

            // Füge den Header über der Grafik ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-header') // Gibt ihm eine Klasse für potenzielles CSS-Styling
                .style('font-size', '1.3rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1em') // Abstand nach unten
                .html('<b style="background:#2D3C46;color:#ffffff;padding:1px 0px;">&nbsp;USA&nbsp;</b><b style="color:#2D3C46;border-bottom:1px solid #2D3C46;">&nbsp;Wie spricht der Präsident über Einwanderer?&nbsp;&nbsp;</b>&nbsp;&nbsp;');

            // Erstelle einen dedizierten Container für die SVG, um das Styling zu erleichtern.
            const chartContainer = container.append('div')
                .attr('class', 'chart-container');
            // Erstelle das SVG-Element, in das wir zeichnen
            const svg = chartContainer.append('svg')
                .attr('viewBox', `0 0 ${logicalWidth} ${logicalHeight}`)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);

            // Erstelle die Skalen (x-Achse für Zeit, y-Achse für Sentiment)
            const x = d3.scaleTime()
                .domain([new Date('1919-12-31'), new Date('2020-01-01')]) // Domain erweitert, damit 1920 und 2020 Ticks erscheinen
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([-1, 1]) // Fester Bereich von -1 bis 1
                .range([height, 0]);

            // Zeichne die Achsen
            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .style("font-size", isMobile ? "12px" : "10px") // NEU: Größere Schrift
                .call(d3.axisBottom(x).ticks(d3.timeYear.every(20)))
                .selectAll(".tick text") // Wähle alle Text-Elemente der Ticks aus
                .each(function(d, i, nodes) {
                    // Überprüfe, ob es der erste Tick ist
                    if (i === 0) { // Erster Tick (z.B. 1920)
                        d3.select(this).attr("text-anchor", "start"); // Rechtsbündig
                    } 
                    // Überprüfe, ob es der letzte Tick ist
                    else if (i === nodes.length - 1) {
                        d3.select(this).attr("text-anchor", "end"); // Linksbündig
                    }
                }); // End of axisBottom call

            
            // Füge die Text-Anmerkungen "positiv" und "negativ" hinzu.
            // Anmerkung für "positiv"
            svg.append("text")
            .attr("x", 0) // Positioniert den Text am linken Rand des G-Elements
            .attr("y", y(0.9))
            .attr("dy", "0.32em") // Kleine vertikale Korrektur für perfekte Ausrichtung
            .attr("text-anchor", "start") // Text beginnt an x=0
            .attr("dx", "0.5em") // Etwas nach rechts verschieben (innerhalb des Diagramms)
            .style("font-family", "Arial").style("font-size", isMobile ? "18px" : "16px") // Nochmal größer
            .style("fill", "#777") //  Farbton
            .style("font-weight", "200") 
            .text("positiv");
            // Anmerkung für "negativ" (gleiches Prinzip)
            svg.append("text")
            .attr("x", 0).attr("y", y(-0.9)).attr("dy", "0.32em") // x=0, y(-0.9)
            .attr("text-anchor", "start") // Text beginnt an x=0
            .attr("dx", "0.5em") // Etwas nach rechts verschieben (innerhalb des Diagramms)
            .style("font-family", "Arial").style("font-size", isMobile ? "18px" : "16px") // Nochmal größer
            .style("fill", "#777") //  Farbton
            .style("font-weight", "200") 
            .text("negativ");
                
            // Nulllinie für Kontext
            svg.append("line")
                .attr("x1", 0)
                .attr("x2", width)
                .attr("y1", y(0))
                .attr("y2", y(0))
                .attr("stroke", "black") // Schwarz
                .attr("stroke-width", 1) // Dünn
                .attr("stroke-dasharray", "0"); // Durchgehend (kein Dash-Array)

            // Erstelle den Linien-Generator
        const line = d3.line()
            .x(d => x(d.year))
            .defined(d => d.sentiment != null && !isNaN(d.sentiment))
            .y(d => y(d.sentiment));

            // Gruppiere die Daten nach Präsidenten
            const presidents = Array.from(d3.group(data, d => d.president), ([key, value]) => ({key, value}));

            // Füge für jeden Präsidenten eine Linie hinzu
            presidents.forEach((president, index) => {
                // Lese die Partei aus den Daten
                const party = president.value[0].party;

                // Zeichne den Pfad (die Linie) für jeden Präsidenten
                const path = svg.append('path')
                    .datum(president.value) // Verwende die gefilterten Daten für den Präsidenten
                    .attr('fill', 'none')
                    .attr('stroke', partyColors[party] || 'grey') // Farbe basierend auf der Partei
                    .attr('stroke-width', index < 4 ? 1.5 : 3) // Dünnere Linien (1.5px) für die ersten vier Präsidenten, sonst dicker (3px)
                .attr('d', line);
                
                // --- Animationslogik ---
                const totalLength = path.node().getTotalLength();

                // Alle Linien für die "Zeichnen"-Animation vorbereiten.
                // Das stroke-dasharray wird auf die Gesamtlänge der Linie plus eine Lücke in gleicher Länge gesetzt.
                // Dadurch ist die Linie zunächst unsichtbar, da nur die Lücke zu sehen ist.
                path.attr("stroke-dasharray", totalLength + " " + totalLength);

                path.attr("stroke-dashoffset", totalLength).style("opacity", 0);
                president.path = path; // Speichere den Pfad im president-Objekt
                president.totalLength = totalLength; // Speichere die Gesamtlänge für die Animation
            });

            //  Vorabberechnung der Segmentlängen zur Performance-Optimierung ---
            presidents.forEach(president => {
                president.segmentLengthsByYear = {}; // Neues Objekt zum Speichern der Längen
                // Gehe durch jeden Datenpunkt (jedes Jahr) der Amtszeit eines Präsidenten
                for (let i = 1; i <= president.value.length; i++) {
                    const segmentData = president.value.slice(0, i); // Nimm die Daten von Anfang bis zum aktuellen Jahr
                    const year = segmentData[segmentData.length - 1].year.getFullYear();

                    // Erstelle einen unsichtbaren Pfad, um die Länge zu messen
                    const tempPath = svg.append('path').datum(segmentData).attr('d', line).style('display', 'none');
                    const segmentLength = tempPath.node().getTotalLength();
                    tempPath.remove();

                    president.segmentLengthsByYear[year] = segmentLength; // Speichere die Länge mit dem Jahr als Schlüssel
                }
            });

            // Ein Container für die Beschriftungen, damit wir sie leicht hinzufügen/entfernen können
            const labels = svg.append("g")
                .attr("class", "labels")
                .attr("font-family", "sans-serif")
                .attr("font-size", isMobile ? 14 : 12) // Größere Labels für die Namen
                .attr("text-anchor", "middle"); // Standard-Ausrichtung auf "middle" setzen, das passt jetzt zur neuen Logik
            
            let previousEndYear = 1921; // Variable, um den Zustand des vorherigen Steps zu speichern

            // Liste der Präsidenten, deren Labels nach dem Erscheinen erhalten bleiben sollen.
            const presidentsToKeepLabels = [
                "Roosevelt",
                "Kennedy",
                "Reagan",
                "Clinton",
                "Bush jr.",
                "Obama",
                "Trump"
            ];

            // --- 3. SCROLLAMA-FUNKTIONEN ---
            // Diese Funktion wird aufgerufen, wenn ein neuer Step in den Fokus rückt
            let currentStepIndex = null; // Zustandsspeicher

            function handleStepEnter(response) {
                // response.element ist das DOM-Element des Steps
                const stepIndex = d3.select(response.element).attr('data-step');
                
                // Doppelte Ausführung verhindern (wichtig für mobile Split-Steps)
                if (stepIndex === currentStepIndex) return;
                currentStepIndex = stepIndex;

                // Definiere die Endjahre für jeden Schritt
                const endYears = {
                    '1': 1944, // Roosevelt
                    '2': 1963, // Kennedy
                    '3': 1988, // Reagan
                    '4': 2000, // Clinton
                    '5': 2008, // Bush
                    '6': 2016, // Obama
                    '7': 2020  // Trump
                };
                
                const endYear = endYears[stepIndex] || 1921; // Fallback auf das Startjahr
               
                // Aufräumen: Entferne alle Labels, die NICHT in der "presidentsToKeepLabels"-Liste sind.
                // Wir machen das einmal zentral zu Beginn des Steps, statt bei jedem Präsidenten einzeln.
                labels.selectAll("text")
                    .filter(function() {
                        const currentLabelText = d3.select(this).text();
                        return !presidentsToKeepLabels.includes(currentLabelText);
                    })
                    .remove();

                // Sequenzielle Animation der Präsidentenlinien
                let animationDelay = 0;
                const delayPerPresident = 2000; // Verzögerung zwischen den Animationen
                const durationFactorPerPixel = 10; // Millisekunden pro Pixel für die Animationsdauer

                presidents.forEach(president => {
                    const presidentFirstYear = d3.min(president.value, d => d.year.getFullYear());

                    // Filtere die Daten des Präsidenten bis zum aktuellen End-Jahr des Steps
                    const filteredPresidentData = president.value.filter(d => d.year.getFullYear() <= endYear);

                    // Wenn für diesen Präsidenten im aktuellen Step keine Daten sichtbar sind, Pfad ausblenden.
                    if (filteredPresidentData.length === 0) { 
                        president.path.style("opacity", 0);
                        return; // zum nächsten Präsidenten
                    }

                    // Greife auf die vorab berechnete Ziellänge für den aktuellen Step zu.
                    const lastDataYearInSegment = filteredPresidentData[filteredPresidentData.length - 1].year.getFullYear();
                    const targetLength = president.segmentLengthsByYear[lastDataYearInSegment] || 0;
                    const targetOffset = president.totalLength - targetLength;

                    // Prüfe, ob die Amtszeit dieses Präsidenten bereits im VORHERIGEN Step begonnen hat.
                    if (presidentFirstYear <= previousEndYear) {
                        // JA: Dieser Pfad war bereits (teilweise) sichtbar.
                        // Setze ihn ohne Verzögerung und ohne Animation auf den neuen Endzustand.
                        // Dies verhindert das "Nachzeichnen" bereits sichtbarer Linien.
                        president.path
                            .interrupt() // Stoppt laufende Animationen auf diesem Pfad
                            .style("opacity", 1)
                            .attr("stroke-dashoffset", targetOffset);
                    } else {
                        // NEIN: Dieser Pfad ist neu in diesem Step.
                        // Animiere ihn mit der sequenziellen Verzögerung.
                        president.path.style("opacity", 1)
                            .transition() // Starte eine Transition
                            .delay(animationDelay) // Korrekte, kumulative Verzögerung verwenden
                            // Dauer ist jetzt proportional zur Länge des zu animierenden Segments
                            .duration(targetLength * durationFactorPerPixel)
                            .ease(d3.easeLinear)
                            .attr("stroke-dashoffset", targetOffset);

                        // LABEL-LOGIK: Zeige den Namen des aktuell animierten Präsidenten an.
                        // Finde den letzten Punkt für diesen spezifischen Präsidenten im aktuellen Step.
                        const presidentLastPoint = filteredPresidentData[filteredPresidentData.length - 1];
                        
                        // Wir nutzen setTimeout statt einer D3-Transition auf 'labels', 
                        // um zu verhindern, dass sich Transitionen gegenseitig abbrechen ("Race Condition").
                        setTimeout(() => {
                            const isImportantPresident = presidentsToKeepLabels.includes(presidentLastPoint.president);

                            // --- POSITIONIERUNGSLOGIK FÜR LABELS ---
                            const presidentName = presidentLastPoint.president;
                            const presidentParty = presidentLastPoint.party;
                            let labelYValue;

                            // Y-Position basierend auf Partei und Name bestimmen
                            if (presidentParty === "Republikaner") {
                                if (presidentName === "Bush jr." || presidentName === "Trump") {
                                    labelYValue = -0.6; 
                                } else {
                                    labelYValue = (presidentName === "Bush sr." || presidentName === "Hoover" 
                                    || presidentName === "Eisenhower" || presidentName === "Ford") ? -0.25 : -0.1;
                                }
                            } else { // Demokrat
                                if (presidentName === "Roosevelt") {
                                    labelYValue = 0.1;
                                } else {
                                    labelYValue = (presidentName === "LBJ") ? 0.8 : 0.7;
                                }
                            }

                            // X-Position in der Mitte der Amtszeit berechnen
                            const firstPointOfYear = president.value[0].year;
                            const lastPointOfYear = filteredPresidentData[filteredPresidentData.length - 1].year;
                            const midPointTimestamp = (firstPointOfYear.getTime() + lastPointOfYear.getTime()) / 2;
                            const calculatedX = x(new Date(midPointTimestamp));

                            // Füge das Label hinzu
                            labels.append("text")
                            .attr("x", calculatedX)
                            .attr("y", y(labelYValue))
                            .text(presidentLastPoint.president)
                            .attr("text-anchor", "middle")
                            .attr("class", isImportantPresident ? "label-important" : null)
                            .style("font-weight", isImportantPresident ? "bold" : "normal")
                            .style("font-size", isImportantPresident ? (isMobile ? "14px" : "12px") : (isMobile ? "12px" : "11px"))
                            .style("fill", "#333")
                            .style("opacity", 0) // Start unsichtbar
                            .transition()
                            .duration(300)
                            .style("opacity", 1);
                        }, animationDelay); // Das Timeout feuert, wenn die Linie anfängt zu zeichnen

                        animationDelay += delayPerPresident; // Verzögerung für den nächsten Präsidenten erhöhen
                    }
                });

                previousEndYear = endYear; // Aktualisiere den Zustand für den nächsten Step

            }

            // Richte Scrollama ein
            scroller.setup({
                step: '.scrolly-text .step', // Welche Elemente sollen beobachtet werden?
                offset: isMobile ? 0.9 : 0.5, // Mobil: Trigger weit unten (0.9), Desktop: Mitte (0.5)
                debug: false // auf true setzen, um Hilfslinien zu sehen
            })
            .onStepEnter(handleStepEnter); // Welche Funktion soll bei "Enter" aufgerufen werden?


            // Füge nach jedem einzelnen Textabschnitt ("step") ein Puffer-Element ein.
            // Dieses leere div erzeugt einen leeren Raum, der dem Leser eine Pause gibt
            // und sicherstellt, dass jeder Textabschnitt vollständig aus dem Bild scrollen kann.
            steps.each(function() {
                // `this` ist das aktuelle DOM-Element des ".step"
                const step = d3.select(this);
                let extraClasses = '';
                if (step.classed('desktop-only')) extraClasses += ' desktop-only';
                if (step.classed('mobile-only')) extraClasses += ' mobile-only';

                // Wir fügen ein neues <div> direkt nach dem aktuellen Step-Element ein.
                // WICHTIG: Wir geben ihm dieselben Sichtbarkeits-Klassen wie dem Step selbst!
                this.insertAdjacentHTML('afterend', `<div class="step-puffer${extraClasses}" style="height: 75vh;"></div>`);
            });

        }).catch(function (error) {
            // Diese Zeile ist super wichtig!
            console.error("Schwerwiegender Fehler beim Laden oder Verarbeiten der Daten: ", error);
        });
    });

})(); // Die leeren Klammern am Ende führen die Funktion sofort aus.
