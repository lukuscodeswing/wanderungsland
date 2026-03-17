// Wir packen alles in eine Funktion, die wir sofort aufrufen (IIFE).
(function() {
    // Aufführung Schritt 1: Teams für die Szene mit der Bevölkerungsentwicklung versammeln
    // Alle Variablen hier drin sind privat für diese Grafik.
    // Diese Selektoren sind spezifisch für diese Grafik und sollten beibehalten werden.
    const container = d3.select('#scrolly-population .scrolly-vis');
    const scrollyText = d3.select('#scrolly-population .scrolly-text');
    const steps = scrollyText.selectAll('.step');
    const isMobile = window.innerWidth < 768;


    // Aufführung: DOM gibt später Signal, wenn Bühne für B-Szene ready ist und stupst Regisseur (scrollama) an
    // Wartet, bis das gesamte HTML-Dokument geladen ist, bevor die Grafik initialisiert wird.
    document.addEventListener('DOMContentLoaded', function() {
        // Initialisiere den Scroller und konfiguriere ihn
        const scroller = scrollama();    

        // Aufführung Schritt 2: Schauspieler und Kulisse ready machen
        // --- DATEN LADEN UND GRAFIK ERSTELLEN ---
        d3.csv('population.csv').then(function (data) {
            console.log("Population_Schritt B: CSV-Daten für Bevölkerungsentwicklung wurden geladen.", data);
            // Konvertiere die Daten in die richtigen Typen (Zahlen und Daten)
            data.forEach(d => {
                d.year = d3.timeParse("%Y")(d.year); // Jahr in ein Datumsobjekt umwandeln
                // WICHTIG: Die Bevölkerungs-Spalten muss auch in eine Zahl umgewandelt werden.
                d.pop_total = +d.pop_total;
                d.pop_migrants = +d.pop_migrants;
                d.share = +d.share;
            });

            //
            // Aufführung SCHRITT 3: Umbau der Bühne beginnt
            // Koordinatensystem wird implementiert, Header gebaut, 
            // Achsen erstellt und gezeichnet, Schauspieler in Position gebracht, ihr Weg festgelegt
            // --- D3.js Grafik-Setup ---
            // Definiere eine "logische" Größe für unser internes Koordinatensystem.
            const margin = { top: 30, right: 40, bottom: 20, left: 60 }; // Angepasste Margins für die Grafik
            const logicalWidth = 600;
            const logicalHeight = 450; // Ein 4:3 Seitenverhältnis
            const width = logicalWidth - margin.left - margin.right;
            const height = logicalHeight - margin.top - margin.bottom;

            // Füge die Einleitung unter dem Header ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-intro')
                .style('font-size', '0.8rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1.5rem') // Mehr Abstand zur Grafik
                .html('Zahl der in den USA lebenden <b style="background:#d73445; color:#ffffff;">&nbsp;Eingewanderten&nbsp;</b> , jeweils im Vergleich zur  <b style="background:#777; color:#ffffff;">&nbsp;Gesamtbevölkerung&nbsp;</b>.');

            // Füge den Header über der Grafik ein
            container.insert('div', ':first-child') // Fügt ein div als erstes Element in den Container ein
                .attr('class', 'chart-header') // Gibt ihm eine Klasse für potenzielles CSS-Styling
                .style('font-size', '1.3rem') // Kleinere Schriftgröße
                .style('margin-bottom', '1em') // Abstand nach unten
                .html('<b style="background:#2D3C46;color:#ffffff;padding:1px 0px;">&nbsp;USA&nbsp;</b><b style="color:#2D3C46;border-bottom:1px solid #2D3C46;">&nbsp;Anteil Eingewanderter an der Bevölkerung');

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
            // Wir speichern das Rechteck in der Variable 'clipRect', um es später zu animieren.
            const clipRect = svg.append("defs").append("clipPath")
                .attr("id", "clip-population") // Diesen Namen brauchen wir weiter unten bei den Generatoren (Schauspielern)
                .append("rect")
                .attr("width", 0) // Startzustand: Vorhang zu (Breite 0)
                .attr("height", height);

            // 1. Erstelle die Skalen (x-Achse für Zeit, y-Achse für Anzahl Menschen)
            // Aufführung: Bühne aufteilen in Planquadrate
            const x = d3.scaleTime()
                .domain([new Date('1850-01-01'), new Date('2023-01-01')]) // Feste Bühne von Anfang bis Ende
                .range([0, width]);

            const y = d3.scaleLinear()
                .domain([0, 60000000]) // Fester Bereich 
                .range([height, 0]);

            // Definition der Farben für die Parteien
            const populationColors = {
                "Gesamtbevölkerung": "#777777",
                "Eingewanderte": "#e74c3c"
            };

            // Zeichne die Achsen
            // x-Achse
            const xAxis = svg.append('g')
                .attr('class', 'x-axis')
                .attr('transform', `translate(0,${height})`)
                .call(d3.axisBottom(x).ticks(d3.timeYear.every(20)).tickSizeOuter(0));
            // y-Achse
            const yAxis = svg.append("g")
                .attr("class", "y-axis")
                .call(d3.axisLeft(y)
                    .ticks(5) // Nicht zu viele Striche
                    .tickFormat(d => d / 1000000 + " Mio.") // Formatierung: "300 Mio." statt "300000000"
                );   

            // 2. Die Generatoren definieren 
            // Aufführung: Die Schauspielers                
            // Area-Generatoren definieren (Darsteller für die Flächen unter den Linien)
            // Eine "area" ist wie eine "line", hat aber zusätzlich eine Unterkante (y0).
            const areaGenGesamt = d3.area()
                .x(d => x(d.year))
                .y0(height) // Unterkante ist die X-Achse (unten auf der Zeichenfläche)
                .y1(d => y(d.pop_total)); // Oberkante ist die Datenlinie

            const areaGenMigrants = d3.area()
                .x(d => x(d.year))
                .y0(height) // Unterkante ist ebenfalls die X-Achse
                .y1(d => y(d.pop_migrants)); // Oberkante ist die Datenlinie

            // Flächen zeichnen (VOR den Linien, damit die Linien obenauf liegen)
            // Wir zeichnen zuerst die Gesamt-Fläche, dann die kleinere Migranten-Fläche darüber.
            const areaGesamt = svg.append("path")
                .datum(data)
                .attr("class", "area-gesamt")
                .attr("fill", populationColors["Gesamtbevölkerung"])
                .attr("fill-opacity", 0.3) // 70% transparent (1.0 = 0% transparent)
                .attr("clip-path", "url(#clip-population)") // Hier Anwendung Schablone 
                .attr("d", areaGenGesamt);


            const areaMigrants = svg.append("path")
                .datum(data)
                .attr("class", "area-migrants")
                .attr("fill", populationColors["Eingewanderte"])
                .attr("fill-opacity", 0.3)
                .attr("clip-path", "url(#clip-population)") 
                .attr("d", areaGenMigrants);

            // Die Linien-Generatoren definieren 
            // Anders als bei den Präsidenten brauchen wir ZWEI Generatoren, 
            // da wir zwei verschiedene Daten-Spalten visualisieren.
            
            // Generator für die Gesamtbevölkerung
            const lineGesamt = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.pop_total)); // Nutzt die Spalte 'pop_total'

            // Generator für die Eingewanderten
            const lineMigrants = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.pop_migrants)); // Nutzt die Spalte 'pop_migrants'

            // 3. Die Schauspieler auf die Bühne bringen (Pfade zeichnen)
            // Wir zeichnen die Linien initial einmal komplett.
            // Pfad für Gesamtbevölkerung
            const pathGesamt = svg.append("path")
                .datum(data) // Wir binden die GESAMTEN Daten an diesen Pfad
                .attr("class", "line-gesamt") // Klasse für CSS (Farbe etc.)
                .attr("fill", "none")
                .attr("stroke", populationColors["Gesamtbevölkerung"])
                .attr("stroke-width", 3)
                .attr("clip-path", "url(#clip-population)") // Zuschnitt mit clippath
                .attr("d", lineGesamt); // Hier wird die Form berechnet


            // Pfad für Eingewanderte
            const pathMigrants = svg.append("path")
                .datum(data)
                .attr("class", "line-migrants")
                .attr("fill", "none")
                .attr("stroke", populationColors["Eingewanderte"])
                .attr("stroke-width", 3)
                .attr("clip-path", "url(#clip-population)") 
                .attr("d", lineMigrants);



            // Aufführung SCHRITT 4: das Drehbuch (SCROLLAMA LOGIK) ---

            function handleStepEnter(response) {
                // Welcher Step sind wir? (1, 2, 3...)
                const stepIndex = response.element.dataset.step;

                // Regieanweisung: Welcher Zoom-Level (maximaler y-Wert) gilt für welchen Step?
                // Step 1: Fokus auf den Anfang (kleine Zahlen) - bis 1890/ 60Mio
                // Step 2: zweite Welle - bis 1920/ 120Mio
                // Step 3: MigraAnteil sinkt - bis 1970/ 220Mio
                // Step 4: dritte Welle, erstmal bis 1990
                // Step 5: ganzes Bild - bis 2023/ max
                let yDomainMax;
                let xDomainMax;

                if (stepIndex === '1') {
                    yDomainMax = 65000000; // 65 Mio.
                    xDomainMax = new Date('1890-01-01'); // bis 1890
                } else if (stepIndex === '2') {
                    yDomainMax = 120000000; // 120 Mio.
                    xDomainMax = new Date('1920-01-01'); // bis 1920
                } else if (stepIndex === '3') {
                    yDomainMax = 150000000; // 150 Mio.
                    xDomainMax = new Date('1950-01-01'); // bis 1950
                } else if (stepIndex === '4') {
                    yDomainMax = 220000000; // 250 Mio.
                    xDomainMax = new Date('1970-01-01'); // bis 1970
                } else if (stepIndex === '5') { 
                    yDomainMax = 300000000; // 300 Mio. (Vollansicht)
                    xDomainMax = new Date('1990-01-01'); // bis 1990
                } else if (stepIndex === '6') {                   
                    yDomainMax = 350000000; // 350 Mio. (Vollansicht)
                    xDomainMax = new Date('2023-01-01'); // bis 2023
                }
                
                // 1. Die Umrechnung der y-Werte in Pixel updaten
                y.domain([0, yDomainMax]);
                // 1.1. Die Y-Achse visuell anpassen (mit Animation)
                svg.select(".y-axis")
                    .transition()
                    .duration(2000) // Dauer: 1 Sekunde
                    .call(d3.axisLeft(y)
                        .ticks(5)
                        .tickFormat(d => d / 1000000 + " Mio.")
                    );

                // 2. Den Vorhang (clipRect) aufziehen
                // Wir berechnen, wie viele Pixel breit der Bereich bis zum aktuellen Jahr (xDomainMax) ist.
                const targetWidth = x(xDomainMax);
                
                clipRect
                    .transition()
                    .duration(5000) // Dauer: 3 Sekunde
                    .attr("width", targetWidth);


                // 3. Flächen und Linien an die neue Skala anpassen (mit Animation)
                // Da wir 'y' oben geändert haben, berechnen lineGesamt und lineMigrants
                // jetzt neue Pixel-Positionen für dieselben Daten.
                areaGesamt
                    .transition()
                    .duration(2000)
                    .attr("d", areaGenGesamt);

                areaMigrants
                    .transition()
                    .duration(2000)
                    .attr("d", areaGenMigrants);  

                pathGesamt
                    .transition()
                    .duration(2000)
                    .attr("d", lineGesamt);

                pathMigrants
                    .transition()
                    .duration(2000)
                    .attr("d", lineMigrants);
            }

            // Aufführung SCHRITT 4: Stück beginnt
            scroller.setup({
                step: '#scrolly-population .scrolly-text .step', // WICHTIG: Spezifischer Selektor
                offset: isMobile ? 1.0 : 0.7, // Mobil: Trigger ganz unten (1.0), Desktop: 0.7
                debug: false
            })
            .onStepEnter(handleStepEnter);

        }).catch(function (error) {
            console.error("Fehler beim Laden der Bevölkerungsdaten:", error);
        });
    });
})();