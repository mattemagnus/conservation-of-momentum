# Kollisionslabbet

En interaktiv simulering av två vagnar och rörelsemängdens bevarande. Allt körs i webbläsaren utan installation eller internetanslutning.

## Öppna sidan

1. Öppna projektmappen i VS Code.
2. Leta upp `index.html` i filpanelen till vänster.
3. Högerklicka på filen och välj **Visa i Finder**.
4. Dubbelklicka på `index.html` i Finder. Sidan öppnas i din webbläsare.

Ändringar i filerna syns efter att du sparat och uppdaterat sidan i webbläsaren.

## Använd simuleringen

Välj stöttyp och ange massa och hastighet för båda vagnarna. Positiv hastighet är åt höger och negativ åt vänster. Ovanför varje vagn visas en hastighet åt gången: före stöten visas begynnelsehastigheten, som ligger kvar under stöten. Hastighetsrutorna är centrerade ovanför vagnarna före och efter stöten och flyttas isär under stöten om de annars skulle överlappa. När stöten är klar byts hastigheten till sluthastigheten. Tryck på **Starta simulering**. Tabellen visar värden efter stöten när kollisionen har skett.

Diagrammet visar kraften på varje vagn under stöten, räknat från första kontakten. Den vågräta axeln visar modellens tid i sekunder och den lodräta visar kraft i newton (N). Krafterna är lika stora men motriktade. Kraften startar på noll, är störst mitt i stöten och återgår till noll. De färgade areorna mellan kraftkurvorna och tidsaxeln växer under stöten och visar impulserna hittills, som motsvarar förändringen i respektive vagns rörelsemängd. Animationen visar rörelsen före och efter stöten i modellens normala hastighet och själva stöten under 1,5 sekunder i slow motion, oavsett hur kort modellens stöttid är.

Diagrammet visar den sammanlagda impulsen för varje vagn sedan stöten började, i newtonsekunder (N·s). Värdena visas på fasta platser i diagrammet, där de färgade areorna hamnar när stöten är avslutad. De uppdateras under stöten och finns kvar när den avslutats. Tabellen visar också vagnarnas individuella rörelsemängd före och efter stöten.

Vid oelastisk stöt kan studstalet ändras mellan 0,05 och 0,95. Ett större studstal ger en kraftigare studs. Elastisk stöt har studstalet 1 och fullständigt oelastisk stöt har studstalet 0. Om vagnarna inte närmar sig varandra sker ingen kollision. Simuleringen stannar om en vagn når banans kant; ändra hastigheterna om det sker före stöten.

Modellen beskriver en endimensionell stöt mellan två vagnar på en friktionsfri bana, utan yttre krafter under stöten. Kraftpulsen har en normalfördelningsliknande klockform: under kontakttiden T är F(t) proportionell mot exp(−18 · (t/T − 0,5)²) − exp(−4,5). Ändvärdet dras av så att kraften är noll vid stötens början och slut. Kraftens storlek väljs så att arean ger den impuls som motsvarar valt studstal. Pulsens form är en förenkling, inte en uppmätt kraftkurva; verkliga krafter beror bland annat på vagnarnas material och deformation. Stöttiden väljs i modellen utifrån vagnarnas relativa hastighet, med ett maximum på 0,6 s; även det är ett pedagogiskt antagande, inte en mätning av en verklig stöt. Vagnarna ritas ihoptryckta som en förenklad illustration av deformation. Efter en oelastisk stöt kan deformationen vara bestående. Modellen behandlar massorna som konstanta och beräknar inte vad den förlorade rörelseenergin omvandlas till. Under en elastisk stöt är rörelseenergin tillfälligt lägre än före och efter; modellen visar inte den lagrade energin separat.

## Ändra text eller fysik

- `content.js`: all text som visas på sidan, inklusive rubriker, knappar, meddelanden, undervisningstext och beskrivningar för skärmläsare. Öppna filen och leta efter texten du vill ändra. Ändra bara texten mellan citattecknen efter kolon; behåll nycklarna, citattecknen och kommatecknen. För att skriva ett citattecken inuti texten, skriv `\"`.
- `physics.js`: funktionerna för rörelsemängd, rörelseenergi, impuls och kollision, inklusive modellens stöttid och kraftpuls. Här anges kollisionens studstal som ett tal mellan 0 och 1.
- `index.html`: sidans struktur och hänvisningar till texten i `content.js`.
- `style.css`: färger, layout och utseende.
- `app.js`: knappar, animation och kopplingen mellan sidan och fysiken.

Spara filen och uppdatera webbläsaren för att se en ändring. Testa gärna beräkningarna igen efter ändringar i fysiken.

Formlerna i `content.js` skrivs med vanliga bokstäver, siffror och matematiska tecken, till exempel `I = ∫F dt`. Webbläsaren formaterar dem med MathML; LaTeX-kommandon stöds inte. Om du ändrar en formel behöver du också uppdatera den tillhörande skärmläsarbeskrivningen och eventuell förklarande text.

## Publicera på GitHub Pages

Du behöver ett GitHub-konto. Det enklaste första gången är att ladda upp filerna via GitHubs webbplats:

1. Logga in på [GitHub](https://github.com/) och skapa ett nytt repository (projektarkiv). Välj **Public** om du använder GitHub Free.
2. På repositoryts sida, välj **Add file → Upload files**. Dra in projektets filer, inklusive `index.html`, direkt till repositoryts översta nivå. Ladda inte upp själva mappen som en undermapp.
3. Välj **Commit changes** för att spara filerna på GitHub.
4. Öppna **Settings → Pages** i repositoryt. Under **Build and deployment**, välj **Deploy from a branch**. Välj grenen `main` och mappen `/ (root)`, och klicka på **Save**.
5. Vänta några minuter och uppdatera Pages-inställningarna. Där visas adressen till den publicerade sidan. Öppna adressen för att kontrollera att den fungerar.

När du ändrar en fil lokalt behöver du ladda upp den ändrade filen till GitHub igen för att eleverna ska se ändringen.

## Kontrollera fysiken

För den som har Node.js installerat kan de automatiska testerna köras med `node --test physics.test.js content.test.js`. Node.js behövs inte för att använda eller publicera sidan.
