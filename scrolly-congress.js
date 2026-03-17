// Wir packen alles in eine Funktion, die wir sofort aufrufen (IIFE).
(function() {
    // Alle Variablen hier drin sind privat für diese Grafik.
    // Diese Selektoren sind spezifisch für diese Grafik und sollten beibehalten werden.
    const container = d3.select('#scrolly-congress .scrolly-vis');
    const scrollyText = d3.select('#scrolly-congress .scrolly-text');
    const steps = scrollyText.selectAll('.step');
    const isMobile = window.innerWidth < 768;
    
    // Wartet, bis das gesamte HTML-Dokument geladen ist, bevor die Grafik initialisiert wird.
    document.addEventListener('DOMContentLoaded', function() {
        console.log("Schritt A: DOMContentLoaded wurde ausgelöst. Skript für Kongress-Sentiment startet.");
        // Initialisiere den Scroller und konfiguriere ihn
        const scroller = scrollama();

        // --- 2. DATEN LADEN UND GRAFIK ERSTELLEN ---
        d3.csv('congress_sentiment.csv').then(function (data) {
            console.log("Kongress_Schritt B: CSV-Daten für Kongress-Sentiment wurden geladen.", data);
            // Konvertiere die Daten in die richtigen Typen (Zahlen und Daten)
            data.forEach(d => {
                d.year = d3.timeParse("%Y")(d.year); // Jahr in ein Datumsobjekt umwandeln
                // Die Sentiment-Spalten müssen umgewandelt werden.
                // 1. Die Spaltennamen aus der CSV verwenden (z.B. 'pro_minus_anti_D').
                // 2. Das Komma durch einen Punkt ersetzen, damit JavaScript es als Zahl erkennt.
                // 3. Mit dem '+' in eine Zahl umwandeln.
                d.democratic_sentiment = +d.pro_minus_anti_D.replace(",", ".");
                d.republican_sentiment = +d.pro_minus_anti_R.replace(",", ".");
            });

            // --- D3.js Grafik-Setup ---
            console.log("Schritt C: Grafik-Setup beginnt.");
            // Definiere eine "logische" Größe für unser internes Koordinatensystem.
            const margin = { top: 30, right: 40, bottom: 20, left: 40 }; // Angepasste Margins für die Grafik
            const logicalWidth = 600;
            const logicalHeight = 450; // Ein 4:3 Seitenverhältnis
            const width = logicalWidth - margin.left - margin.right;
            const height = logicalHeight - margin.top - margin.bottom;


            // Definition der Farben für die Parteien
            const partyColors = {
                "Demokraten": "#00AEF3",
                "Republikaner": "#E81B23"
            }

            // Füge die Einleitung unter dem Header ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-intro')
                .style('font-size', '0.8rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1.5rem') // Mehr Abstand zur Grafik
                .html(`Tendenz der migrationspolitischen Reden im US-Kongress seit 1880 - bei <b style="background:${partyColors["Republikaner"]}; color:#ffffff;">&nbsp;Republikanern&nbsp;</b> und <b style="background:${partyColors["Demokraten"]}; color:#ffffff;">&nbsp;Demokraten&nbsp;</b>. Überwiegt der Anteil der positiven Reden oder der der negativen?`);

            // Füge den Header über der Grafik ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-header') // Gibt ihm eine Klasse für potenzielles CSS-Styling
                .style('font-size', '1.3rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1em') // Abstand nach unten
                .html('<b style="background:#2D3C46;color:#ffffff;padding:1px 0px;">&nbsp;USA&nbsp;</b><b style="color:#2D3C46;border-bottom:1px solid #2D3C46;">&nbsp;Wie spricht der Kongress über Einwanderer?&nbsp;&nbsp;</b>&nbsp;&nbsp;');

            // Erstelle einen dedizierten Container für die SVG, um das Styling zu erleichtern.
            const chartContainer = container.append('div')
                .attr('class', 'chart-container');
            // Erstelle das SVG-Element, in das wir zeichnen
            const svg = chartContainer.append('svg')
                .attr('viewBox', `0 0 ${logicalWidth} ${logicalHeight}`)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);


            // --- CLIP RECT DEFINITION (Der "Guckkasten") ---
            // Wir definieren einen Bereich, außerhalb dessen nichts zu sehen sein soll.
            // Wir speichern zwei Rechtecke in den Variablen 'clipReps/Dems', um sie später zu animieren und die jeweiligen Linien gesondert steuern zu können.
            const clipReps = svg.append("defs").append("clipPath")
                .attr("id", "clip-reps") // Diesen Namen brauchen wir weiter unten bei den Generatoren (Schauspielern)
                .append("rect")
                .attr("width", 0) // Startzustand: Vorhang zu (Breite 0)
                .attr("height", height);

            const clipDems = svg.append("defs").append("clipPath")
                .attr("id", "clip-dems") // Diesen Namen brauchen wir weiter unten bei den Generatoren (Schauspielern)
                .append("rect")
                .attr("width", 0) // Startzustand: Vorhang zu (Breite 0)
                .attr("height", height);

            // Erstelle die Skalen (x-Achse für Zeit, y-Achse für Sentiment)
            const x = d3.scaleTime()
                .domain([new Date('1875-12-31'), new Date('2021-01-01')]) // ???? Domain erweitert, damit 1920 und 2020 Ticks erscheinen
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([-1, 1]) // Fester Bereich von -1 bis 1
                .range([height, 0]);
                
            // --- GITTERNETZ (GRID) ---
            // Y-Gitter (Horizontale Linien)
            svg.append("g")
                .attr("class", "grid")
                .call(d3.axisLeft(y)
                    .ticks(10) // ca. 10 Schritte
                    .tickSize(-width)
                    .tickFormat("")
                )
                .style("stroke-opacity", 0.1) // Macht die Linien zart
                .select(".domain").remove(); // Entfernt den äußeren Rahmen

            // X-Gitter (Vertikale Linien)
            svg.append("g")
                .attr("class", "grid")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(d3.timeYear.every(20))
                    .tickSize(-height)
                    .tickFormat("")
                )
                .style("stroke-opacity", 0.1)
                .select(".domain").remove();

            // Zeichne die Achsen
            svg.append('g')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(d3.timeYear.every(20)).tickSizeOuter(0));

            
            // Füge die Text-Anmerkungen "positiv" und "negativ" hinzu.
            // Anmerkung für "positiv"
            svg.append("text")
            .attr("x", 0) // Positioniert den Text am linken Rand des G-Elements
            .attr("y", y(0.9))
            .attr("dy", "0.32em") // Kleine vertikale Korrektur für perfekte Ausrichtung
            .attr("text-anchor", "start") // Text beginnt an x=0
            .attr("dx", "0.5em") // Etwas nach rechts verschieben (innerhalb des Diagramms)
            .style("font-family", "Arial").style("font-size", "14px")
            .style("fill", "#777") //  Farbton
            .style("font-weight", "200") 
            .text("positiv");
            // Anmerkung für "negativ" (gleiches Prinzip)
            svg.append("text")
            .attr("x", 0).attr("y", y(-0.9)).attr("dy", "0.32em") // x=0, y(-0.9)
            .attr("text-anchor", "start") // Text beginnt an x=0
            .attr("dx", "0.5em") // Etwas nach rechts verschieben (innerhalb des Diagramms)
            .style("font-family", "Arial").style("font-size", "14px")
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



            // 2. Die Generatoren definieren 
            // Aufführung: Die Schauspielers  
            // wir haben zwei Linien bzw Schauspieler, deshalb brauchen wir zwei Generatoren
            // der für die Republikaner
        const rep_line = d3.line()
            .x(d => x(d.year))
            .defined(d => d.republican_sentiment != null && !isNaN(d.republican_sentiment))
            .y(d => y(d.republican_sentiment));

            // und der für die Demokraten
        const dem_line = d3.line()
            .x(d => x(d.year))
            .defined(d => d.democratic_sentiment != null && !isNaN(d.democratic_sentiment))
            .y(d => y(d.democratic_sentiment));


            // 3. Die Schauspieler auf die Bühne bringen (Pfade zeichnen)
            // Wir zeichnen die Linien initial einmal komplett.
            // Pfad für Republikaner
            const pathReps = svg.append("path")
                .datum(data) // Wir binden die GESAMTEN Daten an diesen Pfad
                .attr("class", "rep_line") // Klasse für CSS (Farbe etc.)
                .attr("fill", "none")
                .attr("stroke", partyColors["Republikaner"])
                .attr("stroke-width", 3)
                .attr("clip-path", "url(#clip-reps)") // Zuschnitt mit clippath
                .attr("d", rep_line); // Hier wird die Form berechnet


            // Pfad für Demokraten
            const pathDems = svg.append("path")
                .datum(data)
                .attr("class", "dem_line")
                .attr("fill", "none")
                .attr("stroke", partyColors["Demokraten"])
                .attr("stroke-width", 3)
                .attr("clip-path", "url(#clip-dems)") 
                .attr("d", dem_line);



            // Aufführung SCHRITT 4: das Drehbuch (SCROLLAMA LOGIK) ---
            // Diese Funktion wird aufgerufen, wenn ein neuer Step in den Fokus rückt
            function handleStepEnter(response) {
                console.log("Kongress| Schritt 2.D: Step Enter ausgelöst für Step:", response.element.dataset.step);
                // Welcher Step sind wir? (1, 2, 3...)
                const stepIndex = response.element.dataset.step;


                // Regieanweisung: Wie viel von den beiden Lines zeigen wir bei welchen Step?
                // Step 1: bis 1900 - Einwanderer als 'Bedrohung'
                // Step 2: bis 1940 - weiter so
                // Step 3: bis 1970 - mehr Wohlwollen
                // Step 4: bis 2000 - Reps und Dems driften auseinander
                // Step 5: Reps bis 2022 - Reps noch negativer
                // Step 6: Dems bis 2022 - Dems stabil
                // Step 7: Reps 1920/2020 - alles über -.1 ausblenden
                // Step 8: alles unter -.1 komplett

                let xMaxDems;
                let xMaxReps;
                let ceilingMax;

                if (stepIndex === '1') {
                    xMaxDems = new Date('1900-01-01'); // bis 1900  
                    xMaxReps = new Date('1900-01-01'); // bis 1900
                    ceilingMax = 1;
                } else if (stepIndex === '2') {
                    xMaxDems = new Date('1940-01-01'); // bis 1940
                    xMaxReps = new Date('1940-01-01'); // bis 1940
                    ceilingMax = 1;
                } else if (stepIndex === '3') {
                    xMaxDems = new Date('1970-01-01'); // bis 1970
                    xMaxReps = new Date('1970-01-01'); // bis 1970
                    ceilingMax = 1;
                } else if (stepIndex === '4') {
                    xMaxDems = new Date('2000-01-01'); // bis 2000
                    xMaxReps = new Date('2000-01-01'); // bis 2000
                    ceilingMax = 1;
                } else if (stepIndex === '5') { 
                    xMaxDems = new Date('2000-01-01'); // bis 2000  
                    xMaxReps = new Date('2023-01-01'); // bis 2022
                    ceilingMax = 1;
                } else if (stepIndex === '6') {
                    xMaxDems = new Date('2023-01-01'); // bis 2022
                    xMaxReps = new Date('2023-01-01'); // bis 2022
                    ceilingMax = 1;
                } else if (stepIndex === '7') {
                    xMaxDems = new Date('2023-01-01'); // bis 2022
                    xMaxReps = new Date('2023-01-01'); // bis 2022
                    ceilingMax = 0;
                }

                // 2. Die Vorhänge (clipRect) aufziehen
                // Wir berechnen, wie viele Pixel breit der Bereich bis zum aktuellen Jahr (xDomainMax) ist.
                const targetWidthDems = x(xMaxDems);
                const targetWidthReps = x(xMaxReps);
                const targetCeilingLevel = y(ceilingMax);
                // Neue Höhe berechnen: Vom Startpunkt (y) bis zum Boden
                const targetHeight = height - targetCeilingLevel;

                
                clipDems
                    .transition()
                    .duration(3000) // Dauer: 1 Sekunde 
                    .attr("width", targetWidthDems)
                    .attr("y", targetCeilingLevel) // Decke senken (Startpunkt Y)
                    .attr("height", targetHeight); // Höhe anpassen

                clipReps
                    .transition()
                    .duration(3000) // Dauer: 1 Sekunde
                    .attr("width", targetWidthReps)
                    .attr("y", targetCeilingLevel) // Decke senken (Startpunkt Y)
                    .attr("height", targetHeight); // Höhe anpassen
            }


            // Aufführung SCHRITT 4: Stück beginnt
            scroller.setup({
                step: '#scrolly-congress .scrolly-text .step', // WICHTIG: Spezifischer Selektor
                offset: isMobile ? 0.9 : 0.7, // Mobil: Trigger weit unten (0.9), Desktop: 0.7
                debug: false
            })
            .onStepEnter(handleStepEnter);

        }).catch(function (error) {
            console.error("Fehler beim Laden der Kongressdaten:", error);
        });
    });
})();