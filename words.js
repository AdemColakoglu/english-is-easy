const DEFAULT_WORDS = [
    {
        "tr":  "Köpek",
        "en":  "Dog"
    },
    {
        "tr":  "Kedi",
        "en":  "Cat"
    },
    {
        "tr":  "At",
        "en":  "Horse"
    },
    {
        "tr":  "Aslan",
        "en":  "Lion"
    },
    {
        "tr":  "Kaplan",
        "en":  "Tiger"
    },
    {
        "tr":  "Fil",
        "en":  "Elephant"
    },
    {
        "tr":  "İnek",
        "en":  "Cow"
    },
    {
        "tr":  "Domuz",
        "en":  "Pig"
    },
    {
        "tr":  "Tavuk",
        "en":  "Chicken"
    },
    {
        "tr":  "Ördek",
        "en":  "Duck"
    },
    {
        "tr":  "Tavşan",
        "en":  "Rabbit"
    },
    {
        "tr":  "Ayı",
        "en":  "Bear"
    },
    {
        "tr":  "Kurt",
        "en":  "Wolf"
    },
    {
        "tr":  "Tilki",
        "en":  "Fox"
    },
    {
        "tr":  "Maymun",
        "en":  "Monkey"
    },
    {
        "tr":  "Zürafa",
        "en":  "Giraffe"
    },
    {
        "tr":  "Zebra",
        "en":  "Zebra"
    },
    {
        "tr":  "Geyik",
        "en":  "Deer"
    },
    {
        "tr":  "Kanguru",
        "en":  "Kangaroo"
    },
    {
        "tr":  "Penguen",
        "en":  "Penguin"
    },
    {
        "tr":  "Yunus Balığı",
        "en":  "Dolphin"
    },
    {
        "tr":  "Balina",
        "en":  "Whale"
    },
    {
        "tr":  "Köpekbalığı",
        "en":  "Shark"
    },
    {
        "tr":  "Kartal",
        "en":  "Eagle"
    },
    {
        "tr":  "Baykuş",
        "en":  "Owl"
    },
    {
        "tr":  "Kelebek",
        "en":  "Butterfly"
    },
    {
        "tr":  "Arı",
        "en":  "Bee"
    },
    {
        "tr":  "Karınca",
        "en":  "Ant"
    },
    {
        "tr":  "Örümcek",
        "en":  "Spider"
    },
    {
        "tr":  "Yılan",
        "en":  "Snake"
    },
    {
        "tr":  "Timsah",
        "en":  "Crocodile"
    },
    {
        "tr":  "Timsah",
        "en":  "Alligator"
    },
    {
        "tr":  "Deve",
        "en":  "Camel"
    },
    {
        "tr":  "Goril",
        "en":  "Gorilla"
    },
    {
        "tr":  "Şempanze",
        "en":  "Chimpanzee"
    },
    {
        "tr":  "Panda",
        "en":  "Panda"
    },
    {
        "tr":  "Koala",
        "en":  "Koala"
    },
    {
        "tr":  "Gergedan",
        "en":  "Rhinoceros"
    },
    {
        "tr":  "Su Aygırı",
        "en":  "Hippopotamus"
    },
    {
        "tr":  "Leopar",
        "en":  "Leopard"
    },
    {
        "tr":  "Çita",
        "en":  "Cheetah"
    },
    {
        "tr":  "Jaguar",
        "en":  "Jaguar"
    },
    {
        "tr":  "Sırtlan",
        "en":  "Hyena"
    },
    {
        "tr":  "Sincap",
        "en":  "Squirrel"
    },
    {
        "tr":  "Rakun",
        "en":  "Raccoon"
    },
    {
        "tr":  "Kokarca",
        "en":  "Skunk"
    },
    {
        "tr":  "Kunduz",
        "en":  "Beaver"
    },
    {
        "tr":  "Su Samuru",
        "en":  "Otter"
    },
    {
        "tr":  "Fok",
        "en":  "Seal"
    },
    {
        "tr":  "Mors",
        "en":  "Walrus"
    },
    {
        "tr":  "Kutup Ayısı",
        "en":  "Polar Bear"
    },
    {
        "tr":  "Kızıl Panda",
        "en":  "Red Panda"
    },
    {
        "tr":  "Tembel Hayvan",
        "en":  "Sloth"
    },
    {
        "tr":  "Armadillo",
        "en":  "Armadillo"
    },
    {
        "tr":  "Mirket",
        "en":  "Meerkat"
    },
    {
        "tr":  "Firavun Faresi",
        "en":  "Mongoose"
    },
    {
        "tr":  "Yarasa",
        "en":  "Bat"
    },
    {
        "tr":  "Kirpi",
        "en":  "Hedgehog"
    },
    {
        "tr":  "Köstebek",
        "en":  "Mole"
    },
    {
        "tr":  "Fare",
        "en":  "Mouse"
    },
    {
        "tr":  "Sıçan",
        "en":  "Rat"
    },
    {
        "tr":  "Hamster",
        "en":  "Hamster"
    },
    {
        "tr":  "Ginedomuzu",
        "en":  "Guinea Pig"
    },
    {
        "tr":  "Papağan",
        "en":  "Parrot"
    },
    {
        "tr":  "Kakadu",
        "en":  "Cockatoo"
    },
    {
        "tr":  "Muhabbet Kuşu",
        "en":  "Parakeet"
    },
    {
        "tr":  "Karga",
        "en":  "Crow"
    },
    {
        "tr":  "Güvercin",
        "en":  "Pigeon"
    },
    {
        "tr":  "Kuğu",
        "en":  "Swan"
    },
    {
        "tr":  "Tavus Kuşu",
        "en":  "Peacock"
    },
    {
        "tr":  "Flamingo",
        "en":  "Flamingo"
    },
    {
        "tr":  "Deve Kuşu",
        "en":  "Ostrich"
    },
    {
        "tr":  "Akbaba",
        "en":  "Vulture"
    },
    {
        "tr":  "Şahin",
        "en":  "Hawk"
    },
    {
        "tr":  "Doğan",
        "en":  "Falcon"
    },
    {
        "tr":  "Sinek Kuşu",
        "en":  "Hummingbird"
    },
    {
        "tr":  "Ağaçkakan",
        "en":  "Woodpecker"
    },
    {
        "tr":  "Kızılgerdan",
        "en":  "Robin"
    },
    {
        "tr":  "Martı",
        "en":  "Seagull"
    },
    {
        "tr":  "Hindi",
        "en":  "Turkey"
    },
    {
        "tr":  "Horoz",
        "en":  "Rooster"
    },
    {
        "tr":  "Tavuk",
        "en":  "Hen"
    },
    {
        "tr":  "Kaz",
        "en":  "Goose"
    },
    {
        "tr":  "Uğurböceği",
        "en":  "Ladybug"
    },
    {
        "tr":  "Elma",
        "en":  "Apple"
    },
    {
        "tr":  "Portakal",
        "en":  "Orange"
    },
    {
        "tr":  "Mandalina",
        "en":  "Tangerine"
    },
    {
        "tr":  "Nar",
        "en":  "Pomegranate"
    },
    {
        "tr":  "Muz",
        "en":  "Banana"
    },
    {
        "tr":  "Üzüm",
        "en":  "Grapes"
    },
    {
        "tr":  "Mango",
        "en":  "Mango"
    },
    {
        "tr":  "Guava",
        "en":  "Guava"
    },
    {
        "tr":  "Jak Meyvesi",
        "en":  "Jackfruit"
    },
    {
        "tr":  "Ananas",
        "en":  "Pineapple"
    },
    {
        "tr":  "Karpuz",
        "en":  "Watermelon"
    },
    {
        "tr":  "Hindistan Cevizi",
        "en":  "Coconut"
    },
    {
        "tr":  "Limon",
        "en":  "Lemon"
    },
    {
        "tr":  "Misket Limonu",
        "en":  "Lime"
    },
    {
        "tr":  "Avokado",
        "en":  "Avocado"
    },
    {
        "tr":  "Ejder Meyvesi",
        "en":  "Dragon Fruit"
    },
    {
        "tr":  "Çilek",
        "en":  "Strawberry"
    },
    {
        "tr":  "Kivi",
        "en":  "Kiwi"
    },
    {
        "tr":  "İncir",
        "en":  "Fig"
    },
    {
        "tr":  "Kiraz",
        "en":  "Cherry"
    },
    {
        "tr":  "Armut",
        "en":  "Pear"
    },
    {
        "tr":  "Kavun",
        "en":  "Muskmelon"
    },
    {
        "tr":  "Erik",
        "en":  "Plum"
    },
    {
        "tr":  "Yaban Mersini",
        "en":  "Blueberry"
    },
    {
        "tr":  "Böğürtlen",
        "en":  "Blackberry"
    },
    {
        "tr":  "Şeftali",
        "en":  "Peach"
    },
    {
        "tr":  "Kayısı",
        "en":  "Apricot"
    },
    {
        "tr":  "Hurma",
        "en":  "Date"
    },
    {
        "tr":  "Trabzon Hurması",
        "en":  "Persimmon"
    },
    {
        "tr":  "Ayva",
        "en":  "Quince"
    },
    {
        "tr":  "Greyfurt",
        "en":  "Grapefruit"
    },
    {
        "tr":  "Nektari",
        "en":  "Nectarine"
    },
    {
        "tr":  "Kızılcık",
        "en":  "Cranberry"
    },
    {
        "tr":  "Ahududu",
        "en":  "Raspberry"
    },
    {
        "tr":  "Havuç",
        "en":  "Carrot"
    },
    {
        "tr":  "Pancar",
        "en":  "Beetroot"
    },
    {
        "tr":  "Soğan",
        "en":  "Onion"
    },
    {
        "tr":  "Karnabahar",
        "en":  "Cauliflower"
    },
    {
        "tr":  "Dolmalık Biber",
        "en":  "Capsicum"
    },
    {
        "tr":  "Zencefil",
        "en":  "Ginger"
    },
    {
        "tr":  "Acı Biber",
        "en":  "Chilli"
    },
    {
        "tr":  "Salatalık",
        "en":  "Cucumber"
    },
    {
        "tr":  "Ispanak",
        "en":  "Spinach"
    },
    {
        "tr":  "Marul",
        "en":  "Lettuce"
    },
    {
        "tr":  "Brokoli",
        "en":  "Broccoli"
    },
    {
        "tr":  "Taze Fasulye",
        "en":  "Green Beans"
    },
    {
        "tr":  "Sarımsak",
        "en":  "Garlic"
    },
    {
        "tr":  "Su Kabağı",
        "en":  "Bottle gourd"
    },
    {
        "tr":  "Bezelye",
        "en":  "Peas"
    },
    {
        "tr":  "Dolmalık Biber",
        "en":  "Bell Pepper"
    },
    {
        "tr":  "Mısır",
        "en":  "Corn"
    },
    {
        "tr":  "Mantar",
        "en":  "Mushroom"
    },
    {
        "tr":  "Kabak",
        "en":  "Zucchini"
    },
    {
        "tr":  "Pırasa",
        "en":  "Leek"
    },
    {
        "tr":  "Brüksel Lahanası",
        "en":  "Brussels Sprouts"
    },
    {
        "tr":  "Arnavutluk",
        "en":  "Albania"
    },
    {
        "tr":  "Arnavut",
        "en":  "Albanian"
    },
    {
        "tr":  "Cezayir",
        "en":  "Algeria"
    },
    {
        "tr":  "Cezayirli",
        "en":  "Algerian"
    },
    {
        "tr":  "Arjantin",
        "en":  "Argentina"
    },
    {
        "tr":  "Arjantinli",
        "en":  "Argentinian"
    },
    {
        "tr":  "Ermenistan",
        "en":  "Armenia"
    },
    {
        "tr":  "Ermeni",
        "en":  "Armenian"
    },
    {
        "tr":  "Avustralya",
        "en":  "Australia"
    },
    {
        "tr":  "Avustralyalı",
        "en":  "Australian"
    },
    {
        "tr":  "Avusturya",
        "en":  "Austria"
    },
    {
        "tr":  "Avusturyalı",
        "en":  "Austrian"
    },
    {
        "tr":  "Azerbaycan",
        "en":  "Azerbaijan"
    },
    {
        "tr":  "Azerbaycanlı",
        "en":  "Azerbaijani"
    },
    {
        "tr":  "Bangladeş",
        "en":  "Bangladesh"
    },
    {
        "tr":  "Bangladeşli",
        "en":  "Bangladeshi"
    },
    {
        "tr":  "Belçika",
        "en":  "Belgium"
    },
    {
        "tr":  "Belçikalı",
        "en":  "Belgian"
    },
    {
        "tr":  "Bosna-Hersek",
        "en":  "Bosnia-Herzegovina"
    },
    {
        "tr":  "Boşnak",
        "en":  "Bosnian"
    },
    {
        "tr":  "Brezilya",
        "en":  "Brazil"
    },
    {
        "tr":  "Brezilyalı",
        "en":  "Brazilian"
    },
    {
        "tr":  "Bulgaristan",
        "en":  "Bulgaria"
    },
    {
        "tr":  "Bulgar",
        "en":  "Bulgarian"
    },
    {
        "tr":  "Kanada",
        "en":  "Canada"
    },
    {
        "tr":  "Kanadalı",
        "en":  "Canadian"
    },
    {
        "tr":  "Şili",
        "en":  "Chile"
    },
    {
        "tr":  "Şilili",
        "en":  "Chilean"
    },
    {
        "tr":  "Çin",
        "en":  "China"
    },
    {
        "tr":  "Çinli",
        "en":  "Chinese"
    },
    {
        "tr":  "Kolombiya",
        "en":  "Colombia"
    },
    {
        "tr":  "Kolombiyalı",
        "en":  "Colombian"
    },
    {
        "tr":  "Hırvatistan",
        "en":  "Croatia"
    },
    {
        "tr":  "Hırvat",
        "en":  "Croatian"
    },
    {
        "tr":  "Küba",
        "en":  "Cuba"
    },
    {
        "tr":  "Kübalı",
        "en":  "Cuban"
    },
    {
        "tr":  "Kıbrıs",
        "en":  "Cyprus"
    },
    {
        "tr":  "Kıbrıslı",
        "en":  "Cypriot"
    },
    {
        "tr":  "Çekya",
        "en":  "Czech Republic"
    },
    {
        "tr":  "Çek",
        "en":  "Czech"
    },
    {
        "tr":  "Danimarka",
        "en":  "Denmark"
    },
    {
        "tr":  "Danimarkalı",
        "en":  "Danish"
    },
    {
        "tr":  "Dominika",
        "en":  "Dominica"
    },
    {
        "tr":  "Dominikli",
        "en":  "Dominican"
    },
    {
        "tr":  "Ekvador",
        "en":  "Ecuador"
    },
    {
        "tr":  "Ekvadorlu",
        "en":  "Ecuadorian"
    },
    {
        "tr":  "Fransa",
        "en":  "France"
    },
    {
        "tr":  "Fransız",
        "en":  "French"
    },
    {
        "tr":  "Gürcistan",
        "en":  "Georgia"
    },
    {
        "tr":  "Gürcü",
        "en":  "Georgian"
    },
    {
        "tr":  "Almanya",
        "en":  "Germany"
    },
    {
        "tr":  "Alman",
        "en":  "German"
    },
    {
        "tr":  "Yunanistan",
        "en":  "Greece"
    },
    {
        "tr":  "Yunan",
        "en":  "Greek"
    },
    {
        "tr":  "Hollanda",
        "en":  "Holland"
    },
    {
        "tr":  "Hollandalı",
        "en":  "Dutch"
    },
    {
        "tr":  "Macaristan",
        "en":  "Hungary"
    },
    {
        "tr":  "Macar",
        "en":  "Hungarian"
    },
    {
        "tr":  "İzlanda",
        "en":  "Iceland"
    },
    {
        "tr":  "İzlandalı",
        "en":  "Icelandic"
    },
    {
        "tr":  "Hindistan",
        "en":  "India"
    },
    {
        "tr":  "Hintli",
        "en":  "Indian"
    },
    {
        "tr":  "Endonezya",
        "en":  "Indonesia"
    },
    {
        "tr":  "Endonezyalı",
        "en":  "Indonesian"
    },
    {
        "tr":  "İran",
        "en":  "Iran"
    },
    {
        "tr":  "İranlı",
        "en":  "Iranian"
    },
    {
        "tr":  "Irak",
        "en":  "Iraq"
    },
    {
        "tr":  "Iraklı",
        "en":  "Iraqi"
    },
    {
        "tr":  "İrlanda",
        "en":  "Ireland"
    },
    {
        "tr":  "İrlandalı",
        "en":  "Irish"
    },
    {
        "tr":  "İsrail",
        "en":  "Israel"
    },
    {
        "tr":  "İsrailli",
        "en":  "Israeli"
    },
    {
        "tr":  "İtalya",
        "en":  "Italy"
    },
    {
        "tr":  "İtalyan",
        "en":  "Italian"
    },
    {
        "tr":  "Jamaika",
        "en":  "Jamaica"
    },
    {
        "tr":  "Jamaikalı",
        "en":  "Jamaican"
    },
    {
        "tr":  "Japonya",
        "en":  "Japan"
    },
    {
        "tr":  "Japon",
        "en":  "Japanese"
    },
    {
        "tr":  "Kazakistan",
        "en":  "Kazakhstan"
    },
    {
        "tr":  "Kazak",
        "en":  "Kazakh"
    },
    {
        "tr":  "Kenya",
        "en":  "Kenya"
    },
    {
        "tr":  "Kenyalı",
        "en":  "Kenyan"
    },
    {
        "tr":  "Kore",
        "en":  "Korea"
    },
    {
        "tr":  "Koreli",
        "en":  "Korean"
    },
    {
        "tr":  "Kuveyt",
        "en":  "Kuwait"
    },
    {
        "tr":  "Kuveytli",
        "en":  "Kuwaiti"
    },
    {
        "tr":  "Lübnan",
        "en":  "Lebanon"
    },
    {
        "tr":  "Lübnanlı",
        "en":  "Lebanese"
    },
    {
        "tr":  "Libya",
        "en":  "Libya"
    },
    {
        "tr":  "Libyalı",
        "en":  "Libyan"
    },
    {
        "tr":  "Litvanya",
        "en":  "Lithuania"
    },
    {
        "tr":  "Litvanyalı",
        "en":  "Lithuanian"
    },
    {
        "tr":  "Maldivler",
        "en":  "Maldives"
    },
    {
        "tr":  "Maldivli",
        "en":  "Maldivian"
    },
    {
        "tr":  "Mali",
        "en":  "Mali"
    },
    {
        "tr":  "Malili",
        "en":  "Malian"
    },
    {
        "tr":  "Malta",
        "en":  "Malta"
    },
    {
        "tr":  "Maltalı",
        "en":  "Maltese"
    },
    {
        "tr":  "Meksika",
        "en":  "Mexico"
    },
    {
        "tr":  "Meksikalı",
        "en":  "Mexican"
    },
    {
        "tr":  "Moldova",
        "en":  "Moldova"
    },
    {
        "tr":  "Moldovalı",
        "en":  "Moldovan"
    },
    {
        "tr":  "Monako",
        "en":  "Monaco"
    },
    {
        "tr":  "Monakolu",
        "en":  "Monacan"
    },
    {
        "tr":  "Fas",
        "en":  "Morocco"
    },
    {
        "tr":  "Faslı",
        "en":  "Moroccan"
    },
    {
        "tr":  "Nepal",
        "en":  "Nepal"
    },
    {
        "tr":  "Nepalli",
        "en":  "Nepalese"
    },
    {
        "tr":  "Nijerya",
        "en":  "Nigeria"
    },
    {
        "tr":  "Nijeryalı",
        "en":  "Nigerian"
    },
    {
        "tr":  "Norveç",
        "en":  "Norway"
    },
    {
        "tr":  "Norveçli",
        "en":  "Norwegian"
    },
    {
        "tr":  "Pakistan",
        "en":  "Pakistan"
    },
    {
        "tr":  "Pakistanlı",
        "en":  "Pakistani"
    },
    {
        "tr":  "Paraguay",
        "en":  "Paraguay"
    },
    {
        "tr":  "Paraguaylı",
        "en":  "Paraguayan"
    },
    {
        "tr":  "Peru",
        "en":  "Peru"
    },
    {
        "tr":  "Perulu",
        "en":  "Peruvian"
    },
    {
        "tr":  "Filipinler",
        "en":  "Philippines"
    },
    {
        "tr":  "Filipinli",
        "en":  "Filipino"
    },
    {
        "tr":  "Polonya",
        "en":  "Poland"
    },
    {
        "tr":  "Polonyalı",
        "en":  "Polish"
    },
    {
        "tr":  "Portekiz",
        "en":  "Portugal"
    },
    {
        "tr":  "Portekizli",
        "en":  "Portuguese"
    },
    {
        "tr":  "Katar",
        "en":  "Qatar"
    },
    {
        "tr":  "Katarlı",
        "en":  "Qatari"
    },
    {
        "tr":  "Romanya",
        "en":  "Romania"
    },
    {
        "tr":  "Rumen",
        "en":  "Romanian"
    },
    {
        "tr":  "Rusya",
        "en":  "Russia"
    },
    {
        "tr":  "Rus",
        "en":  "Russian"
    },
    {
        "tr":  "Suudi Arabistan",
        "en":  "Saudi Arabia"
    },
    {
        "tr":  "Suudi",
        "en":  "Saudi"
    },
    {
        "tr":  "Senegal",
        "en":  "Senegal"
    },
    {
        "tr":  "Senegalli",
        "en":  "Senegalese"
    },
    {
        "tr":  "Sırbistan",
        "en":  "Serbia"
    },
    {
        "tr":  "Sırp",
        "en":  "Serbian"
    },
    {
        "tr":  "Singapur",
        "en":  "Singapore"
    },
    {
        "tr":  "Singapurlu",
        "en":  "Singaporean"
    },
    {
        "tr":  "İsviçre",
        "en":  "Switzerland"
    },
    {
        "tr":  "İsviçreli",
        "en":  "Swiss"
    },
    {
        "tr":  "Suriye",
        "en":  "Syria"
    },
    {
        "tr":  "Suriyeli",
        "en":  "Syrian"
    },
    {
        "tr":  "Tayvan",
        "en":  "Taiwan"
    },
    {
        "tr":  "Tayvanlı",
        "en":  "Taiwanese"
    },
    {
        "tr":  "Tacikistan",
        "en":  "Tajikistan"
    },
    {
        "tr":  "Tacik",
        "en":  "Tajik"
    },
    {
        "tr":  "Tayland",
        "en":  "Thailand"
    },
    {
        "tr":  "Taylandlı",
        "en":  "Thai"
    },
    {
        "tr":  "Tunus",
        "en":  "Tunisia"
    },
    {
        "tr":  "Tunuslu",
        "en":  "Tunisian"
    },
    {
        "tr":  "Türkiye",
        "en":  "Turkey"
    },
    {
        "tr":  "Türk",
        "en":  "Turkish"
    },
    {
        "tr":  "Uganda",
        "en":  "Uganda"
    },
    {
        "tr":  "Ugandalı",
        "en":  "Ugandan"
    },
    {
        "tr":  "Ukrayna",
        "en":  "Ukraine"
    },
    {
        "tr":  "Ukraynalı",
        "en":  "Ukrainian"
    },
    {
        "tr":  "Birleşik Krallık",
        "en":  "United Kingdom"
    },
    {
        "tr":  "İngiliz",
        "en":  "British"
    },
    {
        "tr":  "Amerika Birleşik Devletleri",
        "en":  "United States"
    },
    {
        "tr":  "Amerikalı",
        "en":  "American"
    },
    {
        "tr":  "Uruguay",
        "en":  "Uruguay"
    },
    {
        "tr":  "Uruguaylı",
        "en":  "Uruguayan"
    },
    {
        "tr":  "Özbekistan",
        "en":  "Uzbekistan"
    },
    {
        "tr":  "Özbek",
        "en":  "Uzbek"
    },
    {
        "tr":  "Venezuela",
        "en":  "Venezuela"
    },
    {
        "tr":  "Venezuelalı",
        "en":  "Venezuelan"
    },
    {
        "tr":  "Vietnam",
        "en":  "Vietnam"
    },
    {
        "tr":  "Vietnamlı",
        "en":  "Vietnamese"
    },
    {
        "tr":  "Yemen",
        "en":  "Yemen"
    },
    {
        "tr":  "Yemenli",
        "en":  "Yemeni"
    },
    {
        "tr":  "Yugoslavya",
        "en":  "Yugoslavia"
    },
    {
        "tr":  "Yugoslav",
        "en":  "Yugoslav"
    },
    {
        "tr":  "Zimbabve",
        "en":  "Zimbabwe"
    },
    {
        "tr":  "Zimbabveli",
        "en":  "Zimbabwean"
    },
    {
        "tr":  "Muhasebeci",
        "en":  "Accountant"
    },
    {
        "tr":  "Akrobat",
        "en":  "Acrobat"
    },
    {
        "tr":  "Aktör",
        "en":  "Actor"
    },
    {
        "tr":  "Aktris",
        "en":  "Actress"
    },
    {
        "tr":  "Amiral",
        "en":  "Admiral"
    },
    {
        "tr":  "Reklamcı",
        "en":  "Advertiser"
    },
    {
        "tr":  "Ajan",
        "en":  "Agent"
    },
    {
        "tr":  "Büyükelçi",
        "en":  "Ambassador"
    },
    {
        "tr":  "Spiker",
        "en":  "Announcer"
    },
    {
        "tr":  "Arkeolog",
        "en":  "Archaeologist"
    },
    {
        "tr":  "Bankacı",
        "en":  "Banker"
    },
    {
        "tr":  "Berber",
        "en":  "Barber"
    },
    {
        "tr":  "Barmen",
        "en":  "Barman"
    },
    {
        "tr":  "Marangoz",
        "en":  "Carpenter"
    },
    {
        "tr":  "Kasiyer",
        "en":  "Cashier"
    },
    {
        "tr":  "Bilgisayar Mühendisi",
        "en":  "Computer Engineer"
    },
    {
        "tr":  "Aşçı",
        "en":  "Cook"
    },
    {
        "tr":  "Diş Hekimi",
        "en":  "Dentist"
    },
    {
        "tr":  "Dedektif",
        "en":  "Detective"
    },
    {
        "tr":  "Dalgıç",
        "en":  "Diver"
    },
    {
        "tr":  "Doktor",
        "en":  "Doctor"
    },
    {
        "tr":  "Şoför",
        "en":  "Driver"
    },
    {
        "tr":  "Kuru Temizlemeci",
        "en":  "Dry Cleaner"
    },
    {
        "tr":  "Elektrikçi",
        "en":  "Electrician"
    },
    {
        "tr":  "Mühendis",
        "en":  "Engineer"
    },
    {
        "tr":  "Cellat",
        "en":  "Executioner"
    },
    {
        "tr":  "Yönetici",
        "en":  "Executive"
    },
    {
        "tr":  "Çiftçi",
        "en":  "Farmer"
    },
    {
        "tr":  "Moda Tasarımcısı",
        "en":  "Fashion designer"
    },
    {
        "tr":  "İtfaiyeci",
        "en":  "Firefighter"
    },
    {
        "tr":  "Çiçekçi",
        "en":  "Florist"
    },
    {
        "tr":  "Futbolcu",
        "en":  "Football Player"
    },
    {
        "tr":  "Ustabaşı",
        "en":  "Foreman"
    },
    {
        "tr":  "Mobilyacı",
        "en":  "Furniture maker"
    },
    {
        "tr":  "Bahçıvan",
        "en":  "Gardener"
    },
    {
        "tr":  "Camcı",
        "en":  "Glazier"
    },
    {
        "tr":  "Grafik Tasarımcısı",
        "en":  "Graphic Designer"
    },
    {
        "tr":  "Manav",
        "en":  "Greengrocer"
    },
    {
        "tr":  "Bakkal",
        "en":  "Grocer"
    },
    {
        "tr":  "Rehber",
        "en":  "Guide"
    },
    {
        "tr":  "Kuaför",
        "en":  "Hairdresser"
    },
    {
        "tr":  "Şef Garson",
        "en":  "Headwaiter"
    },
    {
        "tr":  "Hostes",
        "en":  "Hostess"
    },
    {
        "tr":  "Ev Hanımı",
        "en":  "Housewife"
    },
    {
        "tr":  "Sanayici",
        "en":  "Industrialist"
    },
    {
        "tr":  "Müfettiş",
        "en":  "Inspector"
    },
    {
        "tr":  "Sigortacı",
        "en":  "Insurer"
    },
    {
        "tr":  "Kuyumcu",
        "en":  "Jeweller"
    },
    {
        "tr":  "Jokey",
        "en":  "Jockey"
    },
    {
        "tr":  "Gazeteci",
        "en":  "Journalist"
    },
    {
        "tr":  "Hakim",
        "en":  "Judge"
    },
    {
        "tr":  "Anaokulu Öğretmeni",
        "en":  "Kindergarten teacher"
    },
    {
        "tr":  "Mutfak Çalışanı",
        "en":  "Kitchen attendant"
    },
    {
        "tr":  "Avukat",
        "en":  "Lawyer"
    },
    {
        "tr":  "Okutman",
        "en":  "Lecturer"
    },
    {
        "tr":  "Kütüphaneci",
        "en":  "Librarian"
    },
    {
        "tr":  "Madenci",
        "en":  "Miner"
    },
    {
        "tr":  "Bakan",
        "en":  "Minister"
    },
    {
        "tr":  "Manken",
        "en":  "Model"
    },
    {
        "tr":  "Müzisyen",
        "en":  "Musician"
    },
    {
        "tr":  "Noter",
        "en":  "Notary"
    },
    {
        "tr":  "Romancı",
        "en":  "Novelist"
    },
    {
        "tr":  "Rahibe",
        "en":  "Nun"
    },
    {
        "tr":  "Kadın Rahip",
        "en":  "Priestess"
    },
    {
        "tr":  "Hemşire",
        "en":  "Nurse"
    },
    {
        "tr":  "Göz Doktoru",
        "en":  "Oculist"
    },
    {
        "tr":  "Gözlükçü",
        "en":  "Optician"
    },
    {
        "tr":  "Ressam",
        "en":  "Painter"
    },
    {
        "tr":  "Çocuk Doktoru",
        "en":  "Pediatrician"
    },
    {
        "tr":  "Filozof",
        "en":  "Philosopher"
    },
    {
        "tr":  "Fotoğrafçı",
        "en":  "Photographer"
    },
    {
        "tr":  "Pilot",
        "en":  "Pilot"
    },
    {
        "tr":  "Tesisatçı",
        "en":  "Plumber"
    },
    {
        "tr":  "Şair",
        "en":  "Poet"
    },
    {
        "tr":  "Polis Memuru",
        "en":  "Police Officer"
    },
    {
        "tr":  "Politikacı",
        "en":  "Politician"
    },
    {
        "tr":  "Hamal",
        "en":  "Porter"
    },
    {
        "tr":  "Postacı",
        "en":  "Postman"
    },
    {
        "tr":  "Cumhurbaşkanı",
        "en":  "President"
    },
    {
        "tr":  "Papaz",
        "en":  "Priest"
    },
    {
        "tr":  "Başbakan",
        "en":  "Prime Minister"
    },
    {
        "tr":  "Matbaacı",
        "en":  "Printer"
    },
    {
        "tr":  "Yazılımcı",
        "en":  "Programmer"
    },
    {
        "tr":  "Savcı",
        "en":  "Prosecutor"
    },
    {
        "tr":  "Psikolog",
        "en":  "Psychologist"
    },
    {
        "tr":  "Yayımcı",
        "en":  "Publisher"
    },
    {
        "tr":  "Emlakçı",
        "en":  "Real Estate Agent"
    },
    {
        "tr":  "Resepsiyonist",
        "en":  "Receptionist"
    },
    {
        "tr":  "Hakem",
        "en":  "Referee"
    },
    {
        "tr":  "Muhabir",
        "en":  "Reporter"
    },
    {
        "tr":  "Emekli",
        "en":  "Retired"
    },
    {
        "tr":  "Denizci",
        "en":  "Sailor"
    },
    {
        "tr":  "Bilim İnsanı",
        "en":  "Scientist"
    },
    {
        "tr":  "Sekreter",
        "en":  "Secretary"
    },
    {
        "tr":  "Çavuş",
        "en":  "Sergeant"
    },
    {
        "tr":  "Hizmetçi",
        "en":  "Servant"
    },
    {
        "tr":  "Çoban",
        "en":  "Shepherd"
    },
    {
        "tr":  "Ayakkabıcı",
        "en":  "Shoemaker"
    },
    {
        "tr":  "Tezgahtar",
        "en":  "Shop Assistant"
    },
    {
        "tr":  "Asker",
        "en":  "Soldier"
    },
    {
        "tr":  "Casus",
        "en":  "Spy"
    },
    {
        "tr":  "Devlet Adamı",
        "en":  "Statesman"
    },
    {
        "tr":  "Veznedar",
        "en":  "Treasurer"
    },
    {
        "tr":  "İşsiz",
        "en":  "Unemployed"
    },
    {
        "tr":  "Yer Gösterici",
        "en":  "Usher"
    },
    {
        "tr":  "Veteriner",
        "en":  "Veterinary"
    },
    {
        "tr":  "Vokalist",
        "en":  "Vocalist"
    },
    {
        "tr":  "Garson",
        "en":  "Waiter"
    },
    {
        "tr":  "Kadın Garson",
        "en":  "Waitress"
    },
    {
        "tr":  "Saat Tamircisi",
        "en":  "Watch repairer"
    },
    {
        "tr":  "Saatçi",
        "en":  "Watch seller"
    },
    {
        "tr":  "Yazar",
        "en":  "Writer"
    },
    {
        "tr":  "İşçi",
        "en":  "Worker"
    },
    {
        "tr":  "Röntgen Teknisyeni",
        "en":  "Xray Technician"
    },
    {
        "tr":  "Zoolog",
        "en":  "Zoologist"
    },
    {
        "tr":  "Hayvanat Bahçesi Görevlisi",
        "en":  "Zookeeper"
    },
    {
        "tr":  "Olmak",
        "en":  "Be"
    },
    {
        "tr":  "Vurmak",
        "en":  "Beat"
    },
    {
        "tr":  "Olmak",
        "en":  "Become"
    },
    {
        "tr":  "Başlamak",
        "en":  "Begin"
    },
    {
        "tr":  "Esmek",
        "en":  "Blow"
    },
    {
        "tr":  "Kırmak",
        "en":  "Break"
    },
    {
        "tr":  "Getirmek",
        "en":  "Bring"
    },
    {
        "tr":  "İnşa etmek",
        "en":  "Build"
    },
    {
        "tr":  "Yanmak",
        "en":  "Burn"
    },
    {
        "tr":  "Satın almak",
        "en":  "Buy"
    },
    {
        "tr":  "Ebilmek",
        "en":  "Can"
    },
    {
        "tr":  "Yakalamak",
        "en":  "Catch"
    },
    {
        "tr":  "Seçmek",
        "en":  "Choose"
    },
    {
        "tr":  "Gelmek",
        "en":  "Come"
    },
    {
        "tr":  "Fiyatlandırmak",
        "en":  "Cost"
    },
    {
        "tr":  "Kesmek",
        "en":  "Cut"
    },
    {
        "tr":  "Yapmak",
        "en":  "Do"
    },
    {
        "tr":  "Çizmek",
        "en":  "Draw"
    },
    {
        "tr":  "Hayal Etmek",
        "en":  "Dream"
    },
    {
        "tr":  "İçmek",
        "en":  "Drink"
    },
    {
        "tr":  "Sürmek",
        "en":  "Drive"
    },
    {
        "tr":  "Yemek",
        "en":  "Eat"
    },
    {
        "tr":  "Düşmek",
        "en":  "Fall"
    },
    {
        "tr":  "Hissetmek",
        "en":  "Feel"
    },
    {
        "tr":  "Bulmak",
        "en":  "Find"
    },
    {
        "tr":  "Uçmak",
        "en":  "Fly"
    },
    {
        "tr":  "Unutmak",
        "en":  "Forget"
    },
    {
        "tr":  "Affetmek",
        "en":  "Forgive"
    },
    {
        "tr":  "Almak",
        "en":  "Get"
    },
    {
        "tr":  "Vermek",
        "en":  "Give"
    },
    {
        "tr":  "Gitmek",
        "en":  "Go"
    },
    {
        "tr":  "Büyümek",
        "en":  "Grow"
    },
    {
        "tr":  "Sahip olmak",
        "en":  "Have"
    },
    {
        "tr":  "Duymak",
        "en":  "Hear"
    },
    {
        "tr":  "Saklamak",
        "en":  "Hide"
    },
    {
        "tr":  "Vurmak",
        "en":  "Hit"
    },
    {
        "tr":  "Tutmak",
        "en":  "Hold"
    },
    {
        "tr":  "İncitmek",
        "en":  "Hurt"
    },
    {
        "tr":  "Korumak",
        "en":  "Keep"
    },
    {
        "tr":  "Bilmek",
        "en":  "Know"
    },
    {
        "tr":  "Liderlik etmek",
        "en":  "Lead"
    },
    {
        "tr":  "Öğrenmek",
        "en":  "Learn"
    },
    {
        "tr":  "Ayrılmak",
        "en":  "Leave"
    },
    {
        "tr":  "Ödünç vermek",
        "en":  "Lend"
    },
    {
        "tr":  "İzin vermek",
        "en":  "Let"
    },
    {
        "tr":  "Kaybetmek",
        "en":  "Lose"
    },
    {
        "tr":  "Yapmak",
        "en":  "Make"
    },
    {
        "tr":  "Anlamına gelmek",
        "en":  "Mean"
    },
    {
        "tr":  "Tanışmak",
        "en":  "Meet"
    },
    {
        "tr":  "Meli Malı",
        "en":  "Must"
    },
    {
        "tr":  "Ödemek",
        "en":  "Pay"
    },
    {
        "tr":  "Koymak",
        "en":  "Put"
    },
    {
        "tr":  "Okumak",
        "en":  "Read"
    },
    {
        "tr":  "Çalmak",
        "en":  "Ring"
    },
    {
        "tr":  "Yükselmek",
        "en":  "Rise"
    },
    {
        "tr":  "Söylemek",
        "en":  "Say"
    },
    {
        "tr":  "Görmek",
        "en":  "See"
    },
    {
        "tr":  "Satmak",
        "en":  "Sell"
    },
    {
        "tr":  "Göndermek",
        "en":  "Send"
    },
    {
        "tr":  "Göstermek",
        "en":  "Show"
    },
    {
        "tr":  "Kapatmak",
        "en":  "Shut"
    },
    {
        "tr":  "Şarkı söylemek",
        "en":  "Sing"
    },
    {
        "tr":  "Batmak",
        "en":  "Sink"
    },
    {
        "tr":  "Oturmak",
        "en":  "Sit"
    },
    {
        "tr":  "Uyumak",
        "en":  "Sleep"
    },
    {
        "tr":  "Konuşmak",
        "en":  "Speak"
    },
    {
        "tr":  "Harcamak",
        "en":  "Spend"
    },
    {
        "tr":  "Çalmak",
        "en":  "Steal"
    },
    {
        "tr":  "Süpürmek",
        "en":  "Sweep"
    },
    {
        "tr":  "Yüzmek",
        "en":  "Swim"
    },
    {
        "tr":  "Ayakta durmak",
        "en":  "Stand"
    },
    {
        "tr":  "Almak",
        "en":  "Take"
    },
    {
        "tr":  "Öğrenmek",
        "en":  "Teach"
    },
    {
        "tr":  "Ağlamak",
        "en":  "Tear"
    },
    {
        "tr":  "Söylemek",
        "en":  "Tell"
    },
    {
        "tr":  "Fırlatmak",
        "en":  "Throw"
    },
    {
        "tr":  "Anlamak",
        "en":  "Understand"
    },
    {
        "tr":  "Uyanmak",
        "en":  "Wake"
    },
    {
        "tr":  "Düşünmek",
        "en":  "Think"
    },
    {
        "tr":  "Giymek",
        "en":  "Wear"
    },
    {
        "tr":  "Kazanmak",
        "en":  "Win"
    },
    {
        "tr":  "Yazmak",
        "en":  "Write"
    },
    {
        "tr":  "Koşmak",
        "en":  "Run"
    },
    {
        "tr":  "Kurmak",
        "en":  "Set"
    },
    {
        "tr":  "Beyaz",
        "en":  "White"
    },
    {
        "tr":  "Siyah",
        "en":  "Black"
    },
    {
        "tr":  "Kırmızı",
        "en":  "Red"
    },
    {
        "tr":  "Yeşil",
        "en":  "Green"
    },
    {
        "tr":  "Mavi",
        "en":  "Blue"
    },
    {
        "tr":  "Altın",
        "en":  "Gold"
    },
    {
        "tr":  "Gümüş",
        "en":  "Silver"
    },
    {
        "tr":  "Turuncu",
        "en":  "Orange"
    },
    {
        "tr":  "Mor",
        "en":  "Purple"
    },
    {
        "tr":  "Kahverengi",
        "en":  "Brown"
    },
    {
        "tr":  "Sarı",
        "en":  "Yellow"
    },
    {
        "tr":  "Pembe",
        "en":  "Pink"
    },
    {
        "tr":  "Gri",
        "en":  "Grey"
    },
    {
        "tr":  "Koyu",
        "en":  "Dark"
    },
    {
        "tr":  "Açık",
        "en":  "Light"
    },
    {
        "tr":  "Anne",
        "en":  "Mother"
    },
    {
        "tr":  "Baba",
        "en":  "Father"
    },
    {
        "tr":  "Kız Kardeş",
        "en":  "Sister"
    },
    {
        "tr":  "Erkek Kardeş",
        "en":  "Brother"
    },
    {
        "tr":  "Amca",
        "en":  "Uncle"
    },
    {
        "tr":  "Hala",
        "en":  "Aunt"
    },
    {
        "tr":  "Büyükanne",
        "en":  "Grandmother"
    },
    {
        "tr":  "Büyükbaba",
        "en":  "Grandfather"
    },
    {
        "tr":  "Ebeveyn",
        "en":  "Parents"
    },
    {
        "tr":  "Koca",
        "en":  "Husband"
    },
    {
        "tr":  "Eş",
        "en":  "Wife"
    },
    {
        "tr":  "Eş",
        "en":  "Spouse"
    },
    {
        "tr":  "Gelin",
        "en":  "Bride"
    },
    {
        "tr":  "Damat",
        "en":  "Groom"
    },
    {
        "tr":  "Kuzen",
        "en":  "Cousin"
    },
    {
        "tr":  "Kardeş",
        "en":  "Sibling"
    },
    {
        "tr":  "Yaşça Büyük",
        "en":  "Older"
    },
    {
        "tr":  "Yaşça Küçük",
        "en":  "Younger"
    },
    {
        "tr":  "Çocuk",
        "en":  "Child"
    },
    {
        "tr":  "Erkek Çocuk",
        "en":  "Son"
    },
    {
        "tr":  "Kız Çocuk",
        "en":  "Daughter"
    },
    {
        "tr":  "Erkek Torun",
        "en":  "Grandson"
    },
    {
        "tr":  "Evli",
        "en":  "Married"
    },
    {
        "tr":  "Nişanlı",
        "en":  "Engaged"
    },
    {
        "tr":  "Boşanmış",
        "en":  "Divorced"
    },
    {
        "tr":  "Baş",
        "en":  "Head"
    },
    {
        "tr":  "Saç",
        "en":  "Hair"
    },
    {
        "tr":  "Kulak",
        "en":  "Ear"
    },
    {
        "tr":  "Göz",
        "en":  "Eye"
    },
    {
        "tr":  "Kaş",
        "en":  "Eyebrow"
    },
    {
        "tr":  "Kirpik",
        "en":  "Eyelash"
    },
    {
        "tr":  "Burun",
        "en":  "Nose"
    },
    {
        "tr":  "Ağız",
        "en":  "Mouth"
    },
    {
        "tr":  "Diş",
        "en":  "Tooth"
    },
    {
        "tr":  "Dil",
        "en":  "Tongue"
    },
    {
        "tr":  "Yanak",
        "en":  "Cheek"
    },
    {
        "tr":  "Çene",
        "en":  "Chin"
    },
    {
        "tr":  "Sakal",
        "en":  "Beard"
    },
    {
        "tr":  "Boyun",
        "en":  "Neck"
    },
    {
        "tr":  "Omuz",
        "en":  "Shoulder"
    },
    {
        "tr":  "Kol",
        "en":  "Arm"
    },
    {
        "tr":  "Dirsek",
        "en":  "Elbow"
    },
    {
        "tr":  "El Bileği",
        "en":  "Wrist"
    },
    {
        "tr":  "El",
        "en":  "Hand"
    },
    {
        "tr":  "El Parmağı",
        "en":  "Finger"
    },
    {
        "tr":  "Ayak Parmağı",
        "en":  "Toe"
    },
    {
        "tr":  "Tırnak",
        "en":  "Nail"
    },
    {
        "tr":  "Bacak",
        "en":  "Leg"
    },
    {
        "tr":  "Diz",
        "en":  "Knee"
    },
    {
        "tr":  "Ayak",
        "en":  "Foot"
    },
    {
        "tr":  "Sırt",
        "en":  "Back"
    },
    {
        "tr":  "Bel",
        "en":  "Waist"
    },
    {
        "tr":  "Mide",
        "en":  "Stomach"
    },
    {
        "tr":  "Kalp",
        "en":  "Heart"
    },
    {
        "tr":  "Pazartesi",
        "en":  "Monday"
    },
    {
        "tr":  "Salı",
        "en":  "Tuesday"
    },
    {
        "tr":  "Çarşamba",
        "en":  "Wednesday"
    },
    {
        "tr":  "Perşembe",
        "en":  "Thursday"
    },
    {
        "tr":  "Cuma",
        "en":  "Friday"
    },
    {
        "tr":  "Cumartesi",
        "en":  "Saturday"
    },
    {
        "tr":  "Pazar",
        "en":  "Sunday"
    },
    {
        "tr":  "Ocak",
        "en":  "January"
    },
    {
        "tr":  "Şubat",
        "en":  "February"
    },
    {
        "tr":  "Mart",
        "en":  "March"
    },
    {
        "tr":  "Nisan",
        "en":  "April"
    },
    {
        "tr":  "Mayıs",
        "en":  "May"
    },
    {
        "tr":  "Haziran",
        "en":  "June"
    },
    {
        "tr":  "Temmuz",
        "en":  "July"
    },
    {
        "tr":  "Ağustos",
        "en":  "August"
    },
    {
        "tr":  "Eylül",
        "en":  "September"
    },
    {
        "tr":  "Ekim",
        "en":  "October"
    },
    {
        "tr":  "Kasım",
        "en":  "November"
    },
    {
        "tr":  "Aralık",
        "en":  "December"
    },
    {
        "tr":  "Kış",
        "en":  "Winter"
    },
    {
        "tr":  "İlkbahar",
        "en":  "Spring"
    },
    {
        "tr":  "Yaz",
        "en":  "Summer"
    },
    {
        "tr":  "Sonbahar",
        "en":  "Autumn"
    },
    {
        "tr":  "Bir",
        "en":  "One"
    },
    {
        "tr":  "İki",
        "en":  "Two"
    },
    {
        "tr":  "Üç",
        "en":  "Three"
    },
    {
        "tr":  "Dört",
        "en":  "Four"
    },
    {
        "tr":  "Beş",
        "en":  "Five"
    },
    {
        "tr":  "Altı",
        "en":  "Six"
    },
    {
        "tr":  "Yedi",
        "en":  "Seven"
    },
    {
        "tr":  "Sekiz",
        "en":  "Eight"
    },
    {
        "tr":  "Dokuz",
        "en":  "Nine"
    },
    {
        "tr":  "On",
        "en":  "Ten"
    },
    {
        "tr":  "On bir",
        "en":  "Eleven"
    },
    {
        "tr":  "On iki",
        "en":  "Twelve"
    },
    {
        "tr":  "On üç",
        "en":  "Thirteen"
    },
    {
        "tr":  "On dört",
        "en":  "Fourteen"
    },
    {
        "tr":  "On beş",
        "en":  "Fifteen"
    },
    {
        "tr":  "Yirmi dört",
        "en":  "Twenty four"
    },
    {
        "tr":  "Yirmi beş",
        "en":  "Twenty five"
    },
    {
        "tr":  "Yirmi altı",
        "en":  "Twenty six"
    },
    {
        "tr":  "Yirmi yedi",
        "en":  "Twenty seven"
    },
    {
        "tr":  "Yirmi sekiz",
        "en":  "Twenty eight"
    },
    {
        "tr":  "Yirmi dokuz",
        "en":  "Twenty nine"
    },
    {
        "tr":  "Otuz",
        "en":  "Thirty"
    },
    {
        "tr":  "Otuz bir",
        "en":  "Thirty one"
    },
    {
        "tr":  "Otuz iki",
        "en":  "Thirty two"
    },
    {
        "tr":  "Otuz üç",
        "en":  "Thirty three"
    },
    {
        "tr":  "Otuz dört",
        "en":  "Thirty four"
    },
    {
        "tr":  "Otuz beş",
        "en":  "Thirty five"
    },
    {
        "tr":  "Otuz altı",
        "en":  "Thirty six"
    },
    {
        "tr":  "Otuz yedi",
        "en":  "Thirty seven"
    },
    {
        "tr":  "Otuz sekiz",
        "en":  "Thirty eight"
    },
    {
        "tr":  "Otuz dokuz",
        "en":  "Thirty nine"
    },
    {
        "tr":  "Kırk",
        "en":  "Forty"
    },
    {
        "tr":  "Kırk bir",
        "en":  "Forty one"
    },
    {
        "tr":  "Kırk iki",
        "en":  "Forty two"
    },
    {
        "tr":  "Kırk üç",
        "en":  "Forty three"
    },
    {
        "tr":  "Kırk dört",
        "en":  "Forty four"
    },
    {
        "tr":  "Kırk beş",
        "en":  "Forty five"
    },
    {
        "tr":  "Kırk altı",
        "en":  "Forty six"
    },
    {
        "tr":  "Kırk yedi",
        "en":  "Forty seven"
    },
    {
        "tr":  "Kırk sekiz",
        "en":  "Forty eight"
    },
    {
        "tr":  "Kırk dokuz",
        "en":  "Forty nine"
    },
    {
        "tr":  "Elli",
        "en":  "Fifty"
    },
    {
        "tr":  "Elli bir",
        "en":  "Fifty one"
    },
    {
        "tr":  "Elli iki",
        "en":  "Fifty two"
    },
    {
        "tr":  "Elli üç",
        "en":  "Fifty three"
    },
    {
        "tr":  "Elli dört",
        "en":  "Fifty four"
    },
    {
        "tr":  "Elli beş",
        "en":  "Fifty five"
    },
    {
        "tr":  "Elli altı",
        "en":  "Fifty six"
    },
    {
        "tr":  "Elli yedi",
        "en":  "Fifty seven"
    },
    {
        "tr":  "Elli sekiz",
        "en":  "Fifty eight"
    },
    {
        "tr":  "Elli dokuz",
        "en":  "Fifty nine"
    },
    {
        "tr":  "Altmış",
        "en":  "Sixty"
    },
    {
        "tr":  "Altmış bir",
        "en":  "Sixty one"
    },
    {
        "tr":  "Altmış iki",
        "en":  "Sixty two"
    },
    {
        "tr":  "Altmış üç",
        "en":  "Sixty three"
    },
    {
        "tr":  "Altmış dört",
        "en":  "Sixty four"
    },
    {
        "tr":  "Altmış beş",
        "en":  "Sixty five"
    },
    {
        "tr":  "Altmış altı",
        "en":  "Sixty six"
    },
    {
        "tr":  "Altmış yedi",
        "en":  "Sixty seven"
    },
    {
        "tr":  "Altmış sekiz",
        "en":  "Sixty eight"
    },
    {
        "tr":  "Altmış dokuz",
        "en":  "Sixty nine"
    },
    {
        "tr":  "Yetmiş",
        "en":  "Seventy"
    },
    {
        "tr":  "Yetmiş bir",
        "en":  "Seventy one"
    },
    {
        "tr":  "Yetmiş iki",
        "en":  "Seventy two"
    },
    {
        "tr":  "Yetmiş üç",
        "en":  "Seventy three"
    },
    {
        "tr":  "Yetmiş dört",
        "en":  "Seventy four"
    },
    {
        "tr":  "Yetmiş beş",
        "en":  "Seventy five"
    },
    {
        "tr":  "Yetmiş altı",
        "en":  "Seventy six"
    },
    {
        "tr":  "Yetmiş yedi",
        "en":  "Seventy seven"
    },
    {
        "tr":  "Yetmiş sekiz",
        "en":  "Seventy eight"
    },
    {
        "tr":  "Yetmiş dokuz",
        "en":  "Seventy nine"
    },
    {
        "tr":  "Seksen",
        "en":  "Eighty"
    },
    {
        "tr":  "Seksen bir",
        "en":  "Eighty one"
    },
    {
        "tr":  "Seksen iki",
        "en":  "Eighty two"
    },
    {
        "tr":  "Seksen üç",
        "en":  "Eighty three"
    },
    {
        "tr":  "Seksen dört",
        "en":  "Eighty four"
    },
    {
        "tr":  "Seksen beş",
        "en":  "Eighty five"
    },
    {
        "tr":  "Seksen altı",
        "en":  "Eighty six"
    },
    {
        "tr":  "Seksen yedi",
        "en":  "Eighty seven"
    },
    {
        "tr":  "Seksen sekiz",
        "en":  "Eighty eight"
    },
    {
        "tr":  "Seksen dokuz",
        "en":  "Eighty nine"
    },
    {
        "tr":  "Doksan",
        "en":  "Ninety"
    },
    {
        "tr":  "Doksan bir",
        "en":  "Ninety one"
    },
    {
        "tr":  "Doksan iki",
        "en":  "Ninety two"
    },
    {
        "tr":  "Doksan üç",
        "en":  "Ninety three"
    },
    {
        "tr":  "Doksan dört",
        "en":  "Ninety four"
    },
    {
        "tr":  "Doksan beş",
        "en":  "Ninety five"
    },
    {
        "tr":  "Doksan altı",
        "en":  "Ninety six"
    },
    {
        "tr":  "Doksan yedi",
        "en":  "Ninety seven"
    },
    {
        "tr":  "Doksan sekiz",
        "en":  "Ninety eight"
    },
    {
        "tr":  "Doksan dokuz",
        "en":  "Ninety nine"
    },
    {
        "tr":  "Yüz",
        "en":  "One hundred"
    },
    {
        "tr":  "Kitaplar",
        "en":  "Books"
    },
    {
        "tr":  "Masalar",
        "en":  "Tables"
    },
    {
        "tr":  "Öğrenciler",
        "en":  "Students"
    },
    {
        "tr":  "Doktorlar",
        "en":  "Doctors"
    },
    {
        "tr":  "Erkek Çocuklar",
        "en":  "Boys"
    },
    {
        "tr":  "Kızlar",
        "en":  "Girls"
    },
    {
        "tr":  "Kapılar",
        "en":  "Doors"
    },
    {
        "tr":  "Pencereler",
        "en":  "Windows"
    },
    {
        "tr":  "Çantalar",
        "en":  "Bags"
    },
    {
        "tr":  "Fotoğraflar",
        "en":  "Photos"
    },
    {
        "tr":  "Anahtarlar",
        "en":  "Keys"
    },
    {
        "tr":  "Elbiseler",
        "en":  "Dresses"
    },
    {
        "tr":  "Sınıflar",
        "en":  "Classes"
    },
    {
        "tr":  "Patronlar",
        "en":  "Bosses"
    },
    {
        "tr":  "Fırçalar",
        "en":  "Brushes"
    },
    {
        "tr":  "Bulaşıklar",
        "en":  "Dishes"
    },
    {
        "tr":  "Kol Saatleri",
        "en":  "Watches"
    },
    {
        "tr":  "Tilkiler",
        "en":  "Foxes"
    },
    {
        "tr":  "Kutular",
        "en":  "Boxes"
    },
    {
        "tr":  "Domatesler",
        "en":  "Tomatoes"
    },
    {
        "tr":  "Patatesler",
        "en":  "Potatoes"
    },
    {
        "tr":  "Otobüsler",
        "en":  "Buses"
    },
    {
        "tr":  "Bebekler",
        "en":  "Babies"
    },
    {
        "tr":  "Şehirler",
        "en":  "Cities"
    },
    {
        "tr":  "Hanımefendiler",
        "en":  "Ladies"
    },
    {
        "tr":  "Kütüphaneler",
        "en":  "Libraries"
    },
    {
        "tr":  "Ülkeler",
        "en":  "Countries"
    },
    {
        "tr":  "Milliyetler",
        "en":  "Nationalities"
    },
    {
        "tr":  "Günlükler",
        "en":  "Diaries"
    },
    {
        "tr":  "Sözlükler",
        "en":  "Dictionaries"
    },
    {
        "tr":  "Kelebekler",
        "en":  "Butterflies"
    },
    {
        "tr":  "Mücevherler",
        "en":  "Jewelleries"
    },
    {
        "tr":  "Kurtlar",
        "en":  "Wolves"
    },
    {
        "tr":  "Kadın Eşler",
        "en":  "Wives"
    },
    {
        "tr":  "Atkılar",
        "en":  "Scarves"
    },
    {
        "tr":  "Raflar",
        "en":  "Shelves"
    },
    {
        "tr":  "Yapraklar",
        "en":  "Leaves"
    },
    {
        "tr":  "Bıçaklar",
        "en":  "Knives"
    },
    {
        "tr":  "Somunlar",
        "en":  "Loaves"
    },
    {
        "tr":  "Çocuklar",
        "en":  "Children"
    },
    {
        "tr":  "Her zaman",
        "en":  "Always"
    },
    {
        "tr":  "Genellikle",
        "en":  "Usually"
    },
    {
        "tr":  "Genel olarak",
        "en":  "Generally"
    },
    {
        "tr":  "Sık sık",
        "en":  "Often"
    },
    {
        "tr":  "Sıkça",
        "en":  "Frequently"
    },
    {
        "tr":  "Bazen",
        "en":  "Sometimes"
    },
    {
        "tr":  "Nadiren",
        "en":  "Rarely"
    },
    {
        "tr":  "Ender",
        "en":  "Seldom"
    },
    {
        "tr":  "Asla",
        "en":  "Never"
    },
    {
        "tr":  "Neredeyse hiç",
        "en":  "Hardly ever"
    },
    {
        "tr":  "Hangi",
        "en":  "Which"
    },
    {
        "tr":  "Nasıl",
        "en":  "How"
    },
    {
        "tr":  "Kaç yaşında",
        "en":  "How old"
    },
    {
        "tr":  "Ne kadar süre",
        "en":  "How long"
    },
    {
        "tr":  "Boyu ne kadar",
        "en":  "How tall"
    },
    {
        "tr":  "Ne kadar",
        "en":  "How much"
    },
    {
        "tr":  "Kaç tane",
        "en":  "How many"
    },
    {
        "tr":  "Ne sıklıkla",
        "en":  "How often"
    },
    {
        "tr":  "Ne tür",
        "en":  "What kind of"
    },
    {
        "tr":  "Ne zaman",
        "en":  "When"
    },
    {
        "tr":  "Nerede",
        "en":  "Where"
    },
    {
        "tr":  "Neden",
        "en":  "Why"
    },
    {
        "tr":  "Kim",
        "en":  "Who"
    },
    {
        "tr":  "Kime",
        "en":  "Whom"
    },
    {
        "tr":  "Kimin",
        "en":  "Whose"
    },
    {
        "tr":  "Saat kaç",
        "en":  "What time"
    },
    {
        "tr":  "Ne",
        "en":  "What"
    }
];
