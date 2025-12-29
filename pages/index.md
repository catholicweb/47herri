---
title: Ongi etorri
image: /media/hero-bg.webp

sections:
  - _block: calendar
    title: "Próximas celebraciones"
    filter: "byday:empty"
    order: ["title", "dates", "", "times", "locations+rrule-byday+language-euskaraz"]
  - _block: calendar
    title: "Horario de Misas"
    filter: "mass"
    order: ["weekday", "times", "", "locations", "byday-weekday+byweek+language-euskaraz"]
  - _block: calendar
    title: "Otros eventos periódicos"
    filter: "!byday:empty&!mass"
    order: ["title", "locations", "", "times", "byday+byweek+language-euskaraz"]
  - _block: video-channel
    title: Eguneroko Meza
    filter: ""
  - _block: townGrid
    title: Gure herriak
    category: "pages"
    filters: ["Todos", "Larraun", "Urumea", "Leitzaran", "Basaburua", "Araitz", "Imotz"]
  - _block: team
    title: Gure apezak
  - _block: text
    title: Gure pastoral barrutia
    tags: dark
    html: >-
      2019an Iruña-Tuterako elizbarrutian pastoral barrutiak (erdaraz "UAP" direlakoak) eratu ziren, Nafarroako 700 parrokiak 36 pastoral barrutitan kontzentratuz. Berez helburua da pastoralki parroki bakarra osatuko balute bezala lan egitea. Apez talde bat egon beharko litzateke barruti osorako eta pastoral kontseilu bakarra sortu. Herri guztietako eliztarrek sentitu beharko lukete zirkunskripzio bereko partaide direla. Juridikoki eta ekonomikoki, ordea, parroki bakoitzak bere burujabetasuna mantentzen du.

      Eklesiastikoki gure pastoral barrutia Iruñako elizbarrutian dago, Mendialdeko zonalde pastoralean eta Aralarko artziprestaldean hain zuzen ere. Lurralde antolakuntza zibilari dagokionez, Nafarroako hamar udalerrietan gaude: LEITZA, ARESO, GOIZUETA, ARANO, ARAITZ, BETELU, LARRAUN, LEKUNBERRI, BASABURUA ETA IMOTZ.

      Une honetan hiru parroko in solidum aritzen gara aipatutako pastoral barrutian: Jesus Mari Sotil, Santiago Garisoain eta David Galarza, eta asteburutan beste hiru apez etortzen zaizkigu mezak ematen laguntzera: Joxe Mari Aleman, Pako Beloki eta Peio Etxabarri.

      ![](/media/about-img.webp)
  - _block: map
    title: Conócenos
---
