/**
 * COMUNITAS - Client-Side Application Core
 * Handles navigation switching and responsive layout interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const sidebar = document.getElementById('main-sidebar');
    const navButtons = document.querySelectorAll('.nav-btn');
    const menuToggle = document.getElementById('menu-toggle');
    
    // Dynamic overlay for mobile sidebar drawer
    let overlay = null;

    // Navigation and state sharing variables
    let requestDetailSource = 'org-requests';

    const mockSuggestions = {
        "1": {
            name: "Comedor Nuevo Horizonte",
            desc: "Comedor barrial para familias vulnerables.",
            date: "08/06/2026",
            status: "pending",
            statusLabel: "Pendiente",
            address: "Av. Principal 1234",
            phone: "11-2345-6789",
            social: "@comedornuevohorizonte",
            services: ["Comida", "Ropa", "Apoyo escolar"],
            schedule: "No informados",
            lat: "-34.603",
            lng: "-58.381",
            reviewText: "Pendiente de revisión por un administrador.",
            reviewColor: "#cf5e28",
            reviewBg: "rgba(207, 94, 40, 0.08)"
        },
        "2": {
            name: "Centro Comunitario Santa Clara",
            desc: "Espacio comunitario con apoyo escolar y merienda.",
            date: "25/05/2026",
            status: "approved",
            statusLabel: "Aprobada",
            address: "Calle Güemes 456",
            phone: "11-9876-5432",
            social: "@centrosantaclara",
            services: ["Comida", "Apoyo escolar"],
            schedule: "Lunes a Viernes de 16:00 a 19:30 hs",
            lat: "-34.621",
            lng: "-58.412",
            reviewText: "Aprobada y publicada. Esta organización ya está visible en el mapa de COMUNITAS para toda la comunidad.",
            reviewColor: "#2e7d56",
            reviewBg: "rgba(46, 125, 86, 0.08)"
        },
        "3": {
            name: "Fundación Manos Abiertas",
            desc: "Organización que ofrece ropa y acompañamiento social.",
            date: "10/05/2026",
            status: "rejected",
            statusLabel: "Rechazada",
            address: "Pasaje Solidario 789",
            phone: "11-5555-4321",
            social: "@manosabiertas",
            services: ["Ropa", "Asesoramiento legal"],
            schedule: "No informados",
            lat: "-34.595",
            lng: "-58.428",
            reviewText: "Rechazada. La solicitud fue rechazada por falta de información de contacto verificable. Si tenés más datos, podés enviar una nueva sugerencia.",
            reviewColor: "#a64b58",
            reviewBg: "rgba(166, 75, 88, 0.08)"
        }
    };

    /**
     * Set up active navigation item
     * @param {HTMLElement} activeButton 
     */
    function setActiveNavItem(activeButton) {
        navButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
        
        // On mobile, close sidebar when clicking a nav option
        if (window.innerWidth <= 768) {
            closeMobileSidebar();
        }
    }

    /**
     * Create mobile drawer backdrop overlay
     */
    function createMobileOverlay() {
        if (overlay) return;
        
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
        
        // Close sidebar when clicking outside on the overlay
        overlay.addEventListener('click', closeMobileSidebar);
    }

    /**
     * Open mobile sidebar drawer
     */
    function openMobileSidebar() {
        createMobileOverlay();
        sidebar.classList.add('open');
        setTimeout(() => {
            if (overlay) overlay.classList.add('active');
        }, 10);
    }

    /**
     * Close mobile sidebar drawer
     */
    function closeMobileSidebar() {
        if (overlay) {
            overlay.classList.remove('active');
            // Remove overlay from DOM after transitions finish
            setTimeout(() => {
                if (overlay && !overlay.classList.contains('active')) {
                    overlay.remove();
                    overlay = null;
                }
            }, 250); // Matches CSS --transition-speed
        }
        sidebar.classList.remove('open');
    }

    /**
     * Switch visible screen section
     * @param {string} targetId
     */
    function showScreen(targetId) {
        const sections = document.querySelectorAll('.screen-section');
        sections.forEach(sec => sec.classList.remove('active'));
        
        const targetSec = document.getElementById(`screen-${targetId}`);
        if (targetSec) {
            targetSec.classList.add('active');
            // Scroll main content to top
            const mainContent = document.getElementById('main-content');
            if (mainContent) mainContent.scrollTop = 0;

            // If navigating to the Map screen, initialize and invalidate size
            if (targetId === 'map') {
                setTimeout(() => {
                    initLeafletMap();
                    if (map) {
                        map.invalidateSize();
                        if (targetMapOrgName) {
                            clearMapFilters();
                            const org = allMapOrganizations.find(o => o.name === targetMapOrgName);
                            if (org && org._marker) {
                                map.setView([org.lat, org.lng], 15);
                                org._marker.openPopup();
                            }
                            targetMapOrgName = null;
                        }
                    }
                }, 50);
            }
        }
    }

    // Attach Event Listeners to Nav Buttons
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            // Find parent button if click target was the SVG or text inside
            const btn = e.target.closest('.nav-btn');
            if (btn) {
                setActiveNavItem(btn);
                const target = btn.getAttribute('data-target');
                showScreen(target);
            }
        });
    });

    // Mock Data for Organizations mapped by Service Category
    const organizationsByService = {
        "Duchas": [
            {
                name: "Parroquia San José",
                rating: "4.8",
                reviews: "120",
                description: "Duchas calientes, ropa limpia y contención.",
                tags: ["Limpio", "Buen trato", "Seguro"],
                status: "Activo",
                services: ["Duchas", "Ropa", "Comida"],
                lat: -34.603722,
                lng: -58.381592,
                address: "Calle Falsa 123, Barrio San Martín",
                phone: "+54 11 4567-8901",
                social: "@parroquiasanjose",
                website: "www.parroquiasanjose.org.ar",
                serviceInfo: "Servicio de duchas de agua caliente de lunes a viernes. Contamos con toallas limpias, jabón y desodorante provistos sin cargo. Ambiente familiar y de contención.",
                schedule: "Lunes a Viernes de 08:00 a 13:00 hs",
                needs: ["Jabón líquido", "Toallas limpias", "Ropa de abrigo masculina", "Máquinas de afeitar"],
                gallery: ["assets/gallery_dining_room.png", "assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Juan Carlos", rating: "5", tags: ["Buen trato", "Limpio", "Personal amable"], date: "Hace 2 días" },
                    { author: "María Rosa", rating: "4", tags: ["Ambiente seguro", "Limpio", "Mucha espera"], date: "Hace 1 semana" }
                ]
            },
            {
                name: "Centro Comunitario Esperanza",
                rating: "4.6",
                reviews: "85",
                description: "Duchas y elementos básicos de higiene.",
                tags: ["Limpio", "Horarios cumplidos"],
                status: "Cupo completo",
                services: ["Duchas"],
                lat: -34.620000,
                lng: -58.440000,
                address: "Av. de los Trabajadores 456",
                phone: "+54 11 9876-5432",
                social: "@centroesperanza",
                website: "www.centrocomunitarioesperanza.org",
                serviceInfo: "Cabinas de duchas individuales y kits de aseo personal para personas en situación de vulnerabilidad. Contamos con secadores de pelo y cambiadores.",
                schedule: "Martes y Jueves de 09:00 a 15:00 hs",
                needs: ["Elementos de higiene", "Secadores de pelo", "Desodorante corporal", "Peines"],
                gallery: ["assets/gallery_dining_room.png"],
                reviewsList: [
                    { author: "Esteban", rating: "5", tags: ["Limpio", "Horarios cumplidos", "Personal amable"], date: "Hace 3 días" }
                ]
            },
            {
                name: "Fundación Abrigo",
                rating: "4.5",
                reviews: "64",
                description: "Duchas disponibles junto con alojamiento temporal.",
                tags: ["Seguro", "Buen trato"],
                status: "Suspendido",
                services: ["Duchas", "Alojamiento", "Ropa"],
                lat: -34.598000,
                lng: -58.420000,
                address: "Pasaje de la Solidaridad 789",
                phone: "+54 11 5555-1234",
                social: "@fundacionabrigo",
                website: "www.fundacionabrigo.org",
                serviceInfo: "Acceso a duchas calientes como parte de la admisión al refugio nocturno. Se brinda una muda de ropa limpia y contención social.",
                schedule: "Todos los días de 19:00 a 08:00 hs",
                needs: ["Frazadas", "Colchones", "Ropa de cama", "Café y azúcar"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Carlos", rating: "5", tags: ["Buen trato", "Ambiente seguro", "Fácil acceso"], date: "Hace 5 días" }
                ]
            }
        ],
        "Comida": [
            {
                name: "Comedor Esperanza",
                rating: "4.7",
                reviews: "95",
                description: "Almuerzos diarios y apoyo a familias.",
                tags: ["Abundante", "Buen trato", "Seguro"],
                status: "Activo",
                services: ["Comida"],
                lat: -34.615803,
                lng: -58.433298,
                address: "Calle de la Esperanza 912",
                phone: "+54 11 4111-2222",
                social: "@comedoresperanza",
                website: "www.comedoresperanza.org",
                serviceInfo: "Almuerzos calientes servidos en el salón y distribución de viandas familiares para la cena. Talleres de nutrición comunitaria.",
                schedule: "Lunes a Sábado de 11:30 a 13:30 hs",
                needs: ["Arroz y fideos", "Aceite de cocina", "Puré de tomate", "Verduras frescas"],
                gallery: ["assets/gallery_dining_room.png", "assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Sandra M.", rating: "5", tags: ["Comida abundante", "Buen trato", "Personal amable"], date: "Hace 1 día" }
                ]
            },
            {
                name: "Merendero Rinconcito de Luz",
                rating: "4.8",
                reviews: "42",
                description: "Merienda caliente y apoyo escolar por las tardes.",
                tags: ["Cálido", "Seguro"],
                status: "Inactivo",
                services: ["Comida", "Apoyo escolar"],
                lat: -34.630000,
                lng: -58.450000,
                address: "Calle de la Infancia 344",
                phone: "+54 11 4999-8888",
                social: "@merenderoluz",
                website: "www.rinconcitodeluz.org",
                serviceInfo: "Copa de leche, pan casero, galletitas and frutas para niños en edad escolar. Espacio de juegos y contención recreativa.",
                schedule: "Lunes a Viernes de 16:30 a 18:30 hs",
                needs: ["Leche en polvo", "Harina común", "Mermeladas", "Frutas frescas"],
                gallery: ["assets/gallery_dining_room.png"],
                reviewsList: [
                    { author: "Liliana", rating: "5", tags: ["Buen trato", "Ambiente seguro", "Comida abundante"], date: "Hace 4 días" }
                ]
            },
            {
                name: "Parroquia San José",
                rating: "4.9",
                reviews: "88",
                description: "Viandas para familias y personas en situación de calle.",
                tags: ["Rápido", "Buen trato"],
                status: "Activo",
                services: ["Comida", "Duchas", "Ropa"],
                lat: -34.603722,
                lng: -58.381592,
                address: "Calle Falsa 123, Barrio San Martín",
                phone: "+54 11 4567-8901",
                social: "@parroquiasanjose",
                website: "www.parroquiasanjose.org.ar",
                serviceInfo: "Preparación de viandas comunitarias calientes todas las noches. Se reparten insumos secos los fines de semana.",
                schedule: "Todos los días de 20:00 a 21:30 hs",
                needs: ["Legumbres secas", "Carne vacuna", "Envases descartables para viandas"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Jorge", rating: "5", text: "Nos salva las noches a muchos. Una comida caliente con esta temperatura es fundamental. Dios los bendiga.", date: "Hace 6 días" }
                ]
            }
        ],
        "Atención médica": [
            {
                name: "Centro Comunitario Norte",
                rating: "4.6",
                reviews: "78",
                description: "Atención médica primaria y entrega de medicamentos esenciales.",
                tags: ["Profesional", "Seguro"],
                status: "Activo",
                services: ["Atención médica", "Apoyo escolar"],
                lat: -34.626790,
                lng: -58.463540,
                address: "Bulevar del Norte 2045",
                phone: "+54 11 4222-3333",
                social: "@centronorte",
                website: "www.centronorte.org",
                serviceInfo: "Consultorio clínico básico, pediatría y enfermería. Farmacia comunitaria con entrega de medicamentos recetados sin cargo.",
                schedule: "Lunes, Miércoles y Viernes de 08:00 a 14:00 hs",
                needs: ["Algodón y gasas", "Medicamentos básicos (Paracetamol/Ibuprofeno)", "Alcohol en gel"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Martín", rating: "5", text: "Fui por una consulta de pediatría para mi hijo. La doctora fue súper paciente y me dio los remedios ahí mismo.", date: "Hace 3 días" }
                ]
            },
            {
                name: "Centro de Salud San Pantaleón",
                rating: "4.7",
                reviews: "94",
                description: "Consultas médicas generales y atención de enfermería.",
                tags: ["Limpio", "Buen trato"],
                status: "Activo",
                services: ["Atención médica"],
                lat: -34.610000,
                lng: -58.400000,
                address: "Av. San Pantaleón 55",
                phone: "+54 11 4333-4444",
                social: "@sanpantaleon",
                website: "www.sanpantaleonsalud.org",
                serviceInfo: "Control de presión, curaciones, vacunatorio oficial y atención médica general orientada a la comunidad.",
                schedule: "Lunes a Viernes de 08:00 a 16:00 hs",
                needs: ["Desinfectantes", "Guantes de látex", "Jeringas descartables"],
                gallery: ["assets/gallery_dining_room.png"],
                reviewsList: [
                    { author: "Gisela", rating: "4", text: "Muy buena la atención en enfermería. Todo limpio y ordenado, solo que a veces hay demora.", date: "Hace 2 semanas" }
                ]
            }
        ],
        "Apoyo escolar": [
            {
                name: "Centro Comunitario Norte",
                rating: "4.8",
                reviews: "60",
                description: "Apoyo escolar gratuito para niveles primario y secundario.",
                tags: ["Didáctico", "Cálido"],
                status: "Activo",
                services: ["Apoyo escolar", "Atención médica"],
                lat: -34.626790,
                lng: -58.463540,
                address: "Bulevar del Norte 2045",
                phone: "+54 11 4222-3333",
                social: "@centronorte",
                website: "www.centronorte.org",
                serviceInfo: "Clases particulares dictadas por docentes voluntarios en grupos reducidos. Biblioteca infantil disponible y merienda al finalizar.",
                schedule: "Martes y Jueves de 14:00 a 17:30 hs",
                needs: ["Cuadernos universitarios", "Lápices y marcadores", "Libros de lectura infantil"],
                gallery: ["assets/gallery_dining_room.png"],
                reviewsList: [
                    { author: "Patricia", rating: "5", text: "Llevo a mis hijas a matemáticas e inglés. Las maestras tienen una paciencia de oro y mejoraron un montón las notas.", date: "Hace 4 días" }
                ]
            },
            {
                name: "Apoyo Escolar Luces",
                rating: "4.9",
                reviews: "36",
                description: "Clases de apoyo y talleres creativos los fines de semana.",
                tags: ["Paciencia", "Limpio"],
                status: "Activo",
                services: ["Apoyo escolar"],
                lat: -34.625000,
                lng: -58.455000,
                address: "Calle del Aprendizaje 78",
                phone: "+54 11 4888-7777",
                social: "@apoyoluces",
                website: "www.apoyoluces.org",
                serviceInfo: "Tutorías escolares integrales, talleres de computación básica, dibujo y juegos cooperativos para el desarrollo social.",
                schedule: "Sábados de 09:30 a 13:00 hs",
                needs: ["Resmas de hojas A4", "Cartulinas y témperas", "Juegos de mesa educativos"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Ricardo", rating: "5", text: "El taller de computación es excelente. Los profesores explican muy bien y cuidan un montón a los chicos.", date: "Hace 1 semana" }
                ]
            }
        ],
        "Ropa": [
            {
                name: "Fundación Abrigo",
                rating: "4.6",
                reviews: "50",
                description: "Entrega de abrigos, calzado y mantas en época invernal.",
                tags: ["Seguro", "Buen trato"],
                status: "Activo",
                services: ["Ropa", "Duchas", "Alojamiento"],
                lat: -34.598000,
                lng: -58.420000,
                address: "Pasaje de la Solidaridad 789",
                phone: "+54 11 5555-1234",
                social: "@fundacionabrigo",
                website: "www.fundacionabrigo.org",
                serviceInfo: "Campaña permanente contra el frío. Clasificación y entrega de buzos, camperas, calzado y mantas abrigadas. Atención prioritaria.",
                schedule: "Lunes, Miércoles y Viernes de 10:00 a 14:00 hs",
                needs: ["Camperas de abrigo inflables", "Frazadas", "Calzado infantil (talles 25 al 36)"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Claudio", rating: "5", text: "Conseguí zapatillas y una campera bien abrigada para pasar el invierno. Muy agradecido por la amabilidad.", date: "Hace 3 días" }
                ]
            },
            {
                name: "Parroquia San José",
                rating: "4.8",
                reviews: "110",
                description: "Ropero comunitario abierto dos veces por semana.",
                tags: ["Ordenado", "Limpio"],
                status: "Activo",
                services: ["Ropa", "Duchas", "Comida"],
                lat: -34.603722,
                lng: -58.381592,
                address: "Calle Falsa 123, Barrio San Martín",
                phone: "+54 11 4567-8901",
                social: "@parroquiasanjose",
                website: "www.parroquiasanjose.org.ar",
                serviceInfo: "Ropero social donde se puede elegir ropa en buen estado. Se solicita DNI o derivación de trabajadora social para agilizar la entrega.",
                schedule: "Martes y Jueves de 09:00 a 12:00 hs",
                needs: ["Ropa de bebé", "Pantalones de jean adultos", "Jabón de lavar ropa en polvo"],
                gallery: ["assets/gallery_dining_room.png"],
                reviewsList: [
                    { author: "Norma", rating: "4", text: "La ropa está bien lavada y planchada. Muy ordenado el ropero, podés elegir con tranquilidad lo que necesitás.", date: "Hace 5 días" }
                ]
            }
        ],
        "Alojamiento": [
            {
                name: "Fundación Abrigo",
                rating: "4.5",
                reviews: "64",
                description: "Alojamiento seguro y de transición para personas sin hogar.",
                tags: ["Seguro", "Buen trato"],
                status: "Activo",
                services: ["Alojamiento", "Duchas", "Ropa"],
                lat: -34.598000,
                lng: -58.420000,
                address: "Pasaje de la Solidaridad 789",
                phone: "+54 11 5555-1234",
                social: "@fundacionabrigo",
                website: "www.fundacionabrigo.org",
                serviceInfo: "Dormitorio de tránsito para caballeros y mujeres (sectores separados). Capacidad limitada a 40 camas. Cena y desayuno caliente.",
                schedule: "Todos los días de 19:00 a 08:00 hs",
                needs: ["Almohadas y sábanas de 1 plaza", "Artículos de limpieza (Lavandina/Lisoform)", "Café y té"],
                gallery: ["assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Carlos", rating: "5", text: "Un lugar donde realmente te abren las puertas y te tratan con dignidad. Las instalaciones están muy bien.", date: "Hace 5 días" }
                ]
            },
            {
                name: "Hogar San José",
                rating: "4.8",
                reviews: "120",
                description: "Refugio nocturno integral con cena y desayuno incluido.",
                tags: ["Cálido", "Seguro"],
                status: "Activo",
                services: ["Alojamiento", "Comida", "Duchas"],
                lat: -34.604000,
                lng: -58.385000,
                address: "Calle Falsa 123, Barrio San Martín",
                phone: "+54 11 4567-8901",
                social: "@parroquiasanjose",
                website: "www.parroquiasanjose.org.ar",
                serviceInfo: "Hogar de noche abierto los 365 días del año. Incluye duchas de agua caliente, cena completa, cama individual y atención de trabajadores sociales.",
                schedule: "Todos los días de 18:30 a 08:00 hs",
                needs: ["Medias nuevas", "Champú y crema de enjuague en bidón", "Detergente para vajilla"],
                gallery: ["assets/gallery_dining_room.png", "assets/gallery_volunteers.png"],
                reviewsList: [
                    { author: "Juan Carlos", rating: "5", text: "Excelente trato, las duchas siempre están limpias y el agua sale bien caliente. Muy agradecido por la ropa limpia.", date: "Hace 2 días" },
                    { author: "María Rosa", rating: "4", text: "Muy seguro y ordenado. A veces hay que esperar un poco porque hay mucha gente, pero la atención es muy buena.", date: "Hace 1 semana" }
                ]
            }
        ]
    };

    let currentActiveCategory = "services"; // Tracks category for back button routing
    let detailScreenSource = "service-placeholder"; // Tracks origin of detail view
    let currentActiveOrg = null;
    let currentActiveServiceName = "";
    let targetMapOrgName = null;
    let detailMiniMap = null;

    /**
     * Populate organization list for the selected category (Screen 2.1)
     * @param {string} serviceName 
     */
    let serviceUserLocation = null;
    let serviceLocationDenied = false;
    let activeServiceFilters = null;

    function matchesSchedule(scheduleStr, filterType) {
        if (!scheduleStr) return false;
        
        const s = scheduleStr.toLowerCase();
        
        function timeInMinutes(timeStr) {
            const parts = timeStr.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || 0, 10);
        }

        if (filterType === 'now') {
            const now = new Date();
            const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const currentMins = now.getHours() * 60 + now.getMinutes();

            let dayMatch = false;
            if (s.includes('todos los días') || s.includes('todos los dias')) {
                dayMatch = true;
            } else if (s.includes('lunes a viernes')) {
                dayMatch = (day >= 1 && day <= 5);
            } else if (s.includes('lunes a sábado') || s.includes('lunes a sabado')) {
                dayMatch = (day >= 1 && day <= 6);
            } else if (s.includes('martes y jueves')) {
                dayMatch = (day === 2 || day === 4);
            } else if (s.includes('sábados') || s.includes('sabados')) {
                dayMatch = (day === 6);
            } else if (s.includes('domingos')) {
                dayMatch = (day === 0);
            } else {
                dayMatch = true;
            }

            if (!dayMatch) return false;

            const timeMatch = s.match(/(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})/);
            if (timeMatch) {
                const startMins = timeInMinutes(timeMatch[1]);
                const endMins = timeInMinutes(timeMatch[2]);
                if (endMins < startMins) {
                    return (currentMins >= startMins || currentMins <= endMins);
                } else {
                    return (currentMins >= startMins && currentMins <= endMins);
                }
            }
            return true;
        }

        let startHour = 0;
        let endHour = 24;
        const timeMatch = s.match(/(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})/);
        if (timeMatch) {
            startHour = parseInt(timeMatch[1].split(':')[0], 10);
            endHour = parseInt(timeMatch[2].split(':')[0], 10);
        }

        if (filterType === 'morning') {
            if (endHour < startHour) return true;
            return (startHour < 12 && endHour > 6);
        }
        
        if (filterType === 'afternoon') {
            if (endHour < startHour) return true;
            return (startHour < 19 && endHour > 12);
        }
        
        if (filterType === 'night') {
            if (endHour < startHour) return true;
            return (startHour < 6 || endHour > 19);
        }

        return false;
    }

    /**
     * Populate organization list for the selected category (Screen 2.1)
     * @param {string} serviceName 
     */
    function populateOrganizationsList(serviceName) {
        const listContainer = document.getElementById('org-list-container');
        if (!listContainer) return;
        
        currentActiveCategory = serviceName;
        listContainer.innerHTML = '';
        
        let orgs = organizationsByService[serviceName] || [];
        
        const allOrgsCount = orgs.length;
        if (allOrgsCount === 0) {
            listContainer.innerHTML = `
                <div class="placeholder-content-box" style="margin: 2rem auto;">
                    <p class="placeholder-box-text">Próximamente se listarán las organizaciones para esta categoría.</p>
                </div>`;
            return;
        }

        // Apply filters if they exist
        if (activeServiceFilters) {
            orgs = orgs.filter(org => {
                // 1. Estado filter
                if (activeServiceFilters.status !== 'All') {
                    if (org.status !== activeServiceFilters.status) return false;
                }

                // 2. Calificación filter
                if (activeServiceFilters.rating !== 'All') {
                    const minRating = parseFloat(activeServiceFilters.rating);
                    if (parseFloat(org.rating) < minRating) return false;
                }

                // 3. Horario filter
                if (activeServiceFilters.schedule !== 'All') {
                    if (!matchesSchedule(org.schedule, activeServiceFilters.schedule)) return false;
                }

                // 4. Distancia filter
                if (activeServiceFilters.distance !== 'All' && serviceUserLocation) {
                    const maxDist = parseFloat(activeServiceFilters.distance);
                    const dist = getHaversineDistance(serviceUserLocation.lat, serviceUserLocation.lng, org.lat, org.lng);
                    if (dist > maxDist) return false;
                }

                return true;
            });
        }

        if (orgs.length === 0) {
            listContainer.innerHTML = `
                <div class="placeholder-content-box" style="margin: 2rem auto;">
                    <p class="placeholder-box-text">No hay organizaciones que coincidan con los filtros aplicados.</p>
                </div>`;
            return;
        }
        
        orgs.forEach(org => {
            const card = document.createElement('article');
            card.className = 'org-list-card';
            
            const tagsMarkup = org.tags.map(t => `<span class="org-list-tag">${t}</span>`).join('');
            
            let statusColor = '#3ca374';
            if (org.status === 'Suspendido') {
                statusColor = '#cf5e28';
            } else if (org.status === 'Cupo completo') {
                statusColor = '#d87b1a';
            } else if (org.status === 'Inactivo') {
                statusColor = 'var(--text-muted)';
            }

            let distanceText = "📍 Activá tu ubicación para ver distancia";
            let distanceColor = "var(--text-muted)";
            if (serviceLocationDenied) {
                distanceText = "📍 No se pudo acceder a tu ubicación.";
                distanceColor = "#cf5e28";
            } else if (serviceUserLocation && org.lat && org.lng) {
                const dist = getHaversineDistance(serviceUserLocation.lat, serviceUserLocation.lng, org.lat, org.lng);
                distanceText = `📍 A ${dist.toFixed(1)} km`;
                distanceColor = "var(--brand-charcoal)";
            }

            card.innerHTML = `
                <div class="org-list-info">
                    <div class="org-list-header">
                        <h3 class="org-list-name">${org.name}</h3>
                        <div class="org-list-rating" aria-label="Calificación ${org.rating} estrellas de ${org.reviews} opiniones">
                            <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px; color:var(--brand-mustard);">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span class="rating-value">${org.rating}</span>
                            <span class="rating-count">(${org.reviews} reseñas)</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <span class="status-badge" style="color: ${statusColor}; font-weight: 600;">• ${org.status}</span>
                            <span class="distance-badge" style="font-size: 0.85rem; font-weight: 600; color: ${distanceColor};">${distanceText}</span>
                        </div>
                    </div>
                    <p class="org-list-desc">${org.description}</p>
                    <div class="org-list-tags">
                        ${tagsMarkup}
                    </div>
                </div>
                <div class="org-list-action" style="display: flex; gap: 0.75rem;">
                    <button class="org-list-btn" style="flex: 1;">Ver detalles</button>
                    <button class="eval-secondary-btn org-list-map-btn" style="flex: 1; padding: 0.75rem 1rem; margin: 0; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px;">
                            <polygon points="3 7 9 4 15 7 21 4 21 17 15 20 9 17 3 20"></polygon>
                            <line x1="9" y1="4" x2="9" y2="17"></line>
                            <line x1="15" y1="7" x2="15" y2="20"></line>
                        </svg>
                        Ver en mapa
                    </button>
                </div>
            `;
            
            // Route to Detail Screen (Screen 2.2) when clicking anywhere on the card
            card.addEventListener('click', (e) => {
                if (e.target.closest('.org-list-btn') || e.target.closest('.org-list-map-btn')) {
                    return;
                }
                detailScreenSource = 'service-placeholder';
                showOrganizationDetail(org, serviceName);
            });
            
            // Route to Detail Screen when clicking the button specifically
            const btn = card.querySelector('.org-list-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    detailScreenSource = 'service-placeholder';
                    showOrganizationDetail(org, serviceName);
                });
            }

            // Route to Map Screen when clicking "Ver en mapa"
            const mapBtn = card.querySelector('.org-list-map-btn');
            if (mapBtn) {
                mapBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    targetMapOrgName = org.name;
                    const mapNavBtn = document.querySelector('.nav-btn[data-target="map"]');
                    if (mapNavBtn) setActiveNavItem(mapNavBtn);
                    showScreen('map');
                });
            }
            
            listContainer.appendChild(card);
        });
    }

    /**
     * Populate and render the Organization Detail page (Screen 2.2)
     * @param {Object} org 
     * @param {string} serviceName 
     */
    function showOrganizationDetail(org, serviceName) {
        currentActiveOrg = org;
        currentActiveServiceName = serviceName;
        const detailContainer = document.getElementById('org-detail-content');
        if (!detailContainer) return;

        // ── Service icon config (matches Screen 2.0 colors & icons exactly) ────
        const serviceConfig = {
            'Duchas': {
                circleClass: 'circle-duchas',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M7 4h5a6 6 0 0 1 6 6v1"></path>
                    <path d="M15 11h6v2h-6zM16 16v.01M18 16v.01M20 16v.01"></path>
                </svg>`
            },
            'Comida': {
                circleClass: 'circle-comida',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M12 3v3M8 3.5v2M16 3.5v2M3 11h18c0 4.5-3.5 8-9 8s-9-3.5-9-8z"></path>
                </svg>`
            },
            'Atención médica': {
                circleClass: 'circle-salud',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>`
            },
            'Apoyo escolar': {
                circleClass: 'circle-apoyo',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>`
            },
            'Ropa': {
                circleClass: 'circle-clothing',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M2 17l10-10 10 10Z"></path>
                    <path d="M12 7a3 3 0 1 0-3-3"></path>
                </svg>`
            },
            'Alojamiento': {
                circleClass: 'circle-alojamiento',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="category-card-icon" style="width:26px;height:26px;">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>`
            }
        };

        // Build services offered badges
        const orgServices = org.services && org.services.length > 0 ? org.services : [serviceName];
        const servicesMarkup = orgServices.map(svc => {
            const cfg = serviceConfig[svc] || serviceConfig['Duchas'];
            return `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width:80px;">
                    <div class="service-card-icon-wrapper ${cfg.circleClass}" style="width:60px; height:60px; margin:0; flex-shrink:0;">
                        ${cfg.svg}
                    </div>
                    <span style="font-size:0.85rem; font-weight:700; color:var(--brand-charcoal); text-align:center; line-height:1.25;">${svc}</span>
                </div>
            `;
        }).join('');

        // Render current needs items
        const needsMarkup = org.needs.map(n => `
            <div class="needs-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="needs-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>${n}</span>
            </div>
        `).join('');

        // Render reviews items
        const reviewsMarkup = org.reviewsList.map(r => {
            const reviewTags = (r.tags && r.tags.length > 0)
                ? r.tags.map(t => `<span class="org-list-tag">${t}</span>`).join('')
                : '';
            return `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${r.author}</span>
                    <div style="display:flex; align-items:center; gap:0.25rem;">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px; height:14px; color:var(--brand-mustard);">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span style="font-weight:700; font-size:0.9rem;">${r.rating}.0</span>
                        <span class="review-date">• ${r.date}</span>
                    </div>
                </div>
                ${reviewTags ? `<div class="org-list-tags" style="margin-top:0.5rem; flex-wrap:wrap; display:flex; gap:0.4rem;">${reviewTags}</div>` : ''}
            </div>
        `;
        }).join('');

        // Render photo gallery
        const galleryMarkup = org.gallery.map(img => `
            <img src="${img}" alt="Galería de fotos de ${org.name}" class="gallery-img">
        `).join('');

        const isFav = favoriteOrganizations.some(f => f.name === org.name);
        const favBtnText = isFav ? "♥ Guardado en favoritos" : "♡ Guardar favorito";
        const favBtnStyle = isFav 
            ? "color: var(--brand-rose); border-color: rgba(166,75,88,0.15); background-color: #fbeeef;" 
            : "";

        // Set layout innerHTML
        detailContainer.innerHTML = `
            <!-- Left Column: Main Info, Services, Gallery, Reviews -->
            <div class="detail-main">
                <div class="detail-card">
                    <div class="detail-header">
                        <div class="detail-title-block">
                            <h1 class="detail-org-name">${org.name}</h1>
                            <div class="detail-meta">
                                <div class="detail-rating">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    <span>${org.rating}</span>
                                    <span style="color:var(--text-muted); font-weight:400; font-size:0.95rem; margin-left:0.25rem;">(${org.reviews} reseñas)</span>
                                </div>
                                <span class="status-badge open">• ${org.status}</span>
                            </div>
                        </div>
                        <button class="eval-secondary-btn" id="btn-toggle-favorite" style="width: auto; padding: 0.5rem 1.25rem; height: 42px; margin: 0; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; ${favBtnStyle}">${favBtnText}</button>
                    </div>
                    <p class="detail-desc-text">${org.description}</p>
                </div>

                <!-- Servicios disponibles -->
                <div class="detail-card">
                    <h2 class="detail-subtitle">Servicios disponibles</h2>
                    <div style="display:flex; flex-wrap:wrap; gap:1.25rem; margin-top:0.5rem;">
                        ${servicesMarkup}
                    </div>
                </div>
                
                <div class="detail-card">
                    <h2 class="detail-subtitle">Detalle del servicio</h2>
                    <p class="detail-service-info">${org.serviceInfo}</p>
                </div>
                
                <div class="detail-card">
                    <h2 class="detail-subtitle">Galería de fotos</h2>
                    <div class="gallery-grid">
                        ${galleryMarkup}
                    </div>
                </div>

                <div class="detail-card">
                    <h2 class="detail-subtitle">Reseñas destacadas</h2>
                    <div class="reviews-list">
                        ${reviewsMarkup}
                    </div>
                </div>
            </div>
            
            <!-- Right Column: Contact, Schedule, Needs, Map -->
            <div class="detail-side">
                <div class="detail-card">
                    <h2 class="detail-subtitle">Contacto</h2>
                    <div class="info-list">
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span class="info-text">${org.address}</span>
                        </div>
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span class="info-text">${org.phone}</span>
                        </div>
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <a href="https://${org.website}" target="_blank" class="info-text" style="color: var(--brand-rust); text-decoration: none; font-weight: 600;">${org.website}</a>
                        </div>
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <path d="M24 11.5c0 6-4.5 10.5-10.5 10.5S3 17.5 3 11.5 7.5 1 13.5 1 24 5.5 24 11.5z"></path>
                            </svg>
                            <span class="info-text">${org.social}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <h2 class="detail-subtitle">Horario de atención</h2>
                    <div class="info-list">
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span class="info-text" style="font-weight: 600;">${org.schedule}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <h2 class="detail-subtitle" style="border-color: #fcefe9;">Ubicación</h2>
                    <!-- Mini Map Container -->
                    <div id="detail-mini-map" style="height: 180px; width: 100%; border-radius: 16px; margin-bottom: 1.25rem; z-index: 1; border: 1px solid rgba(76, 67, 61, 0.1);"></div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="evaluate-btn" id="btn-detail-view-map" style="margin: 0;">Ver en mapa</button>
                        <a href="#" id="btn-detail-google-maps" target="_blank" style="text-align: center; color: var(--brand-rust); font-weight: 600; text-decoration: none; font-size: 0.95rem; display: block; padding: 0.25rem;">Abrir en Google Maps</a>
                    </div>
                </div>

                <div class="detail-card">
                    <h2 class="detail-subtitle" style="border-color: #fbeeef;">Necesidades actuales</h2>
                    <div class="needs-list">
                        ${needsMarkup}
                    </div>
                </div>

                <button class="evaluate-btn" id="btn-evaluate-org">Evaluar organización</button>
            </div>
        `;

        // Set back button text dynamically depending on where we came from
        const backBtnSpan = document.querySelector('#btn-back-to-list span');
        if (backBtnSpan) {
            if (detailScreenSource === 'home') {
                backBtnSpan.textContent = 'Volver al inicio';
            } else if (detailScreenSource === 'map') {
                backBtnSpan.textContent = 'Volver al mapa';
            } else if (detailScreenSource === 'favorites') {
                backBtnSpan.textContent = 'Volver a favoritos';
            } else {
                backBtnSpan.textContent = 'Volver al listado';
            }
        }

        // Bind Action button inside the populated detail screen
        const evalBtn = document.getElementById('btn-evaluate-org');
        if (evalBtn) {
            evalBtn.addEventListener('click', () => {
                showEvaluationScreen(org, serviceName);
            });
        }

        const favBtn = document.getElementById('btn-toggle-favorite');
        if (favBtn) {
            favBtn.addEventListener('click', () => {
                const isCurrentlyFav = favoriteOrganizations.some(f => f.name === org.name);
                if (isCurrentlyFav) {
                    favoriteOrganizations = favoriteOrganizations.filter(f => f.name !== org.name);
                    favBtn.textContent = "♡ Guardar favorito";
                    favBtn.style.color = "";
                    favBtn.style.backgroundColor = "";
                    favBtn.style.borderColor = "";
                    alert("Organización quitada de favoritos.");
                } else {
                    favoriteOrganizations.push({
                        name: org.name,
                        services: org.services && org.services.length > 0 ? org.services : [serviceName],
                        rating: org.rating,
                        status: org.status,
                        description: org.description
                    });
                    favBtn.textContent = "♥ Guardado en favoritos";
                    favBtn.style.color = "var(--brand-rose)";
                    favBtn.style.backgroundColor = "#fbeeef";
                    favBtn.style.borderColor = "rgba(166,75,88,0.15)";
                    alert("Organización agregada a favoritos.");
                }
            });
        }

        // Bind Location buttons
        const btnGoogleMaps = document.getElementById('btn-detail-google-maps');
        if (btnGoogleMaps) {
            const query = encodeURIComponent(`${org.name} ${org.address}`);
            btnGoogleMaps.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
        }

        const btnViewMap = document.getElementById('btn-detail-view-map');
        if (btnViewMap) {
            btnViewMap.addEventListener('click', () => {
                targetMapOrgName = org.name;
                const mapNavBtn = document.querySelector('.nav-btn[data-target="map"]');
                if (mapNavBtn) setActiveNavItem(mapNavBtn);
                showScreen('map');
            });
        }

        // Initialize Mini Map
        setTimeout(() => {
            if (detailMiniMap) {
                detailMiniMap.remove();
                detailMiniMap = null;
            }
            const miniMapContainer = document.getElementById('detail-mini-map');
            if (miniMapContainer && org.lat && org.lng) {
                detailMiniMap = L.map('detail-mini-map', {
                    zoomControl: false,
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    touchZoom: false,
                    keyboard: false
                }).setView([org.lat, org.lng], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(detailMiniMap);

                L.marker([org.lat, org.lng], {
                    icon: getMarkerIcon(),
                    title: org.name
                }).addTo(detailMiniMap);
            } else if (miniMapContainer) {
                miniMapContainer.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; background:#f5ede6; color:var(--text-muted); font-size:0.9rem; font-weight:500; border-radius:16px;">Ubicación no disponible</div>';
            }
        }, 150);

        // Route to Screen 2.2 Detail View
        showScreen('org-detail');
    }

    /**
     * Populate and render the Organization Evaluation page (Screen 2.3)
     * @param {Object} org 
     * @param {string} serviceName 
     */
    function showEvaluationScreen(org, serviceName) {
        const evalContainer = document.getElementById('org-evaluate-content');
        if (!evalContainer) return;

        // Map serviceName to category badge class
        let badgeClass = 'category-housing';
        if (serviceName === 'Comida') badgeClass = 'category-food';
        else if (serviceName === 'Atención médica') badgeClass = 'category-health';
        else if (serviceName === 'Apoyo escolar') badgeClass = 'category-health';
        else if (serviceName === 'Ropa') badgeClass = 'category-clothing';
        else if (serviceName === 'Alojamiento') badgeClass = 'category-education';

        evalContainer.innerHTML = `
            <!-- Organization Summary Card -->
            <div class="eval-summary-card">
                <div class="eval-summary-info">
                    <h2 class="eval-summary-name">${org.name}</h2>
                    <div class="eval-summary-badges">
                        <div class="service-badge ${badgeClass}">
                            <span>${serviceName}</span>
                        </div>
                        <span class="status-badge open">• ${org.status}</span>
                    </div>
                </div>
                <div class="eval-summary-rating">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px; color: var(--brand-mustard); margin-right: 0.25rem;">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>${org.rating}</span>
                </div>
            </div>

            <!-- Evaluation Form Card -->
            <div class="eval-form-card" id="eval-form-card-container">
                <!-- 3. Rating Section -->
                <div class="eval-form-section">
                    <h3 class="eval-section-title">Tu calificación</h3>
                    <div class="star-rating-selector" id="star-selector">
                        <button type="button" class="star-btn" data-value="1" aria-label="1 estrella">
                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="star-btn" data-value="2" aria-label="2 estrellas">
                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="star-btn" data-value="3" aria-label="3 estrellas">
                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="star-btn" data-value="4" aria-label="4 estrellas">
                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="star-btn" data-value="5" aria-label="5 estrellas">
                            <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                    </div>
                </div>

                <!-- 4. Review Tags Section -->
                <div class="eval-form-section">
                    <h3 class="eval-section-title">Seleccioná etiquetas</h3>
                    <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:0.75rem;">Podés elegir varias.</p>
                    <div style="margin-bottom:0.5rem;">
                        <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:#3ca374;">✓ Positivo</span>
                    </div>
                    <div class="eval-tags-grid" style="margin-bottom:1rem;">
                        <span class="eval-tag-pill" data-tag="Buen trato">Buen trato</span>
                        <span class="eval-tag-pill" data-tag="Ambiente seguro">Ambiente seguro</span>
                        <span class="eval-tag-pill" data-tag="Limpio">Limpio</span>
                        <span class="eval-tag-pill" data-tag="Horarios cumplidos">Horarios cumplidos</span>
                        <span class="eval-tag-pill" data-tag="Comida abundante">Comida abundante</span>
                        <span class="eval-tag-pill" data-tag="Atención rápida">Atención rápida</span>
                        <span class="eval-tag-pill" data-tag="Fácil acceso">Fácil acceso</span>
                        <span class="eval-tag-pill" data-tag="Personal amable">Personal amable</span>
                        <span class="eval-tag-pill" data-tag="Mucha disponibilidad de recursos">Mucha disponibilidad de recursos</span>
                    </div>
                    <div style="margin-bottom:0.5rem;">
                        <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--brand-rust);">↑ Para mejorar</span>
                    </div>
                    <div class="eval-tags-grid">
                        <span class="eval-tag-pill" data-tag="Poco personal">Poco personal</span>
                        <span class="eval-tag-pill" data-tag="Horarios limitados">Horarios limitados</span>
                        <span class="eval-tag-pill" data-tag="Mucha espera">Mucha espera</span>
                        <span class="eval-tag-pill" data-tag="Información poco clara">Información poco clara</span>
                        <span class="eval-tag-pill" data-tag="Falta de higiene">Falta de higiene</span>
                        <span class="eval-tag-pill" data-tag="Ambiente poco climatizado">Ambiente poco climatizado</span>
                        <span class="eval-tag-pill" data-tag="Poca disponibilidad de recursos">Poca disponibilidad de recursos</span>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div style="display:flex; flex-direction:column; gap:1.25rem; margin-top:0.5rem;">
                    <button class="eval-submit-btn" id="btn-submit-eval">Enviar evaluación</button>
                    <button class="eval-secondary-btn" id="btn-cancel-eval">Volver al detalle</button>
                </div>
            </div>
        `;

        // Interactive Star Rating logic
        let selectedStars = 0;
        const starBtns = evalContainer.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                selectedStars = parseInt(btn.getAttribute('data-value'));
                starBtns.forEach(s => {
                    const val = parseInt(s.getAttribute('data-value'));
                    if (val <= selectedStars) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });

        // Interactive Tags selector
        const tagPills = evalContainer.querySelectorAll('.eval-tag-pill');
        tagPills.forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('selected');
            });
        });

        // Cancel Button routes back to Screen 2.2
        const cancelBtn = document.getElementById('btn-cancel-eval');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                showOrganizationDetail(org, serviceName);
            });
        }

        // Submit Button shows a beautiful success state inline
        const submitBtn = document.getElementById('btn-submit-eval');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                // Render success state
                const cardContainer = document.getElementById('eval-form-card-container');
                if (cardContainer) {
                    cardContainer.innerHTML = `
                        <div style="text-align:center; padding: 1.5rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="eval-section-title" style="font-size:1.6rem; color:#2e7d56; margin-bottom:0.5rem;">¡Evaluación enviada!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5;">Muchas gracias por compartir tu experiencia con <strong>${org.name}</strong>. Tu opinión ayuda a que la comunidad esté mejor informada.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver al detalle</button>
                        </div>
                    `;

                    // Bind success back button
                    const successBackBtn = document.getElementById('btn-success-back');
                    if (successBackBtn) {
                        successBackBtn.addEventListener('click', () => {
                            showOrganizationDetail(org, serviceName);
                        });
                    }
                }
            });
        }

        // Show the evaluation screen
        showScreen('org-evaluate');
    }

    // Reset service filter UI helper
    function resetServiceFiltersUI() {
        const selectStatus = document.getElementById('filter-service-status');
        const selectRating = document.getElementById('filter-service-rating');
        const selectSchedule = document.getElementById('filter-service-schedule');
        const selectDistance = document.getElementById('filter-service-distance');
        
        if (selectStatus) selectStatus.value = 'All';
        if (selectRating) selectRating.value = 'All';
        if (selectSchedule) selectSchedule.value = 'All';
        if (selectDistance) {
            selectDistance.value = 'All';
            if (!serviceUserLocation) {
                selectDistance.setAttribute('disabled', 'true');
            } else {
                selectDistance.removeAttribute('disabled');
            }
        }
        
        const useLocationBtn = document.getElementById('btn-service-use-location');
        if (useLocationBtn) {
            if (serviceUserLocation) {
                useLocationBtn.innerHTML = '<span>Ubicación activa</span>';
                useLocationBtn.style.backgroundColor = '#e8f5e9';
                useLocationBtn.style.color = '#2e7d56';
                useLocationBtn.style.borderColor = 'rgba(46, 125, 86, 0.15)';
            } else {
                useLocationBtn.innerHTML = '<span>📍 Usar mi ubicación</span>';
                useLocationBtn.style.backgroundColor = '';
                useLocationBtn.style.color = '';
                useLocationBtn.style.borderColor = '';
            }
        }
    }

    // Apply service filter helper
    function applyServiceFilters() {
        const selectStatus = document.getElementById('filter-service-status');
        const selectRating = document.getElementById('filter-service-rating');
        const selectSchedule = document.getElementById('filter-service-schedule');
        const selectDistance = document.getElementById('filter-service-distance');
        
        activeServiceFilters = {
            status: selectStatus ? selectStatus.value : 'All',
            rating: selectRating ? selectRating.value : 'All',
            schedule: selectSchedule ? selectSchedule.value : 'All',
            distance: selectDistance ? selectDistance.value : 'All'
        };
        
        populateOrganizationsList(currentActiveCategory);
    }

    // Clear service filter helper
    function clearServiceFilters() {
        activeServiceFilters = null;
        resetServiceFiltersUI();
        populateOrganizationsList(currentActiveCategory);
    }

    // Handle Service Category Clicks
    const serviceCards = document.querySelectorAll('.service-card');
    const placeholderServiceName = document.getElementById('placeholder-service-name');
    
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            const serviceName = card.getAttribute('data-service');
            if (placeholderServiceName) {
                placeholderServiceName.textContent = serviceName;
            }
            activeServiceFilters = null;
            resetServiceFiltersUI();
            populateOrganizationsList(serviceName);
            showScreen('service-placeholder');
        });
    });

    // Bind Screen 2.1 filter buttons
    const serviceApplyBtn = document.getElementById('btn-service-apply-filters');
    if (serviceApplyBtn) {
        serviceApplyBtn.addEventListener('click', applyServiceFilters);
    }

    const serviceClearBtn = document.getElementById('btn-service-clear-filters');
    if (serviceClearBtn) {
        serviceClearBtn.addEventListener('click', clearServiceFilters);
    }

    // Geolocation button on Screen 2.1
    const serviceUseLocationBtn = document.getElementById('btn-service-use-location');
    if (serviceUseLocationBtn) {
        serviceUseLocationBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    serviceLocationDenied = false;
                    serviceUserLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    serviceUseLocationBtn.innerHTML = '<span>Ubicación activa</span>';
                    serviceUseLocationBtn.style.backgroundColor = '#e8f5e9';
                    serviceUseLocationBtn.style.color = '#2e7d56';
                    serviceUseLocationBtn.style.borderColor = 'rgba(46, 125, 86, 0.15)';
                    
                    const selectDistance = document.getElementById('filter-service-distance');
                    if (selectDistance) {
                        selectDistance.removeAttribute('disabled');
                    }
                    populateOrganizationsList(currentActiveCategory);
                },
                (error) => {
                    serviceLocationDenied = true;
                    populateOrganizationsList(currentActiveCategory);
                    alert('No se pudo acceder a tu ubicación. Podés usar COMUNITAS sin filtro por distancia.');
                }
            );
        });
    }

    // Handle Back Button in Service Detail List
    const backToServicesBtn = document.getElementById('btn-back-to-services');
    if (backToServicesBtn) {
        backToServicesBtn.addEventListener('click', () => {
            showScreen('services');
        });
    }

    // Handle Back Button in Organization Detail View (Routes back to active category list, home or map)
    const backToListBtn = document.getElementById('btn-back-to-list');
    if (backToListBtn) {
        backToListBtn.addEventListener('click', () => {
            if (detailScreenSource === 'home') {
                showScreen('home');
                const btnHome = document.getElementById('btn-home');
                if (btnHome) {
                    setActiveNavItem(btnHome);
                }
            } else if (detailScreenSource === 'map') {
                showScreen('map');
                const btnMap = document.getElementById('btn-map');
                if (btnMap) {
                    setActiveNavItem(btnMap);
                }
            } else if (detailScreenSource === 'favorites') {
                showScreen('favorites');
                const btnProfile = document.getElementById('btn-profile');
                if (btnProfile) {
                    setActiveNavItem(btnProfile);
                }
            } else {
                showScreen('service-placeholder');
            }
        });
    }

    // Handle Back Button in Evaluation Form View (Routes back to active organization detail)
    const backToDetailBtn = document.getElementById('btn-back-to-detail');
    if (backToDetailBtn) {
        backToDetailBtn.addEventListener('click', () => {
            if (currentActiveOrg) {
                showOrganizationDetail(currentActiveOrg, currentActiveServiceName);
            } else {
                showScreen('home');
            }
        });
    }

    // Mobile Hamburger Toggle Click
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                closeMobileSidebar();
            } else {
                openMobileSidebar();
            }
        });
    }

    // Close mobile sidebar if screen size transitions back to desktop width
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && sidebar.classList.contains('open')) {
            closeMobileSidebar();
        }
    });

    // Set up click listeners for recommended cards on the Home screen
    
    function getServiceBadgeClass(service) {
        if (service === 'Comida') return 'category-food';
        if (service === 'Apoyo escolar') return 'category-health';
        return 'category-housing';
    }
    function getServiceCircleClass(service) {
        if (service === 'Comida') return 'circle-food';
        if (service === 'Apoyo escolar') return 'circle-health';
        return 'circle-housing';
    }
    function getServiceIconSVG(service) {
        if (service === 'Comida') return '<svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v3M8 6v2M16 6v2M3 12h18c0 3.5-3 6.5-9 6.5S3 15.5 3 12z"></path></svg>';
        if (service === 'Apoyo escolar') return '<svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
        return '<svg class="service-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h5a6 6 0 0 1 6 6v1"></path><path d="M15 11h6v2h-6zM16 16v.01M18 16v.01M20 16v.01"></path></svg>';
    }
    function getServiceCircleSVG(service) {
        if (service === 'Comida') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="card-center-icon"><path d="M12 3v3M8 3.5v2M16 3.5v2M3 11h18c0 4.5-3.5 8-9 8s-9-3.5-9-8z"></path></svg>';
        if (service === 'Apoyo escolar') return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="card-center-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
        return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="card-center-icon"><path d="M12 2v4M10 4h4M4 14l8-7 8 7v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6z"></path><path d="M9 22v-4a3 3 0 0 1 6 0v4"></path></svg>';
    }

    function renderRecommendedOrgs() {
        const container = document.getElementById('recommendations-grid');
        if (!container) return;
        container.innerHTML = '';
        
        let orgsToRender = [];
        
        if (window.INJECTED_DATA && window.INJECTED_DATA.status === 'success' && window.INJECTED_DATA.data && window.INJECTED_DATA.data.length > 0) {
            orgsToRender = window.INJECTED_DATA.data.slice(0, 4); // Show top 4
        } else {
            // Fallback mock data
            orgsToRender = [
                { name: "Parroquia San José", description: "Duchas calientes, ropa limpia y contención.", service_types: ["Duchas"], status: "active", average_rating: 4.8, total_reviews: 120 },
                { name: "Comedor Esperanza", description: "Almuerzos diarios y apoyo a familias.", service_types: ["Comida"], status: "active", average_rating: 4.7, total_reviews: 95 },
                { name: "Centro Comunitario Norte", description: "Apoyo escolar gratuito para niños y jóvenes.", service_types: ["Apoyo escolar"], status: "active", average_rating: 4.6, total_reviews: 78 }
            ];
            
            if (window.INJECTED_DATA && window.INJECTED_DATA.status === 'error') {
                console.error("Error from Supabase:", window.INJECTED_DATA.message);
                const banner = document.createElement('div');
                banner.style.width = '100%';
                banner.style.padding = '10px';
                banner.style.background = '#ffe5e5';
                banner.style.color = '#d32f2f';
                banner.style.borderRadius = '8px';
                banner.style.marginBottom = '20px';
                banner.style.gridColumn = '1 / -1';
                banner.textContent = "Aviso: No se pudo conectar a Supabase. Mostrando datos de prueba.";
                container.appendChild(banner);
            }
        }
        
        container.innerHTML += orgsToRender.map(org => {
            const service = (org.service_types && org.service_types.length > 0) ? org.service_types[0] : 'Duchas';
            const statusClass = org.status === 'active' || org.status === 'activo' || org.status === 'Activo' ? 'open' : 'closed';
            const statusText = org.status === 'active' || org.status === 'activo' || org.status === 'Activo' ? 'Activo' : 'Cerrado';
            
            return `
                <article class="org-card">
                    <div class="org-card-header">
                        <div class="service-badge ${getServiceBadgeClass(service)}">
                            ${getServiceIconSVG(service)}
                            <span>${service}</span>
                        </div>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div class="org-card-body">
                        <div class="org-illustration-circle ${getServiceCircleClass(service)}">
                            ${getServiceCircleSVG(service)}
                        </div>
                        <h3 class="org-name">${org.name}</h3>
                        <div class="org-rating" aria-label="Calificación ${org.average_rating} estrellas de ${org.total_reviews} opiniones">
                            <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span class="rating-value">${org.average_rating || '5.0'}</span>
                            <span class="rating-count">(${org.total_reviews || '0'} reseñas)</span>
                        </div>
                        <p class="org-description">${org.description || ''}</p>
                    </div>
                    <div class="org-card-footer">
                        <button class="details-btn">Ver detalles</button>
                    </div>
                </article>
            `;
        }).join('');
        
        // Add click listeners
        const homeCards = document.querySelectorAll('#screen-home .org-card');
        homeCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.details-btn')) e.stopPropagation();
                const orgName = card.querySelector('.org-name').textContent;
                
                let orgData = null;
                if (window.INJECTED_DATA && window.INJECTED_DATA.status === 'success') {
                    orgData = window.INJECTED_DATA.data.find(o => o.name === orgName);
                } else {
                    orgData = orgsToRender.find(o => o.name === orgName);
                }
                
                if (orgData) {
                    detailScreenSource = 'home';
                    const srv = (orgData.service_types && orgData.service_types.length > 0) ? orgData.service_types[0] : 'Duchas';
                    showOrganizationDetail(orgData, srv);
                }
            });
            const btn = card.querySelector('.details-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const orgName = card.querySelector('.org-name').textContent;
                    let orgData = null;
                    if (window.INJECTED_DATA && window.INJECTED_DATA.status === 'success') {
                        orgData = window.INJECTED_DATA.data.find(o => o.name === orgName);
                    } else {
                        orgData = orgsToRender.find(o => o.name === orgName);
                    }
                    if (orgData) {
                        detailScreenSource = 'home';
                        const srv = (orgData.service_types && orgData.service_types.length > 0) ? orgData.service_types[0] : 'Duchas';
                        showOrganizationDetail(orgData, srv);
                    }
                });
            }
        });
    }
    
    renderRecommendedOrgs();


    let map = null;
    let markersLayerGroup = null;
    let allMapOrganizations = [];
    let mapUserLocation = null;

    /**
     * Extract a flat list of unique organizations from mock database
     */
    function getAllOrganizations() {
        const uniqueOrgsMap = new Map();
        
        Object.entries(organizationsByService).forEach(([serviceName, orgList]) => {
            orgList.forEach(org => {
                const key = org.name;
                if (!uniqueOrgsMap.has(key)) {
                    uniqueOrgsMap.set(key, {
                        ...org,
                        services: [serviceName],
                        primaryService: serviceName,
                        isFavorite: false
                    });
                } else {
                    const existing = uniqueOrgsMap.get(key);
                    if (!existing.services.includes(serviceName)) {
                        existing.services.push(serviceName);
                    }
                }
            });
        });
        
        return Array.from(uniqueOrgsMap.values());
    }

    /**
     * Create custom Leaflet icon based on service category
     */
    function getMarkerIcon() {
        let color = '#cf5e28'; // Always use generic brand Rust color for all pins

        return L.divIcon({
            className: 'custom-map-pin',
            html: `
                <div class="pin-marker" style="color: ${color}; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; transform: translate(-8px, -18px);">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="width: 100%; height: 100%;">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                </div>
            `,
            iconSize: [24, 40],
            iconAnchor: [12, 40]
        });
    }

    /**
     * Get the SVG and circle color wrapper for a service category
     * @param {string} serviceName
     */
    function getServiceIconMarkup(serviceName) {
        let svg = '';
        let circleClass = '';
        
        switch (serviceName) {
            case 'Duchas':
                circleClass = 'circle-duchas';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M7 4h5a6 6 0 0 1 6 6v1"></path>
                        <path d="M15 11h6v2h-6zM16 16v.01M18 16v.01M20 16v.01"></path>
                    </svg>
                `;
                break;
            case 'Comida':
                circleClass = 'circle-comida';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 3v3M8 3.5v2M16 3.5v2M3 11h18c0 4.5-3.5 8-9 8s-9-3.5-9-8z"></path>
                    </svg>
                `;
                break;
            case 'Atención médica':
                circleClass = 'circle-salud';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                    </svg>
                `;
                break;
            case 'Apoyo escolar':
                circleClass = 'circle-apoyo';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                `;
                break;
            case 'Ropa':
                circleClass = 'circle-clothing';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 17l10-10 10 10Z"></path>
                        <path d="M12 7a3 3 0 1 0-3-3"></path>
                    </svg>
                `;
                break;
            case 'Alojamiento':
                circleClass = 'circle-alojamiento';
                svg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                `;
                break;
            default:
                break;
        }

        if (!svg) return '';
        return `
            <div class="popup-service-circle ${circleClass}" title="${serviceName}">
                ${svg}
            </div>
        `;
    }

    /**
     * Render markers on the map
     */
    function renderMapMarkers(orgsList) {
        if (!map || !markersLayerGroup) return;
        
        // Clear existing markers
        markersLayerGroup.clearLayers();

        // Add new markers
        orgsList.forEach(org => {
            if (!org.lat || !org.lng) return;

            const marker = L.marker([org.lat, org.lng], {
                icon: getMarkerIcon(),
                title: org.name
            });
            org._marker = marker;

            // Generate circular icons for all services offered
            const servicesCirclesMarkup = org.services.map(s => getServiceIconMarkup(s)).join('');
            const primaryService = org.primaryService || org.services[0];

            const popupContent = `
                <div class="custom-leaflet-popup">
                    <div class="map-popup-header">
                        <h4 class="map-popup-name">${org.name}</h4>
                        <button class="map-popup-fav-btn ${org.isFavorite ? 'active' : ''}" data-org="${org.name}" aria-label="Guardar en favoritos">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 20px; height: 20px;">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="popup-services-list">
                        ${servicesCirclesMarkup}
                    </div>
                    <div class="map-popup-meta">
                        <span class="status-badge open" style="font-size: 0.75rem;">• ${org.status}</span>
                        <div class="map-popup-rating">
                            <svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: var(--brand-mustard); margin-right: 0.15rem;">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span>${org.rating}</span>
                        </div>
                    </div>
                    <button class="map-popup-btn btn-view-popup-details" data-org="${org.name}" data-service="${primaryService}">Ver detalles</button>
                </div>
            `;

            marker.bindPopup(popupContent);
            markersLayerGroup.addLayer(marker);
        });
    }

    /**
     * Filter implementation logic
     */
    function getHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }

    /**
     * Filter implementation logic
     */
    function applyMapFilters() {
        if (!map || !markersLayerGroup) return;

        // Get filter selections
        const serviceAllChecked = document.getElementById('service-all')?.checked;
        const selectedServices = serviceAllChecked ? [] : Array.from(document.querySelectorAll('input[name="service"]:not(#service-all):checked')).map(el => el.value);

        const statusAllChecked = document.getElementById('status-all')?.checked;
        const selectedStatuses = statusAllChecked ? [] : Array.from(document.querySelectorAll('input[name="status"]:not(#status-all):checked')).map(el => el.value);
        
        const ratingVal = document.querySelector('input[name="rating"]:checked').value;
        const distanceEl = document.querySelector('input[name="distance"]:checked');
        const distanceVal = distanceEl ? distanceEl.value : 'all';
        const favoritesOnly = document.getElementById('filter-favorites').checked;

        const filteredOrgs = allMapOrganizations.filter(org => {
            // Check service match: if no service filter selected, show all. Otherwise, check if org offers any selected service
            if (selectedServices.length > 0) {
                const serviceMatches = org.services.some(s => selectedServices.includes(s));
                if (!serviceMatches) return false;
            }

            // Check status match: if no status filter selected, show all. Otherwise, check if org matches checked status
            if (selectedStatuses.length > 0) {
                if (!selectedStatuses.includes(org.status)) return false;
            }

            // Check rating match
            if (ratingVal !== 'all') {
                const rating = parseFloat(org.rating);
                const minRating = parseFloat(ratingVal);
                if (rating < minRating) return false;
            }

            // Check distance match (if location was granted)
            if (distanceVal !== 'all' && mapUserLocation) {
                const maxDist = parseFloat(distanceVal);
                const dist = getHaversineDistance(mapUserLocation.lat, mapUserLocation.lng, org.lat, org.lng);
                if (dist > maxDist) return false;
            }

            // Check favorites match
            if (favoritesOnly && !org.isFavorite) return false;

            return true;
        });

        renderMapMarkers(filteredOrgs);
    }

    /**
     * Clear filters logic
     */
    function clearMapFilters() {
        // Reset checkbox selections to unchecked
        document.querySelectorAll('input[name="service"]').forEach(el => el.checked = false);
        document.querySelectorAll('input[name="status"]').forEach(el => el.checked = false);
        
        // Reset rating radio
        const defaultRadio = document.querySelector('input[name="rating"][value="all"]');
        if (defaultRadio) defaultRadio.checked = true;

        // Reset distance radio
        const defaultDistance = document.querySelector('input[name="distance"][value="all"]');
        if (defaultDistance) defaultDistance.checked = true;

        // Reset toggle
        const favToggle = document.getElementById('filter-favorites');
        if (favToggle) favToggle.checked = false;

        // Render all markers
        renderMapMarkers(allMapOrganizations);
    }

    /**
     * Initialize Leaflet map and tile layers
     */
    function initLeafletMap() {
        if (map) return;

        // Initialize Leaflet map targeting the Leaflet div
        map = L.map('map', {
            zoomControl: false
        }).setView([-34.61, -58.42], 12);

        L.control.zoom({
            position: 'bottomright'
        }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        markersLayerGroup = L.layerGroup().addTo(map);
        allMapOrganizations = getAllOrganizations();
        renderMapMarkers(allMapOrganizations);

        // Bind Leaflet popup events to select details button and toggle hearts
        map.on('popupopen', (e) => {
            const popupNode = e.popup.getElement();
            
            // Heart toggling
            const favBtn = popupNode.querySelector('.map-popup-fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', () => {
                    const orgName = favBtn.getAttribute('data-org');
                    const org = allMapOrganizations.find(o => o.name === orgName);
                    if (org) {
                        org.isFavorite = !org.isFavorite;
                        favBtn.classList.toggle('active', org.isFavorite);
                    }
                });
            }

            // View details routing
            const detailsBtn = popupNode.querySelector('.btn-view-popup-details');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => {
                    const orgName = detailsBtn.getAttribute('data-org');
                    const serviceName = detailsBtn.getAttribute('data-service');
                    const org = allMapOrganizations.find(o => o.name === orgName);
                    if (org) {
                        detailScreenSource = 'map';
                        showOrganizationDetail(org, serviceName);
                    }
                });
            }
        });

        // Bind filter button triggers
        const applyBtn = document.getElementById('btn-apply-filters');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyMapFilters);
        }

        const clearBtn = document.getElementById('btn-clear-filters');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearMapFilters);
        }

        // Service Select-All Logic
        const serviceAllCheckbox = document.getElementById('service-all');
        const serviceCheckboxes = document.querySelectorAll('input[name="service"]:not(#service-all)');
        if (serviceAllCheckbox) {
            serviceAllCheckbox.addEventListener('change', () => {
                const checked = serviceAllCheckbox.checked;
                serviceCheckboxes.forEach(cb => cb.checked = checked);
            });
            
            serviceCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const allChecked = Array.from(serviceCheckboxes).every(c => c.checked);
                    serviceAllCheckbox.checked = allChecked;
                });
            });
        }

        // Status Select-All Logic
        const statusAllCheckbox = document.getElementById('status-all');
        const statusCheckboxes = document.querySelectorAll('input[name="status"]:not(#status-all)');
        if (statusAllCheckbox) {
            statusAllCheckbox.addEventListener('change', () => {
                const checked = statusAllCheckbox.checked;
                statusCheckboxes.forEach(cb => cb.checked = checked);
            });
            
            statusCheckboxes.forEach(cb => {
                cb.addEventListener('change', () => {
                    const allChecked = Array.from(statusCheckboxes).every(c => c.checked);
                    statusAllCheckbox.checked = allChecked;
                });
            });
        }

        // Geolocation Button Logic
        const useLocationBtn = document.getElementById('btn-use-location');
        if (useLocationBtn) {
            useLocationBtn.addEventListener('click', (e) => {
                e.preventDefault();
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        mapUserLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        useLocationBtn.textContent = 'Ubicación activa';
                        useLocationBtn.style.backgroundColor = '#e8f5e9';
                        useLocationBtn.style.color = '#2e7d56';
                        useLocationBtn.style.borderColor = 'rgba(46, 125, 86, 0.15)';
                        
                        // Enable distance filter inputs
                        document.querySelectorAll('input[name="distance"]').forEach(el => {
                            el.removeAttribute('disabled');
                        });
                    },
                    (error) => {
                        alert('No se pudo acceder a tu ubicación. Podés usar COMUNITAS sin filtro por distancia.');
                    }
                );
            });
        }
    }
    // Bind Add Org (Screen 4.1) buttons placeholders
    const btnAddOrgSubmit = document.getElementById('btn-add-org-submit');
    if (btnAddOrgSubmit) {
        btnAddOrgSubmit.addEventListener('click', () => {
            resetSuggestForm();
            showScreen('suggest-org');
        });
    }

    const btnViewOrgRequests = document.getElementById('btn-view-org-requests');
    if (btnViewOrgRequests) {
        btnViewOrgRequests.addEventListener('click', () => {
            showScreen('org-requests');
        });
    }

    // Admin state and logic
    let isAdmin = true; // Mock admin state

    // Mock pending requests state
    let adminPendingRequests = [
        {
            id: 1,
            name: 'Hogar San Martín',
            desc: 'Centro de día para personas mayores, ofrece viandas y apoyo psicológico.',
            submitter: 'Carlos Méndez',
            date: '12/05/2026',
            status: 'Pendiente'
        }
    ];

    const cardAdminRequests = document.getElementById('card-admin-requests');
    if (cardAdminRequests) {
        if (isAdmin) {
            cardAdminRequests.style.display = 'flex';
        } else {
            cardAdminRequests.style.display = 'none';
        }
    }

    function renderAdminRequests() {
        const listContainer = document.getElementById('admin-requests-list');
        if (!listContainer) return;

        const pendingReqs = adminPendingRequests.filter(req => req.status === 'Pendiente');

        if (pendingReqs.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem; text-align: center; margin-top: 2rem;">No hay solicitudes pendientes.</p>';
            return;
        }

        let html = '';
        pendingReqs.forEach(req => {
            html += `
                <article class="request-card" style="background: var(--bg-card); border-radius: 24px; padding: 2rem; border: 1px solid rgba(76, 67, 61, 0.05); box-shadow: var(--box-shadow);">
                    <div class="request-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 class="request-org-name" style="margin: 0; font-size: 1.4rem; color: var(--brand-charcoal);">${req.name}</h3>
                            <p class="request-desc" style="margin: 0.5rem 0 0; color: var(--text-muted); font-size: 1rem; line-height: 1.5;">${req.desc}</p>
                        </div>
                        <span class="status-badge pending" style="background-color: rgba(207, 94, 40, 0.1); color: var(--brand-rust); font-weight: 600; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">${req.status}</span>
                    </div>
                    <div class="request-meta" style="display: flex; gap: 1.5rem; margin-top: 1.25rem; font-size: 0.9rem; color: var(--text-muted);">
                        <span><strong>Por:</strong> ${req.submitter}</span>
                        <span><strong>Fecha:</strong> ${req.date}</span>
                    </div>
                    <button class="eval-secondary-btn btn-view-admin-request" data-id="${req.id}" style="margin-top: 1.5rem; width: 100%;">Ver detalle</button>
                </article>
            `;
        });
        listContainer.innerHTML = html;

        // Bind view detail buttons
        const btnViewAdminRequestsList = listContainer.querySelectorAll('.btn-view-admin-request');
        btnViewAdminRequestsList.forEach(btn => {
            btn.addEventListener('click', () => {
                showScreen('admin-review');
            });
        });
    }

    const btnAdminRequests = document.getElementById('btn-admin-requests');
    if (btnAdminRequests) {
        btnAdminRequests.addEventListener('click', () => {
            renderAdminRequests();
            showScreen('admin-requests');
        });
    }

    const btnBackFromAdminRequests = document.getElementById('btn-back-from-admin-requests');
    if (btnBackFromAdminRequests) {
        btnBackFromAdminRequests.addEventListener('click', () => {
            showScreen('add-org');
        });
    }

    const btnBackFromAdminReview = document.getElementById('btn-back-from-admin-review');
    if (btnBackFromAdminReview) {
        btnBackFromAdminReview.addEventListener('click', () => {
            showScreen('admin-requests');
        });
    }

    const btnAdminApprove = document.getElementById('btn-admin-approve');
    if (btnAdminApprove) {
        btnAdminApprove.addEventListener('click', () => {
            let approvedReq = null;
            adminPendingRequests = adminPendingRequests.map(req => {
                if (req.id === 1 && req.status === 'Pendiente') {
                    req.status = 'Aprobada';
                    approvedReq = req;
                }
                return req;
            });

            if (approvedReq) {
                // Convert to main organizations format
                const newOrg = {
                    name: approvedReq.name,
                    rating: "Sin calificaciones",
                    reviews: "0",
                    description: approvedReq.desc,
                    tags: [], // Optional tags
                    status: "Activa",
                    services: approvedReq.services,
                    lat: approvedReq.lat,
                    lng: approvedReq.lng,
                    address: approvedReq.address,
                    phone: approvedReq.phone,
                    social: approvedReq.social,
                    website: "",
                    serviceInfo: approvedReq.desc,
                    schedule: approvedReq.schedule,
                    needs: [],
                    gallery: [],
                    reviewsList: []
                };

                // Add to each service category
                approvedReq.services.forEach(svc => {
                    if (!organizationsByService[svc]) {
                        organizationsByService[svc] = [];
                    }
                    organizationsByService[svc].push(newOrg);
                });

                // Update Leaflet map if already initialized
                if (typeof map !== 'undefined' && map !== null) {
                    allMapOrganizations = getAllOrganizations();
                    renderMapMarkers(allMapOrganizations);
                }
            }

            alert('Organización aprobada correctamente.');
            renderAdminRequests();
            showScreen('admin-requests');
        });
    }

    const btnAdminReject = document.getElementById('btn-admin-reject');
    if (btnAdminReject) {
        btnAdminReject.addEventListener('click', () => {
            adminPendingRequests = adminPendingRequests.map(req => {
                if (req.id === 1) req.status = 'Rechazada';
                return req;
            });
            alert('Solicitud rechazada correctamente.');
            renderAdminRequests();
            showScreen('admin-requests');
        });
    }

    let suggestFormTemplate = '';

    /**
     * Bind all interactive events for the Suggest Organization form (Screen 4.2)
     */
    function bindSuggestFormEvents() {
        // 1. Back buttons: btn-back-to-add-org & btn-cancel-suggest
        const backBtn = document.getElementById('btn-back-to-add-org');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                showScreen('add-org');
            });
        }

        const cancelBtn = document.getElementById('btn-cancel-suggest');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                showScreen('add-org');
            });
        }

        // 2. Selectable service pills toggle selected class
        const servicePills = document.querySelectorAll('.service-pill');
        servicePills.forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('selected');
            });
        });

        // 3. Conditional schedules toggle (No/Sí radio selection)
        const scheduleRadios = document.querySelectorAll('input[name="suggest-schedule-known"]');
        const scheduleContainer = document.getElementById('suggest-schedule-container');
        scheduleRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (radio.value === 'yes') {
                    scheduleContainer.style.display = 'flex';
                } else {
                    scheduleContainer.style.display = 'none';
                }
            });
        });

        // 4. Submit Solicitud triggers success state rendering
        const btnSubmitSuggest = document.getElementById('btn-submit-suggest');
        if (btnSubmitSuggest) {
            btnSubmitSuggest.addEventListener('click', () => {
                const formCard = document.getElementById('suggest-form-card-container');
                if (formCard) {
                    formCard.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Solicitud enviada!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Solicitud enviada correctamente. Será revisada por un administrador.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-suggest" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success back button
                    const btnSuccessBack = document.getElementById('btn-success-back-suggest');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            showScreen('add-org');
                        });
                    }
                }
            });
        }
    }

    /**
     * Reset the suggestion form HTML back to blank state
     */
    function resetSuggestForm() {
        const formCard = document.getElementById('suggest-form-card-container');
        if (formCard && suggestFormTemplate) {
            formCard.innerHTML = suggestFormTemplate;
            bindSuggestFormEvents();
        }
    }

    // Capture initial template and bind events
    const suggestFormContainer = document.getElementById('suggest-form-card-container');
    if (suggestFormContainer) {
        suggestFormTemplate = suggestFormContainer.innerHTML;
        bindSuggestFormEvents();
    }

    function populateRequestDetail(reqId) {
        const req = mockSuggestions[reqId];
        if (!req) return;

        // Populate fields dynamically
        document.getElementById('detail-req-title').textContent = req.name;
        document.getElementById('detail-req-name').textContent = req.name;
        document.getElementById('detail-req-desc').textContent = req.desc;
        document.getElementById('detail-req-date').textContent = `Fecha de envío: ${req.date}`;
        document.getElementById('detail-req-address').textContent = req.address || '-';
        document.getElementById('detail-req-phone').textContent = req.phone || '-';
        document.getElementById('detail-req-social').textContent = req.social || '-';
        document.getElementById('detail-req-lat').textContent = req.lat || '-';
        document.getElementById('detail-req-lng').textContent = req.lng || '-';

        // Status Badge
        const badge = document.getElementById('detail-req-badge');
        badge.className = 'status-badge-custom'; // reset
        badge.classList.add(req.status);
        badge.textContent = req.statusLabel;

        // Services pills
        const servicesContainer = document.getElementById('detail-req-services');
        servicesContainer.innerHTML = '';
        if (req.services && req.services.length > 0) {
            req.services.forEach(svc => {
                const pill = document.createElement('span');
                pill.className = 'service-pill selected';
                pill.style.cursor = 'default';
                pill.textContent = svc;
                servicesContainer.appendChild(pill);
            });
        } else {
            servicesContainer.innerHTML = '<span style="font-style: italic; color: var(--text-muted);">Ninguno</span>';
        }

        // Schedule
        const scheduleEl = document.getElementById('detail-req-schedule');
        if (req.schedule === 'No informados') {
            scheduleEl.style.fontStyle = 'italic';
            scheduleEl.style.color = 'var(--text-muted)';
        } else {
            scheduleEl.style.fontStyle = 'normal';
            scheduleEl.style.color = 'var(--brand-charcoal)';
        }
        scheduleEl.textContent = req.schedule;

        // Review status banner
        const reviewBlock = document.getElementById('detail-req-review-block');
        reviewBlock.style.borderLeftColor = req.reviewColor;
        reviewBlock.style.backgroundColor = req.reviewBg;
        
        document.getElementById('detail-req-review-text').textContent = req.reviewText;
    }

    // Bind Solicitudes Anteriores (Screen 4.3) buttons and placeholders
    function bindOrgRequestsEvents() {
        // 1. Back buttons: btn-back-to-add-org-from-requests & btn-cancel-view-org-requests
        const backBtnHeader = document.getElementById('btn-back-to-add-org-from-requests');
        if (backBtnHeader) {
            backBtnHeader.addEventListener('click', () => {
                showScreen('add-org');
            });
        }

        const cancelBtnBottom = document.getElementById('btn-cancel-view-org-requests');
        if (cancelBtnBottom) {
            cancelBtnBottom.addEventListener('click', () => {
                showScreen('add-org');
            });
        }

        // 2. View details "Ver solicitud" transitions to Screen 4.4
        const viewRequestBtns = document.querySelectorAll('.btn-view-request');
        viewRequestBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const reqId = btn.getAttribute('data-id');
                requestDetailSource = 'org-requests';
                populateRequestDetail(reqId);
                // Show detail screen
                showScreen('request-detail');
            });
        });

        // 3. Back buttons from detail screen
        const backDetailBtn = document.getElementById('btn-back-to-requests-from-detail');
        if (backDetailBtn) {
            backDetailBtn.addEventListener('click', () => {
                if (requestDetailSource === 'suggestions') {
                    showScreen('suggestions');
                } else {
                    showScreen('org-requests');
                }
            });
        }

        const backCardBtn = document.getElementById('btn-back-to-requests-from-card');
        if (backCardBtn) {
            backCardBtn.addEventListener('click', () => {
                if (requestDetailSource === 'suggestions') {
                    showScreen('suggestions');
                } else {
                    showScreen('org-requests');
                }
            });
        }
    }
    bindOrgRequestsEvents();

    let editMyOrgFormTemplate = '';

    function bindMyOrgEvents() {
        const editFormContainer = document.getElementById('edit-my-org-form-container');
        if (editFormContainer && !editMyOrgFormTemplate) {
            editMyOrgFormTemplate = editFormContainer.innerHTML;
        }

        // 1. "Editar información" button switches to screen 5.2
        const btnEditMyOrgInfo = document.getElementById('btn-edit-my-org-info');
        if (btnEditMyOrgInfo) {
            btnEditMyOrgInfo.addEventListener('click', () => {
                resetEditMyOrgForm();
                showScreen('edit-my-org');
            });
        }

        // 2. Back actions from Screen 5.2
        const btnBackHeader = document.getElementById('btn-back-to-my-org-from-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        const btnCancel = document.getElementById('btn-cancel-edit-my-org');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        // 3. Save Changes ("Guardar cambios")
        const btnSave = document.getElementById('btn-save-edit-my-org');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const nameVal = document.getElementById('edit-my-org-name').value;
                const descVal = document.getElementById('edit-my-org-desc').value;
                const addressVal = document.getElementById('edit-my-org-address').value;
                const phoneVal = document.getElementById('edit-my-org-phone').value;
                const instagramVal = document.getElementById('edit-my-org-instagram').value;
                const websiteVal = document.getElementById('edit-my-org-website').value;
                const latVal = document.getElementById('edit-my-org-lat').value;
                const lngVal = document.getElementById('edit-my-org-lng').value;

                // Update Screen 5.1 display values dynamically
                const headerName = document.getElementById('my-org-header-name');
                if (headerName) headerName.textContent = nameVal;

                const headerDesc = document.getElementById('my-org-header-desc');
                if (headerDesc) headerDesc.textContent = descVal;

                const infoAddress = document.getElementById('my-org-info-address');
                if (infoAddress) infoAddress.textContent = addressVal;

                const infoPhone = document.getElementById('my-org-info-phone');
                if (infoPhone) infoPhone.textContent = phoneVal;

                const infoInstagram = document.getElementById('my-org-info-instagram');
                if (infoInstagram) infoInstagram.textContent = instagramVal;

                const infoWebsite = document.getElementById('my-org-info-website');
                if (infoWebsite) {
                    infoWebsite.textContent = websiteVal;
                    infoWebsite.href = websiteVal.startsWith('http') ? websiteVal : `https://${websiteVal}`;
                }

                const infoLat = document.getElementById('my-org-info-lat');
                if (infoLat) infoLat.textContent = latVal;

                const infoLng = document.getElementById('my-org-info-lng');
                if (infoLng) infoLng.textContent = lngVal;

                // Render success confirmation state inside the form container
                if (editFormContainer) {
                    editFormContainer.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Información actualizada!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Información actualizada correctamente.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-edit-my-org" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success back button to return to dashboard
                    const btnSuccessBack = document.getElementById('btn-success-back-edit-my-org');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            showScreen('my-org');
                        });
                    }
                }
            });
        }
    }

    function resetEditMyOrgForm() {
        const editFormContainer = document.getElementById('edit-my-org-form-container');
        if (editFormContainer && editMyOrgFormTemplate) {
            // Read updated values from the dashboard (Screen 5.1) to prefill inputs
            editFormContainer.innerHTML = editMyOrgFormTemplate;
            
            const headerNameVal = document.getElementById('my-org-header-name')?.textContent || '';
            const headerDescVal = document.getElementById('my-org-header-desc')?.textContent || '';
            const addressVal = document.getElementById('my-org-info-address')?.textContent || '';
            const phoneVal = document.getElementById('my-org-info-phone')?.textContent || '';
            const instagramVal = document.getElementById('my-org-info-instagram')?.textContent || '';
            const websiteVal = document.getElementById('my-org-info-website')?.textContent || '';
            const latVal = document.getElementById('my-org-info-lat')?.textContent || '';
            const lngVal = document.getElementById('my-org-info-lng')?.textContent || '';

            document.getElementById('edit-my-org-name').value = headerNameVal;
            document.getElementById('edit-my-org-desc').value = headerDescVal;
            document.getElementById('edit-my-org-address').value = addressVal;
            document.getElementById('edit-my-org-phone').value = phoneVal;
            document.getElementById('edit-my-org-instagram').value = instagramVal;
            document.getElementById('edit-my-org-website').value = websiteVal;
            document.getElementById('edit-my-org-lat').value = latVal;
            document.getElementById('edit-my-org-lng').value = lngVal;

            bindMyOrgEvents();
        }
    }

    bindMyOrgEvents();

    let myOrgServices = [
        {
            id: 1,
            type: "Duchas",
            name: "Duchas comunitarias",
            desc: "Acceso a duchas y elementos básicos de higiene.",
            schedule: "Lunes a viernes de 9:00 a 12:00",
            status: "active-status",
            statusLabel: "Activo"
        },
        {
            id: 2,
            type: "Ropa",
            name: "Entrega de ropa",
            desc: "Entrega de ropa limpia según disponibilidad.",
            schedule: "Martes y jueves de 10:00 a 13:00",
            status: "active-status",
            statusLabel: "Activo"
        },
        {
            id: 3,
            type: "Comida",
            name: "Almuerzo comunitario",
            desc: "Almuerzos para personas y familias del barrio.",
            schedule: "Lunes a viernes de 12:00 a 14:00",
            status: "active-status",
            statusLabel: "Activo"
        }
    ];

    let editingServiceId = null;
    let serviceFormTemplate = '';

    function bindManageServicesEvents() {
        const formContainer = document.getElementById('service-form-card-container');
        if (formContainer && !serviceFormTemplate) {
            serviceFormTemplate = formContainer.innerHTML;
        }

        // 1. "Administrar servicios" button switches to screen 5.3
        const btnManageServices = document.getElementById('btn-manage-my-org-services');
        if (btnManageServices) {
            btnManageServices.addEventListener('click', () => {
                renderMyOrgServices();
                // Ensure views are reset
                document.getElementById('services-list-view').style.display = 'block';
                document.getElementById('service-form-view').style.display = 'none';
                showScreen('manage-services');
            });
        }

        // 2. Back arrow in header & footer Volver button on list view
        const btnBackHeader = document.getElementById('btn-back-to-my-org-from-services-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        const btnBackFooter = document.getElementById('btn-back-to-my-org-from-services-btn');
        if (btnBackFooter) {
            btnBackFooter.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        // 3. "Agregar servicio" button shows form
        const btnAddService = document.getElementById('btn-add-service');
        if (btnAddService) {
            btnAddService.addEventListener('click', () => {
                editingServiceId = null;
                resetServiceForm();
                document.getElementById('service-form-title').textContent = "Agregar servicio";
                document.getElementById('services-list-view').style.display = 'none';
                document.getElementById('service-form-view').style.display = 'block';
            });
        }

        // 4. "Cancelar" button in form
        const btnCancel = document.getElementById('btn-cancel-service');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                document.getElementById('services-list-view').style.display = 'block';
                document.getElementById('service-form-view').style.display = 'none';
            });
        }

        // 5. "Guardar servicio" in form
        const btnSave = document.getElementById('btn-save-service');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const typeEl     = document.getElementById('service-form-type');
                const nameEl     = document.getElementById('service-form-name');
                const descEl     = document.getElementById('service-form-desc');
                const scheduleEl = document.getElementById('service-form-schedule');
                const statusEl   = document.getElementById('service-form-status');

                const typeVal     = typeEl.value.trim();
                const nameVal     = nameEl.value.trim();
                const descVal     = descEl.value.trim();
                const scheduleVal = scheduleEl.value.trim();
                const statusVal   = statusEl.value.trim();

                // ── Validation ──────────────────────────────────────────────
                // Collect which fields are invalid.
                // Selects always have a chosen value so we check they're non-empty.
                // Text inputs must have non-blank content.
                const requiredFields = [
                    { el: typeEl,     val: typeVal },
                    { el: nameEl,     val: nameVal },
                    { el: descEl,     val: descVal },
                    { el: scheduleEl, val: scheduleVal },
                    { el: statusEl,   val: statusVal }
                ];

                // Clear previous error state on all fields
                requiredFields.forEach(({ el }) => el.classList.remove('form-input--error'));

                // Remove any existing error banner
                const existingBanner = document.getElementById('service-form-error-banner');
                if (existingBanner) existingBanner.remove();

                const invalidFields = requiredFields.filter(({ val }) => !val);

                if (invalidFields.length > 0) {
                    // Highlight each invalid field
                    invalidFields.forEach(({ el }) => el.classList.add('form-input--error'));

                    // Remove error highlight when the user starts correcting a field
                    invalidFields.forEach(({ el }) => {
                        const clearError = () => {
                            el.classList.remove('form-input--error');
                            el.removeEventListener('input', clearError);
                            el.removeEventListener('change', clearError);
                        };
                        el.addEventListener('input', clearError);
                        el.addEventListener('change', clearError);
                    });

                    // Insert inline error banner just above the action buttons row
                    const actionsRow = document.querySelector('#service-form-card-container .form-actions-row');
                    if (actionsRow) {
                        const banner = document.createElement('div');
                        banner.id = 'service-form-error-banner';
                        banner.className = 'service-form-error-banner';
                        banner.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>Completá todos los campos obligatorios antes de guardar.</span>
                        `;
                        actionsRow.parentNode.insertBefore(banner, actionsRow);
                    }

                    // Do NOT save, do NOT close the form
                    return;
                }

                // ── All fields valid — save the service ──────────────────────
                const statusLabelMap = {
                    'active-status':    'Activo',
                    'suspended-status': 'Suspendido',
                    'full-status':      'Cupo completo',
                    'inactive-status':  'Inactivo'
                };

                if (editingServiceId !== null) {
                    // Edit mode
                    const svc = myOrgServices.find(s => s.id === editingServiceId);
                    if (svc) {
                        svc.type      = typeVal;
                        svc.name      = nameVal;
                        svc.desc      = descVal;
                        svc.schedule  = scheduleVal;
                        svc.status    = statusVal;
                        svc.statusLabel = statusLabelMap[statusVal] || 'Activo';
                    }
                } else {
                    // Add mode
                    const newId = myOrgServices.length > 0 ? Math.max(...myOrgServices.map(s => s.id)) + 1 : 1;
                    myOrgServices.push({
                        id:          newId,
                        type:        typeVal,
                        name:        nameVal,
                        desc:        descVal,
                        schedule:    scheduleVal,
                        status:      statusVal,
                        statusLabel: statusLabelMap[statusVal] || 'Activo'
                    });
                }

                // Render success confirmation in the form card container
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Servicio guardado!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Servicio guardado correctamente.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-service" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success button
                    const btnSuccessBack = document.getElementById('btn-success-back-service');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            renderMyOrgServices();
                            document.getElementById('services-list-view').style.display = 'block';
                            document.getElementById('service-form-view').style.display = 'none';
                        });
                    }
                }
            });
        }
    }

    function renderMyOrgServices() {
        const cardsGrid = document.getElementById('services-cards-grid');
        if (!cardsGrid) return;

        cardsGrid.innerHTML = '';

        if (myOrgServices.length === 0) {
            cardsGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); font-size: 1.1rem; font-style: italic; background-color: var(--bg-card); border-radius: 20px; border: 1.5px dashed rgba(76, 67, 61, 0.15);">
                    No hay servicios registrados para tu organización.
                </div>
            `;
        } else {
            myOrgServices.forEach(svc => {
                const card = document.createElement('article');
                card.className = 'manage-service-card';
                card.innerHTML = `
                    <div class="manage-service-info">
                        <div class="manage-service-header">
                            <h4 class="manage-service-name">${svc.name}</h4>
                            <span class="status-badge-custom ${svc.status}">${svc.statusLabel}</span>
                        </div>
                        <p class="manage-service-desc">${svc.desc}</p>
                        <div class="manage-service-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>Horario: ${svc.schedule}</span>
                        </div>
                    </div>
                    <div class="manage-service-actions">
                        <button class="request-card-btn btn-edit-service" data-id="${svc.id}">Editar</button>
                        <button class="request-card-btn btn-delete-service" data-id="${svc.id}">Eliminar</button>
                    </div>
                `;

                // Add to DOM
                cardsGrid.appendChild(card);
            });

            // Bind individual card actions
            const editBtns = cardsGrid.querySelectorAll('.btn-edit-service');
            editBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    const svc = myOrgServices.find(s => s.id === id);
                    if (svc) {
                        editingServiceId = id;
                        resetServiceForm();
                        
                        document.getElementById('service-form-title').textContent = "Editar servicio";
                        document.getElementById('service-form-type').value = svc.type;
                        document.getElementById('service-form-name').value = svc.name;
                        document.getElementById('service-form-desc').value = svc.desc;
                        document.getElementById('service-form-schedule').value = svc.schedule;
                        document.getElementById('service-form-status').value = svc.status;

                        document.getElementById('services-list-view').style.display = 'none';
                        document.getElementById('service-form-view').style.display = 'block';
                    }
                });
            });

            const deleteBtns = cardsGrid.querySelectorAll('.btn-delete-service');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    myOrgServices = myOrgServices.filter(s => s.id !== id);
                    renderMyOrgServices();
                });
            });
        }

        // Synchronize display pills on Screen 5.1 dashboard services list!
        const dashboardServicesList = document.getElementById('my-org-services-list');
        if (dashboardServicesList) {
            dashboardServicesList.innerHTML = '';
            
            // Get unique active service types (Duchas, Ropa, Comida, etc.)
            const uniqueTypes = [...new Set(myOrgServices.map(s => s.type))];
            
            if (uniqueTypes.length > 0) {
                uniqueTypes.forEach(type => {
                    const pill = document.createElement('span');
                    pill.className = 'service-pill selected';
                    pill.style.cursor = 'default';
                    pill.style.margin = '0';
                    pill.textContent = type;
                    dashboardServicesList.appendChild(pill);
                });
            } else {
                dashboardServicesList.innerHTML = `<span style="font-style: italic; color: var(--text-muted);">Sin servicios registrados</span>`;
            }
        }
    }

    function resetServiceForm() {
        const formContainer = document.getElementById('service-form-card-container');
        if (formContainer && serviceFormTemplate) {
            formContainer.innerHTML = serviceFormTemplate;
            bindManageServicesEvents();
        }
    }

    bindManageServicesEvents();

    let myOrgNeeds = [
        {
            id: 1,
            name: "Toallas",
            category: "Higiene",
            desc: "Se necesitan toallas limpias para el servicio de duchas.",
            priority: "high",
            priorityLabel: "Alta",
            status: "active-status",
            statusLabel: "Activa"
        },
        {
            id: 2,
            name: "Jabón",
            category: "Higiene",
            desc: "Se reciben jabones nuevos para kits de higiene.",
            priority: "medium",
            priorityLabel: "Media",
            status: "active-status",
            statusLabel: "Activa"
        },
        {
            id: 3,
            name: "Ropa de abrigo",
            category: "Ropa",
            desc: "Se necesitan camperas, buzos y frazadas en buen estado.",
            priority: "high",
            priorityLabel: "Alta",
            status: "active-status",
            statusLabel: "Activa"
        },
        {
            id: 4,
            name: "Voluntarios",
            category: "Voluntariado",
            desc: "Se buscan voluntarios para ayudar en la organización.",
            priority: "medium",
            priorityLabel: "Media",
            status: "active-status",
            statusLabel: "Activa"
        }
    ];

    let editingNeedId = null;
    let needFormTemplate = '';

    function bindManageNeedsEvents() {
        const formContainer = document.getElementById('need-form-card-container');
        if (formContainer && !needFormTemplate) {
            needFormTemplate = formContainer.innerHTML;
        }

        // 1. "Administrar necesidades" button switches to screen 5.4
        const btnManageNeeds = document.getElementById('btn-manage-my-org-needs');
        if (btnManageNeeds) {
            btnManageNeeds.addEventListener('click', () => {
                renderMyOrgNeeds();
                // Ensure views are reset
                document.getElementById('needs-list-view').style.display = 'block';
                document.getElementById('need-form-view').style.display = 'none';
                showScreen('manage-needs');
            });
        }

        // 2. Back arrow in header & footer Volver button on list view
        const btnBackHeader = document.getElementById('btn-back-to-my-org-from-needs-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        const btnBackFooter = document.getElementById('btn-back-to-my-org-from-needs-btn');
        if (btnBackFooter) {
            btnBackFooter.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        // 3. "Nueva necesidad" button shows form
        const btnAddNeed = document.getElementById('btn-add-need');
        if (btnAddNeed) {
            btnAddNeed.addEventListener('click', () => {
                editingNeedId = null;
                resetNeedForm();
                document.getElementById('need-form-title').textContent = "Nueva necesidad";
                document.getElementById('needs-list-view').style.display = 'none';
                document.getElementById('need-form-view').style.display = 'block';
            });
        }

        // 4. "Cancelar" button in form
        const btnCancel = document.getElementById('btn-cancel-need');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                document.getElementById('needs-list-view').style.display = 'block';
                document.getElementById('need-form-view').style.display = 'none';
            });
        }

        // 5. "Guardar necesidad" in form
        const btnSave = document.getElementById('btn-save-need');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const nameVal = document.getElementById('need-form-name').value;
                const descVal = document.getElementById('need-form-desc').value;
                const categoryVal = document.getElementById('need-form-category').value;
                const priorityVal = document.getElementById('need-form-priority').value;
                const statusVal = document.getElementById('need-form-status').value;

                const priorityLabelMap = {
                    'low': 'Baja',
                    'medium': 'Media',
                    'high': 'Alta',
                    'urgent': 'Urgente'
                };

                const statusLabelMap = {
                    'active-status': 'Activa',
                    'inactive-status': 'Inactiva'
                };

                if (editingNeedId !== null) {
                    // Edit mode
                    const need = myOrgNeeds.find(n => n.id === editingNeedId);
                    if (need) {
                        need.name = nameVal;
                        need.desc = descVal;
                        need.category = categoryVal;
                        need.priority = priorityVal;
                        need.priorityLabel = priorityLabelMap[priorityVal] || 'Media';
                        need.status = statusVal;
                        need.statusLabel = statusLabelMap[statusVal] || 'Activa';
                    }
                } else {
                    // Add mode
                    const newId = myOrgNeeds.length > 0 ? Math.max(...myOrgNeeds.map(n => n.id)) + 1 : 1;
                    myOrgNeeds.push({
                        id: newId,
                        name: nameVal,
                        desc: descVal,
                        category: categoryVal,
                        priority: priorityVal,
                        priorityLabel: priorityLabelMap[priorityVal] || 'Media',
                        status: statusVal,
                        statusLabel: statusLabelMap[statusVal] || 'Activa'
                    });
                }

                // Render success confirmation in the form card container
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Necesidad guardada!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Necesidad guardada correctamente.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-need" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success button
                    const btnSuccessBack = document.getElementById('btn-success-back-need');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            renderMyOrgNeeds();
                            document.getElementById('needs-list-view').style.display = 'block';
                            document.getElementById('need-form-view').style.display = 'none';
                        });
                    }
                }
            });
        }
    }

    function renderMyOrgNeeds() {
        const cardsGrid = document.getElementById('needs-cards-grid');
        if (!cardsGrid) return;

        cardsGrid.innerHTML = '';

        if (myOrgNeeds.length === 0) {
            cardsGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); font-size: 1.1rem; font-style: italic; background-color: var(--bg-card); border-radius: 20px; border: 1.5px dashed rgba(76, 67, 61, 0.15);">
                    No hay necesidades registradas para tu organización.
                </div>
            `;
        } else {
            myOrgNeeds.forEach(need => {
                const card = document.createElement('article');
                card.className = 'manage-service-card'; // Reuse the card styling
                card.innerHTML = `
                    <div class="manage-service-info">
                        <div class="manage-service-header">
                            <h4 class="manage-service-name">${need.name}</h4>
                            <span class="priority-badge-custom priority-${need.priority}">${need.priorityLabel}</span>
                            <span class="status-badge-custom ${need.status}" style="font-size: 0.75rem; padding: 0.25rem 0.65rem;">${need.statusLabel}</span>
                        </div>
                        <p class="manage-service-desc">${need.desc}</p>
                        <div class="manage-service-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>Categoría: ${need.category}</span>
                        </div>
                    </div>
                    <div class="manage-service-actions">
                        <button class="request-card-btn btn-edit-need" data-id="${need.id}">Editar</button>
                        <button class="request-card-btn btn-delete-need" data-id="${need.id}">Eliminar</button>
                    </div>
                `;

                // Add to DOM
                cardsGrid.appendChild(card);
            });

            // Bind individual card actions
            const editBtns = cardsGrid.querySelectorAll('.btn-edit-need');
            editBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    const need = myOrgNeeds.find(n => n.id === id);
                    if (need) {
                        editingNeedId = id;
                        resetNeedForm();
                        
                        document.getElementById('need-form-title').textContent = "Editar necesidad";
                        document.getElementById('need-form-name').value = need.name;
                        document.getElementById('need-form-desc').value = need.desc;
                        document.getElementById('need-form-category').value = need.category;
                        document.getElementById('need-form-priority').value = need.priority;
                        document.getElementById('need-form-status').value = need.status;

                        document.getElementById('needs-list-view').style.display = 'none';
                        document.getElementById('need-form-view').style.display = 'block';
                    }
                });
            });

            const deleteBtns = cardsGrid.querySelectorAll('.btn-delete-need');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    myOrgNeeds = myOrgNeeds.filter(n => n.id !== id);
                    renderMyOrgNeeds();
                });
            });
        }

        // Synchronize display list on Screen 5.1 dashboard needs list!
        const dashboardNeedsList = document.getElementById('my-org-needs-list');
        if (dashboardNeedsList) {
            dashboardNeedsList.innerHTML = '';
            
            // Filter only active status needs
            const activeNeeds = myOrgNeeds.filter(n => n.status === 'active-status');
            
            if (activeNeeds.length > 0) {
                activeNeeds.forEach(need => {
                    const needItem = document.createElement('div');
                    needItem.style.display = 'flex';
                    needItem.style.alignItems = 'center';
                    needItem.style.gap = '0.6rem';
                    needItem.style.fontWeight = '600';
                    needItem.style.color = 'var(--brand-charcoal)';
                    needItem.style.fontSize = '1.05rem';
                    needItem.innerHTML = `
                        <span style="display:inline-block; width:6px; height:6px; background-color:var(--brand-rust); border-radius:50%;"></span>
                        ${need.name}
                    `;
                    dashboardNeedsList.appendChild(needItem);
                });
            } else {
                dashboardNeedsList.innerHTML = `<span style="font-style: italic; color: var(--text-muted);">Sin necesidades pendientes</span>`;
            }
        }
    }

    function resetNeedForm() {
        const formContainer = document.getElementById('need-form-card-container');
        if (formContainer && needFormTemplate) {
            formContainer.innerHTML = needFormTemplate;
            bindManageNeedsEvents();
        }
    }

    bindManageNeedsEvents();

    function bindManagePhotosEvents() {
        // 1. "Administrar fotos" button switches to screen 5.5
        const btnManagePhotos = document.getElementById('btn-manage-my-org-photos');
        if (btnManagePhotos) {
            btnManagePhotos.addEventListener('click', () => {
                showScreen('manage-photos');
            });
        }

        // 2. Back arrow in header & footer Volver button
        const btnBackHeader = document.getElementById('btn-back-to-my-org-from-photos-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        const btnBackFooter = document.getElementById('btn-back-to-my-org-from-photos-btn');
        if (btnBackFooter) {
            btnBackFooter.addEventListener('click', () => {
                showScreen('my-org');
            });
        }

        // 3. Upload photo action switches to screen 5.5.1
        const btnUploadHeader = document.getElementById('btn-upload-photo-header');
        if (btnUploadHeader) {
            btnUploadHeader.addEventListener('click', () => {
                resetAddPhotoForm();
                showScreen('add-photo');
            });
        }

        const btnSelectCard = document.getElementById('btn-select-file-card');
        if (btnSelectCard) {
            btnSelectCard.addEventListener('click', () => {
                resetAddPhotoForm();
                showScreen('add-photo');
            });
        }

        const btnSelectFile = document.getElementById('btn-select-file');
        if (btnSelectFile) {
            btnSelectFile.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent triggering the card's click twice
                resetAddPhotoForm();
                showScreen('add-photo');
            });
        }

        // 4. Delete photo handler
        const galleryContainer = document.getElementById('photos-gallery-container');
        if (galleryContainer) {
            galleryContainer.addEventListener('click', (e) => {
                if (e.target && e.target.classList.contains('btn-delete-photo')) {
                    const card = e.target.closest('.photo-gallery-card');
                    if (card) {
                        alert("Foto eliminada correctamente.");
                        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                        card.style.opacity = "0";
                        card.style.transform = "scale(0.9)";
                        setTimeout(() => {
                            card.remove();
                        }, 300);
                    }
                }
            });
        }
    }

    bindManagePhotosEvents();

    let addPhotoFormTemplate = '';

    function bindAddPhotoEvents() {
        const formContainer = document.getElementById('add-photo-form-card-container');
        if (formContainer && !addPhotoFormTemplate) {
            addPhotoFormTemplate = formContainer.innerHTML;
        }

        // 1. Back/Cancel Actions: Volver buttons transition to screen 5.5
        const btnBackHeader = document.getElementById('btn-back-to-photos-from-add-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('manage-photos');
            });
        }

        const btnCancel = document.getElementById('btn-cancel-add-photo');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                showScreen('manage-photos');
            });
        }

        // 2. Mock file select actions (dashed upload card and its select file button) redirect to Screen 5.5.2
        const btnSelectCardAdd = document.getElementById('btn-select-file-add-card');
        if (btnSelectCardAdd) {
            btnSelectCardAdd.addEventListener('click', () => {
                resetPhotoSelectedForm();
                showScreen('photo-selected');
            });
        }

        const btnSelectFileAdd = document.getElementById('btn-select-file-add');
        if (btnSelectFileAdd) {
            btnSelectFileAdd.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent triggering card click twice
                resetPhotoSelectedForm();
                showScreen('photo-selected');
            });
        }

        // 3. Save Photo button
        const btnSavePhoto = document.getElementById('btn-save-photo');
        if (btnSavePhoto) {
            btnSavePhoto.addEventListener('click', () => {
                // Trigger alert confirmation
                alert("Foto guardada correctamente.");

                // Render success confirmation state in the form container
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Foto guardada!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Foto guardada correctamente.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-add-photo" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success back button
                    const btnSuccessBack = document.getElementById('btn-success-back-add-photo');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            showScreen('manage-photos');
                        });
                    }
                }
            });
        }
    }

    function resetAddPhotoForm() {
        const formContainer = document.getElementById('add-photo-form-card-container');
        if (formContainer && addPhotoFormTemplate) {
            formContainer.innerHTML = addPhotoFormTemplate;
            bindAddPhotoEvents();
        }
    }

    bindAddPhotoEvents();

    let photoSelectedFormTemplate = '';
    let lastSelectedFile = null;

    function bindPhotoSelectedEvents() {
        const formContainer = document.getElementById('photo-selected-card-container');
        if (formContainer && !photoSelectedFormTemplate) {
            photoSelectedFormTemplate = formContainer.innerHTML;
        }

        // 1. Back Arrow returns to Screen 5.5.1
        const btnBackHeader = document.getElementById('btn-back-to-add-from-selected-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', () => {
                showScreen('add-photo');
            });
        }

        // 2. Volver returns to Screen 5.5
        const btnCancel = document.getElementById('btn-cancel-selected-photo');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                showScreen('manage-photos');
            });
        }

        // 3. File Input triggering & change event
        const realFileInput = document.getElementById('real-file-input');
        const btnTrigger = document.getElementById('btn-trigger-file-select');
        
        if (btnTrigger && realFileInput) {
            btnTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                realFileInput.click();
            });
        }

        if (realFileInput) {
            realFileInput.addEventListener('change', (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                    const file = files[0];
                    lastSelectedFile = file;

                    // Update preview using URL.createObjectURL
                    const previewImg = document.getElementById('preview-image-element');
                    const placeholderText = document.getElementById('preview-placeholder-text');
                    if (previewImg && placeholderText) {
                        previewImg.src = URL.createObjectURL(file);
                        previewImg.style.display = 'block';
                        placeholderText.style.display = 'none';
                    }

                    // Update info block
                    const fileInfo = document.getElementById('selected-file-info-container');
                    const fileNameSpan = document.getElementById('selected-file-name');
                    const fileSizeSpan = document.getElementById('selected-file-size');
                    if (fileInfo && fileNameSpan && fileSizeSpan) {
                        fileNameSpan.textContent = file.name;
                        const sizeMB = file.size / (1024 * 1024);
                        if (sizeMB >= 1) {
                            fileSizeSpan.textContent = sizeMB.toFixed(1) + ' MB';
                        } else {
                            const sizeKB = file.size / 1024;
                            fileSizeSpan.textContent = sizeKB.toFixed(0) + ' KB';
                        }
                        fileInfo.style.display = 'block';
                    }

                    // Enable Save button
                    const btnSave = document.getElementById('btn-save-selected-photo');
                    if (btnSave) {
                        btnSave.disabled = false;
                    }
                }
            });
        }

        // 4. Save photo
        const btnSave = document.getElementById('btn-save-selected-photo');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                if (!lastSelectedFile) {
                    alert("Seleccioná un archivo antes de guardar.");
                    return;
                }

                // Show confirmation message
                alert("Foto guardada correctamente.");

                // Dynamically add to the photos gallery in Screen 5.5!
                const gallery = document.getElementById('photos-gallery-container');
                const descInput = document.getElementById('selected-photo-description');
                const descVal = (descInput && descInput.value) ? descInput.value : 'Foto de la organización';
                if (gallery && lastSelectedFile) {
                    const card = document.createElement('article');
                    card.className = 'photo-gallery-card';
                    const objectUrl = URL.createObjectURL(lastSelectedFile);
                    card.innerHTML = `
                        <div class="gallery-image-placeholder" style="background-image: url('${objectUrl}'); background-size: cover; background-position: center; aspect-ratio: 1.5; border-radius: 12px; border: 1px solid rgba(76, 67, 61, 0.05);">
                        </div>
                        <div class="photo-label-row">
                            <span class="photo-card-label">${descVal}</span>
                            <button class="btn-delete-photo">Eliminar</button>
                        </div>
                    `;
                    gallery.appendChild(card);
                }

                // Return to Screen 5.5
                showScreen('manage-photos');
            });
        }
    }

    function resetPhotoSelectedForm() {
        const formContainer = document.getElementById('photo-selected-card-container');
        if (formContainer && photoSelectedFormTemplate) {
            formContainer.innerHTML = photoSelectedFormTemplate;
            lastSelectedFile = null;
            bindPhotoSelectedEvents();
        }
    }

    bindPhotoSelectedEvents();

    const mockComunitasRegisteredUsers = [
        { email: "maria.garcia@example.com", name: "María García" },
        { email: "juan.perez@example.com", name: "Juan Pérez" },
        { email: "ana.lopez@example.com", name: "Ana López" },
        { email: "carlos.mendoza@example.com", name: "Carlos Mendoza" },
        { email: "lucia.gomez@example.com", name: "Lucía Gómez" },
        { email: "sofia.rodriguez@example.com", name: "Sofía Rodríguez" }
    ];

    let myOrgMembers = [
        {
            id: 1,
            name: "María García",
            email: "maria.garcia@example.com",
            role: "Administradora",
            status: "Activa",
            date: "01/06/2026"
        },
        {
            id: 2,
            name: "Juan Pérez",
            email: "juan.perez@example.com",
            role: "Editor",
            status: "Activa",
            date: "05/06/2026"
        },
        {
            id: 3,
            name: "Ana López",
            email: "ana.lopez@example.com",
            role: "Colaboradora",
            status: "Inactiva",
            date: "10/06/2026"
        }
    ];

    let editingMemberId = null;
    let memberFormTemplate = '';
    let manageMembersEventsBound = false;

    function bindManageMembersEvents() {
        const formContainer = document.getElementById('member-form-card-container');
        if (formContainer && !memberFormTemplate) {
            memberFormTemplate = formContainer.innerHTML;
        }

        // Bind persistent buttons only once
        if (!manageMembersEventsBound) {
            // 1. "Administrar miembros" dashboard button switches to screen 5.6
            const btnManageMembers = document.getElementById('btn-manage-my-org-members');
            if (btnManageMembers) {
                btnManageMembers.addEventListener('click', () => {
                    renderMyOrgMembers();
                    // Ensure views are reset
                    document.getElementById('members-list-view').style.display = 'block';
                    document.getElementById('member-form-view').style.display = 'none';
                    showScreen('manage-members');
                });
            }

            // 2. Back arrow in header & footer Volver button on list view
            const btnBackHeader = document.getElementById('btn-back-to-my-org-from-members-header');
            if (btnBackHeader) {
                btnBackHeader.addEventListener('click', () => {
                    showScreen('my-org');
                });
            }

            const btnBackFooter = document.getElementById('btn-back-to-my-org-from-members-btn');
            if (btnBackFooter) {
                btnBackFooter.addEventListener('click', () => {
                    showScreen('my-org');
                });
            }

            // 3. "Agregar miembro" button shows form
            const btnAddMember = document.getElementById('btn-add-member');
            if (btnAddMember) {
                btnAddMember.addEventListener('click', () => {
                    editingMemberId = null;
                    resetMemberForm();
                    document.getElementById('member-form-title').textContent = "Agregar miembro";
                    document.getElementById('members-list-view').style.display = 'none';
                    document.getElementById('member-form-view').style.display = 'block';
                });
            }

            manageMembersEventsBound = true;
        }

        // Bind form-specific elements (which are replaced when innerHTML changes)
        // 4. "Cancelar" button in form
        const btnCancel = document.getElementById('btn-cancel-member');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                document.getElementById('members-list-view').style.display = 'block';
                document.getElementById('member-form-view').style.display = 'none';
            });
        }

        // 5. "Buscar usuario" click handler
        const btnSearchUser = document.getElementById('btn-search-user');
        if (btnSearchUser) {
            btnSearchUser.addEventListener('click', () => {
                const emailInput = document.getElementById('member-form-email');
                const emailVal = emailInput.value.trim().toLowerCase();

                if (!emailVal) {
                    alert("Por favor ingresá un email válido.");
                    return;
                }

                // Search in mock database
                const foundUser = mockComunitasRegisteredUsers.find(u => u.email.toLowerCase() === emailVal);

                const foundSection = document.getElementById('member-found-section');
                const notFoundSection = document.getElementById('member-not-found-section');
                const saveBtn = document.getElementById('btn-save-member');

                if (foundUser) {
                    // Populate details
                    document.getElementById('member-found-name').textContent = foundUser.name;
                    document.getElementById('member-found-email-display').textContent = foundUser.email;

                    // Show options
                    foundSection.style.display = 'flex';
                    notFoundSection.style.display = 'none';
                    saveBtn.style.display = 'block';
                } else {
                    // Show error message
                    notFoundSection.style.display = 'block';
                    foundSection.style.display = 'none';
                    saveBtn.style.display = 'none';
                }
            });
        }

        // 6. "Guardar miembro" in form
        const btnSave = document.getElementById('btn-save-member');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const emailVal = document.getElementById('member-form-email').value.trim().toLowerCase();
                const roleVal = document.getElementById('member-form-role').value;
                const statusVal = document.getElementById('member-form-status').value;

                if (!emailVal) {
                    alert("Por favor ingresá un email válido.");
                    return;
                }

                // Verify COMUNITAS account exists
                const userObj = mockComunitasRegisteredUsers.find(u => u.email.toLowerCase() === emailVal);
                if (!userObj) {
                    alert("El usuario debe estar registrado en COMUNITAS.");
                    return;
                }

                if (editingMemberId !== null) {
                    // Edit mode
                    const m = myOrgMembers.find(member => member.id === editingMemberId);
                    if (m) {
                        m.email = userObj.email;
                        m.role = roleVal;
                        m.status = statusVal;
                        m.name = userObj.name;
                    }
                } else {
                    // Add mode
                    const newId = myOrgMembers.length > 0 ? Math.max(...myOrgMembers.map(m => m.id)) + 1 : 1;
                    myOrgMembers.push({
                        id: newId,
                        name: userObj.name,
                        email: userObj.email,
                        role: roleVal,
                        status: statusVal,
                        date: "09/06/2026"
                    });
                }

                // Show confirmation message
                alert("Miembro guardado correctamente.");

                // Render success confirmation in the form card container
                if (formContainer) {
                    formContainer.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0; display:flex; flex-direction:column; align-items:center; gap:1.5rem; animation: fadeIn 0.4s ease;">
                            <div style="width:72px; height:72px; background-color:#e8f5e9; color:#2e7d56; border-radius:50%; display:flex; align-items:center; justify-content:center;">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="width:36px; height:36px;">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                            <div>
                                <h3 class="form-section-title" style="font-size:1.6rem; color:#2e7d56; border:none; margin-bottom:0.5rem; padding:0;">¡Miembro guardado!</h3>
                                <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Miembro guardado correctamente.</p>
                            </div>
                            <button class="eval-submit-btn" id="btn-success-back-member" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                        </div>
                    `;

                    // Bind success back button
                    const btnSuccessBack = document.getElementById('btn-success-back-member');
                    if (btnSuccessBack) {
                        btnSuccessBack.addEventListener('click', () => {
                            renderMyOrgMembers();
                            document.getElementById('members-list-view').style.display = 'block';
                            document.getElementById('member-form-view').style.display = 'none';
                        });
                    }
                }
            });
        }
    }

    function renderMyOrgMembers() {
        const cardsGrid = document.getElementById('members-cards-grid');
        if (!cardsGrid) return;

        cardsGrid.innerHTML = '';

        if (myOrgMembers.length === 0) {
            cardsGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem 1.5rem; color: var(--text-muted); font-size: 1.1rem; font-style: italic; background-color: var(--bg-card); border-radius: 20px; border: 1.5px dashed rgba(76, 67, 61, 0.15);">
                    No hay miembros registrados para tu organización.
                </div>
            `;
        } else {
            myOrgMembers.forEach(member => {
                const card = document.createElement('article');
                card.className = 'manage-service-card'; // Reuse the card styling

                let statusClass = member.status === 'Activa' ? 'active-status' : 'inactive-status';
                let roleColor = 'var(--brand-rust)';
                let roleBg = '#fcefe9';
                if (member.role === 'Editor') {
                    roleColor = 'var(--text-muted)';
                    roleBg = '#f5ede6';
                } else if (member.role === 'Colaboradora') {
                    roleColor = 'var(--brand-mustard)';
                    roleBg = '#fef5e7';
                }

                card.innerHTML = `
                    <div class="manage-service-info">
                        <div class="manage-service-header">
                            <h4 class="manage-service-name">${member.name}</h4>
                            <span style="font-size:0.8rem; font-weight:700; color:${roleColor}; background-color:${roleBg}; padding:0.25rem 0.65rem; border-radius:20px; text-transform: uppercase; letter-spacing: 0.5px;">${member.role}</span>
                            <span class="status-badge-custom ${statusClass}">${member.status}</span>
                        </div>
                        <p class="manage-service-desc" style="font-weight: 500; color: var(--text-muted); font-size: 0.95rem;">Email: ${member.email}</p>
                        <div class="manage-service-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Fecha de ingreso: ${member.date}</span>
                        </div>
                    </div>
                    <div class="manage-service-actions">
                        <button class="request-card-btn btn-edit-member" data-id="${member.id}">Editar rol</button>
                        <button class="request-card-btn btn-delete-member" data-id="${member.id}">Quitar</button>
                    </div>
                `;

                // Add to DOM
                cardsGrid.appendChild(card);
            });

            // Bind individual card actions
            const editBtns = cardsGrid.querySelectorAll('.btn-edit-member');
            editBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    const m = myOrgMembers.find(member => member.id === id);
                    if (m) {
                        editingMemberId = id;
                        resetMemberForm();
                        
                        document.getElementById('member-form-title').textContent = "Editar rol de miembro";
                        document.getElementById('member-form-email').value = m.email;
                        
                        // Hide search section when editing
                        document.getElementById('member-search-section').style.display = 'none';
                        
                        // Populate user details in result card
                        document.getElementById('member-found-name').textContent = m.name;
                        document.getElementById('member-found-email-display').textContent = m.email;
                        
                        document.getElementById('member-form-role').value = m.role;
                        document.getElementById('member-form-status').value = m.status;

                        // Display found section and save button
                        document.getElementById('member-found-section').style.display = 'flex';
                        document.getElementById('member-not-found-section').style.display = 'none';
                        document.getElementById('btn-save-member').style.display = 'block';

                        document.getElementById('members-list-view').style.display = 'none';
                        document.getElementById('member-form-view').style.display = 'block';
                    }
                });
            });

            const deleteBtns = cardsGrid.querySelectorAll('.btn-delete-member');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    alert("Miembro quitado correctamente.");
                    
                    const card = btn.closest('.manage-service-card');
                    if (card) {
                        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                        card.style.opacity = "0";
                        card.style.transform = "scale(0.9)";
                        setTimeout(() => {
                            myOrgMembers = myOrgMembers.filter(m => m.id !== id);
                            renderMyOrgMembers();
                        }, 300);
                    }
                });
            });
        }

        // Synchronize display list on Screen 5.1 dashboard members list!
        const dashboardList = document.getElementById('my-org-members-list');
        if (dashboardList) {
            dashboardList.innerHTML = '';
            myOrgMembers.forEach((member, index) => {
                const borderStyle = index < myOrgMembers.length - 1 ? 'border-bottom:1px solid #f5ede6; padding-bottom:0.6rem;' : 'padding-top:0.25rem;';
                const div = document.createElement('div');
                div.style = `display:flex; justify-content:space-between; align-items:center; ${borderStyle}`;
                
                let roleColor = 'var(--brand-rust)';
                let roleBg = '#fcefe9';
                if (member.role === 'Editor') {
                    roleColor = 'var(--text-muted)';
                    roleBg = '#f5ede6';
                } else if (member.role === 'Colaboradora') {
                    roleColor = 'var(--brand-mustard)';
                    roleBg = '#fef5e7';
                }

                div.innerHTML = `
                    <span style="font-weight:600; color:var(--brand-charcoal); font-size:1.05rem;">${member.name}</span>
                    <span style="font-size:0.8rem; font-weight:700; color:${roleColor}; background-color:${roleBg}; padding:0.25rem 0.65rem; border-radius:20px; text-transform: uppercase; letter-spacing: 0.5px;">${member.role}</span>
                `;
                dashboardList.appendChild(div);
            });
        }
    }

    function resetMemberForm() {
        const formContainer = document.getElementById('member-form-card-container');
        if (formContainer && memberFormTemplate) {
            formContainer.innerHTML = memberFormTemplate;
            bindManageMembersEvents();
        }
    }

    bindManageMembersEvents();
    renderMyOrgMembers();

    function bindProfileEvents() {
        // Edit Profile transition from Screen 6.1
        const btnEditProfile = document.getElementById('btn-edit-profile');
        if (btnEditProfile) {
            btnEditProfile.addEventListener('click', () => {
                // Pre-populate input fields if elements exist
                const nameText = document.getElementById('profile-user-name');
                const emailText = document.getElementById('profile-user-email');
                
                if (nameText) {
                    const parts = nameText.textContent.split(' ');
                    const name = parts[0] || '';
                    const lastname = parts.slice(1).join(' ') || '';
                    const nameInput = document.getElementById('edit-profile-name');
                    const lastnameInput = document.getElementById('edit-profile-lastname');
                    if (nameInput) nameInput.value = name;
                    if (lastnameInput) lastnameInput.value = lastname;
                }
                if (emailText) {
                    const emailInput = document.getElementById('edit-profile-email');
                    if (emailInput) emailInput.value = emailText.textContent;
                }
                
                // Clear password fields on entry
                const currPass = document.getElementById('edit-profile-curr-pass');
                const newPass = document.getElementById('edit-profile-new-pass');
                const confPass = document.getElementById('edit-profile-conf-pass');
                if (currPass) currPass.value = '';
                if (newPass) newPass.value = '';
                if (confPass) confPass.value = '';

                showScreen('edit-profile');
            });
        }

        // Cancel editing and return to Screen 6.1
        const btnCancelEdit = document.getElementById('btn-cancel-profile-edit');
        if (btnCancelEdit) {
            btnCancelEdit.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        const btnBackHeader = document.getElementById('btn-back-to-profile-from-edit-header');
        if (btnBackHeader) {
            btnBackHeader.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        // Save profile changes
        const btnSaveProfile = document.getElementById('btn-save-profile-changes');
        if (btnSaveProfile) {
            btnSaveProfile.addEventListener('click', (e) => {
                e.preventDefault();

                const nameInput = document.getElementById('edit-profile-name');
                const lastnameInput = document.getElementById('edit-profile-lastname');
                const emailInput = document.getElementById('edit-profile-email');

                const nameVal = nameInput ? nameInput.value.trim() : '';
                const lastnameVal = lastnameInput ? lastnameInput.value.trim() : '';
                const emailVal = emailInput ? emailInput.value.trim() : '';

                if (!nameVal) {
                    alert('Por favor ingresá un nombre.');
                    return;
                }
                if (!emailVal) {
                    alert('Por favor ingresá un email válido.');
                    return;
                }

                // Check passwords if they entered any
                const newPass = document.getElementById('edit-profile-new-pass');
                const confPass = document.getElementById('edit-profile-conf-pass');
                if (newPass && confPass && newPass.value) {
                    if (newPass.value !== confPass.value) {
                        alert('Las contraseñas nuevas no coinciden.');
                        return;
                    }
                }

                // Show confirmation message
                alert('Perfil actualizado correctamente.');

                // Dynamically update Screen 6.1 elements
                const nameDisplay = document.getElementById('profile-user-name');
                const emailDisplay = document.getElementById('profile-user-email');
                if (nameDisplay) {
                    nameDisplay.textContent = `${nameVal} ${lastnameVal}`.trim();
                }
                if (emailDisplay) {
                    emailDisplay.textContent = emailVal;
                }

                // Navigate back
                showScreen('profile');
            });
        }

        // Handle Ver favoritos click to navigate to screen 6.3
        const btnViewFavorites = document.getElementById('btn-view-favorites');
        if (btnViewFavorites) {
            btnViewFavorites.addEventListener('click', (e) => {
                e.preventDefault();
                renderFavorites();
                showScreen('favorites');
            });
        }

        // Handle Volver al perfil clicks
        const btnBackFavHeader = document.getElementById('btn-back-to-profile-from-fav-header');
        if (btnBackFavHeader) {
            btnBackFavHeader.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        const btnBackFavBtn = document.getElementById('btn-back-to-profile-from-fav-btn');
        if (btnBackFavBtn) {
            btnBackFavBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        // Handle Ver reseñas click to navigate to screen 6.4
        const btnViewReviews = document.getElementById('btn-view-reviews');
        if (btnViewReviews) {
            btnViewReviews.addEventListener('click', (e) => {
                e.preventDefault();
                renderReviews();
                showScreen('reviews');
            });
        }

        // Handle Volver al perfil clicks from reviews screen
        const btnBackReviewsHeader = document.getElementById('btn-back-to-profile-from-reviews-header');
        if (btnBackReviewsHeader) {
            btnBackReviewsHeader.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        const btnBackReviewsBtn = document.getElementById('btn-back-to-profile-from-reviews-btn');
        if (btnBackReviewsBtn) {
            btnBackReviewsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        // Handle Ver sugerencias click to navigate to screen 6.5
        const btnViewSuggestions = document.getElementById('btn-view-suggestions');
        if (btnViewSuggestions) {
            btnViewSuggestions.addEventListener('click', (e) => {
                e.preventDefault();
                renderSuggestions();
                showScreen('suggestions');
            });
        }

        // Handle Volver al perfil clicks from suggestions screen
        const btnBackSugHeader = document.getElementById('btn-back-to-profile-from-suggestions-header');
        if (btnBackSugHeader) {
            btnBackSugHeader.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }

        const btnBackSugBtn = document.getElementById('btn-back-to-profile-from-suggestions-btn');
        if (btnBackSugBtn) {
            btnBackSugBtn.addEventListener('click', (e) => {
                e.preventDefault();
                showScreen('profile');
            });
        }
    }

    let favoriteOrganizations = [
        {
            name: "Parroquia San José",
            services: ["Duchas", "Ropa", "Comida"],
            rating: "4.8",
            status: "Activo",
            description: "Duchas, ropa limpia y acompañamiento comunitario."
        },
        {
            name: "Comedor Esperanza",
            services: ["Comida", "Ropa"],
            rating: "4.7",
            status: "Activo",
            description: "Almuerzos y meriendas para personas y familias del barrio."
        },
        {
            name: "Centro Comunitario Norte",
            services: ["Apoyo escolar", "Comida"],
            rating: "4.6",
            status: "Activo",
            description: "Apoyo escolar y actividades educativas."
        }
    ];

    function renderFavorites() {
        const grid = document.getElementById('favorites-grid');
        if (!grid) return;

        // Service icon config — same circle classes and SVGs as Screen 2.0 and 2.2
        const serviceConfig = {
            'Duchas': {
                circleClass: 'circle-duchas',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M7 4h5a6 6 0 0 1 6 6v1"></path>
                    <path d="M15 11h6v2h-6zM16 16v.01M18 16v.01M20 16v.01"></path>
                </svg>`
            },
            'Comida': {
                circleClass: 'circle-comida',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M12 3v3M8 3.5v2M16 3.5v2M3 11h18c0 4.5-3.5 8-9 8s-9-3.5-9-8z"></path>
                </svg>`
            },
            'Atención médica': {
                circleClass: 'circle-salud',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>`
            },
            'Apoyo escolar': {
                circleClass: 'circle-apoyo',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>`
            },
            'Ropa': {
                circleClass: 'circle-clothing',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M2 17l10-10 10 10Z"></path>
                    <path d="M12 7a3 3 0 1 0-3-3"></path>
                </svg>`
            },
            'Alojamiento': {
                circleClass: 'circle-alojamiento',
                svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>`
            }
        };

        grid.innerHTML = '';

        if (favoriteOrganizations.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.15rem; font-style: italic; background-color: var(--bg-card); border-radius: 24px; border: 1.5px dashed rgba(76, 67, 61, 0.15); width: 100%;">
                    No tenés organizaciones guardadas en tus favoritos.
                </div>
            `;
            return;
        }

        favoriteOrganizations.forEach(org => {
            const card = document.createElement('article');
            card.className = 'org-card';

            // Build multi-service icon badges
            const orgServices = org.services && org.services.length > 0 ? org.services : [];
            const servicesBadgesMarkup = orgServices.map(svc => {
                const cfg = serviceConfig[svc] || serviceConfig['Duchas'];
                return `
                    <div style="display:flex; flex-direction:column; align-items:center; gap:0.3rem;">
                        <div class="service-card-icon-wrapper ${cfg.circleClass}" style="width:44px; height:44px; margin:0; flex-shrink:0;">
                            ${cfg.svg}
                        </div>
                        <span style="font-size:0.72rem; font-weight:700; color:var(--brand-charcoal); text-align:center; line-height:1.2;">${svc}</span>
                    </div>
                `;
            }).join('');

            // Status color
            let statusColor = '#3ca374';
            if (org.status === 'Suspendido') statusColor = '#cf5e28';
            else if (org.status === 'Cupo completo') statusColor = '#d87b1a';
            else if (org.status === 'Inactivo') statusColor = 'var(--text-muted)';

            card.innerHTML = `
                <div class="org-card-header" style="flex-direction:column; align-items:flex-start; gap:0.75rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                        <span style="font-size:0.85rem; font-weight:700; color:${statusColor};">• ${org.status}</span>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.75rem; width:100%;">
                        ${servicesBadgesMarkup}
                    </div>
                </div>
                <div class="org-card-body">
                    <h3 class="org-name">${org.name}</h3>
                    <div class="org-rating" aria-label="Calificación ${org.rating} estrellas">
                        <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span class="rating-value">${org.rating}</span>
                    </div>
                    <p class="org-description">${org.description}</p>
                </div>
                <div class="org-card-footer" style="display: flex; gap: 0.75rem; width: 100%;">
                    <button class="details-btn" style="flex-grow: 1; margin: 0;">Ver detalles</button>
                    <button class="eval-secondary-btn btn-remove-fav" style="margin: 0; padding: 0.75rem 1rem; width: auto; color: #a64b58; background-color: #fbeeef; border-color: rgba(166,75,88,0.15); display: flex; align-items: center; justify-content: center;" title="Quitar de favoritos">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px;">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path>
                        </svg>
                    </button>
                </div>
            `;

            // Bind click to "Ver detalles" button — look up in main org db
            const detailsBtn = card.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Use the first service to look up in the org db
                    const primaryService = orgServices[0] || '';
                    const orgsInCategory = organizationsByService[primaryService];
                    const mainOrgData = orgsInCategory ? orgsInCategory.find(o => o.name === org.name) : null;
                    detailScreenSource = 'favorites';
                    if (mainOrgData) {
                        showOrganizationDetail(mainOrgData, primaryService);
                    } else {
                        // Fallback using mock data if not found in db
                        const fallbackOrg = {
                            name: org.name,
                            rating: org.rating,
                            reviews: '45',
                            description: org.description,
                            tags: ['Favorito', 'Activo'],
                            status: org.status,
                            services: org.services || [],
                            address: org.name === 'Parroquia San José' ? 'Calle Falsa 123, Barrio San Martín' : 'Av. de los Trabajadores 456',
                            phone: '+54 11 4567-8901',
                            social: '@comunitas',
                            website: 'www.comunitas.org',
                            serviceInfo: org.description,
                            schedule: 'Lunes a Viernes de 09:00 a 17:00 hs',
                            needs: ['Alimentos', 'Voluntarios'],
                            gallery: ['assets/gallery_dining_room.png'],
                            reviewsList: [
                                { author: 'Juan Pérez', rating: '5', tags: ['Buen trato', 'Personal amable'], date: 'Hace 1 semana' }
                            ]
                        };
                        showOrganizationDetail(fallbackOrg, primaryService);
                    }
                });
            }

            // Bind click to "Quitar favorito" button
            const removeBtn = card.querySelector('.btn-remove-fav');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    alert("Organización quitada de favoritos.");
                    favoriteOrganizations = favoriteOrganizations.filter(o => o.name !== org.name);
                    renderFavorites();
                });
            }

            grid.appendChild(card);
        });
    }

    let userReviews = [
        {
            name: "Parroquia San José",
            service: "Duchas",
            rating: 5,
            tags: ["Buen trato", "Limpio", "Ambiente seguro"],
            date: "08/06/2026"
        },
        {
            name: "Comedor Esperanza",
            service: "Comida",
            rating: 4,
            tags: ["Comida abundante", "Horarios cumplidos"],
            date: "04/06/2026"
        },
        {
            name: "Centro Comunitario Norte",
            service: "Apoyo escolar",
            rating: 5,
            tags: ["Buen trato", "Ambiente seguro", "Personal amable"],
            date: "28/05/2026"
        }
    ];

    let editingReviewIndex = null;
    let currentEditRating = 5;

    function renderReviews() {
        const listView = document.getElementById('reviews-list-view');
        if (!listView) return;

        listView.innerHTML = '';

        if (userReviews.length === 0) {
            listView.innerHTML = `
                <div style="text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.15rem; font-style: italic; background-color: var(--bg-card); border-radius: 24px; border: 1.5px dashed rgba(76, 67, 61, 0.15); width: 100%;">
                    No realizaste ninguna evaluación aún.
                </div>
            `;
            return;
        }

        userReviews.forEach((review, index) => {
            const card = document.createElement('article');
            card.className = 'manage-service-card';
            
            const tagsMarkup = review.tags.map(t => `<span class="org-list-tag">${t}</span>`).join('');
            
            card.innerHTML = `
                <div class="manage-service-info" style="width: 100%;">
                    <div class="manage-service-header" style="justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 0.75rem;">
                        <h4 class="manage-service-name" style="font-size: 1.25rem; margin: 0;">${review.name}</h4>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--brand-rust); background-color: #fcefe9; padding: 0.25rem 0.65rem; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;">${review.service}</span>
                            <span style="color: var(--brand-mustard); font-weight: 700; font-size: 1.1rem; display: flex; align-items: center; gap: 0.25rem;">
                                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 18px; height: 18px; color: var(--brand-mustard);">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                ${review.rating}
                            </span>
                        </div>
                    </div>
                    
                    <div class="org-list-tags" style="margin: 0.5rem 0 0.75rem 0;">
                        ${tagsMarkup}
                    </div>
                    
                    <div class="manage-service-meta" style="margin-top: 0.5rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Evaluado el: ${review.date}</span>
                    </div>
                </div>
                <div class="manage-service-actions" style="margin-top: 1rem; border-top: 1px solid #f5ede6; padding-top: 1rem; display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button class="request-card-btn btn-edit-review" data-index="${index}" style="width: auto; padding-left: 1.5rem; padding-right: 1.5rem;">Editar</button>
                    <button class="request-card-btn btn-delete-review" data-index="${index}" style="width: auto; padding-left: 1.5rem; padding-right: 1.5rem; color: #a64b58; background-color: #fbeeef; border-color: rgba(166,75,88,0.15);">Eliminar</button>
                </div>
            `;

            // Bind click to Edit button
            const editBtn = card.querySelector('.btn-edit-review');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    openEditReviewForm(index);
                });
            }

            // Bind click to Delete button
            const deleteBtn = card.querySelector('.btn-delete-review');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    alert("Reseña eliminada correctamente.");
                    userReviews.splice(index, 1);
                    renderReviews();
                });
            }

            listView.appendChild(card);
        });
    }

    function renderSuggestions() {
        const listView = document.getElementById('suggestions-list-view');
        if (!listView) return;

        listView.innerHTML = '';

        Object.keys(mockSuggestions).forEach(id => {
            const sug = mockSuggestions[id];
            const card = document.createElement('article');
            card.className = 'manage-service-card';
            card.innerHTML = `
                <div class="manage-service-info" style="flex-grow: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                    <h4 class="manage-service-name" style="font-size: 1.25rem; margin: 0; color: var(--brand-charcoal); font-weight: 700;">${sug.name}</h4>
                    
                    <p class="manage-service-desc" style="font-size: 1.05rem; color: var(--brand-charcoal); margin: 0.25rem 0 0.5rem 0;">
                        ${sug.desc}
                    </p>
                    
                    <div class="manage-service-meta" style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); font-size: 0.95rem; font-weight: 500;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>Sugerido el: ${sug.date}</span>
                    </div>
                </div>
                <div class="manage-service-actions" style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; gap: 0.75rem; flex-shrink: 0; min-width: 160px; margin: 0; border: none; padding: 0;">
                    <span class="status-badge-custom ${sug.status}" style="font-size: 0.85rem; padding: 0.35rem 0.85rem; border-radius: 30px; font-weight: 700; text-align: center; display: inline-block; width: 100%; box-sizing: border-box; white-space: nowrap;">${sug.statusLabel}</span>
                    <button class="request-card-btn view-sug-detail-btn" data-id="${id}" style="width: 100%; padding: 0.75rem 1.5rem; margin: 0; text-align: center; white-space: nowrap;">Ver solicitud</button>
                </div>
            `;
            listView.appendChild(card);
        });

        // Bind clicks for the newly rendered buttons
        const detailBtns = listView.querySelectorAll('.view-sug-detail-btn');
        detailBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const reqId = btn.getAttribute('data-id');
                requestDetailSource = 'suggestions';
                populateRequestDetail(reqId);
                showScreen('request-detail');
            });
        });
    }

    function openEditReviewForm(index) {
        editingReviewIndex = index;
        const review = userReviews[index];
        if (!review) return;

        currentEditRating = review.rating;

        // Highlight stars
        updateEditReviewStars(currentEditRating);

        // Highlight tags
        const tagPills = document.querySelectorAll('#edit-review-form-card .eval-tag-pill');
        tagPills.forEach(pill => {
            const tagName = pill.getAttribute('data-tag');
            if (review.tags.includes(tagName)) {
                pill.classList.add('selected');
            } else {
                pill.classList.remove('selected');
            }
        });

        // Hide list & actions row, show form card
        document.getElementById('reviews-list-view').style.display = 'none';
        document.getElementById('reviews-actions-row').style.display = 'none';
        document.getElementById('btn-back-to-profile-from-reviews-header').style.display = 'none';
        document.getElementById('edit-review-form-card').style.display = 'block';
    }

    function closeEditReviewForm() {
        editingReviewIndex = null;
        document.getElementById('edit-review-form-card').style.display = 'none';
        document.getElementById('reviews-list-view').style.display = 'block';
        document.getElementById('reviews-actions-row').style.display = 'flex';
        document.getElementById('btn-back-to-profile-from-reviews-header').style.display = 'flex';
    }

    function updateEditReviewStars(rating) {
        const stars = document.querySelectorAll('.star-rating-container .star-pill-svg');
        stars.forEach(star => {
            const starVal = parseInt(star.getAttribute('data-rating'));
            if (starVal <= rating) {
                star.setAttribute('fill', 'currentColor');
            } else {
                star.setAttribute('fill', 'none');
            }
        });
    }

    // Set up edit review form events
    function setupEditReviewFormEvents() {
        // Star clicks
        const stars = document.querySelectorAll('.star-rating-container .star-pill-svg');
        stars.forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.getAttribute('data-rating'));
                currentEditRating = rating;
                updateEditReviewStars(rating);
            });
        });

        // Tag clicks
        const tagPills = document.querySelectorAll('#edit-review-form-card .eval-tag-pill');
        tagPills.forEach(pill => {
            pill.addEventListener('click', () => {
                pill.classList.toggle('selected');
            });
        });

        // Cancel button
        const btnCancel = document.getElementById('btn-cancel-review-edit');
        if (btnCancel) {
            btnCancel.addEventListener('click', (e) => {
                e.preventDefault();
                closeEditReviewForm();
            });
        }

        // Save button
        const btnSave = document.getElementById('btn-save-review-changes');
        if (btnSave) {
            btnSave.addEventListener('click', (e) => {
                e.preventDefault();
                if (editingReviewIndex === null) return;

                // Gather selected tags — covers both positive and constructive grids
                const selectedTags = [];
                const tagPills = document.querySelectorAll('#edit-review-form-card .eval-tag-pill.selected');
                tagPills.forEach(pill => {
                    selectedTags.push(pill.getAttribute('data-tag'));
                });

                if (selectedTags.length === 0) {
                    alert('Por favor seleccioná al menos una etiqueta.');
                    return;
                }

                // Update reviews data
                const review = userReviews[editingReviewIndex];
                if (review) {
                    review.rating = currentEditRating;
                    review.tags = selectedTags;
                }

                alert("Reseña actualizada correctamente.");
                closeEditReviewForm();
                renderReviews();
            });
        }
    }

    setupEditReviewFormEvents();

    bindProfileEvents();


    // Simple accessibility enhancement for keyboard focus ring toggle
    document.body.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('user-is-tabbing');
        }
    });
    document.body.addEventListener('mousedown', () => {
        document.body.classList.remove('user-is-tabbing');
    });
});
