document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it has faded in
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Select all elements with the fade-in class
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // Optional: Add a smooth parallax effect to the background orbs on mousemove
    const orbs = document.querySelectorAll('.orb');
    
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        
        orbs.forEach((orb, index) => {
            const speed = (index + 1) * 20;
            const xOffset = (window.innerWidth / 2 - e.pageX) / speed;
            const yOffset = (window.innerHeight / 2 - e.pageY) / speed;
            
            // We combine the base animation float by modifying the margins or translate using CSS variables
            orb.style.transform = `translate(${xOffset}px, ${yOffset}px)`;
        });
    });
});
