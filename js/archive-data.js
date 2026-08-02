// Архів статей Української Соціалістичної Ліги
// Щоб додати нову статтю до архіву, додайте її запис у масив USL_ARCHIVE
// (url — відносний шлях від кореня сайту).
var USL_ARCHIVE = [
    {
        url: "articles/temneprosvitnitstvo.htm",
        title: "Темне Просвітництво",
        date: "01 Серпня, 2026",
        tag: "Міжнародне",
        description: "Новітній рух у колі технологічної бізнес-еліти та аналіз правого повороту в Кремнієвій долині.",
        image: "pictures/temneprosvitnitstvo.jpg"
    },
    {
        url: "articles/protestausl.htm",
        title: "Завдяки нашій спільній активності",
        date: "18 Липня, 2026",
        tag: "Україна",
        description: "Громадська рада при КМДА підтримала вимогу протестувальників.",
        image: "pictures/protestausl.jpg"
    },
    {
        url: "articles/protest2.htm",
        title: "Народна Ініціатива",
        date: "17 Липня, 2026",
        tag: "Україна",
        description: "У КМДА було проведено засідання Громради.",
        image: "pictures/protestpic2.jpg"
    },
    {
        url: "articles/protest1.htm",
        title: "Народна Ініціатива: Протест проти підвищення цін",
        date: "14 Липня, 2026",
        tag: "Україна",
        description: "Протест проти підвищення цін.",
        image: "pictures/protestpic1.jpg"
    },
    {
        url: "articles/zbirka.htm",
        title: "Горизонт Революції",
        date: "13 Липня, 2026",
        tag: "Культура",
        description: "Збірка Спілки Пролетарських Митців.",
        image: "pictures/zbirka.jpg"
    },
    {
        url: "articles/gegemonia.htm",
        title: "Антоніо Грамші: Культурна Гегемонія",
        date: "6 Липня, 2026",
        tag: "Теорія",
        description: "Культурна гегемонія Грамші як ключ до розуміння влади та боротьби за свідомість мас.",
        image: "pictures/gegemonia.jpg"
    },
    {
        url: "articles/uslshumskyy.htm",
        title: "Олександр Шумський",
        date: "28 Червня, 2026",
        tag: "Історія",
        description: "Олександр Шумський: між революцією, національним відродженням і трагедією доби.",
        image: "pictures/USLlogobig.png"
    },
    {
        url: "articles/migracia1.htm",
        title: "Трудова міграція: спроба соціалістичного аналізу",
        date: "5 Червня, 2026",
        tag: "Аналіз",
        description: "Трудова міграція: спроба соціалістичного аналізу.",
        image: "pictures/migracia1.jpg"
    },
    {
        url: "articles/interview_artil.htm",
        title: "Діалоги українського троцькіста та українського анархіста",
        date: "22 Травня, 2026",
        tag: "Інтерв'ю",
        description: "Розмова редактора журналу «АРТІЛЬ» Романа Коржика з Олегом Верником.",
        image: "pictures/interview_artil.jpg"
    },
    {
        url: "articles/USL_grushevsky.htm",
        title: "Михайло Грушевський",
        date: "14 Травня, 2026",
        tag: "Історія",
        description: "Михайло Грушевський: повернення соціаліста та революціонера.",
        image: "pictures/mykhailo_grushevsky.jpg"
    },
    {
        url: "articles/ukrresolucia.htm",
        title: "Резолюція 3-го Конгресу МСЛ",
        date: "30 Квітня, 2026",
        tag: "МСЛ",
        description: "Резолюція 3-го Конгресу Міжнародної Соціалістичної Ліги щодо російської імперіалістичної агресії та українського опору.",
        image: "pictures/ukrresolucia.jpg"
    },
    {
        url: "articles/vasylchumak.htm",
        title: "Василь Чумак",
        date: "9 Квітня, 2026",
        tag: "Історія",
        description: "Повертаємо Україні: Василь Чумак – зірка української революційної поезії.",
        image: "pictures/vasylchumak.png"
    },
    {
        url: "articles/radycalnemystectvo.htm",
        title: "Disco Elysium і ситуаціонізм",
        date: "2 Квітня, 2026",
        tag: "Культура",
        description: "Радикальне мистецтво та мистецтво радикалізму: Disco Elysium і ситуаціонізм.",
        image: "pictures/disco.png"
    },
    {
        url: "articles/lis_msl_isl.htm",
        title: "Міжнародна Соціалістична Ліга",
        date: "22 Березня, 2026",
        tag: "МСЛ",
        description: "УСЛ є частиною Міжнародної Соціалістичної Ліги – революційного інтернаціоналу соціалістичних партій та організацій.",
        image: "pictures/biglogomsl.png"
    },
    {
        url: "articles/rukyhetvidrozavi.htm",
        title: "Руки геть від Рожави!",
        date: "21 Березня, 2026",
        tag: "Солідарність",
        description: "Припиніть атаки на самовизначення курдського народу!",
        image: "pictures/rukyhetvidrozavi.jpg"
    },
    {
        url: "articles/bahatopartijnistchyodnopartijnist.htm",
        title: "Багатопартійність чи Однопартійність?",
        date: "21 Березня, 2026",
        tag: "Теорія",
        description: "Чому «соціалізм є однопартійним» — лише сталінська авторитарна парадигма, а не марксизм.",
        image: "pictures/preview.jpg"
    },
    {
        url: "articles/vijnavirani.htm",
        title: "Війна в Ірані",
        date: "21 Березня, 2026",
        tag: "Міжнародне",
        description: "Війна в Ірані: нова фаза імперіалістичної бійні.",
        image: "pictures/vijnavirani.jpg"
    },
    {
        url: "articles/gendernaresolucia.htm",
        title: "Гендерна Резолюція",
        date: "21 Березня, 2026",
        tag: "МСЛ",
        description: "3-й Конгрес МСЛ (ISL): опрацювання та дії наших організацій щодо скарг, пов'язаних із ґендерною проблематикою.",
        image: "pictures/gendernaresolucia.jpg"
    },
    {
        url: "articles/isl_feminism1.htm",
        title: "3-й Конгрес МСЛ: Фемінізм",
        date: "21 Березня, 2026",
        tag: "Фемінізм",
        description: "Міжнародний контекст та четверта феміністична хвиля.",
        image: "pictures/ISL_feminism1.jpg"
    },
    {
        url: "articles/andriy_richickij.htm",
        title: "Андрій Річицький",
        date: "21 Березня, 2026",
        tag: "Історія",
        description: "Інтелектуал, що хотів примирити соціалістичну перспективу із волею України.",
        image: "pictures/andrij_richickij.jpg"
    },
    {
        url: "articles/Isl_ecologia1.htm",
        title: "Соціально-екологічна криза, революція і соціалістичний перехід",
        date: "21 Березня, 2026",
        tag: "Екологія",
        description: "Соціально-екологічна криза, революція і соціалістичний перехід.",
        image: "pictures/ISL_ecologia1.jpg"
    }
];
