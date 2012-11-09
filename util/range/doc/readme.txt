==============================================
= Knihovna JAK.Range 3.0                     =
==============================================

Knihovnu pro práci s rozsahem lze použít k pokročilé manipulaci s elementy DOMu a práci s uživatelským výběrem.
Pomocí ní lze tedy prvky uživatelsky označovat, modifikovat (např. mazat, vkládat nové prvky, ...),
získat html i textový obsah, atd...

Sestává se z těchto knihoven:

range.js - hlavní soubor obsahující veškeré třídy, který lze použít v projektech
range-lib.js - wrapper nad W3C range a IE range
range-ie.js - implementace Range metod pod IE 8 a níže
range-ie-utils.js - pomocné utility
range-ie-selection.js - třída pro selection v IE 8 a níže

Základní použití Range:
-----------------------------------
Nalinkujte soubor range.js: <script type="text/javascript" src="cesta_k_JAKU/range.js"></script>

PRÁCE S DOMEM:
Základní inicializace:
var range = new JAK.Range();

Přidat div do range a uživatelsky označit:
range.setOnNode(JAK.gel("mujDiv"), true); // nastavit na obsah divu
range.show();

Range ze selection:
var range = JAK.Range.fromSelection();
alert(range.getContentHTML());

PRÁCE S INPUTEM A TEXTAREOU:
JAK.Range.setCaret(JAK.gel("mujInput"), 0, 1); //uzivatelsky oznaci prvni znak
alert(JAK.Range.getCaret(JAK.gel("mujInput"))); //vrati {start:0, end:1}

TODO:
Demo stránka ukazující možnosti Range
