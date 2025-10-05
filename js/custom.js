---
layout: null
---
window.addEventListener("load", function() {
    // to get current year
    function getYear() {
        var currentDate = new Date();
        var currentYear = currentDate.getFullYear();
        document.querySelector("#displayYear").innerHTML = currentYear;
    }

    getYear();


    // isotope js
    setTimeout(() => {
  

    $('.filters_menu li').click(function() {
        $('.filters_menu li').removeClass('active');
        $(this).addClass('active');

        var data = $(this).attr('data-filter');
        $grid.isotope({
            filter: data
        })
    });

    $('.search-container .search-input').on("input", function() {
        var data = this.value.toLowerCase()
        $grid.isotope({
            filter: function() {
                let e = this.querySelector('header') || this.querySelector('h4')
                return e.textContent.toLowerCase().includes(data)
            }
        })
    });

    var $grid = $(".grid").isotope({
        itemSelector: ".all",
        percentPosition: false,
        masonry: {
            columnWidth: ".all"
        }
    })
}, 1000);


    // client section owl carousel
    $(".client_owl-carousel").owlCarousel({
        loop: true,
        margin: 0,
        dots: false,
        nav: true,
        navText: [],
        autoplay: true,
        autoplayHoverPause: true,
        navText: [
            '<i class="fa fa-angle-left" aria-hidden="true"></i>',
            '<i class="fa fa-angle-right" aria-hidden="true"></i>'
        ],
        responsive: {
            0: {
                items: 1
            },
            768: {
                items: 2
            },
            1000: {
                items: 4
            }
        }
    });

})


async function fetchCacheAndNetwork(url, callback) {
  // 1. Primero obtenemos los datos de la caché (cache-only)
    const cacheResponse = await fetch(url, { headers: { 'x-cache-strategy': 'cache-only' }     });
    if (cacheResponse.ok) {
        let data = await cacheResponse.json()
        callback(data);
    }

  // 2. Luego, realizamos un fetch con network-first para obtener los datos más recientes
    const networkResponse = await fetch(url, { headers: { 'x-cache-strategy': 'network-first' } });
    if (networkResponse.ok) {
        let data = await networkResponse.json()
        callback(data);
    }
}



// prettier-ignore
{% include module tag='script' %}


function vueMount() {
    vueApp.$delimiters = ['[[', ']]']
    PetiteVue.createApp(vueApp).mount()
}