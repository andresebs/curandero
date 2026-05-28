document.addEventListener('DOMContentLoaded', () => {
    /* ===========================================
       REFERENCES
       =========================================== */
    const introContainer = document.getElementById('intro-container');
    const upperJaw = document.getElementById('upper-jaw');
    const lowerJaw = document.getElementById('lower-jaw');
    const titleLogo = document.getElementById('title-logo');
    const introGlow = document.getElementById('intro-glow');
    const scrollHint = document.getElementById('scroll-hint');
    const mainNav = document.getElementById('main-nav');
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    /* ===========================================
       CUSTOM CURSOR
       =========================================== */
    const customCursor = document.createElement('div');
    customCursor.id = 'custom-cursor';
    document.body.appendChild(customCursor);

    document.addEventListener('mousemove', (e) => {
        customCursor.style.left = e.clientX + 'px';
        customCursor.style.top = e.clientY + 'px';
    });

    document.addEventListener('mousedown', () => {
        customCursor.classList.add('clicked');
    });

    document.addEventListener('mouseup', () => {
        customCursor.classList.remove('clicked');
    });

    /* ===========================================
       INTRO ANIMATION (Only runs if intro exists)
       =========================================== */
    if (introContainer) {
        // Scroll thresholds
        const phase1End = 450;    // when mouths are fully open
        const phase2Start = 500;  // when fade out begins
        const phase2End = 900;    // when fade out is complete

        // Jaw positions (matches CSS starting positions)
        const upperStart = -52;
        const lowerStart = -48;
        const upperEnd = -100;
        const lowerEnd = 0;
        const lowerOffsetX = -2.0;

        function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

        function updateScrollAnimation() {
            let scrollY = window.scrollY || window.pageYOffset;

            // Phase 1: Jaws opening and logo appearing
            let p1Progress = Math.min(Math.max(scrollY / phase1End, 0), 1);
            let easeOut = easeOutCubic(p1Progress);

            let currentUpper = upperStart + ((upperEnd - upperStart) * easeOut);
            let currentLower = lowerStart + ((lowerEnd - lowerStart) * easeOut);

            if (upperJaw) upperJaw.style.transform = `translateY(${currentUpper}%)`;
            if (lowerJaw) lowerJaw.style.transform = `translate(${lowerOffsetX}%, ${currentLower}%)`;

            let logoScale = 0.6 + (0.4 * easeOut);
            if (titleLogo) {
                titleLogo.style.opacity = p1Progress;
                titleLogo.style.transform = `translate(-50%, -50%) scale(${logoScale})`;
            }
            if (introGlow) introGlow.style.opacity = easeOut * 0.7;

            // Hide scroll hint
            if (scrollHint) {
                if (scrollY > 50) scrollHint.classList.add('hidden');
                else scrollHint.classList.remove('hidden');
            }

            // Phase 2: Fade out intro to reveal content
            let p2Progress = 0;
            if (scrollY > phase2Start) {
                p2Progress = Math.min((scrollY - phase2Start) / (phase2End - phase2Start), 1);
            }

            let introOpacity = 1 - p2Progress;
            introContainer.style.opacity = introOpacity;

            // When intro is fully hidden, make nav visible
            if (introOpacity <= 0.01) {
                introContainer.style.pointerEvents = 'none';
                introContainer.style.visibility = 'hidden';
                if (mainNav) {
                    mainNav.classList.add('visible');
                    mainNav.classList.add('scrolled');
                }
            } else {
                introContainer.style.pointerEvents = 'auto';
                introContainer.style.visibility = 'visible';
                if (mainNav) {
                    mainNav.classList.remove('visible');
                    mainNav.classList.remove('scrolled');
                }
            }
        }

        // Use native scroll event for fluid animation
        window.addEventListener('scroll', updateScrollAnimation, { passive: true });
        updateScrollAnimation(); // Initial call
    } else {
        // If not main page, nav is always visible
        if (mainNav) {
            mainNav.classList.add('visible');
            mainNav.classList.add('scrolled');
        }
    }

    /* ===========================================
       CAROUSEL LOGIC
       =========================================== */
    const track = document.getElementById('carousel-track');
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.getElementById('carousel-next');
        const prevButton = document.getElementById('carousel-prev');
        let currentSlideIndex = 0;

        function updateCarousel() {
            track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                currentSlideIndex = (currentSlideIndex + 1) % slides.length;
                updateCarousel();
            });
        }
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
                updateCarousel();
            });
        }
    }

    /* ===========================================
       NAVIGATION
       =========================================== */
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            if (navLinks) navLinks.classList.toggle('open');
        });
    }

    /* ===========================================
       SCROLL REVEAL (Intersection Observer)
       =========================================== */
    const revealEls = document.querySelectorAll('.reveal-el');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));

    /* Fallback: reveal elements already in viewport at page load */
    requestAnimationFrame(() => {
        revealEls.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.top < window.innerHeight - 20) {
                el.classList.add('revealed');
            }
        });
    });

    /* ===========================================
       STAT COUNTER ANIMATION
       =========================================== */
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    let statsCounted = false;

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !statsCounted) {
                statsCounted = true;
                animateCounters();
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    const statsContainer = document.querySelector('.lore-stats');
    if (statsContainer) statsObserver.observe(statsContainer);

    function animateCounters() {
        statNumbers.forEach(num => {
            const target = parseInt(num.dataset.target);
            if (isNaN(target)) return;
            const duration = 2000;
            const startTime = performance.now();

            function tick(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = Math.sin(progress * (Math.PI / 2)); // Ease out
                num.textContent = Math.round(target * eased);
                if (progress < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
        });
    }

    /* ===========================================
       PARTICLE SYSTEM (Canvas)
       =========================================== */
    if (canvas && ctx) {
        let particles = [];
        const PARTICLE_COUNT = 55;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() { this.reset(true); }

            reset(initial) {
                this.x = Math.random() * canvas.width;
                this.y = initial ? Math.random() * canvas.height : canvas.height + 10;
                this.size = Math.random() * 2.5 + 0.8;
                this.speedY = -(Math.random() * 0.4 + 0.1);
                this.speedX = (Math.random() - 0.5) * 0.3;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.flickerSpeed = Math.random() * 0.02 + 0.005;
                this.flickerPhase = Math.random() * Math.PI * 2;
                this.hue = 35 + Math.random() * 20;
                this.saturation = 60 + Math.random() * 30;
                this.lightness = 55 + Math.random() * 20;
            }

            update() {
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.flickerPhase) * 0.15;
                this.flickerPhase += this.flickerSpeed;
                this.opacity += Math.sin(this.flickerPhase) * 0.003;
                this.opacity = Math.max(0.05, Math.min(0.6, this.opacity));

                if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
                    this.reset(false);
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, ${this.opacity * 0.15})`;
                ctx.fill();
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animateParticles);
        }
        animateParticles();
    }

    /* ===========================================
       PATIENT GENERATOR DATA
       =========================================== */
    const PATIENT_NAMES = [
        'Tlacaelel', 'Citlali', 'Huitzil', 'Itzcoatl', 'Xochitl',
        'Cuauhtli', 'Yaretzi', 'Izel', 'Tezca', 'Nahui', 'Mayahuel',
        'Tonatiuh', 'Coatl', 'Itzel', 'Quetzal', 'Chimalli',
        'Ixchel', 'Mictlán', 'Tezcatlipoca', 'Huitzilin', 'Yoliztli'
    ];

    const ILLNESS_DATA = {
        fuego: {
            name: 'Esencia de Fuego',
            cls: 'fuego',
            dialogues: [
                'Curandero, un <span class="kw-fuego">fuego</span> me consume por dentro. Siento que el <span class="kw-fuego">calor</span> no cede y el <span class="kw-fuego">ardor</span> me quita el sueño.',
                'La piel me <span class="kw-fuego">arde</span> como brasas desde hace tres soles. La <span class="kw-fuego">fiebre</span> me devora. El <span class="kw-fuego">fuego</span> interior no para.',
                'Siento que el sol vive dentro de mi pecho. La <span class="kw-fuego">quemazón</span> sube hasta mi garganta y el <span class="kw-fuego">calor</span> me ciega.',
                'Tres días con este <span class="kw-fuego">ardor</span>. El <span class="kw-fuego">fuego</span> no <span class="kw-fuego">cede</span>. Me estoy consumiendo por adentro, curandero.',
            ]
        },
        frio: {
            name: 'Esencia de Frío',
            cls: 'frio',
            dialogues: [
                'Mis huesos se han convertido en <span class="kw-frio">hielo</span>. No puedo mover los dedos. El <span class="kw-frio">frío</span> sube lento por mis piernas.',
                'Un <span class="kw-frio">frío de piedra</span> me paraliza desde los pies. Mis piernas ya no obedecen — todo se <span class="kw-frio">congela</span> en mi interior.',
                'El <span class="kw-frio">entumecimiento</span> llegó en la noche y no se va. El <span class="kw-frio">frío</span> me envuelve como una <span class="kw-frio">mortaja de hielo</span>.',
                'Cada vez que respiro siento el <span class="kw-frio">frío</span> filtrarse. Los dedos <span class="kw-frio">no responden</span>. Soy una <span class="kw-frio">estatua</span>, curandero.',
            ]
        },
        veneno: {
            name: 'Esencia de Veneno',
            cls: 'veneno',
            dialogues: [
                'Veo <span class="kw-veneno">sombras que hablan</span> y escucho <span class="kw-veneno">voces del más allá</span>. Mi mente ya no me pertenece desde ayer al atardecer.',
                'Los árboles tienen <span class="kw-veneno">voces</span>. El cielo <span class="kw-veneno">late</span>. Todo <span class="kw-veneno">gira</span> y no puedo detenerlo. ¿Qué me está pasando?',
                'Las <span class="kw-veneno">visiones</span> no cesan. Escucho <span class="kw-veneno">cantos</span> sin origen y ya <span class="kw-veneno">no distingo lo real</span> de lo que no existe.',
                'Desde que comí del fruto del bosque, todo <span class="kw-veneno">se distorsiona</span>. Las <span class="kw-veneno">alucinaciones</span> me consumen, curandero. <span class="kw-veneno">Ayúdame</span>.',
            ]
        }
    };

    /* ===========================================
       PATIENT GENERATOR LOGIC
       =========================================== */
    function rand(n) { return Math.floor(Math.random() * n) + 1; }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function generatePatientSprites() {
        const bodyEl  = document.getElementById('p-body');
        const headEl  = document.getElementById('p-head');
        const noseEl  = document.getElementById('p-nose');
        const mouthEl = document.getElementById('p-mouth');
        const eyeLEl  = document.getElementById('p-eye-l');
        const eyeREl  = document.getElementById('p-eye-r');
        if (!bodyEl) return;

        bodyEl.src  = `assets/patients/Body ${rand(4)}.png`;
        headEl.src  = `assets/patients/Head_${rand(4)}.png`;
        noseEl.src  = `assets/patients/Nose_${rand(4)}.png`;
        mouthEl.src = `assets/patients/Mouth_${rand(4)}.png`;
        eyeLEl.src  = `assets/patients/eyes/L_${rand(8)}.png`;
        eyeREl.src  = `assets/patients/eyes/R_${rand(8)}.png`;
    }

    function generatePatientCard() {
        const nameEl    = document.getElementById('pd-name');
        const ailmentEl = document.getElementById('pd-ailment');
        const dialogEl  = document.getElementById('pd-dialogue');
        const urgency   = document.getElementById('pd-urgency');
        const card      = document.getElementById('patient-dialog-card');
        if (!nameEl) return;

        const name = pick(PATIENT_NAMES);
        const illnessKeys = Object.keys(ILLNESS_DATA);
        const illnessKey  = pick(illnessKeys);
        const illness     = ILLNESS_DATA[illnessKey];
        const intensity   = rand(3); // 1–3

        nameEl.textContent = name;

        ailmentEl.textContent = illness.name;
        ailmentEl.className   = `patient-dialog-ailment ${illness.cls}`;

        dialogEl.innerHTML = `"${pick(illness.dialogues)}"`;

        if (urgency) {
            const dots = urgency.querySelectorAll('span');
            dots.forEach((dot, i) => {
                dot.classList.toggle('filled', i < intensity + 1);
            });
        }

        if (card) {
            card.classList.remove('flash');
            void card.offsetWidth;
            card.classList.add('flash');
            setTimeout(() => card.classList.remove('flash'), 500);
        }
    }

    const generatePatientBtn = document.getElementById('generate-patient-btn');
    if (generatePatientBtn) {
        const figure = document.getElementById('patient-figure-index') || document.getElementById('patient-figure-chars');

        function doGenerate() {
            generatePatientSprites();
            generatePatientCard();

            if (figure) {
                figure.classList.remove('flash');
                void figure.offsetWidth;
                figure.classList.add('flash');
                setTimeout(() => figure.classList.remove('flash'), 500);
            }
        }

        generatePatientBtn.addEventListener('click', doGenerate);
        doGenerate();
    }

    /* ===========================================
       JAGUAR POPUP (newsletter success)
       =========================================== */
    const jaguarPopupHTML = `
<div id="jaguar-popup" class="jaguar-popup-overlay" aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="jaguar-popup-title">
  <div class="jaguar-popup-card">
    <span class="jaguar-popup-glyph">◆ ✦ ◆</span>
    <span class="jaguar-popup-icon">🐆</span>
    <h3 id="jaguar-popup-title">El Jaguar te Acepta</h3>
    <div class="jaguar-popup-divider"></div>
    <p>Tu correo ha llegado al altar sagrado. El espíritu del jaguar protector te guiará hacia el conocimiento ancestral. Bienvenido a la tribu del curandero.</p>
    <button class="cta-button jaguar-popup-close" id="jaguar-popup-close">✦ Continuar</button>
    <span class="jaguar-popup-esc">Esc para cerrar</span>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', jaguarPopupHTML);

    const jaguarPopup = document.getElementById('jaguar-popup');
    const jaguarClose = document.getElementById('jaguar-popup-close');

    function openJaguarPopup() {
        if (!jaguarPopup) return;
        jaguarPopup.classList.add('active');
        jaguarPopup.removeAttribute('aria-hidden');
        jaguarClose && jaguarClose.focus();
    }
    function closeJaguarPopup() {
        if (!jaguarPopup) return;
        jaguarPopup.classList.remove('active');
        jaguarPopup.setAttribute('aria-hidden', 'true');
    }

    if (jaguarClose) jaguarClose.addEventListener('click', closeJaguarPopup);
    if (jaguarPopup) {
        jaguarPopup.addEventListener('click', (e) => { if (e.target === jaguarPopup) closeJaguarPopup(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && jaguarPopup && jaguarPopup.classList.contains('active')) closeJaguarPopup();
    });

    /* ===========================================
       NEWSLETTER FORM
       =========================================== */
    const form = document.getElementById('newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            emailInput.value = '';
            openJaguarPopup();
        });
    }

    /* ===========================================
       HERBOLARIO DRAG & DROP
       =========================================== */
    const herbImages = document.querySelectorAll('.herb-card img');
    const dropzone = document.getElementById('bowl-dropzone');
    const itemHolder = document.getElementById('item-holder');

    if (herbImages.length > 0 && dropzone) {
        // Enlazar atributos de arrastre
        herbImages.forEach((img, idx) => {
            img.draggable = true;
            img.classList.add('draggable-herb');
            img.dataset.herbId = 'herb-' + idx;

            img.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', img.dataset.herbId);
                img.classList.add('dragging');
            });

            img.addEventListener('dragend', () => {
                img.classList.remove('dragging');
            });
        });

        // Eventos del Caldero
        dropzone.addEventListener('dragenter', (e) => {
            e.preventDefault();
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault(); // Vital para habilitar soltar
            dropzone.classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });

        const droppedContainer = document.getElementById('dropped-items-container');

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            
            const herbId = e.dataTransfer.getData('text/plain');
            const draggedImg = document.querySelector(`[data-herb-id="${herbId}"]`);
            
            if (draggedImg && droppedContainer) {
                const clone = document.createElement('img');
                clone.src = draggedImg.src;
                clone.className = 'dropped-clone';
                
                // Random position within 30% to 70% of the bowl wrapper
                const randomX = Math.floor(Math.random() * 40) + 30;
                const randomY = Math.floor(Math.random() * 40) + 30;
                
                clone.style.left = `${randomX}%`;
                clone.style.top = `${randomY}%`;
                
                // Add slight random rotation for organic look
                const randomRot = Math.floor(Math.random() * 360);
                clone.style.transform = `translate(-50%, -50%) rotate(${randomRot}deg)`;
                
                droppedContainer.appendChild(clone);
            }
        });

        // Botón Mezclar enciende el fuego
        const mixBtn = document.getElementById('mix-btn');
        if (mixBtn) {
            mixBtn.addEventListener('click', () => {
                itemHolder.classList.remove('fire-anim');
                
                // Reiniciar animación con micro retraso
                setTimeout(() => {
                    itemHolder.classList.add('fire-anim');
                    
                    // Fade out dropped ingredients
                    if (droppedContainer) {
                        const clones = droppedContainer.querySelectorAll('.dropped-clone');
                        clones.forEach(clone => {
                            clone.classList.add('fade-out');
                            // Remove from DOM after fade completes
                            setTimeout(() => clone.remove(), 1000);
                        });
                    }
                }, 50);

                // Apagar el fuego tras 3.5 segundos
                setTimeout(() => {
                    itemHolder.classList.remove('fire-anim');
                }, 3500);
            });
        }
    }
});
