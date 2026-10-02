document.addEventListener('DOMContentLoaded', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const navbar = document.getElementById('navbar');

    // 1. Navigation material appears once content scrolls beneath it
    // 2. Timeline progress follows the reader through the 7 days
    const timeline = document.querySelector('.timeline');
    const timelineItems = document.querySelectorAll('.timeline-item');
    let ticking = false;

    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 8);

        if (timeline) {
            const rect = timeline.getBoundingClientRect();
            const focus = window.innerHeight * 0.6;
            const progress = Math.min(Math.max((focus - rect.top) / rect.height, 0), 1);
            timeline.style.setProperty('--progress', reduceMotion ? 1 : progress.toFixed(3));
            timelineItems.forEach(item => {
                const marker = item.querySelector('.timeline-marker');
                item.classList.toggle('reached', marker.getBoundingClientRect().top < focus);
            });
        }
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });
    onScroll();

    // 3. Staggered reveals: siblings inside [data-stagger] enter one after another
    document.querySelectorAll('[data-stagger]').forEach(group => {
        const step = parseInt(group.dataset.stagger, 10) || 80;
        [...group.children]
            .filter(child => child.classList.contains('reveal'))
            .forEach((child, i) => child.style.setProperty('--d', `${i * step}ms`));
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            el.classList.add('in');
            observer.unobserve(el);

            // Hand control back to the element's own hover transitions once revealed
            const delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0;
            setTimeout(() => {
                el.classList.remove('reveal', 'reveal-scale', 'in');
                el.style.removeProperty('--d');
            }, delay + 650);

            if (el.dataset.count) countUp(el);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // 4. Count-up for the headline statistic
    function countUp(el) {
        const target = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suffix || '';
        if (reduceMotion) return;
        const duration = 1400;
        const start = performance.now();
        const easeOut = t => 1 - Math.pow(1 - t, 4);
        const frame = now => {
            const t = Math.min((now - start) / duration, 1);
            el.textContent = Math.round(easeOut(t) * target) + suffix;
            if (t < 1) requestAnimationFrame(frame);
        };
        el.textContent = '0' + suffix;
        requestAnimationFrame(frame);
    }

    // 5. Chat conversation: plays once when the mockup is on screen
    const chatBody = document.querySelector('.chat-body');
    const chatStatus = document.querySelector('.chat-status');

    if (chatBody && !reduceMotion) {
        const messages = [...chatBody.querySelectorAll('.message')];
        chatBody.classList.add('chat-ready');

        const typing = document.createElement('div');
        typing.className = 'message outgoing typing';
        typing.setAttribute('aria-hidden', 'true');
        typing.innerHTML = '<span></span><span></span><span></span>';

        // Show/remove bubbles, sliding the earlier ones up smoothly (FLIP)
        const update = (change) => {
            const before = [...chatBody.children].filter(c => c.offsetParent);
            const tops = new Map(before.map(c => [c, c.getBoundingClientRect().top]));
            change();
            [...chatBody.children].filter(c => c.offsetParent).forEach(c => {
                if (tops.has(c)) {
                    const delta = tops.get(c) - c.getBoundingClientRect().top;
                    if (delta) {
                        c.animate(
                            [{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }],
                            { duration: 350, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
                        );
                    }
                } else {
                    c.animate(
                        [{ opacity: 0, transform: 'translateY(8px) scale(0.96)' }, { opacity: 1, transform: 'none' }],
                        { duration: 380, easing: 'cubic-bezier(0.34, 1.4, 0.64, 1)' }
                    );
                }
            });
        };

        const show = msg => update(() => msg.classList.add('shown'));
        const startTyping = () => {
            chatStatus.textContent = 'Escribiendo…';
            update(() => chatBody.appendChild(typing));
        };
        const reply = msg => {
            chatStatus.textContent = 'En línea';
            update(() => {
                typing.remove();
                msg.classList.add('shown');
            });
        };

        const script = [
            [500, () => show(messages[0])],
            [1100, startTyping],
            [2500, () => reply(messages[1])],
            [4000, () => show(messages[2])],
            [4600, startTyping],
            [5800, () => reply(messages[3])],
        ];

        const chatObserver = new IntersectionObserver((entries, observer) => {
            if (!entries[0].isIntersecting) return;
            observer.disconnect();
            script.forEach(([delay, step]) => setTimeout(step, delay));
        }, { threshold: 0.4 });
        chatObserver.observe(chatBody);
    }

    // 6. Smooth scroll for internal links, offset by the fixed nav
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = targetId && document.getElementById(targetId);
            if (!targetElement) return;
            e.preventDefault();
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navbar.offsetHeight;
            window.scrollTo({ top: targetPosition, behavior: reduceMotion ? 'auto' : 'smooth' });
        });
    });

    // 7. Dark Mode Toggle
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleIcon = themeToggleBtn.querySelector('i');

    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        themeToggleIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');

        if (isDarkMode) {
            themeToggleIcon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleIcon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });
});
