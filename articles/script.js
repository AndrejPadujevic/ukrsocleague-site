const btnTop = document.getElementById("scroll-to-top");
        const btnBottom = document.getElementById("scroll-to-bottom");
        
        let lastScrollTop = 0;
        
        window.addEventListener("scroll", function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            let windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        
            // 1. Логіка для кнопки "Вгору" (показуємо, коли гортаємо вгору і ми не на самому верху)
            if (scrollTop < lastScrollTop && scrollTop > 200) {
                btnTop.classList.add("show");
            } else {
                btnTop.classList.remove("show");
            }
        
            // 2. Логіка для кнопки "Вниз" (показуємо, коли гортаємо вниз і ми далеко від низу)
            if (scrollTop > lastScrollTop && scrollTop < windowHeight - 200) {
                btnBottom.classList.add("show");
            } else {
                btnBottom.classList.remove("show");
            }
        
            lastScrollTop = scrollTop;
        });
        
        // Функція для скролу вгору
        btnTop.addEventListener("click", function() {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
        
        // Функція для скролу вниз
        btnBottom.addEventListener("click", function() {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth"
            });
        });
