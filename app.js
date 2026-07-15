/**
 * COMUNITAS - Client-Side Application Core
 * Handles navigation switching and responsive layout interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Session Storage persistence
    if (window.INJECTED_DATA?.logout_signal) {
        sessionStorage.removeItem("comunitas_current_user");
    } else if (window.INJECTED_DATA?.current_user) {
        sessionStorage.setItem("comunitas_current_user", JSON.stringify(window.INJECTED_DATA.current_user));
    } else {
        const savedUser = sessionStorage.getItem("comunitas_current_user");
        if (savedUser && window.INJECTED_DATA) {
            window.INJECTED_DATA.current_user = JSON.parse(savedUser);
        }
    }

    // --- Access Helpers ---
    window.getCurrentUserId = function() {
        return Number(window.INJECTED_DATA?.current_user?.supabase_user_id || 1);
    };

    window.getCurrentUserMemberships = function() {
        const currentUserId = window.getCurrentUserId();
        return (window.INJECTED_DATA?.organization_members_full || []).filter(member =>
            Number(member.user_id) === currentUserId &&
            member.is_active === true
        );
    };

    window.getCurrentUserSuggestions = function() {
        const currentUserId = window.getCurrentUserId();
        return (window.INJECTED_DATA?.suggested_organizations_full || []).filter(suggestion =>
            Number(suggestion.user_id) === Number(currentUserId)
        );
    };

    window.getCurrentUserFavorites = function() {
        const currentUserId = window.getCurrentUserId();
        return (window.INJECTED_DATA?.favorites_full || []).filter(fav =>
            Number(fav.user_id) === Number(currentUserId)
        );
    };

    window.getCurrentUserReviews = function() {
        const currentUserId = window.getCurrentUserId();
        return (window.INJECTED_DATA?.reviews_full || []).filter(review =>
            Number(review.user_id) === Number(currentUserId)
        );
    };

    window.isFavoriteOrg = function(orgId) {
        return window.getCurrentUserFavorites().some(fav =>
            Number(fav.org_id) === Number(orgId)
        );
    };

    window.getReviewAuthorName = function(review) {
        if (review.full_name) return review.full_name;
        if (review.user_name) return review.user_name;

        const currentUser = window.INJECTED_DATA?.current_user;
        if (
            currentUser?.full_name &&
            Number(currentUser.supabase_user_id) === Number(review.user_id)
        ) {
            return currentUser.full_name;
        }

        const users = window.INJECTED_DATA?.users || [];
        const user = users.find(u =>
            Number(u.user_id) === Number(review.user_id)
        );

        if (user?.full_name) return user.full_name;

        return "Usuario";
    };

    window.canAccessMyOrganization = function() {
        return window.getCurrentUserMemberships().length > 0;
    };

    // DOM Elements
    const sidebar = document.getElementById('main-sidebar');
    const navButtons = document.querySelectorAll('.nav-btn');
    const menuToggle = document.getElementById('menu-toggle');
    
    // Check permissions and hide nav button if needed
    const btnMyOrgNav = document.getElementById('btn-my-org');
    if (btnMyOrgNav) {
        if (!window.canAccessMyOrganization()) {
            btnMyOrgNav.style.display = 'none';
        }
    }

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

            if (targetId === 'my-org') {
                populateMyOrgDashboard();
            }

            // If navigating to the Map screen, initialize and invalidate size
            if (targetId === 'map') {
                setTimeout(() => {
                    initLeafletMap();
                    if (map) {
                        // Recalculate organizations to keep services in sync when returning to the map
                        allMapOrganizations = getAllOrganizations();
                        applyMapFilters();
                        
                        map.invalidateSize();
                        if (targetMapLat && targetMapLng) {
                            clearMapFilters();
                            map.setView([targetMapLat, targetMapLng], 15);
                            
                            // Try to open existing marker popup
                            let foundLayer = false;
                            if (markersLayerGroup) {
                                markersLayerGroup.eachLayer(layer => {
                                    if (layer.options.title === targetMapOrgName) {
                                        layer.openPopup();
                                        foundLayer = true;
                                    }
                                });
                            }
                            
                            // If not found in mock layers, inject a temporary marker so there's a pin to see
                            if (!foundLayer && targetMapOrgName) {
                                const tempMarker = L.marker([targetMapLat, targetMapLng], {
                                    icon: getMarkerIcon(),
                                    title: targetMapOrgName
                                }).addTo(map);
                                
                                tempMarker.bindPopup(`
                                    <div class="custom-leaflet-popup">
                                        <div class="map-popup-header">
                                            <h4 class="map-popup-name">${targetMapOrgName}</h4>
                                        </div>
                                        <div style="padding: 0.5rem; text-align: center;">
                                            <span style="font-size: 0.85rem; color: var(--brand-rust); font-weight: 600;">Pin de Supabase</span>
                                        </div>
                                    </div>
                                `).openPopup();
                            }
                            
                            targetMapLat = null;
                            targetMapLng = null;
                            targetMapOrgName = null;
                            targetMapOrgId = null;
                        } else if (targetMapOrgName) {
                            // Legacy fallback
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
    let targetMapOrgId = null;
    let targetMapLat = null;
    let targetMapLng = null;
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
        
        let orgs = [];
        if (window.INJECTED_DATA && window.INJECTED_DATA.services_full) {
            console.log("Render Servicios 2.1 categoría:", serviceName);
            let rawOrgs = window.INJECTED_DATA.services_full.filter(s => 
                s.service_type === serviceName && 
                (s.service_status === 'active' || s.service_status === 'full' || s.status === 'active' || s.status === 'full')
            );

            // Evitar duplicados de la misma organización para la misma categoría
            const seenOrgIds = new Set();
            rawOrgs = rawOrgs.filter(s => {
                if (seenOrgIds.has(s.org_id)) return false;
                seenOrgIds.add(s.org_id);
                return true;
            });
            console.log("Servicios usados para 2.1:", rawOrgs);
            
            // Helper function to format rating
            function formatRating(averageRating, totalReviews) {
                const reviews = Number(totalReviews || 0);
                const rating = averageRating === null || averageRating === undefined
                    ? null
                    : Number(averageRating);

                if (!reviews || rating === null || Number.isNaN(rating)) {
                    return {
                        hasReviews: false,
                        label: "Sin reseñas",
                        rating: null,
                        reviews: 0
                    };
                }

                return {
                    hasReviews: true,
                    label: rating.toFixed(1),
                    rating: rating,
                    reviews: reviews
                };
            }

            orgs = rawOrgs.map(s => {
                let ratingData = { hasReviews: false, label: "Rating no disponible", rating: null, reviews: null };
                
                if (window.INJECTED_DATA.organizations_with_rating) {
                    const ratingInfo = window.INJECTED_DATA.organizations_with_rating.find(
                        org => Number(org.org_id) === Number(s.org_id)
                    );
                    if (ratingInfo) {
                        ratingData = formatRating(ratingInfo.average_rating, ratingInfo.total_reviews);
                    }
                }

                return {
                    org_id: s.org_id,
                    name: s.organization_name,
                    ratingData: ratingData,
                    description: s.description || '',
                    tags: [],
                    status: s.service_status === 'active' || s.organization_status === 'active' ? 'Activo' : 'Inactivo',
                    schedule: s.schedule || 'Sin horario especificado',
                    lat: s.latitude,
                    lng: s.longitude,
                    address: s.address,
                    title: s.title || ''
                };
            });
        }
        
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
                // 2. Calificación filter
                if (activeServiceFilters.rating && activeServiceFilters.rating !== 'All') {
                    const minRating = parseFloat(activeServiceFilters.rating);
                    const orgRating = org.ratingData && org.ratingData.rating !== null ? parseFloat(org.ratingData.rating) : 0;
                    if (orgRating < minRating) return false;
                }

                // 4. Distancia filter
                if (activeServiceFilters.distance && activeServiceFilters.distance !== 'All' && serviceUserLocation) {
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
                        ${org.ratingData.hasReviews ? `
                        <div class="org-list-rating" aria-label="Calificación ${org.ratingData.label} estrellas de ${org.ratingData.reviews} opiniones">
                            <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px; color:var(--brand-mustard);">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span class="rating-value">${org.ratingData.label}</span>
                            <span class="rating-count">(${org.ratingData.reviews} reseñas)</span>
                        </div>
                        ` : `
                        <div class="org-list-rating" aria-label="Sin reseñas">
                            <span class="rating-count" style="margin-left:0; font-style:italic;">${org.ratingData.label}</span>
                        </div>
                        `}
                        <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                            <span class="status-badge" style="color: ${statusColor}; font-weight: 600;">• ${org.status}</span>
                            <span class="distance-badge" style="font-size: 0.85rem; font-weight: 600; color: ${distanceColor};">${distanceText}</span>
                        </div>
                    </div>
                    ${org.title ? `<div style="margin-top: 0.5rem; font-weight: 600; color: var(--brand-charcoal); font-size: 0.95rem;">${org.title}</div>` : ''}
                    <p class="org-list-desc" style="margin-top: ${org.title ? '0.25rem' : '0.5rem'};">${org.description}</p>
                    ${org.schedule ? `<div style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">🕒 ${org.schedule}</div>` : ''}
                    ${org.address ? `<div style="margin-top: 0.25rem; font-size: 0.85rem; color: var(--text-muted);">📍 ${org.address}</div>` : ''}
                    ${tagsMarkup ? `<div class="org-list-tags">${tagsMarkup}</div>` : ''}
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
            const handleCardClick = () => {
                detailScreenSource = 'service-placeholder';
                // Provide fallback arrays so the detail screen doesn't crash, plus the org_id
                const detailOrg = {
                    org_id: org.org_id,
                    name: org.name,
                    rating: org.rating || '5.0',
                    reviews: org.reviews || '0',
                    description: org.description,
                    tags: org.tags || [],
                    status: org.status,
                    services: [serviceName],
                    address: org.address,
                    phone: '+54 11 4567-8901',
                    social: '@comunitas',
                    website: 'www.comunitas.org',
                    serviceInfo: org.description,
                    schedule: org.schedule,
                    needs: ['Alimentos', 'Voluntarios'], // Mock para evitar crash
                    gallery: ['assets/gallery_dining_room.png'], // Mock para evitar crash
                    reviewsList: [
                        { author: 'Usuario', rating: org.rating || '5', tags: ['Buen trato'], date: 'Reciente' }
                    ]
                };
                showOrganizationDetail(detailOrg, serviceName);
            };
            
            // Route to Detail Screen (Screen 2.2) when clicking anywhere on the card
            card.addEventListener('click', (e) => {
                if (e.target.closest('.org-list-btn') || e.target.closest('.org-list-map-btn')) {
                    return;
                }
                handleCardClick();
            });
            
            // Route to Detail Screen when clicking the button specifically
            const btn = card.querySelector('.org-list-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleCardClick();
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

    function showOrganizationDetail(orgParam, serviceName) {
        currentActiveOrg = orgParam;
        currentActiveServiceName = serviceName;
        const detailContainer = document.getElementById('org-detail-content');
        if (!detailContainer) return;

        // Extract org_id
        const selectedOrgId = orgParam.org_id;
        const data = window.INJECTED_DATA || {};
        const orgData = (data.organizations_with_rating || []).find(o => o.org_id === selectedOrgId);

        if (!orgData) {
            detailContainer.innerHTML = `
                <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-weight: 500;">
                    No se encontró información para esta organización.
                </div>
            `;
            showScreen('org-detail');
            return;
        }

        const orgServicesData = (data.services_full || []).filter(s => 
            s.org_id === selectedOrgId && 
            (s.service_status === 'active' || s.service_status === 'full' || s.status === 'active' || s.status === 'full')
        );
        const orgNeedsData = (data.active_needs || []).filter(n => n.org_id === selectedOrgId);
        const orgReviewsData = (data.reviews_full || []).filter(r => r.org_id === selectedOrgId);

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
        const servicesMarkup = orgServicesData.map(svc => {
            const svcName = svc.service_type;
            const cfg = serviceConfig[svcName] || serviceConfig['Duchas'];
            return `
                <div style="display:flex; flex-direction:column; align-items:center; gap:0.5rem; min-width:80px;">
                    <div class="service-card-icon-wrapper ${cfg.circleClass}" style="width:60px; height:60px; margin:0; flex-shrink:0;">
                        ${cfg.svg}
                    </div>
                    <span style="font-size:0.85rem; font-weight:700; color:var(--brand-charcoal); text-align:center; line-height:1.25;">${svcName}</span>
                </div>
            `;
        }).join('');
        
        const serviceDetailMarkup = orgServicesData.map(svc => `
            <div style="margin-bottom: 1rem;">
                <h3 style="font-size:1rem; color:var(--brand-charcoal);">${svc.title || svc.service_type}</h3>
                ${svc.description ? `<p style="font-size:0.9rem; color:var(--text-muted);">${svc.description}</p>` : ''}
                ${svc.schedule ? `<p style="font-size:0.85rem; color:var(--brand-rust); margin-top:0.25rem;">🕒 ${svc.schedule}</p>` : ''}
            </div>
        `).join('');

        // Render current needs items
        let needsMarkup = '';
        if (orgNeedsData.length === 0) {
            needsMarkup = '<div style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">No hay necesidades activas publicadas.</div>';
        } else {
            needsMarkup = orgNeedsData.map(n => `
                <div class="needs-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="needs-icon">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <div>
                        <div style="font-weight: 600; color: var(--brand-charcoal);">${n.title || n.category || ''}</div>
                        ${n.description ? `<div style="font-size:0.85rem; color:var(--text-muted);">${n.description}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }

        // Render reviews items
        const reviewsMarkup = orgReviewsData.length > 0 ? orgReviewsData.map(r => {
            let reviewTags = '';
            if (r.tags) {
                const tagList = String(r.tags).split(',').map(t => t.trim()).filter(Boolean);
                reviewTags = tagList.map(t => `<span class="org-list-tag">${t}</span>`).join('');
            }
            const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';

            return `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${window.getReviewAuthorName(r)}</span>
                    <div style="display:flex; align-items:center; gap:0.25rem;">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width:14px; height:14px; color:var(--brand-mustard);">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span style="font-weight:700; font-size:0.9rem;">${r.rating}.0</span>
                        ${dateStr ? `<span class="review-date">• ${dateStr}</span>` : ''}
                    </div>
                </div>
                ${reviewTags ? `<div class="org-list-tags" style="margin-top:0.5rem; flex-wrap:wrap; display:flex; gap:0.4rem;">${reviewTags}</div>` : ''}
            </div>
            `;
        }).join('') : '<div style="color: var(--text-muted); font-size: 0.95rem; font-style: italic;">No hay reseñas publicadas todavía.</div>';

        // Initialize INJECTED_DATA.favorites_full if undefined
        window.INJECTED_DATA.favorites_full = window.INJECTED_DATA.favorites_full || [];
        const isFav = window.isFavoriteOrg(orgData.org_id);
        const favBtnText = isFav ? "♥ Guardado en favoritos" : "♡ Guardar favorito";
        const favBtnStyle = isFav 
            ? "color: var(--brand-rose); border-color: rgba(166,75,88,0.15); background-color: #fbeeef;" 
            : "";
            
        const validWebsite = orgData.website && orgData.website !== "--" && String(orgData.website).trim() !== "null";
        const validInstagram = orgData.instagram && orgData.instagram !== "--" && String(orgData.instagram).trim() !== "null";
            
        let locationMarkup = '';
        if (orgData.latitude && orgData.longitude) {
            locationMarkup = `
                <div class="detail-card">
                    <h2 class="detail-subtitle" style="border-color: #fcefe9;">Ubicación</h2>
                    <!-- Mini Map Container -->
                    <div id="detail-mini-map" style="height: 180px; width: 100%; border-radius: 16px; margin-bottom: 1.25rem; z-index: 1; border: 1px solid rgba(76, 67, 61, 0.1);"></div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="evaluate-btn" id="btn-detail-view-map" style="margin: 0;">Ver en mapa de la App</button>
                        <a href="https://www.google.com/maps/search/?api=1&query=${orgData.latitude},${orgData.longitude}" id="btn-detail-google-maps" target="_blank" style="text-align: center; color: var(--brand-rust); font-weight: 600; text-decoration: none; font-size: 0.95rem; display: block; padding: 0.25rem;">Abrir en Google Maps</a>
                    </div>
                </div>
            `;
        }

        // Set layout innerHTML
        detailContainer.innerHTML = `
            <!-- Left Column: Main Info, Services, Gallery, Reviews -->
            <div class="detail-main">
                <div class="detail-card">
                    <div class="detail-header">
                        <div class="detail-title-block">
                            <h1 class="detail-org-name">${orgData.name}</h1>
                            <div class="detail-meta">
                                <div class="detail-rating">
                                    <svg viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    <span>${orgData.average_rating || '5.0'}</span>
                                    <span style="color:var(--text-muted); font-weight:400; font-size:0.95rem; margin-left:0.25rem;">(${orgData.total_reviews || '0'} reseñas)</span>
                                </div>
                                <span class="status-badge ${orgData.status === 'active' ? 'open' : 'closed'}">• ${orgData.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <button class="eval-secondary-btn" id="btn-toggle-favorite" style="width: auto; padding: 0.5rem 1.25rem; height: 42px; margin: 0; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; ${favBtnStyle}">${favBtnText}</button>
                            <button class="eval-secondary-btn" id="btn-share-qr" style="width: auto; padding: 0.5rem; height: 42px; margin: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; border-color: var(--brand-mustard); color: var(--brand-mustard);" title="Compartir por QR">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;"><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6zM14 10h6M10 14v6M10 10h4v4h-4z"></path></svg>
                            </button>
                        </div>
                    </div>
                    <p class="detail-desc-text">${orgData.description || ''}</p>
                </div>

                <!-- Servicios disponibles -->
                <div class="detail-card">
                    <h2 class="detail-subtitle">Servicios disponibles</h2>
                    <div style="display:flex; flex-wrap:wrap; gap:1.25rem; margin-top:0.5rem;">
                        ${servicesMarkup || '<p style="color:var(--text-muted); font-size:0.9rem;">No hay servicios registrados.</p>'}
                    </div>
                </div>
                
                <div class="detail-card">
                    <h2 class="detail-subtitle">Detalle del servicio</h2>
                    ${serviceDetailMarkup || '<p style="color:var(--text-muted); font-size:0.9rem;">Sin detalles adicionales.</p>'}
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
                            <span class="info-text">${orgData.address || 'No disponible'}</span>
                        </div>
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span class="info-text">${orgData.phone || 'No disponible'}</span>
                        </div>
                        ${validWebsite ? `
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <a href="https://${orgData.website.replace(/^https?:\/\//, '')}" target="_blank" class="info-text" style="color: var(--brand-rust); text-decoration: none; font-weight: 600;">${orgData.website}</a>
                        </div>
                        ` : ''}
                        ${validInstagram ? `
                        <div class="info-item">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="info-icon">
                                <path d="M24 11.5c0 6-4.5 10.5-10.5 10.5S3 17.5 3 11.5 7.5 1 13.5 1 24 5.5 24 11.5z"></path>
                            </svg>
                            <span class="info-text">${orgData.instagram}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                ${locationMarkup}

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
                showEvaluationScreen(orgParam, serviceName);
            });
        }

        const favBtn = document.getElementById('btn-toggle-favorite');
        
        // --- Lógica Segura: Generación de QR (Versión 1) ---
        const btnShareQr = document.getElementById('btn-share-qr');
        if (btnShareQr) {
            btnShareQr.addEventListener('click', () => {
                try {
                    // Remover modal existente si hubiera quedado pegado
                    const oldModal = document.getElementById('qr-modal-overlay');
                    if (oldModal) oldModal.remove();

                    // Construcción segura de datos
                    const name = orgData.name || "Organización";
                    const address = orgData.address || "Dirección no disponible";
                    const phone = orgData.phone ? `\nTeléfono:\n${orgData.phone}\n` : "\n";
                    
                    const servicesList = (orgServicesData && orgServicesData.length > 0) 
                        ? orgServicesData.map(s => s.service_type || s.service_name).filter(Boolean).join(', ')
                        : "Sin servicios informados";
                    
                    let schedulesList = "Horario no informado";
                    if (orgServicesData && orgServicesData.length > 0) {
                        const scheds = [];
                        orgServicesData.forEach(s => {
                            if (s.schedule) scheds.push(`${s.service_type || s.type_name || s.title || 'Servicio'}: ${s.schedule}`);
                        });
                        if (scheds.length > 0) {
                            schedulesList = scheds.join('\n');
                        }
                    }

                    const lat = orgData.latitude || "";
                    const lng = orgData.longitude || "";
                    const mapsLink = (lat && lng) ? `\nCómo llegar:\nhttps://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : "";

                    // Construir texto
                    const qrText = `COMUNITAS\n\n${name}\n\nDirección:\n${address}\n\nServicios:\n${servicesList}\n\nHorarios:\n${schedulesList}\n${phone}${mapsLink}`.trim();
                    const encodedUrl = encodeURIComponent(qrText);
                    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedUrl}`;

                    // Mostrar modal
                    const modalHtml = `
                        <div id="qr-modal-overlay" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:9999; display:flex; align-items:center; justify-content:center;">
                            <div style="background:#fff; border-radius:12px; padding:1.5rem; text-align:center; max-width:90%; width:320px; box-shadow:0 4px 12px rgba(0,0,0,0.2); position:relative;">
                                <button id="btn-close-qr" style="position:absolute; top:10px; right:10px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-muted);">&times;</button>
                                <h3 style="color:var(--brand-terracotta); margin-bottom:1rem; font-size:1.2rem;">Compartir Organización</h3>
                                <div style="min-height:250px; display:flex; align-items:center; justify-content:center; margin-bottom:1rem; background:#f9f9f9; border-radius:8px;">
                                    <img src="${qrImgUrl}" alt="Código QR" style="max-width:100%; display:block;" onerror="this.onerror=null; this.parentNode.innerHTML='<p style=\\'color:var(--brand-coral);\\'>No se pudo cargar el QR. Verifique su conexión.</p>';">
                                </div>
                                <p style="font-size:0.9rem; color:var(--text-main); margin-bottom:0;">Escaneá este código para guardar la información y cómo llegar.</p>
                            </div>
                        </div>
                    `;

                    document.body.insertAdjacentHTML('beforeend', modalHtml);

                    // Eventos de cierre
                    document.getElementById('btn-close-qr').addEventListener('click', () => {
                        const m = document.getElementById('qr-modal-overlay');
                        if (m) m.remove();
                    });
                    document.getElementById('qr-modal-overlay').addEventListener('click', (e) => {
                        if (e.target.id === 'qr-modal-overlay') {
                            e.target.remove();
                        }
                    });

                } catch(e) {
                    console.error("Error al generar QR:", e);
                    alert("Ocurrió un error al intentar generar el código QR.");
                }
            });
        }
        // -----------------------------------------------------

        if (favBtn) {
            favBtn.addEventListener('click', async () => {
                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !creds.url || !creds.anon_key) {
                    alert('Error: Credenciales de Supabase no encontradas.');
                    return;
                }
                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                
                const isCurrentlyFav = window.isFavoriteOrg(orgData.org_id);
                
                const userId = window.getCurrentUserId();
                
                favBtn.disabled = true;
                
                try {
                    if (isCurrentlyFav) {
                        const { error } = await supabaseClient.rpc('remove_favorite', {
                            p_user_id: userId,
                            p_org_id: orgData.org_id
                        });
                        
                        if (error) {
                            console.error("Error completo al actualizar favoritos:", error);
                            alert('Error al actualizar favoritos: ' + error.message);
                        } else {
                            // Remove from local injected data
                            window.INJECTED_DATA.favorites_full = window.INJECTED_DATA.favorites_full.filter(fav => 
                                !(Number(fav.user_id) === userId && Number(fav.org_id) === Number(orgData.org_id))
                            );
                            favBtn.textContent = "♡ Guardar favorito";
                            favBtn.style.color = "";
                            favBtn.style.borderColor = "";
                            favBtn.style.backgroundColor = "";
                            alert('Organización quitada de favoritos.');
                        }
                    } else {
                        const { error } = await supabaseClient.rpc('add_favorite', {
                            p_user_id: userId,
                            p_org_id: orgData.org_id
                        });
                        
                        if (error) {
                            console.error("Error completo al actualizar favoritos:", error);
                            if (error.code === '23505' && error.message && error.message.includes('duplicate key value')) {
                                alert('Esta organización ya está en favoritos.');
                            } else {
                                alert('Error al actualizar favoritos: ' + error.message);
                            }
                        } else {
                            // Add to local injected data
                            window.INJECTED_DATA.favorites_full.push({
                                user_id: userId,
                                org_id: orgData.org_id,
                                organization_name: orgData.name,
                                description: orgData.description,
                                address: orgData.address
                            });
                            favBtn.textContent = "♥ Guardado en favoritos";
                            favBtn.style.color = "var(--brand-rose)";
                            favBtn.style.borderColor = "rgba(166,75,88,0.15)";
                            favBtn.style.backgroundColor = "#fbeeef";
                            alert('Organización agregada a favoritos.');
                        }
                    }
                } catch (err) {
                    console.error("Error completo al actualizar favoritos:", err);
                    alert('Error al actualizar favoritos: ' + err.message);
                } finally {
                    favBtn.disabled = false;
                }
            });
        }

        // Map navigation binding
        const viewMapBtn = document.getElementById('btn-detail-view-map');
        if (viewMapBtn) {
            viewMapBtn.addEventListener('click', () => {
                targetMapOrgName = orgData.name;
                targetMapOrgId = orgData.org_id;
                targetMapLat = orgData.latitude;
                targetMapLng = orgData.longitude;
                const mapNavBtn = document.querySelector('.nav-btn[data-target="map"]');
                if (mapNavBtn) setActiveNavItem(mapNavBtn);
                showScreen('map');
            });
        }

        showScreen('org-detail');
        // Initialize Mini Map
        setTimeout(() => {
            if (detailMiniMap) {
                detailMiniMap.remove();
                detailMiniMap = null;
            }
            const miniMapContainer = document.getElementById('detail-mini-map');
            if (miniMapContainer && orgData.latitude && orgData.longitude) {
                detailMiniMap = L.map('detail-mini-map', {
                    zoomControl: false,
                    dragging: false,
                    scrollWheelZoom: false,
                    doubleClickZoom: false,
                    boxZoom: false,
                    touchZoom: false,
                    keyboard: false
                }).setView([orgData.latitude, orgData.longitude], 15);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap'
                }).addTo(detailMiniMap);

                L.marker([orgData.latitude, orgData.longitude], {
                    icon: getMarkerIcon(),
                    title: orgData.name
                }).addTo(detailMiniMap);
            } else if (miniMapContainer) {
                miniMapContainer.innerHTML = '<div style="display:flex; height:100%; align-items:center; justify-content:center; background:#f5ede6; color:var(--text-muted); font-size:0.9rem; font-weight:500; border-radius:16px;">Ubicación no disponible</div>';
            }
        }, 150);

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

        // Submit Button shows a beautiful success state inline and writes to Supabase
        const submitBtn = document.getElementById('btn-submit-eval');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => {
                if (selectedStars === 0) {
                    alert('Por favor, selecciona una calificación.');
                    return;
                }

                const orgId = org.org_id;
                const userId = window.getCurrentUserId();

                // Gather selected tags
                const tagsData = window.INJECTED_DATA.tags || [];
                const selectedTagElements = evalContainer.querySelectorAll('.eval-tag-pill.selected');
                const selectedTagNames = Array.from(selectedTagElements).map(el => el.getAttribute('data-tag'));
                
                const selectedTagIds = [];
                for (const tagName of selectedTagNames) {
                    const tagObj = tagsData.find(t => t.tag_name === tagName);
                    if (tagObj) {
                        selectedTagIds.push(tagObj.tag_id);
                    } else {
                        alert('No se encontró el tag seleccionado en la base de datos: ' + tagName);
                        return;
                    }
                }

                submitBtn.textContent = 'Enviando...';
                submitBtn.disabled = true;

                // Initialize Supabase Client
                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !creds.url || !creds.anon_key) {
                    alert('Error: Credenciales de Supabase no encontradas.');
                    submitBtn.textContent = 'Enviar evaluación';
                    submitBtn.disabled = false;
                    return;
                }
                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);

                async function submitReview() {
                    try {
                        // 1. Create the review
                        const { data: revId, error: reviewError } = await supabaseClient.rpc('create_review', {
                            p_user_id: userId,
                            p_org_id: orgId,
                            p_rating: selectedStars
                        });

                        if (reviewError) {
                            console.error("Error completo al guardar reseña:", reviewError);
                            alert('Error al guardar la reseña: ' + reviewError.message);
                            submitBtn.textContent = 'Enviar evaluación';
                            submitBtn.disabled = false;
                            return;
                        }

                        // 2. Add tags
                        for (const tagId of selectedTagIds) {
                            const { error: tagError } = await supabaseClient.rpc('add_review_tag', {
                                p_review_id: revId,
                                p_tag_id: tagId
                            });
                            if (tagError) {
                                console.error("Error al asociar tag:", tagError);
                            }
                        }

                        // Refresh injected data arrays locally so the detail view reflects the change
                        
                        // Update organization average rating & total reviews
                        const orgRecord = window.INJECTED_DATA.organizations_with_rating.find(o => o.org_id === orgId);
                        if (orgRecord) {
                            orgRecord.total_reviews = (orgRecord.total_reviews || 0) + 1;
                            const prevAvg = parseFloat(orgRecord.average_rating || 0);
                            orgRecord.average_rating = ((prevAvg * (orgRecord.total_reviews - 1) + selectedStars) / orgRecord.total_reviews).toFixed(1);
                        }

                        // Append the new review to the reviews_full array
                        window.INJECTED_DATA.reviews_full = window.INJECTED_DATA.reviews_full || [];
                        window.INJECTED_DATA.reviews_full.push({
                            rev_id: revId,
                            user_id: userId,
                            full_name: window.getReviewAuthorName({ user_id: userId }),
                            org_id: orgId,
                            organization_name: org.name,
                            rating: selectedStars,
                            created_at: new Date().toISOString(),
                            is_reported: false,
                            tags: selectedTagNames.join(', ')
                        });

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
                                        <h3 class="eval-section-title" style="font-size:1.6rem; color:#2e7d56; margin-bottom:0.5rem;">Reseña guardada correctamente.</h3>
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
                    } catch (err) {
                        console.error("Error completo al guardar reseña:", err);
                        alert('Error al guardar la reseña: ' + err.message);
                        submitBtn.textContent = 'Enviar evaluación';
                        submitBtn.disabled = false;
                    }
                }

                submitReview();
            });
        }

        // Show the evaluation screen
        showScreen('org-evaluate');
    }

    // Reset service filter UI helper
    function resetServiceFiltersUI() {
        const selectRating = document.getElementById('filter-service-rating');
        const selectDistance = document.getElementById('filter-service-distance');
        
        if (selectRating) selectRating.value = 'All';
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
        const selectRating = document.getElementById('filter-service-rating');
        const selectDistance = document.getElementById('filter-service-distance');
        
        activeServiceFilters = {
            rating: selectRating ? selectRating.value : 'All',
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

    function normalizeCommaSeparatedText(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        return String(value)
            .split(",")
            .map(item => item.trim())
            .filter(Boolean);
    }

    function renderRecommendedOrgs() {
        const container = document.getElementById('recommendations-grid');
        if (!container) return;
        
        let orgsToRender = [];
        let htmlBuilder = "";
        
        console.log("INJECTED_DATA recibido:", window.INJECTED_DATA);

        if (typeof window.INJECTED_DATA === 'undefined') {
            const displayMsg = "No se recibieron datos desde Supabase.";
            console.error(displayMsg);
            htmlBuilder += `<div style="width: 100%; padding: 10px; background: #ffe5e5; color: #d32f2f; border-radius: 8px; margin-bottom: 20px; grid-column: 1 / -1;">${displayMsg}</div>`;
        } else if (window.INJECTED_DATA.status === 'error') {
            const displayMsg = "Error de Supabase: " + window.INJECTED_DATA.message;
            console.error(displayMsg);
            htmlBuilder += `<div style="width: 100%; padding: 10px; background: #ffe5e5; color: #d32f2f; border-radius: 8px; margin-bottom: 20px; grid-column: 1 / -1;">${displayMsg}</div>`;
        } else if (window.INJECTED_DATA.status === 'success') {
            if (!window.INJECTED_DATA.data || window.INJECTED_DATA.data.length === 0) {
                const displayMsg = "Supabase respondió correctamente, pero no hay organizaciones disponibles.";
                console.warn(displayMsg);
                htmlBuilder += `<div style="width: 100%; padding: 10px; background: #f8f9fa; color: #6c757d; border-radius: 8px; margin-bottom: 20px; grid-column: 1 / -1;">${displayMsg}</div>`;
            } else {
                orgsToRender = window.INJECTED_DATA.data.slice(0, 4); // Render top 4
            }
        }
        
        htmlBuilder += orgsToRender.map(org => {
            const normalizedServices = normalizeCommaSeparatedText(org.service_types);
            const service = (normalizedServices && normalizedServices.length > 0) ? normalizedServices[0] : 'Duchas';
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
        
        container.innerHTML = htmlBuilder;
        
        // Add click listeners
        const homeCards = container.querySelectorAll('.org-card');
        homeCards.forEach(card => {
            const handleCardClick = (e) => {
                const orgName = card.querySelector('.org-name').textContent;
                
                let orgData = null;
                if (window.INJECTED_DATA && window.INJECTED_DATA.status === 'success') {
                    orgData = window.INJECTED_DATA.data.find(o => o.name === orgName);
                } else {
                    orgData = orgsToRender.find(o => o.name === orgName);
                }
                
                if (orgData) {
                    detailScreenSource = 'home';
                    const normalizedServices = normalizeCommaSeparatedText(orgData.service_types);
                    const primaryService = (normalizedServices && normalizedServices.length > 0) ? normalizedServices[0] : 'Duchas';
                    
                    // Asegurar que el objeto org tenga los campos mock necesarios para que showOrganizationDetail no crashee
                    // Y mantener el org_id de Supabase
                    const detailOrg = {
                        org_id: orgData.org_id || null,
                        name: orgData.name,
                        rating: orgData.average_rating || '5.0',
                        reviews: orgData.total_reviews || '0',
                        description: orgData.description || '',
                        tags: ['Recomendado'],
                        status: orgData.status || 'active',
                        services: normalizedServices,
                        address: orgData.address || 'Av. San Martín 1234',
                        phone: '+54 11 4567-8901',
                        social: '@comunitas',
                        website: 'www.comunitas.org',
                        serviceInfo: orgData.description || 'Información de servicio',
                        schedule: 'Lunes a Viernes de 09:00 a 17:00 hs',
                        needs: ['Alimentos', 'Voluntarios'], // Mock para evitar crash
                        gallery: ['assets/gallery_dining_room.png'], // Mock para evitar crash
                        reviewsList: [
                            { author: 'Usuario', rating: orgData.average_rating || '5', tags: ['Buen trato'], date: 'Reciente' }
                        ]
                    };
                    
                    showOrganizationDetail(detailOrg, primaryService);
                }
            };

            card.addEventListener('click', (e) => {
                if (e.target.closest('.details-btn')) return; // handled by btn listener
                handleCardClick(e);
            });
            const btn = card.querySelector('.details-btn');
            if (btn) {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleCardClick(e);
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
     * Extract a flat list of unique organizations from Supabase data
     */
    function getAllOrganizations() {
        if (!window.INJECTED_DATA || !window.INJECTED_DATA.data) return [];
        
        function normalizeCommaSeparatedText(text) {
            if (!text) return [];
            return text.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        return window.INJECTED_DATA.data.map(org => {
            let services = [];
            
            if (window.INJECTED_DATA.services_full) {
                // Calculate active services directly from services_full
                const orgServices = window.INJECTED_DATA.services_full.filter(service => {
                    const isOrgMatch = Number(service.org_id) === Number(org.org_id);
                    const status = service.service_status || service.status;
                    const isActive = ["active", "full"].includes(status);
                    return isOrgMatch && isActive;
                });
                
                const serviceTypes = orgServices.map(s => s.service_type || s.category);
                services = [...new Set(serviceTypes)];
            } else {
                services = normalizeCommaSeparatedText(org.service_types);
            }
            
            const primaryService = services.length > 0 ? services[0] : '';
            
            const reviews = Number(org.total_reviews || 0);
            let ratingValue = null;
            let ratingLabel = "Sin reseñas";
            let hasReviews = false;
            
            if (reviews > 0 && org.average_rating !== null && org.average_rating !== undefined) {
                ratingValue = Number(org.average_rating).toFixed(1);
                ratingLabel = ratingValue;
                hasReviews = true;
            }

            let isFavorite = window.isFavoriteOrg(org.org_id);

            // Debug mapping requested by user
            console.log("Mapa servicios visibles para org", org.org_id, services);

            return {
                org_id: org.org_id,
                name: org.name,
                lat: org.latitude,
                lng: org.longitude,
                status: org.status === 'active' || org.status === 'Activo' ? 'Activo' : (org.status || 'Inactivo'),
                services: services,
                primaryService: primaryService,
                rating: ratingLabel,
                rawRatingValue: ratingValue,
                hasReviews: hasReviews,
                total_reviews: reviews,
                isFavorite: isFavorite
            };
        });
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

            let ratingMarkup = '';
            if (org.hasReviews) {
                ratingMarkup = `
                    <div class="map-popup-rating">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 14px; height: 14px; color: var(--brand-mustard); margin-right: 0.15rem;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>${org.rating}</span>
                    </div>
                `;
            } else {
                ratingMarkup = `
                    <div class="map-popup-rating">
                        <span style="font-style:italic; font-size:0.8rem;">Sin reseñas</span>
                    </div>
                `;
            }

            const popupContent = `
                <div class="custom-leaflet-popup">
                    <div class="map-popup-header">
                        <h4 class="map-popup-name">${org.name}</h4>
                        <button class="map-popup-fav-btn ${org.isFavorite ? 'active' : ''}" data-orgid="${org.org_id}" aria-label="Guardar en favoritos">
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
                        ${ratingMarkup}
                    </div>
                    <button class="map-popup-btn btn-view-popup-details" data-orgid="${org.org_id}" data-service="${primaryService}">Ver detalles</button>
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

        console.log("Mapa filtro seleccionado:", selectedServices);

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

        // User location marker logic
        function updateUserMarker(lat, lng) {
            const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: `<div style="width: 16px; height: 16px; background-color: #4285F4; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 6px rgba(0,0,0,0.4);"></div>`,
                iconSize: [22, 22],
                iconAnchor: [11, 11]
            });
            if (!window.userLocationMarker) {
                window.userLocationMarker = L.marker([lat, lng], {
                    icon: userIcon,
                    zIndexOffset: 1000,
                    interactive: false // Prevents blocking clicks on nearby org pins
                }).addTo(map);
            } else {
                window.userLocationMarker.setLatLng([lat, lng]);
            }
        }

        if (mapUserLocation) {
            updateUserMarker(mapUserLocation.lat, mapUserLocation.lng);
        } else if (navigator.geolocation && !window.locationRequested) {
            window.locationRequested = true;
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    mapUserLocation = { lat, lng };
                    updateUserMarker(lat, lng);
                    
                    document.querySelectorAll('input[name="distance"]').forEach(el => {
                        el.removeAttribute('disabled');
                    });
                },
                (error) => {
                    console.warn('No se pudo obtener tu ubicación.', error);
                    alert('No se pudo obtener tu ubicación.');
                }
            );
        }

        // Bind Leaflet popup events to select details button and toggle hearts
        map.on('popupopen', (e) => {
            const popupNode = e.popup.getElement();
            
            // Heart toggling
            const favBtn = popupNode.querySelector('.map-popup-fav-btn');
            if (favBtn) {
                favBtn.addEventListener('click', async () => {
                    const orgId = favBtn.getAttribute('data-orgid');
                    const org = allMapOrganizations.find(o => Number(o.org_id) === Number(orgId));
                    if (!org) return;

                    const creds = window.INJECTED_DATA.credentials;
                    if (!creds || !creds.url || !creds.anon_key) {
                        alert('Error: Credenciales de Supabase no encontradas.');
                        return;
                    }
                    const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                    const userId = window.getCurrentUserId();

                    window.INJECTED_DATA.favorites_full = window.INJECTED_DATA.favorites_full || [];
                    const isCurrentlyFav = window.isFavoriteOrg(orgId);

                    favBtn.disabled = true;
                    try {
                        if (isCurrentlyFav) {
                            const { error } = await supabaseClient.rpc('remove_favorite', { p_user_id: userId, p_org_id: orgId });
                            if (error) {
                                console.error("Error completo al actualizar favoritos:", error);
                                alert('Error al actualizar favoritos: ' + error.message);
                            } else {
                                alert('Organización quitada de favoritos.');
                                window.INJECTED_DATA.favorites_full = window.INJECTED_DATA.favorites_full.filter(fav => 
                                    !(Number(fav.user_id) === userId && Number(fav.org_id) === Number(orgId))
                                );
                                org.isFavorite = false;
                                favBtn.classList.remove('active');
                            }
                        } else {
                            const { error } = await supabaseClient.rpc('add_favorite', { p_user_id: userId, p_org_id: orgId });
                            if (error) {
                                console.error("Error completo al actualizar favoritos:", error);
                                if (error.code === '23505' && error.message && error.message.includes('duplicate key value')) {
                                    alert('Esta organización ya está en favoritos.');
                                } else {
                                    alert('Error al actualizar favoritos: ' + error.message);
                                }
                            } else {
                                alert('Organización agregada a favoritos.');
                                window.INJECTED_DATA.favorites_full.push({
                                    user_id: userId,
                                    org_id: orgId,
                                    organization_name: org.name,
                                    description: "",
                                    address: ""
                                });
                                org.isFavorite = true;
                                favBtn.classList.add('active');
                            }
                        }
                    } catch (err) {
                        console.error("Error completo al actualizar favoritos:", err);
                        alert('Error al actualizar favoritos: ' + err.message);
                    } finally {
                        favBtn.disabled = false;
                    }
                });
            }

            // View details routing
            const detailsBtn = popupNode.querySelector('.btn-view-popup-details');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => {
                    const orgId = detailsBtn.getAttribute('data-orgid');
                    const serviceName = detailsBtn.getAttribute('data-service');
                    const ratingInfo = (window.INJECTED_DATA.organizations_with_rating || []).find(o => Number(o.org_id) === Number(orgId));
                    if (ratingInfo) {
                        detailScreenSource = 'map';
                        showOrganizationDetail(ratingInfo, serviceName);
                    } else {
                        alert("No se encontraron detalles para esta organización.");
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
            if (typeof renderOrgRequests === 'function') renderOrgRequests();
            showScreen('org-requests');
        });
    }

    // Admin state and logic
    const isAdmin = window.INJECTED_DATA.current_user?.role === "admin";

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
    const cardSuggestOrg = document.getElementById('card-suggest-org');
    const cardViewRequests = document.getElementById('card-view-requests');
    
    if (isAdmin) {
        if (cardAdminRequests) cardAdminRequests.style.display = 'flex';
        if (cardSuggestOrg) cardSuggestOrg.style.display = 'none';
        if (cardViewRequests) cardViewRequests.style.display = 'none';
    } else {
        if (cardAdminRequests) cardAdminRequests.style.display = 'none';
        if (cardSuggestOrg) cardSuggestOrg.style.display = 'flex';
        if (cardViewRequests) cardViewRequests.style.display = 'flex';
    }

    function renderAdminRequests() {
        const listContainer = document.getElementById('admin-requests-list');
        if (!listContainer) return;

        const isAdmin = window.INJECTED_DATA.current_user?.role === "admin";
        if (!isAdmin) {
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem; text-align: center; margin-top: 2rem;">No tenés permisos para acceder a esta sección.</p>';
            return;
        }

        console.log("Solicitudes reales inyectadas:", window.INJECTED_DATA.suggested_organizations_full);
        console.log("Servicios sugeridos reales inyectados:", window.INJECTED_DATA.suggested_services_full);

        const suggestions = window.INJECTED_DATA.suggested_organizations_full || [];
        const pendingSuggestions = suggestions.filter(s => s.validation_status === "pending");
        
        console.log("Solicitudes pendientes filtradas:", pendingSuggestions);

        if (pendingSuggestions.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem; text-align: center; margin-top: 2rem;">No hay solicitudes pendientes.</p>';
            return;
        }

        let html = '';
        pendingSuggestions.forEach(req => {
            const orgServices = (window.INJECTED_DATA.suggested_services_full || []).filter(s => Number(s.sugg_id) === Number(req.sugg_id));
            
            let servicesHtml = '';
            if (orgServices.length > 0) {
                servicesHtml = orgServices.map(s => `
                    <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.9rem;">
                        <strong>${s.service_type || 'Servicio'}</strong> - ${s.title || ''}<br>
                        ${s.description ? `<span style="color:var(--text-muted)">${s.description}</span><br>` : ''}
                        ${s.schedule ? `<span style="color:var(--text-muted)">Horario: ${s.schedule}</span><br>` : ''}
                        ${s.status ? `<span style="color:var(--text-muted)">Estado: ${s.status === 'active' ? 'Activo' : s.status}</span>` : ''}
                    </div>
                `).join('');
            } else {
                servicesHtml = '<p style="color:var(--text-muted); font-size:0.9rem; font-style:italic;">No hay servicios cargados para esta sugerencia.</p>';
            }

            let dateStr = 'No disponible';
            if (req.created_at) {
                const d = new Date(req.created_at);
                dateStr = d.toLocaleDateString();
            }

            html += `
                <article class="request-card" style="background: var(--bg-card); border-radius: 24px; padding: 2rem; border: 1px solid rgba(76, 67, 61, 0.05); box-shadow: var(--box-shadow); margin-bottom: 1.5rem;">
                    <div class="request-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 class="request-org-name" style="margin: 0; font-size: 1.4rem; color: var(--brand-charcoal);">${req.name}</h3>
                            <p class="request-desc" style="margin: 0.5rem 0 0; color: var(--text-muted); font-size: 1rem; line-height: 1.5;">${req.description || 'No disponible'}</p>
                        </div>
                        <span class="status-badge pending" style="background-color: rgba(207, 94, 40, 0.1); color: var(--brand-rust); font-weight: 600; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem;">Pendiente</span>
                    </div>
                    
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.6; margin-top: 1rem;">
                        <div><strong>Sugerida por:</strong> ${req.suggested_by || 'No disponible'}</div>
                        <div><strong>Dirección:</strong> ${req.address || 'No disponible'}</div>
                        <div><strong>Teléfono:</strong> ${req.phone || 'No disponible'}</div>
                        <div><strong>Redes/contacto:</strong> ${req.socials || 'No disponible'}</div>
                        <div><strong>Latitud/Longitud:</strong> ${req.latitude || '-'}, ${req.longitude || '-'}</div>
                        <div><strong>Fecha de creación:</strong> ${dateStr}</div>
                    </div>

                    <div style="margin-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem; margin-bottom: 1rem;">
                        <h4 style="font-size: 1rem; color: var(--brand-charcoal); margin: 0 0 0.5rem 0;">Servicios asociados</h4>
                        ${servicesHtml}
                    </div>

                    <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
                        <button class="btn-approve-admin" data-id="${req.sugg_id}" style="flex: 1; padding: 0.75rem; border-radius: 30px; border: none; background-color: var(--brand-charcoal); color: white; font-weight: 700; cursor: pointer;">Aprobar</button>
                        <button class="btn-reject-admin" data-id="${req.sugg_id}" style="flex: 1; padding: 0.75rem; border-radius: 30px; border: 1.5px solid var(--text-muted); background-color: transparent; color: var(--brand-charcoal); font-weight: 700; cursor: pointer;">Rechazar</button>
                    </div>
                </article>
            `;
        });
        listContainer.innerHTML = html;

        // Bind Approve buttons
        listContainer.querySelectorAll('.btn-approve-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const suggId = parseInt(btn.getAttribute('data-id'), 10);
                if (!confirm("¿Querés aprobar esta organización?")) return;

                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !window.supabase) {
                    console.error("Cliente Supabase no inicializado para revisar solicitudes");
                    alert("Error al revisar solicitud: cliente Supabase no inicializado");
                    return;
                }
                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                
                const tempAdminId = 4; // TEMPORAL: hasta implementar login real, usamos user_id = 4 como administrador.
                
                const payload = { p_sugg_id: suggId, p_admin_id: tempAdminId };
                console.log("approve_suggested_organization payload:", payload);
                
                btn.disabled = true;
                btn.textContent = 'Aprobando...';
                
                const { data: newOrgId, error } = await supabaseClient.rpc("approve_suggested_organization", payload);
                console.log("approve_suggested_organization response:", newOrgId, error);
                
                if (error) {
                    console.error("Error completo al aprobar solicitud:", error);
                    alert("Error al aprobar solicitud: " + error.message);
                    btn.disabled = false;
                    btn.textContent = 'Aprobar';
                    return;
                }
                
                alert("Solicitud aprobada correctamente.");
                
                // Update local UI
                const orgIdx = window.INJECTED_DATA.suggested_organizations_full.findIndex(o => Number(o.sugg_id) === suggId);
                if (orgIdx !== -1) window.INJECTED_DATA.suggested_organizations_full[orgIdx].validation_status = 'approved';
                
                // Refresh data from Supabase without reload
                try {
                    const [{ data: servicesFull }, { data: mapOrganizations }, { data: organizationsWithRating }, { data: suggestedOrganizations }, { data: suggestedServices }] = await Promise.all([
                        supabaseClient.from("view_services_full").select("*"),
                        supabaseClient.from("view_map_organizations").select("*"),
                        supabaseClient.from("view_organizations_with_rating").select("*"),
                        supabaseClient.from("view_suggested_organizations_full").select("*"),
                        supabaseClient.from("view_suggested_services_full").select("*")
                    ]);

                    if (servicesFull) window.INJECTED_DATA.services_full = servicesFull;
                    if (mapOrganizations) window.INJECTED_DATA.data = mapOrganizations;
                    if (organizationsWithRating) window.INJECTED_DATA.organizations_with_rating = organizationsWithRating;
                    if (suggestedOrganizations) window.INJECTED_DATA.suggested_organizations_full = suggestedOrganizations;
                    if (suggestedServices) window.INJECTED_DATA.suggested_services_full = suggestedServices;
                    
                    if (typeof getAllOrganizations === 'function') {
                        allMapOrganizations = getAllOrganizations();
                    }
                    if (typeof clearMapFilters === 'function') {
                        clearMapFilters(); // Re-renders map pins if active
                    }
                    if (typeof populateOrganizationsList === 'function' && typeof currentActiveCategory !== 'undefined') {
                        populateOrganizationsList(currentActiveCategory);
                    }
                } catch (e) {
                    console.error("Error refrescando datos después de aprobar:", e);
                }
                
                renderAdminRequests();
            });
        });

        // Bind Reject buttons
        listContainer.querySelectorAll('.btn-reject-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
                const suggId = parseInt(btn.getAttribute('data-id'), 10);
                const reason = prompt("Indicá el motivo de rechazo:");
                if (!reason || reason.trim() === '') {
                    if (reason !== null) alert("El motivo de rechazo no puede estar vacío.");
                    return;
                }

                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !window.supabase) {
                    console.error("Cliente Supabase no inicializado para revisar solicitudes");
                    alert("Error al revisar solicitud: cliente Supabase no inicializado");
                    return;
                }
                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                
                const tempAdminId = 4; // TEMPORAL: hasta implementar login real, usamos user_id = 4 como administrador.
                
                const payload = { p_sugg_id: suggId, p_admin_id: tempAdminId, p_reason: reason.trim() };
                console.log("reject_suggested_organization payload:", payload);
                
                btn.disabled = true;
                btn.textContent = 'Rechazando...';
                
                const { error } = await supabaseClient.rpc("reject_suggested_organization", payload);
                console.log("reject_suggested_organization response:", error);
                
                if (error) {
                    console.error("Error completo al rechazar solicitud:", error);
                    alert("Error al rechazar solicitud: " + error.message);
                    btn.disabled = false;
                    btn.textContent = 'Rechazar';
                    return;
                }
                
                alert("Solicitud rechazada correctamente.");
                
                // Update local UI
                const orgIdx = window.INJECTED_DATA.suggested_organizations_full.findIndex(o => Number(o.sugg_id) === suggId);
                if (orgIdx !== -1) {
                    window.INJECTED_DATA.suggested_organizations_full[orgIdx].validation_status = 'rejected';
                    window.INJECTED_DATA.suggested_organizations_full[orgIdx].rejection_reason = reason.trim();
                }
                
                renderAdminRequests();
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

        // 2. Selectable service pills from Supabase service_types
        const pillsContainer = document.getElementById('suggest-services-pills-container');
        const detailsContainer = document.getElementById('suggest-services-details-container');
        if (pillsContainer) {
            pillsContainer.innerHTML = '';
            if (detailsContainer) detailsContainer.innerHTML = '';
            
            const serviceTypes = window.INJECTED_DATA?.service_types || [];
            serviceTypes.forEach(st => {
                const pill = document.createElement('span');
                pill.className = 'service-pill';
                pill.setAttribute('data-id', st.type_id);
                pill.setAttribute('data-service', st.name);
                pill.textContent = st.name;
                pill.addEventListener('click', () => {
                    const isSelected = pill.classList.toggle('selected');
                    if (isSelected) {
                        // Create specific details card for this service
                        if (detailsContainer) {
                            const card = document.createElement('div');
                            card.className = 'service-detail-card';
                            card.id = `suggest-service-details-${st.type_id}`;
                            card.style.cssText = 'padding: 1.25rem; border-radius: 8px; border: 1px solid rgba(76, 67, 61, 0.1); background-color: #faf8f5; margin-bottom: 0.5rem; animation: fadeIn 0.3s ease;';
                            card.innerHTML = `
                                <h4 style="margin:0 0 1rem 0; font-size:1.1rem; color:var(--brand-charcoal); display:flex; align-items:center; gap:0.5rem;">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px; height:18px; color:var(--brand-rust);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                    ${st.name}
                                </h4>
                                <div class="form-group" style="margin-bottom:1rem;">
                                    <label class="form-label" style="font-size:0.9rem;" for="suggest-service-description-${st.type_id}">Descripción del servicio</label>
                                    <textarea class="form-textarea" id="suggest-service-description-${st.type_id}" placeholder="Ej: Entrega de desayuno..." style="min-height:60px; font-size:0.95rem;"></textarea>
                                </div>
                                <div class="form-group" style="margin-bottom:0;">
                                    <label class="form-label" style="font-size:0.9rem;" for="suggest-service-schedule-${st.type_id}">Horario del servicio</label>
                                    <input type="text" class="form-input" id="suggest-service-schedule-${st.type_id}" placeholder="Ej: Lunes a Viernes 8:00 a 10:00" style="font-size:0.95rem;">
                                </div>
                            `;
                            detailsContainer.appendChild(card);
                        }
                    } else {
                        // Remove specific details card
                        const card = document.getElementById(`suggest-service-details-${st.type_id}`);
                        if (card) {
                            card.remove();
                        }
                    }
                });
                pillsContainer.appendChild(pill);
            });
        }

        // 3. Conditional schedules toggle removed (now per service)

        // 4. Submit Solicitud triggers Supabase RPC calls
        const btnSubmitSuggest = document.getElementById('btn-submit-suggest');
        if (btnSubmitSuggest) {
            btnSubmitSuggest.addEventListener('click', async () => {
                // DATA EXTRACTION & VALIDATION
                const name = document.getElementById('suggest-name').value.trim();
                const description = document.getElementById('suggest-desc').value.trim();
                const address = document.getElementById('suggest-address').value.trim();
                const phone = document.getElementById('suggest-phone').value.trim();
                const socials = document.getElementById('suggest-social').value.trim();
                
                const latStr = document.getElementById('suggest-lat').value.trim();
                const lngStr = document.getElementById('suggest-lng').value.trim();
                const latitude = latStr !== "" ? Number(latStr) : NaN;
                const longitude = lngStr !== "" ? Number(lngStr) : NaN;

                const selectedPills = Array.from(document.querySelectorAll('#suggest-form-card-container .service-pill.selected'));
                
                // Validations
                if (selectedPills.length === 0) {
                    alert("Seleccioná al menos un servicio para enviar la solicitud.");
                    return;
                }

                if (!name || !description || !address || !phone || 
                    isNaN(latitude) || isNaN(longitude)) {
                    alert("Completá todos los campos obligatorios.");
                    return;
                }

                const finalSocials = socials === "" ? null : socials;

                btnSubmitSuggest.disabled = true;
                btnSubmitSuggest.textContent = 'Enviando...';

                try {
                    console.log("Intentando crear cliente Supabase para sugerencia");
                    const creds = window.INJECTED_DATA.credentials;

                    if (!creds || !window.supabase) {
                        console.error("Cliente Supabase no inicializado para sugerir organización");
                        alert("Error al sugerir organización: cliente Supabase no inicializado");
                        btnSubmitSuggest.disabled = false;
                        btnSubmitSuggest.textContent = 'Agregar organización';
                        return;
                    }

                    const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                    console.log("Cliente Supabase creado para sugerencia");

                    const p_user_id = window.getCurrentUserId();
                    console.log("Usuario actual al crear sugerencia:", window.INJECTED_DATA.current_user);
                    console.log("CURRENT_USER_ID al crear sugerencia:", p_user_id);

                    const payloadOrg = {
                        p_user_id: p_user_id,
                        p_name: name,
                        p_description: description,
                        p_address: address,
                        p_phone: phone,
                        p_socials: finalSocials,
                        p_latitude: latitude,
                        p_longitude: longitude
                    };

                    console.log("Payload sugerencia enviado a Supabase:", payloadOrg);
                    const { data: suggId, error: orgError } = await supabaseClient.rpc("create_suggested_organization", payloadOrg);
                    console.log("create_suggested_organization response:", suggId, orgError);

                    if (orgError) {
                        console.error("Error completo al crear sugerencia:", orgError);
                        alert("Error al sugerir organización: " + orgError.message);
                        btnSubmitSuggest.disabled = false;
                        btnSubmitSuggest.textContent = 'Enviar solicitud';
                        return;
                    }

                    // Add suggested services
                    const uniqueServicesMap = new Map();
                    for (const pill of selectedPills) {
                        const typeName = pill.getAttribute('data-service');
                        const typeId = parseInt(pill.getAttribute('data-id'), 10) || 1;
                        if (!uniqueServicesMap.has(typeId)) {
                            uniqueServicesMap.set(typeId, typeName);
                        }
                    }

                    for (const [typeId, typeName] of uniqueServicesMap.entries()) {
                        const serviceTitle = typeName;
                        
                        const descInput = document.getElementById(`suggest-service-description-${typeId}`);
                        const schedInput = document.getElementById(`suggest-service-schedule-${typeId}`);
                        
                        const serviceDescription = (descInput && descInput.value.trim() !== '') ? descInput.value.trim() : "Sin descripción disponible";
                        const serviceSchedule = (schedInput && schedInput.value.trim() !== '') ? schedInput.value.trim() : "Horario no informado";

                        const payloadService = {
                            p_sugg_id: suggId,
                            p_type_id: typeId,
                            p_title: serviceTitle,
                            p_description: serviceDescription,
                            p_schedule: serviceSchedule,
                            p_status: "active"
                        };

                        console.log("add_suggested_service payload:", payloadService);
                        const { data: suggServiceId, error: serviceError } = await supabaseClient.rpc("add_suggested_service", payloadService);
                        console.log("add_suggested_service response:", suggServiceId, serviceError);

                        if (serviceError) {
                            console.error("Error completo al agregar servicio sugerido:", serviceError);
                        }
                    }

                    // Success - Clear form and show message
                    document.getElementById('suggest-name').value = '';
                    document.getElementById('suggest-desc').value = '';
                    document.getElementById('suggest-address').value = '';
                    document.getElementById('suggest-phone').value = '';
                    document.getElementById('suggest-social').value = '';
                    document.getElementById('suggest-lat').value = '';
                    document.getElementById('suggest-lng').value = '';
                    selectedPills.forEach(p => p.classList.remove('selected'));
                    if (detailsContainer) detailsContainer.innerHTML = '';

                    alert("Organización sugerida correctamente. Quedará pendiente de revisión.");
                    
                    // Add to local state to reflect immediately
                    window.INJECTED_DATA.suggested_organizations_full = window.INJECTED_DATA.suggested_organizations_full || [];
                    window.INJECTED_DATA.suggested_organizations_full.push({
                        sugg_id: suggId,
                        user_id: p_user_id,
                        name: name,
                        description: description,
                        address: address,
                        phone: phone,
                        socials: socials,
                        latitude: latitude,
                        longitude: longitude,
                        validation_status: "pending",
                        created_at: new Date().toISOString()
                    });
                    
                    if (typeof renderOrgRequests === 'function') renderOrgRequests();

                    btnSubmitSuggest.disabled = false;
                    btnSubmitSuggest.textContent = 'Agregar organización';
                    
                    showScreen('add-org');

                } catch (e) {
                    console.error("Error completo al crear sugerencia:", e);
                    alert("Error al sugerir organización: " + e.message);
                    btnSubmitSuggest.disabled = false;
                    btnSubmitSuggest.textContent = 'Agregar organización';
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

    function renderOrgRequests() {
        const container = document.querySelector('.requests-list-container');
        if (!container) return;
        
        container.innerHTML = '';
        const svcs = (window.INJECTED_DATA && window.INJECTED_DATA.suggested_services_full) ? window.INJECTED_DATA.suggested_services_full : [];
        
        const orgs = window.getCurrentUserSuggestions();
        
        console.log("CURRENT_USER_ID:", window.getCurrentUserId());
        console.log("Todas las sugerencias:", window.INJECTED_DATA?.suggested_organizations_full);
        console.log("Sugerencias propias:", orgs);

        if (orgs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Todavía no realizaste sugerencias.</div>';
            return;
        }
        
        orgs.forEach(org => {
            const orgServices = svcs.filter(s => Number(s.sugg_id) === Number(org.sugg_id));
            
            // Map status
            let statusBadgeClass = 'pending';
            let statusLabel = 'Pendiente';
            if (org.validation_status === 'approved') {
                statusBadgeClass = 'approved';
                statusLabel = 'Aprobada';
            } else if (org.validation_status === 'rejected') {
                statusBadgeClass = 'rejected';
                statusLabel = 'Rechazada';
            }
            
            let servicesHtml = '';
            if (orgServices.length > 0) {
                servicesHtml = orgServices.map(s => `
                    <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.9rem;">
                        <strong>${s.service_type || 'Servicio'}</strong> - ${s.title || ''}<br>
                        ${s.description ? `<span style="color:var(--text-muted)">${s.description}</span><br>` : ''}
                        ${s.schedule ? `<span style="color:var(--text-muted)">Horario: ${s.schedule}</span><br>` : ''}
                        ${s.status ? `<span style="color:var(--text-muted)">Estado: ${s.status === 'active' ? 'Activo' : s.status}</span>` : ''}
                    </div>
                `).join('');
            } else {
                servicesHtml = '<p style="color:var(--text-muted); font-size:0.9rem; font-style:italic;">No hay servicios cargados para esta sugerencia.</p>';
            }
            
            const card = document.createElement('article');
            card.className = 'request-list-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            
            // Date formatting if exists
            let dateStr = 'No disponible';
            if (org.created_at) {
                const d = new Date(org.created_at);
                dateStr = d.toLocaleDateString();
            }

            // rejection reason
            let rejectionHtml = '';
            if (org.validation_status === 'rejected' && org.rejection_reason) {
                rejectionHtml = `<div style="background: #ffebee; color: #c62828; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.9rem;"><strong>Motivo de rechazo:</strong> ${org.rejection_reason}</div>`;
            }

            card.innerHTML = `
                <div class="request-card-info" style="width: 100%;">
                    <div class="request-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 class="request-card-name" style="margin: 0;">${org.name || 'Sin nombre'}</h3>
                        <span class="status-badge-custom ${statusBadgeClass}">${statusLabel}</span>
                    </div>
                    <p class="request-card-desc" style="margin-bottom: 0.5rem; font-weight: 500;">${org.description || 'No disponible'}</p>
                    
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.6;">
                        <div><strong>Sugerida por:</strong> ${org.suggested_by || 'No disponible'}</div>
                        <div><strong>Dirección:</strong> ${org.address || 'No disponible'}</div>
                        <div><strong>Teléfono:</strong> ${org.phone || 'No disponible'}</div>
                        <div><strong>Redes/contacto:</strong> ${org.socials || 'No disponible'}</div>
                        <div><strong>Fecha de creación:</strong> ${dateStr}</div>
                    </div>

                    ${rejectionHtml}

                    <div style="margin-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem;">
                        <h4 style="font-size: 1rem; color: var(--brand-charcoal); margin: 0 0 0.5rem 0;">Servicios asociados</h4>
                        ${servicesHtml}
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
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
            btnSave.addEventListener('click', async () => {
                const nameVal = document.getElementById('edit-my-org-name').value.trim();
                const descVal = document.getElementById('edit-my-org-desc').value.trim();
                const addressVal = document.getElementById('edit-my-org-address').value.trim();
                const phoneVal = document.getElementById('edit-my-org-phone').value.trim();
                const instagramVal = document.getElementById('edit-my-org-instagram').value.trim();
                const websiteVal = document.getElementById('edit-my-org-website').value.trim();
                const latVal = document.getElementById('edit-my-org-lat').value.trim();
                const lngVal = document.getElementById('edit-my-org-lng').value.trim();

                if (!nameVal || !descVal || !addressVal) {
                    alert('Nombre, descripción y dirección son obligatorios.');
                    return;
                }
                
                const latNum = parseFloat(latVal);
                const lngNum = parseFloat(lngVal);
                if (isNaN(latNum) || isNaN(lngNum)) {
                    alert('Latitud y longitud deben ser valores numéricos válidos.');
                    return;
                }

                let currentStatus = 'pending';
                let currentOrg = window.INJECTED_DATA.organizations_with_rating?.find(o => Number(o.org_id) === 1);
                if (currentOrg && currentOrg.status) {
                    currentStatus = currentOrg.status;
                }

                const payload = {
                    p_org_id: 1,
                    p_name: nameVal,
                    p_description: descVal,
                    p_address: addressVal,
                    p_phone: phoneVal || null,
                    p_instagram: instagramVal || null,
                    p_website: websiteVal || null,
                    p_latitude: latNum,
                    p_longitude: lngNum,
                    p_status: currentStatus
                };

                const originalBtnText = btnSave.textContent;
                btnSave.textContent = 'Guardando...';
                btnSave.disabled = true;

                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !window.supabase) {
                    console.error("Cliente Supabase no inicializado para update_organization");
                    alert("Error al actualizar la organización: cliente Supabase no inicializado");
                    btnSave.textContent = originalBtnText;
                    btnSave.disabled = false;
                    return;
                }

                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);

                try {
                    const { error } = await supabaseClient.rpc('update_organization', payload);
                    if (error) throw error;

                    if (window.INJECTED_DATA.organizations_with_rating) {
                        const org = window.INJECTED_DATA.organizations_with_rating.find(o => Number(o.org_id) === 1);
                        if (org) {
                            org.name = payload.p_name;
                            org.description = payload.p_description;
                            org.address = payload.p_address;
                            org.phone = payload.p_phone;
                            org.instagram = payload.p_instagram;
                            org.website = payload.p_website;
                            org.latitude = payload.p_latitude;
                            org.longitude = payload.p_longitude;
                        }
                    }
                    
                    if (window.INJECTED_DATA.map_organizations) {
                        const mOrg = window.INJECTED_DATA.map_organizations.find(o => Number(o.org_id) === 1);
                        if (mOrg) Object.assign(mOrg, { name: payload.p_name, latitude: payload.p_latitude, longitude: payload.p_longitude });
                    }
                    if (window.INJECTED_DATA.data) {
                        const dOrg = window.INJECTED_DATA.data.find(o => Number(o.org_id) === 1);
                        if (dOrg) Object.assign(dOrg, { name: payload.p_name, latitude: payload.p_latitude, longitude: payload.p_longitude });
                    }
                    if (window.INJECTED_DATA.services_full) {
                        window.INJECTED_DATA.services_full.forEach(s => {
                            if (Number(s.org_id) === 1) {
                                s.organization_name = payload.p_name;
                            }
                        });
                    }

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
                                    <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Datos de la organización actualizados correctamente.</p>
                                </div>
                                <button class="eval-submit-btn" id="btn-success-back-edit-my-org" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                            </div>
                        `;

                        const btnSuccessBack = document.getElementById('btn-success-back-edit-my-org');
                        if (btnSuccessBack) {
                            btnSuccessBack.addEventListener('click', () => {
                                showScreen('my-org');
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error completo al actualizar organización:", err);
                    alert("Error al actualizar la organización: " + (err.message || "desconocido"));
                    btnSave.textContent = originalBtnText;
                    btnSave.disabled = false;
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

    let myOrgServices = [];

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
                console.log("CLICK Administrar servicios");
                renderMyOrgServices();
                showScreen('manage-services');
                console.log("Administrar servicios abierto correctamente");
            });
        } else {
            console.warn("No se encontró btn-manage-my-org-services");
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
                console.warn("ALERT PROXIMA ETAPA disparado desde:", "btn-add-service");
                alert('Esta función se conectará en la próxima etapa.');
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
            btnSave.addEventListener('click', async () => {
                const nameEl     = document.getElementById('service-form-name');
                const descEl     = document.getElementById('service-form-desc');
                const scheduleEl = document.getElementById('service-form-schedule');
                const statusEl   = document.getElementById('service-form-status');

                const nameVal     = nameEl.value.trim();
                const descVal     = descEl.value.trim();
                const scheduleVal = scheduleEl.value.trim();
                const rawStatus   = statusEl.value.trim();

                const requiredFields = [
                    { el: scheduleEl, val: scheduleVal }
                ];

                requiredFields.forEach(({ el }) => el.classList.remove('form-input--error'));

                const existingBanner = document.getElementById('service-form-error-banner');
                if (existingBanner) existingBanner.remove();

                const invalidFields = requiredFields.filter(({ val }) => !val);

                if (invalidFields.length > 0) {
                    invalidFields.forEach(({ el }) => el.classList.add('form-input--error'));
                    invalidFields.forEach(({ el }) => {
                        const clearError = () => {
                            el.classList.remove('form-input--error');
                            el.removeEventListener('input', clearError);
                            el.removeEventListener('change', clearError);
                        };
                        el.addEventListener('input', clearError);
                        el.addEventListener('change', clearError);
                    });

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
                    return;
                }

                let finalStatus = 'inactive';
                if (rawStatus === 'active-status') finalStatus = 'active';

                if (editingServiceId !== null) {
                    const svc = myOrgServices.find(s => s.id === editingServiceId);
                    if (!svc) return;

                    const payload = {
                        p_serv_id: Number(svc.id),
                        p_type_id: Number(svc.type_id),
                        p_title: svc.name,
                        p_description: svc.desc,
                        p_schedule: scheduleVal,
                        p_status: finalStatus
                    };
                    console.log("update_service payload:", payload);

                    const creds = window.INJECTED_DATA.credentials;
                    if (!creds || !window.supabase) {
                        console.error("Cliente Supabase no inicializado para update_service");
                        alert("Error al actualizar el servicio: cliente Supabase no inicializado");
                        return;
                    }

                    const originalBtnText = btnSave.textContent;
                    btnSave.textContent = 'Guardando...';
                    btnSave.disabled = true;

                    const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);

                    try {
                        const { error } = await supabaseClient.rpc('update_service', payload);
                        if (error) throw error;
                        
                        console.log("update_service OK");

                        if (window.INJECTED_DATA.services_full) {
                            const dbSvc = window.INJECTED_DATA.services_full.find(s => Number(s.serv_id) === editingServiceId);
                            if (dbSvc) {
                                dbSvc.schedule = payload.p_schedule;
                                dbSvc.service_status = payload.p_status;
                            }
                        }
                        
                        populateMyOrgDashboard();

                        const formContainer = document.getElementById('service-form-card-container');
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
                                        <p style="font-size:1.1rem; color:var(--text-muted); line-height:1.5; max-width:500px; margin:0 auto;">Servicio actualizado correctamente.</p>
                                    </div>
                                    <button class="eval-submit-btn" id="btn-success-back-service" style="background-color: var(--brand-mustard); box-shadow: 0 6px 15px rgba(239, 154, 46, 0.2); margin-top: 0.5rem; max-width: 300px;">Volver</button>
                                </div>
                            `;

                            const btnSuccessBack = document.getElementById('btn-success-back-service');
                            if (btnSuccessBack) {
                                btnSuccessBack.addEventListener('click', () => {
                                    renderMyOrgServices();
                                    document.getElementById('services-list-view').style.display = 'block';
                                    document.getElementById('service-form-view').style.display = 'none';
                                });
                            }
                        }

                    } catch (err) {
                        console.error("Error completo al actualizar servicio:", err);
                        alert("Error al actualizar el servicio: " + (err.message || "desconocido"));
                        btnSave.textContent = originalBtnText;
                        btnSave.disabled = false;
                    }
                } else {
                    console.warn("ALERT PROXIMA ETAPA disparado desde:", "btn-save-service else");
                    alert('Esta función se conectará en la próxima etapa.');
                }
            });
        }
    }

    function renderMyOrgServices() {
        const cardsGrid = document.getElementById('services-cards-grid');
        if (!cardsGrid) return;

        cardsGrid.innerHTML = '';

        myOrgServices = [];
        const myOrgId = 1;
        if (window.INJECTED_DATA.services_full) {
            const orgServices = window.INJECTED_DATA.services_full.filter(s => Number(s.org_id) === myOrgId);
            orgServices.forEach(s => {
                myOrgServices.push({
                    id: s.serv_id,
                    type_id: s.type_id,
                    type: s.service_type || s.type_name || "Servicio",
                    name: s.title,
                    desc: s.description,
                    schedule: s.schedule,
                    status: s.service_status === 'full' ? 'active' : s.service_status,
                    statusLabel: (s.service_status === 'active' || s.service_status === 'full') ? 'Activo' : 'Inactivo'
                });
            });
        }

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
                    </div>
                `;

                // Add to DOM
                cardsGrid.appendChild(card);
            });

            // Bind individual card actions
            const editBtns = cardsGrid.querySelectorAll('.btn-edit-service');
            editBtns.forEach(btn => {
                btn.addEventListener('click', (event) => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    console.log("EDITAR SERVICIO CLICK OK", id);
                    const svc = myOrgServices.find(s => s.id === id);
                    if (svc) {
                        editingServiceId = id;
                        resetServiceForm();
                        
                        document.getElementById('service-form-title').textContent = "Editar servicio";
                        
                        const typeEl = document.getElementById('service-form-type');
                        const nameEl = document.getElementById('service-form-name');
                        const descEl = document.getElementById('service-form-desc');
                        
                        let optionExists = Array.from(typeEl.options).some(opt => opt.value === svc.type);
                        if (!optionExists) {
                            const newOption = new Option(svc.type, svc.type, true, true);
                            typeEl.add(newOption);
                        }
                        typeEl.value = svc.type;
                        typeEl.disabled = true;
                        
                        nameEl.value = svc.name;
                        nameEl.disabled = true;
                        
                        descEl.value = svc.desc;
                        descEl.disabled = true;
                        
                        document.getElementById('service-form-schedule').value = svc.schedule;

                        let formStatusVal = 'inactive-status';
                        if (svc.status === 'active' || svc.status === 'full') formStatusVal = 'active-status';
                        document.getElementById('service-form-status').value = formStatusVal;

                        document.getElementById('services-list-view').style.display = 'none';
                        document.getElementById('service-form-view').style.display = 'block';
                    }
                });
            });

            const deleteBtns = cardsGrid.querySelectorAll('.btn-delete-service');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const servIdStr = btn.getAttribute('data-id');
                    const servId = Number(servIdStr);
                    
                    if (confirm('¿Querés desactivar este servicio?')) {
                        const payload = { p_serv_id: servId };
                        console.log("deactivate_service payload:", payload);
                        
                        try {
                            const { data, error } = await supabaseClient.rpc('deactivate_service', payload);
                            
                            if (error) {
                                console.error("Error completo al desactivar servicio:", error);
                                alert("Ocurrió un error al desactivar el servicio.");
                                return;
                            }
                            
                            console.log("deactivate_service OK");
                            
                            // Update local state
                            if (window.INJECTED_DATA && window.INJECTED_DATA.services_full) {
                                const localSvc = window.INJECTED_DATA.services_full.find(s => Number(s.serv_id) === servId);
                                if (localSvc) {
                                    localSvc.status = 'inactive';
                                    localSvc.service_status = 'inactive';
                                }
                            }
                            
                            // Re-render
                            renderMyOrgServices();
                            
                            // Show success message container instead of alert if we had one, but the prompt says to show the message, so we use an alert for simplicity or just re-render. Wait, "mostrar mensaje: Servicio desactivado correctamente."
                            // We can use a simple alert since there's no feedback container specified for delete.
                            alert("Servicio desactivado correctamente.");
                            
                        } catch (err) {
                            console.error("Error completo al desactivar servicio:", err);
                        }
                    }
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

    let myOrgNeeds = [];

    function bindManageNeedsEvents() {
        // 1. "Administrar necesidades" button switches to screen 5.4
        const btnManageNeeds = document.getElementById('btn-manage-my-org-needs');
        if (btnManageNeeds) {
            btnManageNeeds.addEventListener('click', () => {
                myOrgNeeds = [];
                if (window.INJECTED_DATA && window.INJECTED_DATA.active_needs) {
                    const orgNeeds = window.INJECTED_DATA.active_needs.filter(n => Number(n.org_id) === 1);
                    
                    const priorityLabelMap = {
                        'low': 'Baja',
                        'medium': 'Media',
                        'high': 'Alta',
                        'urgent': 'Urgente'
                    };
                    
                    orgNeeds.forEach(s => {
                        myOrgNeeds.push({
                            id: s.need_id,
                            name: s.title || s.category,
                            desc: s.description,
                            category: s.category,
                            priority: s.priority || 'medium',
                            priorityLabel: priorityLabelMap[s.priority] || 'Media',
                            status: 'active',
                            statusLabel: 'Activa'
                        });
                    });
                }
                
                renderMyOrgNeeds();
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
                resetNeedForm();
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
            btnSave.addEventListener('click', async () => {
                const nameVal = document.getElementById('need-form-name').value.trim();
                const descVal = document.getElementById('need-form-desc').value.trim();
                const categoryVal = document.getElementById('need-form-category').value.trim();
                const priorityVal = document.getElementById('need-form-priority').value;

                if (!nameVal || !descVal || !categoryVal || !['low', 'medium', 'high', 'urgent'].includes(priorityVal)) {
                    alert("Por favor completá todos los campos y seleccioná una prioridad válida.");
                    return;
                }

                const payload = {
                    p_org_id: 1,
                    p_title: nameVal,
                    p_description: descVal,
                    p_category: categoryVal,
                    p_priority: priorityVal
                };
                
                console.log("add_need payload:", payload);

                const creds = window.INJECTED_DATA.credentials;
                if (!creds || !window.supabase) {
                    console.error("Cliente Supabase no inicializado para add_need");
                    alert("Error al guardar la necesidad: cliente Supabase no inicializado");
                    return;
                }

                const originalBtnText = btnSave.textContent;
                btnSave.textContent = "Guardando...";
                btnSave.disabled = true;

                const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);

                try {
                    const { data: newNeedId, error } = await supabaseClient.rpc('add_need', payload);
                    if (error) throw error;

                    const newNeedObj = {
                        need_id: newNeedId,
                        org_id: 1,
                        organization_name: "Comedor Esperanza Pilar",
                        title: nameVal,
                        description: descVal,
                        category: categoryVal,
                        priority: priorityVal,
                        created_at: new Date().toISOString()
                    };

                    if (!window.INJECTED_DATA.active_needs) {
                        window.INJECTED_DATA.active_needs = [];
                    }
                    window.INJECTED_DATA.active_needs.push(newNeedObj);

                    document.getElementById('need-form-card-container').style.display = 'none';
                    document.getElementById('need-form-success-container').style.display = 'flex';
                    
                } catch (error) {
                    console.error("Error completo al agregar necesidad:", error);
                    alert("Error al guardar la necesidad: " + error.message);
                } finally {
                    btnSave.textContent = originalBtnText;
                    btnSave.disabled = false;
                }
            });
        }
        
        const btnSuccessBack = document.getElementById('btn-success-back-need');
        if (btnSuccessBack) {
            btnSuccessBack.addEventListener('click', () => {
                document.getElementById('btn-manage-my-org-needs').click();
                document.getElementById('needs-list-view').style.display = 'block';
                document.getElementById('need-form-view').style.display = 'none';
                document.getElementById('need-form-card-container').style.display = 'block';
                document.getElementById('need-form-success-container').style.display = 'none';
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
                card.className = 'manage-service-card';
                card.innerHTML = `
                    <div class="manage-service-info">
                        <div class="manage-service-header">
                            <h4 class="manage-service-name">${need.name}</h4>
                            <span class="priority-badge-custom priority-${need.priority}">${need.priorityLabel}</span>
                        </div>
                        <p class="manage-service-desc">${need.desc}</p>
                        <div class="manage-service-meta">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; color:var(--brand-rust);">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span>Categoría: ${need.category}</span>
                        </div>
                    </div>
                    <div class="manage-service-actions" style="justify-content: flex-end;">
                        <button class="request-card-btn btn-delete-need" data-id="${need.id}" style="color: #d32f2f; background-color: #ffebee;">Desactivar</button>
                    </div>
                `;

                cardsGrid.appendChild(card);
            });

            const deleteBtns = cardsGrid.querySelectorAll('.btn-delete-need');
            deleteBtns.forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = parseInt(btn.getAttribute('data-id'));
                    const confirmDeactivate = confirm("¿Querés desactivar esta necesidad?");
                    if (!confirmDeactivate) return;

                    const payload = { p_need_id: id };
                    console.log("deactivate_need payload:", payload);

                    const creds = window.INJECTED_DATA.credentials;
                    if (!creds || !window.supabase) {
                        console.error("Cliente Supabase no inicializado para deactivate_need");
                        alert("Error al desactivar la necesidad: cliente Supabase no inicializado");
                        return;
                    }

                    const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                    const originalText = btn.textContent;
                    btn.textContent = "Desactivando...";
                    btn.disabled = true;

                    try {
                        const { error } = await supabaseClient.rpc('deactivate_need', payload);
                        if (error) throw error;
                        
                        if (window.INJECTED_DATA.active_needs) {
                            window.INJECTED_DATA.active_needs = window.INJECTED_DATA.active_needs.filter(n => Number(n.need_id) !== id);
                        }
                        
                        alert("Necesidad desactivada correctamente.");
                        document.getElementById('btn-manage-my-org-needs').click();
                        
                    } catch (error) {
                        console.error("Error completo al desactivar necesidad:", error);
                        alert("Error al desactivar la necesidad: " + error.message);
                        btn.textContent = originalText;
                        btn.disabled = false;
                    }
                });
            });
        }

        const dashboardNeedsList = document.getElementById('my-org-needs-list');
        if (dashboardNeedsList) {
            dashboardNeedsList.innerHTML = '';
            
            if (myOrgNeeds.length > 0) {
                myOrgNeeds.forEach(need => {
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
        document.getElementById('need-form-name').value = '';
        document.getElementById('need-form-desc').value = '';
        document.getElementById('need-form-category').selectedIndex = 0;
        document.getElementById('need-form-priority').selectedIndex = 0;
    }

    bindManageNeedsEvents();

    function bindManagePhotosEvents() {
        // 1. "Administrar fotos" button switches to screen 5.5
        const btnManagePhotos = document.getElementById('btn-manage-my-org-photos');
        if (btnManagePhotos) {
            btnManagePhotos.addEventListener('click', () => {
                console.warn("ALERT PROXIMA ETAPA disparado desde:", "btn-manage-my-org-photos");
                alert('Esta función se conectará en la próxima etapa.');
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

    function populateProfileData() {
        // TEMPORAL: hasta implementar login real/MongoDB, usamos user_id = 1 como usuario actual.
        const CURRENT_USER_ID = window.INJECTED_DATA.current_user?.supabase_user_id || 1;
        console.log("Perfil - CURRENT_USER_ID:", CURRENT_USER_ID);
        
        const users = window.INJECTED_DATA && window.INJECTED_DATA.users ? window.INJECTED_DATA.users : [];
        console.log("Perfil - users:", users);

        const currentUser = users.find(u => Number(u.user_id) === CURRENT_USER_ID);
        console.log("Perfil - currentUser:", currentUser);

        const nameDisplay = document.getElementById('profile-user-name');
        const emailDisplay = document.getElementById('profile-user-email');
        let badgeDisplay = null;
        if (nameDisplay && nameDisplay.nextElementSibling && nameDisplay.nextElementSibling.classList.contains('status-badge-custom')) {
            badgeDisplay = nameDisplay.nextElementSibling;
        }

        if (currentUser) {
            if (nameDisplay) nameDisplay.textContent = currentUser.full_name || 'Sin nombre';
            if (emailDisplay) emailDisplay.textContent = currentUser.email || 'Sin email';
            if (badgeDisplay) {
                badgeDisplay.textContent = currentUser.role || 'Sin rol';
                badgeDisplay.style.display = '';
            }
        } else {
            if (nameDisplay) nameDisplay.textContent = 'No se encontró el usuario actual.';
            if (emailDisplay) emailDisplay.textContent = '';
            if (badgeDisplay) badgeDisplay.style.display = 'none';
        }
    }

    populateProfileData();



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
                
                // Password fields feature removed for demo

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

                if (!nameVal) {
                    alert('Por favor ingresá un nombre.');
                    return;
                }

                // Password check removed for demo

                // Show confirmation message
                alert('Perfil actualizado correctamente.');

                // Dynamically update Screen 6.1 elements
                const nameDisplay = document.getElementById('profile-user-name');
                if (nameDisplay) {
                    nameDisplay.textContent = `${nameVal} ${lastnameVal}`.trim();
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

        // Service icon config
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

        const currentUserFavorites = window.getCurrentUserFavorites();
        
        console.log("CURRENT_USER_ID:", window.getCurrentUserId());
        console.log("Perfil - favorites_full:", window.INJECTED_DATA?.favorites_full);
        console.log("Perfil - currentUserFavorites:", currentUserFavorites);

        if (currentUserFavorites.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.15rem; font-style: italic; background-color: var(--bg-card); border-radius: 24px; border: 1.5px dashed rgba(76, 67, 61, 0.15); width: 100%;">
                    Todavía no agregaste favoritos.
                </div>
            `;
            return;
        }

        currentUserFavorites.forEach(fav => {
            const orgId = fav.org_id;
            
            // Find services
            const orgServicesFull = (window.INJECTED_DATA.services_full || []).filter(s => Number(s.org_id) === Number(orgId));
            const orgServices = orgServicesFull.map(s => s.service_type);

            // Find rating and status
            let status = 'Activo'; // Fallback
            let ratingText = '';
            const ratingInfo = (window.INJECTED_DATA.organizations_with_rating || []).find(o => Number(o.org_id) === Number(orgId));
            if (ratingInfo) {
                status = ratingInfo.status === 'active' ? 'Activo' : 'Inactivo';
                if (ratingInfo.total_reviews > 0 && ratingInfo.average_rating !== null) {
                    ratingText = Number(ratingInfo.average_rating).toFixed(1);
                }
            }

            const card = document.createElement('article');
            card.className = 'org-card';

            // Build multi-service icon badges
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
            if (status === 'Suspendido') statusColor = '#cf5e28';
            else if (status === 'Cupo completo') statusColor = '#d87b1a';
            else if (status === 'Inactivo') statusColor = 'var(--text-muted)';

            card.innerHTML = `
                <div class="org-card-header" style="flex-direction:column; align-items:flex-start; gap:0.75rem;">
                    <div style="display:flex; align-items:center; justify-content:space-between; width:100%;">
                        <span style="font-size:0.85rem; font-weight:700; color:${statusColor};">• ${status}</span>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; gap:0.75rem; width:100%;">
                        ${servicesBadgesMarkup}
                    </div>
                </div>
                <div class="org-card-body">
                    <h3 class="org-name">${fav.organization_name}</h3>
                    ${ratingText ? `
                    <div class="org-rating" aria-label="Calificación ${ratingText} estrellas">
                        <svg class="star-icon" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span class="rating-value">${ratingText}</span>
                    </div>
                    ` : `
                    <div class="org-rating" aria-label="Sin reseñas">
                        <span class="rating-count" style="margin-left:0; font-style:italic;">Sin reseñas</span>
                    </div>
                    `}
                    <p class="org-description">${fav.description || ''}</p>
                    <p class="org-description" style="font-size:0.8rem; margin-top:0.5rem;">📍 ${fav.address || ''}</p>
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

            // Bind click to "Ver detalles" button
            const detailsBtn = card.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const primaryService = orgServices[0] || '';
                    if (ratingInfo) {
                        detailScreenSource = 'favorites';
                        showOrganizationDetail(ratingInfo, primaryService);
                    } else {
                        alert("No se encontraron detalles para esta organización.");
                    }
                });
            }

            // Bind click to "Quitar favorito" button
            const removeBtn = card.querySelector('.btn-remove-fav');
            if (removeBtn) {
                removeBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    const CURRENT_USER_ID = window.getCurrentUserId();

                    console.log("Perfil - quitar favorito orgId:", orgId);
                    console.log("Perfil - payload remove_favorite:", {
                        p_user_id: CURRENT_USER_ID,
                        p_org_id: orgId
                    });
                    console.log("Perfil - favoritos antes:", window.INJECTED_DATA.favorites_full);

                    const creds = window.INJECTED_DATA.credentials;
                    if (!creds || !window.supabase) {
                        alert('Error: Cliente Supabase no inicializado.');
                        return;
                    }
                    const supabaseClient = window.supabase.createClient(creds.url, creds.anon_key);
                    
                    removeBtn.disabled = true;
                    
                    const { error } = await supabaseClient.rpc('remove_favorite', {
                        p_user_id: CURRENT_USER_ID,
                        p_org_id: orgId
                    });
                    
                    if (error) {
                        console.error(error);
                        alert('No se pudo quitar de favoritos.');
                        removeBtn.disabled = false;
                    } else {
                        window.INJECTED_DATA.favorites_full = (window.INJECTED_DATA.favorites_full || []).filter(fav => 
                            !(Number(fav.user_id) === Number(CURRENT_USER_ID) && Number(fav.org_id) === Number(orgId))
                        );
                        
                        console.log("Perfil - favoritos después:", window.INJECTED_DATA.favorites_full);
                        alert('Organización quitada de favoritos.');
                        renderFavorites();
                    }
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
        
        const currentUserReviews = window.getCurrentUserReviews();
        
        console.log("CURRENT_USER_ID:", window.getCurrentUserId());
        console.log("Perfil - reviews_full:", window.INJECTED_DATA?.reviews_full);
        console.log("Perfil - currentUserReviews:", currentUserReviews);

        if (currentUserReviews.length === 0) {
            listView.innerHTML = `
                <div style="text-align: center; padding: 4rem 1.5rem; color: var(--text-muted); font-size: 1.15rem; font-style: italic; background-color: var(--bg-card); border-radius: 24px; border: 1.5px dashed rgba(76, 67, 61, 0.15); width: 100%;">
                    Todavía no realizaste reseñas.
                </div>
            `;
            return;
        }

        currentUserReviews.forEach(review => {
            const card = document.createElement('article');
            card.className = 'manage-service-card';
            
            let tagsMarkup = '<span class="org-list-tag" style="font-style: italic; color: var(--text-muted); background: none; padding: 0; border: none;">Sin etiquetas</span>';
            if (review.tags && Array.isArray(review.tags) && review.tags.length > 0) {
                tagsMarkup = review.tags.map(t => `<span class="org-list-tag">${t}</span>`).join('');
            } else if (typeof review.tags === 'string' && review.tags.trim() !== '') {
                tagsMarkup = review.tags.split(',').map(t => `<span class="org-list-tag">${t.trim()}</span>`).join('');
            }
            
            let displayDate = 'Sin fecha';
            if (review.created_at) {
                try {
                    const d = new Date(review.created_at);
                    if (!isNaN(d.getTime())) {
                        displayDate = d.toLocaleDateString();
                    }
                } catch(e) {}
            }
            
            card.innerHTML = `
                <div class="manage-service-info" style="width: 100%;">
                    <div class="manage-service-header" style="justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 0.75rem;">
                        <h4 class="manage-service-name" style="font-size: 1.25rem; margin: 0;">${review.organization_name || 'Organización desconocida'}</h4>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
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
                        <span>Evaluado el: ${displayDate}</span>
                    </div>
                </div>
            `;

            listView.appendChild(card);
        });
    }

    function renderSuggestions() {
        const listView = document.getElementById('suggestions-list-view');
        if (!listView) return;

        listView.innerHTML = '';
        
        const orgsAll = (window.INJECTED_DATA && window.INJECTED_DATA.suggested_organizations_full) ? window.INJECTED_DATA.suggested_organizations_full : [];
        const svcsAll = (window.INJECTED_DATA && window.INJECTED_DATA.suggested_services_full) ? window.INJECTED_DATA.suggested_services_full : [];
        
        const orgs = window.getCurrentUserSuggestions();

        if (orgs.length === 0) {
            listView.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Todavía no realizaste sugerencias.</div>';
            return;
        }

        orgs.forEach(org => {
            const orgServices = svcsAll.filter(s => Number(s.sugg_id) === Number(org.sugg_id));
            
            let servicesHtml = '';
            if (orgServices.length > 0) {
                servicesHtml = orgServices.map(s => `
                    <div style="background: rgba(0,0,0,0.02); padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.9rem;">
                        <strong>${s.service_type || 'Servicio'}</strong> - ${s.title || ''}<br>
                        ${s.description ? `<span style="color:var(--text-muted)">${s.description}</span><br>` : ''}
                        ${s.schedule ? `<span style="color:var(--text-muted)">Horario: ${s.schedule}</span><br>` : ''}
                        ${s.status ? `<span style="color:var(--text-muted)">Estado: ${s.status === 'active' ? 'Activo' : s.status}</span>` : ''}
                    </div>
                `).join('');
            } else {
                servicesHtml = '<p style="color:var(--text-muted); font-size:0.9rem; font-style:italic;">No hay servicios cargados para esta sugerencia.</p>';
            }
            
            const card = document.createElement('article');
            card.className = 'request-list-card';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            
            let dateStr = 'No disponible';
            if (org.created_at) {
                const d = new Date(org.created_at);
                dateStr = d.toLocaleDateString();
            }

            let statusBadgeClass = 'pending';
            let statusLabel = 'Pendiente';
            if (org.validation_status === 'approved') {
                statusBadgeClass = 'approved';
                statusLabel = 'Aprobada';
            } else if (org.validation_status === 'rejected') {
                statusBadgeClass = 'rejected';
                statusLabel = 'Rechazada';
            }

            let rejectionHtml = '';
            if (org.validation_status === 'rejected' && org.rejection_reason) {
                rejectionHtml = `<div style="background: #ffebee; color: #c62828; padding: 0.75rem; border-radius: 8px; margin-top: 0.5rem; font-size: 0.9rem;"><strong>Motivo de rechazo:</strong> ${org.rejection_reason}</div>`;
            }

            card.innerHTML = `
                <div class="request-card-info" style="width: 100%;">
                    <div class="request-card-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <h3 class="request-card-name" style="margin: 0;">${org.name || 'Sin nombre'}</h3>
                        <span class="status-badge-custom ${statusBadgeClass}">${statusLabel}</span>
                    </div>
                    <p class="request-card-desc" style="margin-bottom: 0.5rem; font-weight: 500;">${org.description || 'No disponible'}</p>
                    
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.6;">
                        <div><strong>Sugerida por:</strong> ${org.suggested_by || 'No disponible'}</div>
                        <div><strong>Dirección:</strong> ${org.address || 'No disponible'}</div>
                        <div><strong>Teléfono:</strong> ${org.phone || 'No disponible'}</div>
                        <div><strong>Redes/contacto:</strong> ${org.socials || 'No disponible'}</div>
                        <div><strong>Latitud/Longitud:</strong> ${org.latitude || '-'}, ${org.longitude || '-'}</div>
                        <div><strong>Fecha de creación:</strong> ${dateStr}</div>
                    </div>

                    ${rejectionHtml}

                    <div style="margin-top: 1rem; border-top: 1px solid rgba(0,0,0,0.05); padding-top: 1rem; margin-bottom: 1rem;">
                        <h4 style="font-size: 1rem; color: var(--brand-charcoal); margin: 0 0 0.5rem 0;">Servicios asociados</h4>
                        ${servicesHtml}
                    </div>
                </div>
            `;
            
            listView.appendChild(card);
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

    // Population function for Mi Organización
    function populateMyOrgDashboard() {
        if (!window.INJECTED_DATA) return;

        const dashboard = document.querySelector('#screen-my-org .my-org-dashboard');
        if (!window.canAccessMyOrganization()) {
            if (dashboard) {
                dashboard.innerHTML = '<p style="color: var(--text-muted); font-size: 1.1rem; text-align: center; margin-top: 2rem;">No tenés una organización asociada.</p>';
            }
            return;
        }
        
        const memberships = window.getCurrentUserMemberships();
        const myOrgId = Number(memberships[0].org_id);

        // 1. Populate General Info (from organizations_with_rating)
        if (window.INJECTED_DATA.organizations_with_rating) {
            const orgInfo = window.INJECTED_DATA.organizations_with_rating.find(o => Number(o.org_id) === myOrgId);
            if (orgInfo) {
                document.getElementById('my-org-header-name').textContent = orgInfo.name || 'No disponible';
                document.getElementById('my-org-header-desc').textContent = orgInfo.description || 'No disponible';
                document.getElementById('my-org-info-address').textContent = orgInfo.address || 'No disponible';
                document.getElementById('my-org-info-phone').textContent = orgInfo.phone || 'No disponible';
                document.getElementById('my-org-info-instagram').textContent = orgInfo.instagram || 'No disponible';
                
                const websiteEl = document.getElementById('my-org-info-website');
                if (orgInfo.website) {
                    websiteEl.textContent = orgInfo.website;
                    websiteEl.href = orgInfo.website.startsWith('http') ? orgInfo.website : `https://${orgInfo.website}`;
                } else {
                    websiteEl.textContent = 'No disponible';
                    websiteEl.removeAttribute('href');
                }
                
                document.getElementById('my-org-info-lat').textContent = orgInfo.latitude || 'No disponible';
                document.getElementById('my-org-info-lng').textContent = orgInfo.longitude || 'No disponible';

                // Status and Rating
                const statusEl = document.getElementById('my-org-header-status');
                if (statusEl) {
                    statusEl.textContent = orgInfo.status === 'active' ? 'Activa' : (orgInfo.status || 'No disponible');
                    statusEl.className = orgInfo.status === 'active' ? 'status-badge-custom approved' : 'status-badge-custom pending';
                }

                const ratingEl = document.getElementById('my-org-header-rating');
                if (ratingEl) {
                    if (orgInfo.total_reviews > 0 && orgInfo.average_rating) {
                        ratingEl.innerHTML = `⭐ ${Number(orgInfo.average_rating).toFixed(1)} <span style="font-size:0.8rem;font-weight:400;color:var(--text-light);margin-left:4px;">(${orgInfo.total_reviews})</span>`;
                    } else {
                        ratingEl.innerHTML = `<span style="font-style:italic; font-size:0.85rem; font-weight:400; color:var(--text-light);">Sin reseñas</span>`;
                    }
                }
            }
        }

        // 2. Populate Services
        const servicesList = document.getElementById('my-org-services-list');
        if (servicesList && window.INJECTED_DATA.services_full) {
            const orgServices = window.INJECTED_DATA.services_full.filter(s => Number(s.org_id) === myOrgId);
            servicesList.innerHTML = '';
            if (orgServices.length === 0) {
                servicesList.innerHTML = '<p style="color:var(--text-light); font-size:0.9rem;">No hay servicios activos publicados.</p>';
            } else {
                orgServices.forEach(srv => {
                    const statusText = srv.service_status === 'active' ? 'Activo' : 'Inactivo';
                    const statusClass = srv.service_status === 'active' ? 'approved' : 'pending';
                    servicesList.innerHTML += `
                        <div class="my-org-service-item" style="border:1px solid #f5ede6; padding:0.75rem; border-radius:8px; width:100%; display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="margin:0; font-size:0.95rem; color:var(--text-dark);">${srv.title || 'Sin título'}</h4>
                                <p style="margin:0.25rem 0 0 0; font-size:0.8rem; color:var(--text-light);">${srv.service_type || ''} • ${srv.schedule || 'Sin horario'}</p>
                            </div>
                            <span class="status-badge-custom ${statusClass}" style="font-size:0.7rem; padding:0.2rem 0.5rem;">${statusText}</span>
                        </div>
                    `;
                });
            }
        }

        // 3. Populate Needs
        const needsList = document.getElementById('my-org-needs-list');
        if (needsList && window.INJECTED_DATA.active_needs) {
            const orgNeeds = window.INJECTED_DATA.active_needs.filter(n => Number(n.org_id) === myOrgId);
            needsList.innerHTML = '';
            if (orgNeeds.length === 0) {
                needsList.innerHTML = '<p style="color:var(--text-light); font-size:0.9rem;">No hay necesidades activas publicadas.</p>';
            } else {
                orgNeeds.forEach(need => {
                    let priorityColor = '#CF5E28'; // high
                    let priorityText = 'Alta';
                    if (need.priority === 'medium') { priorityColor = '#EFA52E'; priorityText = 'Media'; }
                    if (need.priority === 'low') { priorityColor = '#4C433D'; priorityText = 'Baja'; }
                    needsList.innerHTML += `
                        <div class="my-org-need-item" style="border:1px solid #f5ede6; padding:0.75rem; border-radius:8px; display:flex; flex-direction:column; gap:0.25rem;">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4 style="margin:0; font-size:0.95rem; color:var(--text-dark);">${need.title || 'Sin título'}</h4>
                                <span style="background-color:${priorityColor}; color:white; font-size:0.7rem; padding:0.15rem 0.5rem; border-radius:12px; font-weight:600;">${priorityText}</span>
                            </div>
                            <p style="margin:0; font-size:0.85rem; color:var(--text-light);">${need.description || ''}</p>
                            <p style="margin:0; font-size:0.75rem; color:var(--brand-mustard); font-weight:600;">${need.category || ''}</p>
                        </div>
                    `;
                });
            }
        }

        // 4. Populate Members
        const membersList = document.getElementById('my-org-members-list');
        if (membersList) {
            membersList.innerHTML = '';
            
            let orgMembers = [];
            if (window.INJECTED_DATA.organization_members_full && window.INJECTED_DATA.organization_members_full.length > 0) {
                orgMembers = window.INJECTED_DATA.organization_members_full.filter(m => Number(m.org_id) === myOrgId && m.is_active === true);
            }

            if (orgMembers.length === 0) {
                membersList.innerHTML = '<p style="color:var(--text-light); font-size:0.9rem; font-style:italic;">No se pudieron cargar los miembros de la organización.</p>';
            } else {
                orgMembers.forEach(mem => {
                    let userName = mem.full_name || "Usuario Desconocido";

                    const roleText = mem.member_role === 'coordinador' ? 'Coordinador' : (mem.member_role ? mem.member_role.charAt(0).toUpperCase() + mem.member_role.slice(1) : 'Voluntario');
                    const roleClass = mem.member_role === 'coordinador' ? 'approved' : 'pending';
                    membersList.innerHTML += `
                        <div class="my-org-member-item" style="display:flex; align-items:center; gap:0.75rem; padding:0.5rem 0; border-bottom:1px solid #f5ede6;">
                            <div style="width:36px; height:36px; border-radius:50%; background-color:#e2d3c5; display:flex; justify-content:center; align-items:center; color:white; font-weight:600;">
                                ${userName.charAt(0).toUpperCase()}
                            </div>
                            <div style="flex:1;">
                                <h4 style="margin:0; font-size:0.95rem; color:var(--text-dark);">${userName}</h4>
                                <span class="status-badge-custom ${roleClass}" style="font-size:0.7rem; padding:0.1rem 0.4rem; margin-top:0.25rem;">${roleText}</span>
                            </div>
                        </div>
                    `;
                });
            }
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

    // --- Center on My Location Logic ---
    const btnCenterLocation = document.getElementById('btn-center-location');
    if (btnCenterLocation) {
        btnCenterLocation.addEventListener('click', () => {
            const errorMsg = document.getElementById('location-error-msg');
            if (errorMsg) errorMsg.style.display = 'none';

            if (!navigator.geolocation) {
                if (errorMsg) {
                    errorMsg.textContent = "La geolocalización no está disponible en este dispositivo o navegador.";
                    errorMsg.style.display = 'block';
                }
                return;
            }

            const originalContent = btnCenterLocation.innerHTML;
            btnCenterLocation.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg> Buscando...`;
            btnCenterLocation.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    btnCenterLocation.innerHTML = originalContent;
                    btnCenterLocation.disabled = false;
                    
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    if (typeof mapUserLocation !== 'undefined') {
                        mapUserLocation = { lat, lng };
                    }

                    if (typeof map !== 'undefined' && !map) {
                        if (typeof initLeafletMap === 'function') initLeafletMap();
                    }

                    if (typeof window.userLocationMarker !== 'undefined' && window.userLocationMarker) {
                        window.userLocationMarker.setLatLng([lat, lng]);
                        if (!window.userLocationMarker.getPopup()) {
                            window.userLocationMarker.bindPopup("<b>Tu ubicación</b><br>Solo visible para vos.");
                        }
                    } else if (typeof map !== 'undefined' && map) {
                        const userIcon = L.divIcon({
                            className: 'user-location-marker',
                            html: '<div style="width: 16px; height: 16px; background-color: #2196F3; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11]
                        });
                        window.userLocationMarker = L.marker([lat, lng], {
                            icon: userIcon,
                            zIndexOffset: 1000,
                            interactive: true
                        }).addTo(map).bindPopup("<b>Tu ubicación</b><br>Solo visible para vos.");
                    }

                    if (typeof map !== 'undefined' && map) {
                        map.setView([lat, lng], 15);
                    }
                },
                (error) => {
                    btnCenterLocation.innerHTML = originalContent;
                    btnCenterLocation.disabled = false;
                    
                    if (errorMsg) {
                        if (error.code === error.PERMISSION_DENIED) {
                            errorMsg.textContent = "No pudimos acceder a tu ubicación. Podés habilitar el permiso desde la configuración del navegador.";
                        } else {
                            errorMsg.textContent = "Hubo un error al intentar obtener tu ubicación.";
                        }
                        errorMsg.style.display = 'block';
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    }

});
