# T.A.R.A.L.L.O.
Trabiccolo Amministrazione Rottami e Assistenza, Legalmente-noto-come L'inventario Opportuno

**Warning**: this repository is archived and won't receive further developement as the "client" is now rendered server-side. For the current, actively developed and maintained version see [WEEE-Open/tarallo](https://github.com/WEEE-Open/tarallo).

---

Client in JS; basato su ~~Backbone.js, anche se è un po' passato di moda, ma è un software "molto collaudato" e con una
documentazione ben fatta.~~ JS puro, senza framework e librerie all'infuori di quella standard fornita dai browser.

## Build
Installare Node.JS e npm e dare il comando `npm install`.

I file JS devono essere concatenati prima dell'uso: utilizzare `grunt concat`.
È disponibile anche `grunt watch` per fare modifiche in diretta e provarle.
 
Se si aggiungono nuovi file vanno indicati anche in Gruntfile.js,
in quanto vanno inclusi in ordine.  
Il sistema è quantomai bizantino, ma era più veloce fare questo che
configurare Webpack o Browserify.
