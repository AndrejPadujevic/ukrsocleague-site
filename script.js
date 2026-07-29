const btnTop = document.getElementById("scroll-to-top");
        const btnBottom = document.getElementById("scroll-to-bottom");
        
        let lastScrollTop = 0;
        
        window.addEventListener("scroll", function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            let windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        
            
            if (scrollTop < lastScrollTop && scrollTop > 200) {
                btnTop.classList.add("show");
            } else {
                btnTop.classList.remove("show");
            }
        
        
            if (scrollTop > lastScrollTop && scrollTop < windowHeight - 200) {
                btnBottom.classList.add("show");
            } else {
                btnBottom.classList.remove("show");
            }
        
            lastScrollTop = scrollTop;
        });
        
        
        btnTop.addEventListener("click", function() {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
        
        btnBottom.addEventListener("click", function() {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth"
            });
        });
