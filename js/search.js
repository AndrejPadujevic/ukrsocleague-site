/**
 * УКРАЇНСЬКА СОЦІАЛІСТИЧНА ЛІГА
 * Site search: full-text overlay over all articles.
 * Builds an offline index once (IndexedDB) by fetching each article page.
 * Supports multilingual search via Google Translate proxy.
 * Also hosts the bookmarks panel.
 */
(function() {
    'use strict';

    var DB_NAME = 'usl-search';
    var DB_UK_STORE = 'pages';
    var DB_TRANS_STORE = 'translated';
    var DB_META_STORE = 'meta';
    var DB_VERSION = 3;
    var overlay = null;
    var ukMemory = null;
    var transMemory = null;
    var building = null;
    var currentUILang = '';

    /* ---- UI Translations (25 languages) ---- */
    var UI = {
        uk: { placeholder: 'Пошук по статтях…', searching: 'Шукаємо…', nothing: 'Нічого не знайдено за запитом', fallback: 'Спробувати на зовнішньому пошуку:', langHint: '', error: 'Локальний пошук недоступний.' },
        en: { placeholder: 'Search articles…', searching: 'Searching…', nothing: 'Nothing found for', fallback: 'Try external search:', langHint: 'Search works in the original language', error: 'Local search unavailable.' },
        de: { placeholder: 'Artikel durchsuchen…', searching: 'Suche…', nothing: 'Nichts gefunden für', fallback: 'Extern suchen:', langHint: 'Suche in Originalsprache', error: 'Lokale Suche nicht verfügbar.' },
        fr: { placeholder: 'Rechercher des articles…', searching: 'Recherche…', nothing: 'Rien trouvé pour', fallback: 'Recherche externe :', langHint: 'Recherche en langue originale', error: 'Recherche locale indisponible.' },
        es: { placeholder: 'Buscar artículos…', searching: 'Buscando…', nothing: 'No se encontró nada para', fallback: 'Buscar externamente:', langHint: 'Búsqueda en idioma original', error: 'Búsqueda local no disponible.' },
        it: { placeholder: 'Cerca articoli…', searching: 'Ricerca…', nothing: 'Niente trovato per', fallback: 'Cerca esternamente:', langHint: 'Ricerca in lingua originale', error: 'Ricerca locale non disponibile.' },
        pt: { placeholder: 'Pesquisar artigos…', searching: 'Pesquisando…', nothing: 'Nada encontrado para', fallback: 'Pesquisar externamente:', langHint: 'Pesquisa no idioma original', error: 'Pesquisa local indisponível.' },
        nl: { placeholder: 'Artikelen zoeken…', searching: 'Zoeken…', nothing: 'Niets gevonden voor', fallback: 'Extern zoeken:', langHint: 'Zoek in originele taal', error: 'Lokaal zoeken niet beschikbaar.' },
        pl: { placeholder: 'Szukaj artykułów…', searching: 'Szukanie…', nothing: 'Nie znaleziono dla', fallback: 'Szukaj zewnętrznie:', langHint: 'Szukaj w języku oryginalnym', error: 'Wyszukiwanie lokalne niedostępne.' },
        cs: { placeholder: 'Hledat články…', searching: 'Hledání…', nothing: 'Nic nenalezeno pro', fallback: 'Hledat externě:', langHint: 'Hledat v původním jazyce', error: 'Lokální hledání nedostupné.' },
        sv: { placeholder: 'Sök artiklar…', searching: 'Söker…', nothing: 'Inget hittat för', fallback: 'Sök externt:', langHint: 'Sök på originalspråk', error: 'Lokalsökning otillgänglig.' },
        da: { placeholder: 'Søg artikler…', searching: 'Søger…', nothing: 'Intet fundet for', fallback: 'Søg eksternt:', langHint: 'Søg på originalsprog', error: 'Lokal søgning utilgængelig.' },
        fi: { placeholder: 'Hae artikkeleita…', searching: 'Haetaan…', nothing: 'Mitään ei löytynyt', fallback: 'Hae ulkoisesti:', langHint: 'Hae alkuperäiskielellä', error: 'Paikallinen haku ei ole käytettävissä.' },
        el: { placeholder: 'Αναζήτηση άρθρων…', searching: 'Αναζήτηση…', nothing: 'Δεν βρέθηκε τίποτα για', fallback: 'Εξωτερική αναζήτηση:', langHint: 'Αναζήτηση στην αρχική γλώσσα', error: 'Τοπική αναζήτηση μη διαθέσιμη.' },
        hu: { placeholder: 'Cikkek keresése…', searching: 'Keresés…', nothing: 'Semmit sem találtunk', fallback: 'Keresés kívülről:', langHint: 'Keresés eredeti nyelven', error: 'Helyi keresés nem érhető el.' },
        ro: { placeholder: 'Caută articole…', searching: 'Căutare…', nothing: 'Nimic găsit pentru', fallback: 'Caută extern:', langHint: 'Caută în limba originală', error: 'Căutare locală indisponibilă.' },
        sk: { placeholder: 'Hľadať články…', searching: 'Hľadanie…', nothing: 'Nič nenájdené pre', fallback: 'Hľadať externe:', langHint: 'Hľadať v pôvodnom jazyku', error: 'Lokálne hľadanie nedostupné.' },
        bg: { placeholder: 'Търсене на статии…', searching: 'Търсене…', nothing: 'Нищо не е намерено за', fallback: 'Търсене отвън:', langHint: 'Търсене на оригинален език', error: 'Локалното търсене не е налично.' },
        hr: { placeholder: 'Pretraži članke…', searching: 'Traženje…', nothing: 'Ništa nije pronađeno za', fallback: 'Pretraži vanjsko:', langHint: 'Pretraži na izvornom jeziku', error: 'Lokalno pretraživanje nedostupno.' },
        sl: { placeholder: 'Iskanje člankov…', searching: 'Iskanje…', nothing: 'Nič najdeno za', fallback: 'Iskanje zunaj:', langHint: 'Iskanje v originalnem jeziku', error: 'Lokalno iskanje ni na voljo.' },
        lt: { placeholder: 'Ieškoti straipsnių…', searching: 'Ieškoma…', nothing: 'Nieko nerasta', fallback: 'Ieškoti išorėje:', langHint: 'Ieškoti originalo kalba', error: 'Vietinė paieška nepasiekiama.' },
        lv: { placeholder: 'Meklēt rakstus…', searching: 'Meklē…', nothing: 'Nekas nav atrasts', fallback: 'Meklēt ārēji:', langHint: 'Meklēt oriģinālvalodā', error: 'Vietējā meklēšana nav pieejama.' },
        et: { placeholder: 'Otsi artikleid…', searching: 'Otsimine…', nothing: 'Midagi ei leitud', fallback: 'Otsi väliselt:', langHint: 'Otsi algkeeli', error: 'Kohalik otsing pole saadaval.' },
        ga: { placeholder: 'Cuardaigh altanna…', searching: 'Ag cuardach…', nothing: 'Faoin tuaraim seo, níor aimsíodh aon rud', fallback: 'Cuardaigh go seachtrach:', langHint: 'Cuardaigh sa bhuntheanga', error: 'Tá cuardach loganta ar fáil.' },
        mt: { placeholder: 'Fittex artikli…', searching: 'Qed ifittex…', nothing: 'Sibtlebda xejn għal', fallback: 'Fittex barra:', langHint: 'Fittex fil-lingwa originali', error: 'Tfittxija lokali mhux disponibbli.' },
        eo: { placeholder: 'Serĉi artikolojn…', searching: 'Serĉado…', nothing: 'Nenio trovita por', fallback: 'Serĉi eksterne:', langHint: 'Serĉu en origina lingvo', error: 'Loka serĉo ne disponebla.' }
    };

    /* ---- Stop words per language ---- */
    var STOP_WORDS_UK = new Set([
        'і', 'в', 'на', 'що', 'який', 'це', 'та', 'не', 'але', 'як',
        'за', 'він', 'вона', 'воно', 'вони', 'ми', 'ви', 'я', 'то',
        'бути', 'мати', 'цей', 'той', 'свій', 'їхній', 'наш', 'ваш',
        'один', 'більше', 'менше', 'може', 'треба', 'тут', 'там',
        'де', 'коли', 'чому', 'бо', 'або', 'ні', 'так', 'ось',
        'лише', 'навіть', 'вже', 'ще', 'тільки', 'також', 'дуже',
        'якраз', 'саме', 'отже', 'проте', 'однак', 'зате', 'тобто',
        'тоді', 'зараз', 'потім', 'перед', 'після', 'між', 'через',
        'без', 'для', 'до', 'від', 'під', 'над', 'при', 'й',
        'його', 'її', 'їх', 'йому', 'їй', 'ним', 'нею', 'ними',
        'нього', 'ній', 'них', 'цього', 'цій', 'ці', 'ціх',
        'які', 'яких', 'якого', 'якій', 'яку', 'тим', 'того',
        'тій', 'ту', 'ті', 'тіх', 'себе', 'собі', 'собою',
        'такий', 'така', 'таке', 'такі', 'якось', 'десь', 'кудись',
        'звідки', 'звідкіля', 'скільки', 'чий', 'чия', 'чие', 'чьї'
    ]);

    var STOP_WORDS_EN = new Set([
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to',
        'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are',
        'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'shall',
        'can', 'need', 'dare', 'ought', 'used', 'this', 'that', 'these',
        'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me',
        'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
        'their', 'what', 'which', 'who', 'whom', 'where', 'when', 'why',
        'how', 'not', 'no', 'nor', 'if', 'then', 'than', 'too', 'very',
        'just', 'about', 'above', 'after', 'again', 'all', 'also', 'any',
        'because', 'before', 'between', 'both', 'each', 'few', 'more',
        'most', 'other', 'some', 'such', 'into', 'only', 'own', 'same',
        'so', 'still', 'while', 'being', 'during', 'through', 'until'
    ]);

    var STOP_WORDS_DE = new Set([
        'der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer',
        'und', 'oder', 'aber', 'in', 'an', 'auf', 'für', 'mit', 'von',
        'zu', 'bei', 'nach', 'über', 'unter', 'vor', 'zwischen', 'durch',
        'gegen', 'ohne', 'um', 'ist', 'sind', 'war', 'hat', 'haben',
        'wird', 'werden', 'kann', 'nicht', 'auch', 'noch', 'nur', 'schon',
        'wenn', 'dass', 'wie', 'was', 'wer', 'wo', 'warum', 'dann',
        'so', 'da', 'doch', 'denn', 'ja', 'nein', 'man', 'ich', 'du',
        'er', 'sie', 'es', 'wir', 'ihr', 'sich', 'mir', 'dir', 'ihn',
        'uns', 'euch', 'mein', 'dein', 'sein', 'ihr', 'unser', 'euer',
        'diese', 'dieser', 'dieses', 'jene', 'jener', 'jenes',
        'alle', 'alles', 'kein', 'keine', 'keiner', 'keines'
    ]);

    var STOP_WORDS_FR = new Set([
        'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'au', 'aux',
        'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
        'dont', 'où', 'quand', 'comment', 'pourquoi', 'est', 'sont',
        'a', 'ont', 'avait', 'été', 'être', 'avoir', 'fait', 'peut',
        'fait', 'comme', 'plus', 'très', 'aussi', 'encore', 'toujours',
        'jamais', 'rien', 'tout', 'tous', 'toute', 'toutes', 'chaque',
        'ce', 'cette', 'ces', 'cet', 'je', 'tu', 'il', 'elle', 'nous',
        'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'leur', 'leurs',
        'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
        'notre', 'nos', 'votre', 'vos', 'leur', 'leurs',
        'ne', 'pas', 'plus', 'moins', 'bien', 'peu', 'trop', 'si',
        'dans', 'sur', 'sous', 'avec', 'sans', 'par', 'pour', 'chez'
    ]);

    var STOP_WORDS_ES = new Set([
        'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de',
        'del', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'entre',
        'hasta', 'desde', 'contra', 'ante', 'bajo', 'a', 'y', 'o',
        'pero', 'sino', 'que', 'como', 'cuando', 'donde', 'quien',
        'cual', 'cuales', 'este', 'esta', 'estos', 'estas', 'ese',
        'esa', 'esos', 'esas', 'aquel', 'aquella', 'yo', 'tu', 'el',
        'ella', 'nosotros', 'vosotros', 'ellos', 'ellas', 'me', 'te',
        'se', 'le', 'les', 'mi', 'tu', 'su', 'mis', 'tus', 'sus',
        'nuestro', 'nuestra', 'vuestro', 'vuestra', 'no', 'si', 'mas',
        'muy', 'tambien', 'ya', 'aun', 'todo', 'toda', 'todos', 'todas',
        'cada', 'otro', 'otra', 'otros', 'otras', 'nada', 'algo',
        'es', 'son', 'ha', 'han', 'fue', 'ser', 'haber', 'hacer',
        'estar', 'tener', 'poder', 'decir', 'ir', 'venir'
    ]);

    var STOP_WORDS_PL = new Set([
        'i', 'w', 'na', 'do', 'z', 'nie', 'że', 'to', 'co', 'jak',
        'ale', 'za', 'od', 'tak', 'już', 'czy', 'ten', 'ta', 'te',
        'być', 'jest', 'są', 'ma', 'ma', 'tylko', 'bardzo', 'też',
        'jeszcze', 'może', 'przez', 'przed', 'po', 'między', 'bez',
        'dla', 'od', 'przy', 'pod', 'nad', 'ja', 'ty', 'on', 'ona',
        'my', 'wy', 'oni', 'one', 'mnie', 'ciebie', 'jego', 'jej',
        'nas', 'was', 'ich', 'mój', 'twój', 'jego', 'jej', 'nasz',
        'wasz', 'ich', 'ten', 'ta', 'to', 'ci', 'te', 'tamten',
        'wszystko', 'każdy', 'każda', 'każde', 'żaden', 'żadna',
        'coś', 'ktoś', 'gdzieś', 'kiedyś', 'nigdy', 'zawsze',
        'jeszcze', 'już', 'teraz', 'potem', 'potem', 'przedtem'
    ]);

    var STOP_WORDS_IT = new Set([
        'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una',
        'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra',
        'e', 'o', 'ma', 'che', 'non', 'chi', 'cui', 'quando', 'dove',
        'come', 'perché', 'cosa', 'è', 'sono', 'ha', 'hanno', 'era',
        'essere', 'avere', 'fare', 'dire', 'andare', 'venire', 'stare',
        'molto', 'anche', 'ancora', 'già', 'sempre', 'mai', 'niente',
        'tutto', 'tutti', 'tutta', 'tutte', 'ogni', 'altro', 'altra',
        'altri', 'altre', 'io', 'tu', 'lui', 'lei', 'noi', 'voi',
        'loro', 'mi', 'ti', 'ci', 'vi', 'si', 'me', 'te', 'ce',
        'mio', 'tuo', 'suo', 'nostro', 'vostro', 'loro', 'questo',
        'questa', 'questi', 'queste', 'quello', 'quella', 'quelli',
        'più', 'meno', 'bene', 'male', 'sì', 'no', 'forse', 'proprio'
    ]);

    var STOP_WORDS_PT = new Set([
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de',
        'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
        'com', 'por', 'para', 'sem', 'sobre', 'entre', 'até', 'desde',
        'e', 'ou', 'mas', 'que', 'como', 'quando', 'onde', 'quem',
        'qual', 'quais', 'este', 'esta', 'estes', 'estas', 'esse',
        'essa', 'esses', 'essas', 'aquele', 'aquela', 'eu', 'tu',
        'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'me', 'te',
        'se', 'lhe', 'lhes', 'meu', 'teu', 'seu', 'nosso', 'vosso',
        'não', 'sim', 'também', 'já', 'ainda', 'sempre', 'nunca',
        'muito', 'pouco', 'mais', 'menos', 'todo', 'toda', 'todos',
        'todas', 'cada', 'outro', 'outra', 'outros', 'outras',
        'é', 'são', 'tem', 'têm', 'foi', 'ser', 'ter', 'estar',
        'fazer', 'dizer', 'ir', 'vir', 'poder', 'saber'
    ]);

    var STOP_WORDS_NL = new Set([
        'de', 'het', 'een', 'van', 'in', 'op', 'met', 'voor', 'door',
        'aan', 'over', 'uit', 'bij', 'naar', 'tot', 'zonder', 'onder',
        'en', 'of', 'maar', 'want', 'dus', 'dat', 'die', 'dit',
        'wat', 'wie', 'waar', 'wanneer', 'hoe', 'waarom', 'is',
        'zijn', 'was', 'hebben', 'heeft', 'had', 'kan', 'zou', 'zal',
        'niet', 'ook', 'nog', 'al', 'veel', 'heel', 'meer', 'minder',
        'ik', 'jij', 'hij', 'zij', 'wij', 'jullie', 'hen', 'hun',
        'hem', 'haar', 'ons', 'hun', 'mijn', 'jouw', 'zijn', 'haar',
        'onze', 'jullie', 'alle', 'elk', 'elke', 'ieder', 'iets',
        'niets', 'altijd', 'nooit', 'soms', 'hier', 'daar', 'toen'
    ]);

    var STOP_WORDS_SV = new Set([
        'och', 'i', 'att', 'en', 'det', 'som', 'är', 'av', 'för',
        'med', 'den', 'till', 'på', 'har', 'de', 'inte', 'ett',
        'om', 'var', 'men', 'kan', 'ska', 'från', 'vid', 'över',
        'efter', 'under', 'mellan', 'genom', 'mot', 'utan', 'före',
        'jag', 'du', 'han', 'hon', 'vi', 'ni', 'de', 'mig', 'dig',
        'honom', 'henne', 'oss', 'er', 'dem', 'min', 'din', 'hans',
        'hennes', 'vår', 'er', 'deras', 'detta', 'denna', 'dessa',
        'allt', 'alla', 'varje', 'inget', 'inga', 'något', 'några',
        'också', 'redan', 'ändå', 'alltid', 'aldrig', 'mycket',
        'mer', 'minst', 'bara', 'helt', 'bara', 'just', 'nu', 'då'
    ]);

    var STOP_WORDS_DA = new Set([
        'og', 'i', 'at', 'en', 'det', 'som', 'er', 'af', 'for',
        'med', 'den', 'til', 'på', 'har', 'de', 'ikke', 'et',
        'om', 'var', 'men', 'kan', 'skal', 'fra', 'ved', 'over',
        'efter', 'under', 'mellem', 'gennem', 'mod', 'uden', 'før',
        'jeg', 'du', 'han', 'hun', 'vi', 'I', 'de', 'mig', 'dig',
        'ham', 'hende', 'os', 'jer', 'dem', 'min', 'din', 'hans',
        'hendes', 'vores', 'jeres', 'deres', 'denne', 'disse',
        'alt', 'alle', 'hvert', 'ingenting', 'ingenting', 'noget',
        'nogle', 'også', 'allerede', 'dog', 'altid', 'aldrig',
        'meget', 'mere', 'mindst', 'bare', 'helt', 'lige', 'nu', 'så'
    ]);

    var STOP_WORDS_FI = new Set([
        'ja', 'on', 'ei', 'se', 'että', 'tai', 'kun', 'niin',
        'kuin', 'myös', 'vain', 'jos', 'kuitenkin', 'sillä', 'koska',
        'vaikka', 'mikä', 'joka', 'mikä', 'missä', 'milloin', 'miten',
        'miksi', 'minä', 'sinä', 'hän', 'me', 'te', 'he', 'tämä',
        'tuo', 'se', 'nämä', 'nuo', 'ne', 'oma', 'meidän', 'teidän',
        'heidän', 'minun', 'sinun', 'hänen', 'ei', 'ole', 'olla',
        'olla', 'olla', 'olla', 'olla', 'olla', 'olla', 'olla',
        'olla', 'olla', 'olla', 'olla', 'olla', 'olla', 'olla',
        'olla', 'olla', 'olla', 'olla', 'olla', 'olla', 'olla',
        'olla', 'olla', 'olla', 'olla', 'olla', 'olla', 'olla'
    ]);

    var STOP_WORDS_EL = new Set([
        'και', 'το', 'το', 'η', 'ο', 'τα', 'οι', 'τις', 'τους',
        'ένα', 'μια', 'σε', 'με', 'για', 'από', 'ως', 'προς',
        'μετά', 'πριν', 'χωρίς', 'μεταξύ', 'κατά', 'πάνω', 'κάτω',
        'αλλά', 'ή', 'όμως', 'λοιπόν', 'επομένως', 'είναι', 'ήταν',
        'έχει', 'έχουν', 'ήταν', 'να', 'που', 'ποιο', 'ποια', 'ποιοι',
        'πού', 'πότε', 'πώς', 'γιατί', 'εγώ', 'εσύ', 'αυτός', 'αυτή',
        'εμείς', 'εσείς', 'αυτοί', 'μου', 'σου', 'του', 'της', 'μας',
        'σας', 'τους', 'μη', 'δεν', 'θα', 'να', 'πολύ', 'πιο',
        'πάρα', 'λίγο', 'αρκετά', 'πολλά', 'όλα', 'κάθε', 'κανένα',
        'τίποτα', 'κάτι', 'κανείς', 'πάντα', 'ποτέ', 'συχνά'
    ]);

    var STOP_WORDS_HU = new Set([
        'és', 'a', 'az', 'egy', 'is', 'nem', 'hogy', 'van', 'volt',
        'lesz', 'lett', 'lehet', 'kellett', 'kell', 'meg', 'csak',
        'már', 'még', 'ha', 'de', 'mert', 'így', 'úgy', 'ahogy',
        'ami', 'aki', 'ahol', 'amikor', 'miért', 'hogyan', 'milyen',
        'én', 'te', 'ő', 'mi', 'ti', 'ők', 'engem', 'téged', 'őt',
        'minket', 'titeket', 'őket', 'nekem', 'neked', 'neki', 'az',
        'ez', 'amaz', 'ettől', 'ettől', 'attól', 'abban', 'ebben',
        'ott', 'itt', 'ahol', 'minden', 'mindenki', 'semmi', 'valami',
        'senki', 'valaki', 'sehol', 'valahol', 'soha', 'mindig',
        'néha', 'több', 'kevesebb', 'nagyon', 'igen', 'nem', 'persze'
    ]);

    var STOP_WORDS_RO = new Set([
        'și', 'în', 'de', 'la', 'cu', 'pe', 'din', 'pentru', 'ca',
        'sau', 'dar', 'că', 'care', 'ce', 'cum', 'unde', 'când',
        'de ce', 'cine', 'este', 'sunt', 'a', 'au', 'fost', 'fi',
        'avea', 'era', 'vor', 'poate', 'trebuie', 'să', 'nu', 'da',
        'și', 'mai', 'deja', 'încă', 'tot', 'toți', 'toate', 'fiecare',
        'altul', 'alta', 'alții', 'altele', 'eu', 'tu', 'el', 'ea',
        'noi', 'voi', 'ei', 'ele', 'meu', 'tău', 'său', 'nostru',
        'vostru', 'lor', 'acest', 'această', 'acești', 'aceste',
        'foarte', 'mult', 'puțin', 'mai', 'cel mai', 'așa', 'aici',
        'acolo', 'atunci', 'apoi', 'mereu', 'niciodată', 'nimic',
        'ceva', 'cineva', 'undeva', 'cândva', 'oriunde'
    ]);

    var STOP_WORDS_SK = new Set([
        'a', 'v', 'na', 'do', 'z', 'nie', 'že', 'to', 'čo', 'ako',
        'ale', 'za', 'od', 'tak', 'už', 'či', 'ten', 'tá', 'to',
        'byť', 'je', 'sú', 'má', 'mať', 'len', 'veľmi', 'tiež',
        'ešte', 'môže', 'cez', 'pred', 'po', 'medzi', 'bez',
        'pre', 'pri', 'pod', 'nad', 'ja', 'ty', 'on', 'ona',
        'my', 'vy', 'oni', 'ma', 'ťa', 'ho', 'ju', 'nás', 'vás',
        'ich', 'môj', 'tvoj', 'jeho', 'jej', 'náš', 'váš', 'ich',
        'tento', 'táto', 'toto', 'tí', 'tie', 'tamten',
        'všetko', 'každý', 'každá', 'každé', 'žiadny', 'žiadna',
        'niečo', 'niekto', 'niekde', 'niekedy', 'nikdy', 'vždy'
    ]);

    var STOP_WORDS_BG = new Set([
        'и', 'в', 'на', 'да', 'се', 'е', 'за', 'от', 'по', 'са',
        'се', 'не', 'но', 'ще', 'като', 'при', 'след', 'между',
        'без', 'до', 'под', 'над', 'след', 'преди', 'аз', 'ти',
        'той', 'тя', 'ние', 'вие', 'те', 'мен', 'теб', 'него',
        'нея', 'нас', 'вас', 'тях', 'мой', 'твой', 'негов', 'неин',
        'наш', 'ваш', 'тех', 'този', 'тази', 'това', 'тези',
        'всичко', 'всеки', 'всяка', 'никой', 'никоя', 'нищо',
        'нещо', 'някой', 'някоя', 'винаги', 'никога', 'понякога',
        'много', 'малко', 'повече', 'по-малко', 'също', 'вече',
        'още', 'само', 'точно', 'може', 'трябва', 'ако', 'когато'
    ]);

    var STOP_WORDS_HR = new Set([
        'i', 'u', 'na', 'da', 'se', 'je', 'za', 'od', 'po', 'sa',
        'ne', 'ali', 'što', 'kako', 'kada', 'gdje', 'tko', 'koji',
        'koja', 'koje', 'iz', 'do', 'pod', 'nad', 'pred', 'između',
        'bez', 'bio', 'bila', 'bilo', 'bili', 'biti', 'ima', 'imaju',
        'sam', 'si', 'smo', 'ste', 'su', 'me', 'te', 'ga', 'ju',
        'nas', 'vas', 'ih', 'moj', 'tvoj', 'njegov', 'njezin',
        'naš', 'vaš', 'njihov', 'ovo', 'ova', 'ovi', 'ove',
        'sve', 'svaki', 'svaka', 'svako', 'nitko', 'ništa',
        'nešto', 'netko', 'uvijek', 'nikad', 'ponekad',
        'vrlo', 'jako', 'više', 'manje', 'samo', 'već', 'još'
    ]);

    var STOP_WORDS_SL = new Set([
        'in', 'v', 'na', 'da', 'je', 'za', 'od', 'po', 'z', 'se',
        'ne', 'ali', 'ki', 'kako', 'kje', 'kdo', 'kateri', 'kar',
        'iz', 'do', 'pod', 'nad', 'pred', 'med', 'brez', 'bil',
        'bila', 'bilo', 'bili', 'biti', 'ima', 'imajo', 'sem',
        'si', 'smo', 'ste', 'so', 'me', 'te', 'ga', 'jo', 'nas',
        'vas', 'jih', 'moj', 'tvoj', 'njegov', 'njen', 'naš',
        'vaš', 'njihov', 'to', 'ta', 'ti', 'te', 'tisto',
        'vse', 'vsak', 'vsaka', 'vsako', 'nihče', 'nič',
        'nekaj', 'nekdo', 'vedno', 'nikoli', 'včasih',
        'zelo', 'bolj', 'manj', 'samo', 'že', 'še', 'tudi'
    ]);

    var STOP_WORDS_LT = new Set([
        'ir', 'į', 'kad', 'yra', 'buvo', 'bus', 'turi', 'turėti',
        'būti', 'galima', 'reikia', 'taip', 'ne', 'bet', 'o', 'ar',
        'kaip', 'kur', 'kada', 'kodėl', 'kas', 'kuris', 'kuri',
        'kuriuo', 'iš', 'į', 'per', 'po', 'prie', 'ant', 'be',
        'po', 'tarp', 'aš', 'tu', 'jis', 'ji', 'mes', 'jūs', 'jie',
        'jos', 'man', 'tavęs', 'jo', 'jos', 'mūsų', 'jūsų', 'jų',
        'mano', 'tavo', 'jo', 'jos', 'mūsų', 'jūsų', 'jų',
        'tas', 'ta', 'tai', 'tie', 'tos', 'viskas', 'kiekvienas',
        'niekas', 'nieko', 'kažkas', 'kažkur', 'visada', 'niekada',
        'kartais', 'labai', 'daug', 'mažai', 'daugiau', 'mažiau',
        'tik', 'jau', 'dar', 'tik', 'net', 'gi', 'o'
    ]);

    var STOP_WORDS_LV = new Set([
        'un', 'ir', 'ka', 'ar', 'no', 'par', 'uz', 'bet', 'ne',
        'lai', 'kas', 'kur', 'kad', 'kā', 'kāpēc', 'tikai', 'arī',
        'vēl', 'jau', 'tik', 'gan', 'būt', 'bija', 'būs', 'ir',
        'būtu', 'var', 'varbūt', 'vajag', 'es', 'tu', 'viņš', 'viņa',
        'mēs', 'jūs', 'viņi', 'viņas', 'man', 'tev', 'viņam', 'viņai',
        'mums', 'jums', 'viņiem', 'mans', 'tavs', 'viņa', 'mūsu',
        'jūsu', 'viņu', 'šis', 'šī', 'šie', 'šīs', 'tas', 'tā',
        'tie', 'tās', 'viss', 'visa', 'visi', 'visas', 'katrs',
        'katra', 'neviens', 'nekas', 'kaut kas', 'kaut kur',
        'vienmēr', 'nekad', 'dažreiz', 'ļoti', 'daudz', 'maz',
        'vairāk', 'mazāk', 'tikai', 'jau', 'vēl', 'gan'
    ]);

    var STOP_WORDS_ET = new Set([
        'ja', 'on', 'ei', 'see', 'et', 'kas', 'aga', 'kui', 'või',
        'kas', 'kuidas', 'kus', 'millal', 'miks', 'kes', 'mis',
        'oma', 'tema', 'nende', 'see', 'see', 'see', 'kõik',
        'iga', 'ükski', 'midagi', 'keegi', 'kusagil', 'alati',
        'mitte kunagi', 'vahel', 'väga', 'palju', 'vähe', 'rohkem',
        'vähem', 'ainult', 'juba', 'veel', 'ka', 'siis', 'nüüd',
        'ma', 'sina', 'tema', 'meie', 'teie', 'nemad', 'mind',
        'sind', 'teda', 'meid', 'teid', 'neid', 'minu', 'sinu',
        'tema', 'meie', 'teie', 'nende', 'mul', 'sul', 'tal',
        'meil', 'teil', 'neil', 'olema', 'ole', 'olid', 'olnud',
        'saama', 'sai', 'saanud', 'pidama', 'pidi', 'pidanud'
    ]);

    var STOP_WORDS_GA = new Set([
        'is', 'ní', 'go', 'ar', 'ag', 'le', 'do', 'sa', 'san',
        'an', 'na', 'agus', 'nó', 'ach', 'mar', 'má', 'más',
        'níos', 'ár', 'bhfuil', 'níl', 'tá', 'beidh', 'bheadh',
        'd', 'dhá', 's', 'gs', 'a', 'ár', 'ár', 'ár',
        'mise', 'túse', 'éise', 'íse', 'sinnse', 'sibhse', 'siadsan',
        'mo', 'do', 'a', 'ár', 'bhur', 'a', 'an', 'na',
        'gach', 'uile', 'aon', 'rud', 'ar', 'bhfuil',
        'anseo', 'ansin', 'cathain', 'cá', 'cén', 'conas',
        'cad', 'leis', 'le', 'ag', 'ar', 'do', 'as', ' trí',
        'i', 'ann', 'inti', 'iontu', 'ionainn', 'ionat', 'oraibh',
        'go', 'go', 'níos', 'is', 'roimh', 'i', 'tar'
    ]);

    var STOP_WORDS_MT = new Set([
        'u', 'f', 'tal', 'huwa', 'hiya', 'aħna', 'intom', 'huma',
        ' perme', 'me', 'mhux', 'imma', 'jekk', 'meta', 'fejn',
        'għaliex', 'kif', 'min', 'li', 'minn', 'bi', 'għal',
        'fuq', 'taħt', 'wara', 'qabel', 'bejn', 'bla', 'mal',
        'jew', 'u', 'filwaqt', 'għax', 'allura', 'anke', 'diġà',
        'għadu', 'dejjem', 'qatt', 'kultant', 'ħafna', 'ftit',
        'aktar', 'anqas', 'biss', 'xejn', 'xi ħaġa', 'minn',
        'tagħna', 'tiegħek', 'tiegħu', 'tagħhom', 'dak', 'dik',
        'dawk', 'din', 'il-', 'waħda', 'kull', 'ebda', 'xejn'
    ]);

    var STOP_WORDS_EO = new Set([
        'kaj', 'en', 'la', 'unu', 'estas', 'de', 'por', 'al', 'da',
        'sed', 'aŭ', 'ke', 'kiel', 'kie', 'kiam', 'kial', 'kio',
        'kiu', 'tio', 'tiu', 'ĉi', 'nenio', 'neniu', 'io', 'iu',
        'ĉio', 'ĉiu', 'ĝi', 'li', 'ŝi', 'ni', 'vi', 'ili',
        'min', 'vin', 'lin', 'ŝin', 'nin', 'vin', 'ilin',
        'mia', 'via', 'lia', 'ŝia', 'nia', 'via', 'ilia',
        'tiu', 'tio', 'ĉi', 'tiel', 'tiam', 'tie', 'tiel',
        'pli', 'malpli', 'tre', 'jam', 'ankoraŭ', 'nur',
        'ankaŭ', 'eble', 'certe', 'certe', 'tre', 'iom',
        'neniam', 'ĉiam', 'ofte', 'malofte', 'nun', 'poste',
        'tuj', 'baldaŭ', 'hodiaŭ', 'hieraŭ', 'morgan'
    ]);

    var STOP_WORDS_MAP = {
        uk: STOP_WORDS_UK, en: STOP_WORDS_EN, de: STOP_WORDS_DE,
        fr: STOP_WORDS_FR, es: STOP_WORDS_ES, it: STOP_WORDS_IT,
        pt: STOP_WORDS_PT, nl: STOP_WORDS_NL, pl: STOP_WORDS_PL,
        cs: STOP_WORDS_SV, sv: STOP_WORDS_SV, da: STOP_WORDS_DA,
        fi: STOP_WORDS_FI, el: STOP_WORDS_EL, hu: STOP_WORDS_HU,
        ro: STOP_WORDS_RO, sk: STOP_WORDS_SK, bg: STOP_WORDS_BG,
        hr: STOP_WORDS_HR, sl: STOP_WORDS_SL, lt: STOP_WORDS_LT,
        lv: STOP_WORDS_LV, et: STOP_WORDS_ET, ga: STOP_WORDS_GA,
        mt: STOP_WORDS_MT, eo: STOP_WORDS_EO
    };

    function currentBase() {
        return /\/articles\//.test(window.location.pathname) ? '../' : '';
    }

    function getActiveLang() {
        if (window.SiteTranslate && window.SiteTranslate.getLang) {
            return window.SiteTranslate.getLang();
        }
        var match = document.cookie.match(/(^| )googtrans=([^;]+)/);
        if (match && match[2] && match[2] !== '' && match[2] !== '/uk') {
            return match[2].replace('/uk', '');
        }
        return '';
    }

    function getUIStrings() {
        var lang = getActiveLang();
        return UI[lang] || UI.en;
    }

    function getStopWords() {
        var lang = getActiveLang();
        return STOP_WORDS_MAP[lang] || STOP_WORDS_UK;
    }

    function ensureData(cb) {
        if (window.USL_ARCHIVE) { cb(window.USL_ARCHIVE); return; }
        var s = document.createElement('script');
        s.src = currentBase() + 'js/archive-data.js';
        s.onload = function() { cb(window.USL_ARCHIVE || []); };
        s.onerror = function() { cb([]); };
        document.head.appendChild(s);
    }

    function fingerprint(archive, lang) {
        if (!archive.length) return lang + ':';
        return lang + ':' + archive.length + ':' + archive[0].url + ':' + archive[archive.length - 1].url;
    }

    /* ---- IndexedDB helpers ---- */
    function idbOpen() {
        return new Promise(function(resolve, reject) {
            if (!window.indexedDB) { reject(new Error('no idb')); return; }
            var req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function() {
                var db = req.result;
                if (!db.objectStoreNames.contains(DB_UK_STORE)) db.createObjectStore(DB_UK_STORE, { keyPath: 'url' });
                if (!db.objectStoreNames.contains(DB_TRANS_STORE)) db.createObjectStore(DB_TRANS_STORE, { keyPath: 'id' });
                if (!db.objectStoreNames.contains(DB_META_STORE)) db.createObjectStore(DB_META_STORE, { keyPath: 'key' });
            };
            req.onsuccess = function() { resolve(req.result); };
            req.onerror = function() { reject(req.error); };
        });
    }

    function idbAll(db, store) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(store, 'readonly');
            var req = tx.objectStore(store).getAll();
            req.onsuccess = function() { resolve(req.result || []); };
            req.onerror = function() { reject(req.error); };
        });
    }

    function idbGetMeta(db, key) {
        return new Promise(function(resolve) {
            var tx = db.transaction(DB_META_STORE, 'readonly');
            var req = tx.objectStore(DB_META_STORE).get(key);
            req.onsuccess = function() { resolve(req.result ? req.result.value : null); };
            req.onerror = function() { resolve(null); };
        });
    }

    function idbPutMeta(db, key, value) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(DB_META_STORE, 'readwrite');
            tx.objectStore(DB_META_STORE).put({ key: key, value: value });
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function() { reject(tx.error); };
        });
    }

    function idbPutAll(db, items, store) {
        return new Promise(function(resolve, reject) {
            var tx = db.transaction(store, 'readwrite');
            var s = tx.objectStore(store);
            s.clear();
            items.forEach(function(i) { s.put(i); });
            tx.oncomplete = function() { resolve(); };
            tx.onerror = function() { reject(tx.error); };
        });
    }

    function stripNoise(doc) {
        var cloned = doc.cloneNode(true);
        var remove = cloned.querySelectorAll('script, style, nav, footer, header, .page-header, .article-header-simple, .article-widgets, .article-footer, #site-header, #site-footer, .skip-link');
        remove.forEach(function(el) { el.remove(); });
        return cloned;
    }

    function extractText(html) {
        try {
            var doc = new DOMParser().parseFromString(html, 'text/html');
            var cleaned = stripNoise(doc);
            var article = cleaned.querySelector('article') ||
                          cleaned.querySelector('main .article-content') ||
                          cleaned.querySelector('main');
            var text = (article ? article.textContent : '') || '';
            return text.replace(/\s+/g, ' ').trim();
        } catch (e) { return ''; }
    }

    function transProxyURL(originalURL, lang) {
        var full = window.location.origin + '/' + originalURL;
        return 'https://' + window.location.hostname.replace(/\./g, '-') + '.translate.goog/' +
               originalURL + '?_x_tr_sl=uk&_x_tr_tl=' + lang + '&_x_tr_hl=' + lang;
    }

    function buildIndex() {
        if (building) return building;
        building = new Promise(function(resolve) {
            ensureData(function(archive) {
                if (!archive.length) { resolve({ uk: [], trans: [] }); return; }
                var lang = getActiveLang();
                var ukItems = [];
                var transItems = [];
                var done = 0;
                var total = lang ? archive.length * 2 : archive.length;

                archive.forEach(function(a, idx) {
                    var url = currentBase() + a.url;
                    fetch(url, { credentials: 'same-origin' }).then(function(r) {
                        return r.ok ? r.text() : '';
                    }).catch(function() { return ''; }).then(function(html) {
                        var txt = extractText(html);
                        if (!txt) {
                            txt = [a.title, a.description, a.tag, a.date].filter(Boolean).join(' ');
                        }
                        ukItems.push({
                            url: a.url, title: a.title || '', tag: a.tag || '',
                            date: a.date || '', minutes: a.minutes || 0,
                            description: a.description || '', text: txt, idx: idx
                        });
                        done++;
                        if (done === total) finish();
                    });

                    if (lang) {
                        var proxyUrl = transProxyURL(a.url, lang);
                        fetch(proxyUrl).then(function(r) {
                            return r.ok ? r.text() : '';
                        }).catch(function() { return ''; }).then(function(html) {
                            var txt = extractText(html);
                            if (!txt) {
                                txt = [a.title, a.description, a.tag, a.date].filter(Boolean).join(' ');
                            }
                            transItems.push({
                                id: lang + ':' + a.url, url: a.url, lang: lang,
                                title: a.title || '', tag: a.tag || '',
                                date: a.date || '', minutes: a.minutes || 0,
                                description: a.description || '', text: txt, idx: idx
                            });
                            done++;
                            if (done === total) finish();
                        });
                    }
                });

                function finish() {
                    var pUK = persistUK(ukItems, archive);
                    if (lang && transItems.length) {
                        pUK.then(function() { return persistTrans(transItems, archive, lang); })
                           .then(function() { resolve({ uk: ukItems, trans: transItems }); })
                           .catch(function() { resolve({ uk: ukItems, trans: transItems }); });
                    } else {
                        pUK.then(function() { resolve({ uk: ukItems, trans: [] }); })
                           .catch(function() { resolve({ uk: ukItems, trans: [] }); });
                    }
                }
            });
        });
        return building;
    }

    function persistUK(items, archive) {
        return idbOpen().then(function(db) {
            return idbPutAll(db, items, DB_UK_STORE).then(function() {
                return idbPutMeta(db, 'fingerprint_uk', fingerprint(archive, 'uk'));
            }).then(function() { db.close(); });
        }).catch(function() {});
    }

    function persistTrans(items, archive, lang) {
        return idbOpen().then(function(db) {
            return idbPutAll(db, items, DB_TRANS_STORE).then(function() {
                return idbPutMeta(db, 'fingerprint_trans_' + lang, fingerprint(archive, lang));
            }).then(function() { db.close(); });
        }).catch(function() {});
    }

    function loadIndex() {
        if (ukMemory) return Promise.resolve({ uk: ukMemory, trans: transMemory || [] });
        var lang = getActiveLang();
        return idbOpen().then(function(db) {
            return Promise.all([
                idbGetMeta(db, 'fingerprint_uk'),
                idbAll(db, DB_UK_STORE),
                lang ? idbGetMeta(db, 'fingerprint_trans_' + lang) : Promise.resolve(null),
                lang ? idbAll(db, DB_TRANS_STORE).then(function(items) {
                    return items.filter(function(i) { return i.lang === lang; });
                }) : Promise.resolve([])
            ]).then(function(results) {
                db.close();
                return { storedFpUK: results[0], ukItems: results[1], storedFpTrans: results[2], transItems: results[3] };
            });
        }).then(function(result) {
            return new Promise(function(resolve) {
                ensureData(function(archive) {
                    var currentFpUK = fingerprint(archive, 'uk');
                    var ukOk = result.storedFpUK === currentFpUK && result.ukItems.length;
                    var transOk = lang && result.storedFpTrans === fingerprint(archive, lang) && result.transItems.length;

                    if (ukOk) {
                        ukMemory = result.ukItems;
                        transMemory = transOk ? result.transItems : [];
                        resolve({ uk: ukMemory, trans: transMemory });
                    } else {
                        building = null;
                        buildIndex().then(function(data) { resolve(data); });
                    }
                });
            });
        }).catch(function() {
            building = null;
            return buildIndex();
        });
    }

    function isWordBoundary(text, idx, len) {
        if (idx > 0 && /\w/.test(text[idx - 1])) return false;
        var end = idx + len;
        if (end < text.length && /\w/.test(text[end])) return false;
        return true;
    }

    function score(doc, tokens) {
        var s = 0;
        var tl = doc.title.toLowerCase();
        var tagl = doc.tag.toLowerCase();
        var dl = (doc.description || '').toLowerCase();
        var body = doc.text.toLowerCase();
        tokens.forEach(function(t) {
            if (tl.indexOf(t) !== -1) {
                s += 10;
                if (isWordBoundary(tl, tl.indexOf(t), t.length)) s += 5;
            }
            if (tagl.indexOf(t) !== -1) s += 6;
            if (dl.indexOf(t) !== -1) {
                s += 4;
                if (isWordBoundary(dl, dl.indexOf(t), t.length)) s += 2;
            }
            var idx = 0;
            var count = 0;
            while (count < 5 && (idx = body.indexOf(t, idx)) !== -1) {
                count++;
                if (isWordBoundary(body, idx, t.length)) s += 2;
                else s += 1;
                idx += t.length;
            }
            var bodyWords = body.split(/\s+/);
            for (var w = 0; w < bodyWords.length; w++) {
                if (bodyWords[w].indexOf(t) === 0 && bodyWords[w].length > t.length) {
                    s += 3;
                    break;
                }
            }
        });
        s += Math.max(0, (21 - (doc.idx || 0)) * 0.3);
        return s;
    }

    function highlight(text, tokens) {
        if (!tokens.length) return esc(text);
        var lower = text.toLowerCase();
        var segments = [];
        var pos = 0;
        while (pos < text.length) {
            var bestIdx = -1;
            var bestLen = 0;
            tokens.forEach(function(t) {
                var found = lower.indexOf(t, pos);
                if (found !== -1 && (bestIdx === -1 || found < bestIdx)) {
                    bestIdx = found;
                    bestLen = t.length;
                }
            });
            if (bestIdx === -1) {
                segments.push(esc(text.slice(pos)));
                break;
            }
            if (bestIdx > pos) segments.push(esc(text.slice(pos, bestIdx)));
            segments.push('<mark>' + esc(text.slice(bestIdx, bestIdx + bestLen)) + '</mark>');
            pos = bestIdx + bestLen;
        }
        return segments.join('');
    }

    function snippet(doc, tokens) {
        var body = doc.text || '';
        var low = body.toLowerCase();
        var bestIdx = -1;
        tokens.forEach(function(t) {
            var found = low.indexOf(t);
            if (found !== -1 && (bestIdx === -1 || found < bestIdx)) {
                bestIdx = found;
            }
        });
        if (bestIdx !== -1) {
            var start = Math.max(0, bestIdx - 80);
            var end = Math.min(body.length, bestIdx + 140);
            var chunk = body.slice(start, end).trim();
            var prefix = start > 0 ? '…' : '';
            var suffix = end < body.length ? '…' : '';
            return prefix + highlight(chunk, tokens) + suffix;
        }
        return esc((doc.description || '').slice(0, 180));
    }

    function runSearch(q, data) {
        var stopWords = getStopWords();
        var tokens = q.toLowerCase().split(/\s+/).filter(function(t) {
            return t.length >= 1 && !stopWords.has(t);
        });
        if (!tokens.length) return [];

        var docs = data.uk;
        var results = docs.map(function(d) { return { d: d, s: score(d, tokens) }; })
            .filter(function(x) { return x.s > 0; })
            .sort(function(a, b) { return b.s - a.s; })
            .slice(0, 20);

        if (data.trans && data.trans.length && results.length < 5) {
            var transResults = data.trans.map(function(d) { return { d: d, s: score(d, tokens) * 0.9 }; })
                .filter(function(x) { return x.s > 0; });
            var seen = {};
            results.forEach(function(r) { seen[r.d.url] = true; });
            transResults.forEach(function(r) {
                if (!seen[r.d.url]) {
                    results.push(r);
                    seen[r.d.url] = true;
                }
            });
            results.sort(function(a, b) { return b.s - a.s; });
            results = results.slice(0, 20);
        }

        return results.map(function(x) { return x.d; });
    }

    /* ---- overlay ---- */
    function ensureOverlay() {
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.className = 'search-overlay';
        overlay.id = 'search-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML =
            '<div class="search-box">' +
            '  <div class="search-head">' +
            '    <button type="button" class="search-tab active" data-tab="search">Пошук</button>' +
            '    <button type="button" class="search-tab" data-tab="bookmarks">Закладки</button>' +
            '    <button type="button" class="search-close" id="search-close" aria-label="Закрити">&times;</button>' +
            '  </div>' +
            '  <input type="search" id="search-input" class="search-input" placeholder="Пошук по статтях…" autocomplete="off" aria-label="Пошук">' +
            '  <div id="search-lang-hint" class="search-lang-hint" hidden></div>' +
            '  <div id="search-results" class="search-results" role="listbox"></div>' +
            '  <div id="bookmarks-panel" class="bookmarks-panel" hidden></div>' +
            '</div>';
        document.body.appendChild(overlay);

        overlay.querySelector('#search-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });

        overlay.querySelectorAll('.search-tab').forEach(function(t) {
            t.addEventListener('click', function() {
                overlay.querySelectorAll('.search-tab').forEach(function(x) { x.classList.remove('active'); });
                t.classList.add('active');
                switchTab(t.dataset.tab);
            });
        });

        var input = overlay.querySelector('#search-input');
        var debounce = null;
        input.addEventListener('input', function() {
            clearTimeout(debounce);
            debounce = setTimeout(function() { doSearch(input.value.trim()); }, 180);
        });
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') close();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.getAttribute('aria-hidden') === 'false') close();
        });

        window.addEventListener('usl-bookmarks', function() {
            if (overlay.getAttribute('aria-hidden') === 'false' &&
                overlay.querySelector('.search-tab.active').dataset.tab === 'bookmarks') {
                renderBookmarks();
            }
        });

        return overlay;
    }

    function applyUILang() {
        if (!overlay) return;
        var ui = getUIStrings();
        var lang = getActiveLang();
        var input = overlay.querySelector('#search-input');
        var hint = overlay.querySelector('#search-lang-hint');
        if (input) input.placeholder = ui.placeholder;
        if (hint) {
            if (ui.langHint && lang) {
                hint.textContent = ui.langHint;
                hint.hidden = false;
            } else {
                hint.hidden = true;
            }
        }
    }

    function switchTab(tab) {
        var results = overlay.querySelector('#search-results');
        var bookmarks = overlay.querySelector('#bookmarks-panel');
        if (tab === 'bookmarks') {
            results.hidden = true;
            bookmarks.hidden = false;
            renderBookmarks();
        } else {
            results.hidden = false;
            bookmarks.hidden = true;
            doSearch(overlay.querySelector('#search-input').value.trim());
        }
    }

    function renderBookmarks() {
        window.Bookmarks.renderInto(overlay.querySelector('#bookmarks-panel'));
    }

    function open(tab) {
        var ov = ensureOverlay();
        applyUILang();
        ov.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (tab === 'bookmarks') {
            ov.querySelectorAll('.search-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === 'bookmarks');
            });
            switchTab('bookmarks');
        } else {
            ov.querySelectorAll('.search-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.tab === 'search');
            });
            var input = ov.querySelector('#search-input');
            input.value = '';
            setTimeout(function() { input.focus(); }, 30);
            switchTab('search');
        }
    }

    function close() {
        if (!overlay) return;
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function doSearch(q) {
        var box = overlay.querySelector('#search-results');
        var ui = getUIStrings();
        if (!q) { box.innerHTML = ''; return; }
        box.innerHTML = '<p class="search-status">' + esc(ui.searching) + '</p>';
        loadIndex().then(function(data) {
            var found = runSearch(q, data);
            renderResults(found, q, box);
        }).catch(function() {
            box.innerHTML = '<p class="search-status">' + esc(ui.error) + '</p>' + webFallbackHTML(q);
        });
    }

    function renderResults(items, q, box) {
        var ui = getUIStrings();
        box.innerHTML = '';
        if (!items.length) {
            box.innerHTML = '<p class="search-status">' + esc(ui.nothing) + ' «' + esc(q) + '».</p>' + webFallbackHTML(q);
            return;
        }
        var stopWords = getStopWords();
        var tokens = q.toLowerCase().split(/\s+/).filter(function(t) {
            return t.length >= 1 && !stopWords.has(t);
        });
        var list = document.createElement('div');
        list.className = 'search-results-list';
        items.forEach(function(d) {
            var a = document.createElement('a');
            a.href = currentBase() + d.url;
            a.className = 'search-result';
            a.setAttribute('role', 'option');
            var title = document.createElement('span');
            title.className = 'search-result-title';
            title.innerHTML = highlight(d.title, tokens);
            a.appendChild(title);
            if (d.tag || d.date || d.minutes) {
                var meta = document.createElement('span');
                meta.className = 'search-result-meta';
                meta.textContent = [d.tag, d.date, d.minutes ? '\u2248' + d.minutes + ' хв' : ''].filter(Boolean).join(' · ');
                a.appendChild(meta);
            }
            var snip = document.createElement('span');
            snip.className = 'search-result-snippet';
            snip.innerHTML = snippet(d, tokens);
            a.appendChild(snip);
            list.appendChild(a);
        });
        box.appendChild(list);
    }

    function webFallbackHTML(q) {
        var ui = getUIStrings();
        var eq = encodeURIComponent('site:ukrsocleague.org ' + q);
        return '<div class="search-fallback">' +
            '<p class="search-fallback-label">' + esc(ui.fallback) + '</p>' +
            '<div class="search-fallback-links">' +
            '<a class="search-fallback-btn" href="https://www.google.com/search?q=' + eq + '" target="_blank" rel="noopener">Google</a>' +
            '<a class="search-fallback-btn" href="https://duckduckgo.com/?q=' + eq + '" target="_blank" rel="noopener">DuckDuckGo</a>' +
            '<a class="search-fallback-btn" href="https://www.bing.com/search?q=' + eq + '" target="_blank" rel="noopener">Bing</a>' +
            '</div></div>';
    }

    function esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            open('search');
        }
    });

    window.SiteSearch = {
        open: function() { open('search'); },
        openBookmarks: function() { open('bookmarks'); },
        close: close,
        warm: function() { loadIndex(); }
    };
})();
