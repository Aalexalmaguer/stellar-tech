document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation scroll effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const scrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once animated
                // observer.unobserve(entry.target);
                
                // If it's the hero section, trigger the chat messages animation
                if (entry.target.classList.contains('hero-content')) {
                    const messages = document.querySelectorAll('.animate-msg');
                    messages.forEach(msg => msg.classList.add('visible'));
                }
            }
        });
    }, observerOptions);

    // Select all elements to animate
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => scrollObserver.observe(el));

    // Initial trigger for hero section if already in view
    setTimeout(() => {
        const hero = document.querySelector('.hero-content');
        if (hero) {
            hero.classList.add('visible');
            const messages = document.querySelectorAll('.animate-msg');
            messages.forEach(msg => msg.classList.add('visible'));
        }
    }, 100);

    // 3. Smooth scroll mapping for internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    
    internalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            if (!targetId) return;
            
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});
