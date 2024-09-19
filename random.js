const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const throttle = (func, limit) => {
    let lastFunc;
    let lastRan;
    return function(...args) {
        if (!lastRan) {
            func(...args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func(...args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    };
};

const handleNavbarScroll = (() => {
    const navbar = document.querySelector('.navbar');
    const scrollThreshold = 50;
    let lastScrollY = 0;
    
    return throttle(() => {
        const scrollY = window.scrollY;
        const scrollDirection = scrollY > lastScrollY ? 'down' : 'up';
        const scrollDelta = Math.abs(scrollY - lastScrollY);
        
        if (scrollY > scrollThreshold) {
            navbar.classList.add('scrolled');
            if (scrollDirection === 'down' && scrollDelta > 10) {
                navbar.classList.add('hide');
            } else if (scrollDirection === 'up') {
                navbar.classList.remove('hide');
            }
        } else {
            navbar.classList.remove('scrolled', 'hide');
        }
        
        lastScrollY = scrollY;
    }, 100);
})();

window.addEventListener('scroll', handleNavbarScroll);

// Enhanced smooth scroll with customizable easing and interrupt handling
const smoothScroll = (() => {
    const defaultOptions = {
        duration: 1000,
        easing: t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
        offset: 0,
        cancelOnUserAction: true
    };

    let abortController = null;

    return (target, customOptions = {}) => {
        const options = { ...defaultOptions, ...customOptions };
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        abortController?.abort();
        abortController = new AbortController();

        return new Promise((resolve, reject) => {
            const startTime = performance.now();
            const startPosition = window.pageYOffset;
            const targetPosition = targetElement.getBoundingClientRect().top + startPosition + options.offset;
            const distance = targetPosition - startPosition;

            const animation = currentTime => {
                const elapsedTime = currentTime - startTime;
                if (elapsedTime >= options.duration) {
                    window.scrollTo(0, targetPosition);
                    resolve();
                    return;
                }

                const progress = options.easing(elapsedTime / options.duration);
                window.scrollTo(0, startPosition + distance * progress);
                requestAnimationFrame(animation);
            };

            if (options.cancelOnUserAction) {
                const cancelEvents = ['mousedown', 'wheel', 'touchstart'];
                cancelEvents.forEach(event => {
                    document.addEventListener(event, () => {
                        abortController.abort();
                        reject(new Error('Scroll cancelled by user action'));
                    }, { signal: abortController.signal, once: true });
                });
            }

            requestAnimationFrame(animation);
        });
    };
})();

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        smoothScroll(this.getAttribute('href'), { offset: -60 })
            .catch(error => console.warn('Smooth scroll interrupted:', error.message));
    });
});

// Advanced GSAP Animations with performance optimizations
gsap.registerPlugin(ScrollTrigger);

// Reusable animation function with enhanced customization
const createAnimation = (elements, options = {}) => {
    const defaults = {
        trigger: elements,
        start: 'top 80%',
        end: 'bottom 20%',
        toggleActions: 'play none none reverse',
        markers: false,
        duration: 1,
        opacity: 0,
        y: 50,
        x: 0,
        scale: 1,
        rotation: 0,
        ease: 'power3.out',
        stagger: 0,
        delay: 0,
        onEnter: null,
        onLeave: null,
        onEnterBack: null,
        onLeaveBack: null
    };

    const mergedOptions = { ...defaults, ...options };
    const { trigger, start, end, toggleActions, markers, ...animationOptions } = mergedOptions;

    return gsap.from(elements, {
        scrollTrigger: {
            trigger,
            start,
            end,
            toggleActions,
            markers,
            onEnter: mergedOptions.onEnter,
            onLeave: mergedOptions.onLeave,
            onEnterBack: mergedOptions.onEnterBack,
            onLeaveBack: mergedOptions.onLeaveBack
        },
        ...animationOptions
    });
};

// Hero section animations with advanced stagger and custom callbacks
const heroElements = gsap.utils.toArray(['.hero h1', '.hero p', '.hero .cta-button']);
createAnimation(heroElements, {
    y: 100,
    stagger: 0.2,
    onEnter: elements => elements.forEach(el => el.classList.add('active')),
    onLeave: elements => elements.forEach(el => el.classList.remove('active'))
});

// Skills section animations with dynamic layout adjustment
const skillItems = gsap.utils.toArray('.skill-item');
createAnimation(skillItems, {
    opacity: 0,
    scale: 0.8,
    stagger: {
        amount: 0.8,
        from: "center",
        ease: "power2.inOut"
    },
    onComplete: () => {
        const container = document.querySelector('.skills-container');
        gsap.to(container, { duration: 0.5, height: 'auto', ease: 'power2.inOut' });
    }
});

// Experience timeline animations with scroll-based progress indicator
const timelineItems = gsap.utils.toArray('.timeline-item');
const timelineProgress = document.createElement('div');
timelineProgress.classList.add('timeline-progress');
document.querySelector('.timeline').prepend(timelineProgress);

timelineItems.forEach((item, index) => {
    createAnimation(item, {
        x: index % 2 === 0 ? -50 : 50,
        opacity: 0,
        delay: 0.1 * index,
        onEnter: () => {
            gsap.to(timelineProgress, {
                height: `${((index + 1) / timelineItems.length) * 100}%`,
                duration: 0.3,
                ease: 'power2.inOut'
            });
        }
    });
});

// Projects animations with advanced hover effects and lazy loading
const projectCards = gsap.utils.toArray('.project-card');
projectCards.forEach(card => {
    createAnimation(card, { y: 50, opacity: 0 });
    
    const tl = gsap.timeline({ paused: true });
    tl.to(card, { scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', duration: 0.3 })
      .to(card.querySelector('img'), { scale: 1.1, duration: 0.3 }, 0)
      .to(card.querySelector('.project-info'), { y: -10, duration: 0.3 }, 0);
    
    card.addEventListener('mouseenter', () => tl.play());
    card.addEventListener('mouseleave', () => tl.reverse());

    // Lazy load images
    const img = card.querySelector('img');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    }, { threshold: 0.1 });
    observer.observe(img);
});

// Contact form animations with form validation and submission handling
const contactForm = document.querySelector('.contact-form');
const formElements = contactForm.children;

createAnimation(formElements, {
    y: 20,
    opacity: 0,
    stagger: 0.1,
    ease: 'back.out(1.7)'
});

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(contactForm);
    const submitButton = contactForm.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';
    
    try {
        const response = await fetch('/submit-form', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            gsap.to(contactForm, {
                opacity: 0,
                y: -50,
                duration: 0.5,
                onComplete: () => {
                    contactForm.innerHTML = '<h3>Thank you for your message!</h3>';
                    gsap.from(contactForm.children, { opacity: 0, y: 50, duration: 0.5 });
                }
            });
        } else {
            throw new Error('Form submission failed');
        }
    } catch (error) {
        console.error('Error:', error);
        submitButton.textContent = 'Error. Try Again';
    } finally {
        submitButton.disabled = false;
    }
});

// Initialize custom cursor
const cursor = document.createElement('div');
cursor.classList.add('custom-cursor');
document.body.appendChild(cursor);

const updateCursor = (e) => {
    gsap.to(cursor, { 
        x: e.clientX, 
        y: e.clientY, 
        duration: 0.1,
        ease: 'power2.out'
    });
};

document.addEventListener('mousemove', updateCursor);

const cursorEnter = () => gsap.to(cursor, { scale: 1.5, duration: 0.3 });
const cursorLeave = () => gsap.to(cursor, { scale: 1, duration: 0.3 });

document.querySelectorAll('a, button, .interactive').forEach(el => {
    el.addEventListener('mouseenter', cursorEnter);
    el.addEventListener('mouseleave', cursorLeave);
});

// Add a global loading indicator
const loadingOverlay = document.createElement('div');
loadingOverlay.classList.add('loading-overlay');
loadingOverlay.innerHTML = '<div class="loader"></div>';
document.body.appendChild(loadingOverlay);

window.addEventListener('load', () => {
    gsap.to(loadingOverlay, { 
        opacity: 0, 
        duration: 0.5, 
        onComplete: () => loadingOverlay.remove() 
    });
});

// Hamburger menu animation
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const menuItems = document.querySelectorAll('.nav-links a');

// Create GSAP timeline for menu animation
const menuTl = gsap.timeline({ paused: true });

// Animate hamburger to X
menuTl.to('.hamburger .fa-bars', { duration: 0.2, opacity: 0, y: 10 })
      .to('.hamburger .fa-times', { duration: 0.2, opacity: 1, y: 0 }, "-=0.2")
      .to('.hamburger', { duration: 0.2, rotation: 360 }, "-=0.2");

// Animate nav links appearance
menuTl.to(navLinks, { 
    duration: 0.5, 
    clipPath: 'circle(100% at center)', 
    ease: "power4.inOut" 
}, "-=0.3");

// Stagger animate menu items
menuTl.from(menuItems, {
    duration: 0.4,
    opacity: 0,
    y: 20,
    stagger: 0.1,
    ease: "back.out(1.7)"
}, "-=0.3");

// Toggle menu and play animation
hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('active')) {
        menuTl.reverse();
    } else {
        menuTl.play();
    }
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Smooth section transitions
menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = item.getAttribute('href');
        const targetSection = document.querySelector(targetId);

        // Close menu
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
        menuTl.reverse();

        // Scroll to section with smooth animation
        gsap.to(window, {
            duration: 1,
            scrollTo: {
                y: targetSection,
                offsetY: 60
            },
            ease: "power3.inOut"
        });

        // Animate section appearance
        gsap.from(targetSection, {
            duration: 0.8,
            opacity: 0,
            y: 50,
            ease: "power3.out",
            scrollTrigger: {
                trigger: targetSection,
                start: "top 80%",
                end: "bottom 20%",
                toggleActions: "play none none reverse"
            }
        });
    });
});