import streamlit as st
import streamlit.components.v1 as components
from supabase import create_client
import json
import base64
import os

st.set_page_config(page_title="COMUNITAS", layout="wide", initial_sidebar_state="collapsed")

@st.cache_data
def get_logo_base64():
    logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "logo_comunitas.png")
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        return f"data:image/png;base64,{b64}"
    return ""

logo_data_uri = get_logo_base64()

# --- VISTA PÚBLICA (Ficha compartida por QR) ---
ficha_id = st.query_params.get("ficha")
if ficha_id:
    url = st.secrets.get("SUPABASE_URL", "")
    anon_key = st.secrets.get("SUPABASE_KEY", "")
    if url and anon_key:
        client = create_client(url, anon_key)
        
        # Consultar la organización
        org_res = client.table("view_organizations_with_rating").select("*").eq("org_id", ficha_id).execute()
        if not org_res or not org_res.data:
            st.error("No encontramos esta organización.")
            st.stop()
            
        org = org_res.data[0]
        
        # Consultar los servicios
        serv_res = client.table("view_services_full").select("*").eq("org_id", ficha_id).execute()
        services = serv_res.data if serv_res and hasattr(serv_res, "data") and serv_res.data else []
        if not services and hasattr(serv_res, "data") == False: # fallback if structure is different
            services = serv_res.data if serv_res else []
            
        # Filtrar solo activos
        active_services = [s for s in services if s.get("service_status") in ("active", "full") or s.get("status") in ("active", "full")]
        
        # Armar el HTML
        services_html = ""
        for s in active_services:
            name = s.get("service_type") or s.get("type_name") or s.get("title") or "Servicio"
            sched = s.get("schedule") or "Horario no informado"
            services_html += f"""
            <div style="background: rgba(0,0,0,0.02); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; font-size: 0.9rem;">
                <div style="font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">{name}</div>
                <div style="color: var(--text-muted); font-size: 0.85rem;">{sched}</div>
            </div>
            """
            
        if not services_html:
            services_html = '<p style="color: var(--text-muted); font-size: 0.9rem; font-style: italic;">No hay servicios registrados.</p>'
            
        address = org.get("address") or "Dirección no disponible"
        phone = org.get("phone")
        phone_html = f'<p style="color: var(--text-main); font-size: 0.95rem; margin: 0 0 1rem 0;">📞 {phone}</p>' if phone else ''
        
        lat = org.get("latitude")
        lng = org.get("longitude")
        
        map_script = ""
        directions_btn = ""
        if lat and lng:
            directions_btn = f"""
            <a href="https://www.google.com/maps/dir/?api=1&destination={lat},{lng}" target="_blank" style="display: block; width: 100%; text-align: center; background-color: var(--brand-mustard); color: white; padding: 1rem; border-radius: 12px; font-weight: 600; font-size: 1.05rem; text-decoration: none; margin-top: 1.5rem; box-shadow: 0 4px 12px rgba(230, 166, 32, 0.3);">
                Cómo llegar
            </a>
            """
            map_script = f"""
            <div id="map" style="width: 100%; height: 200px; border-radius: 12px; margin-top: 1rem; z-index: 1;"></div>
            <button id="btn-locate" style="width: 100%; margin-top: 0.5rem; background: var(--bg-main); border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; color: var(--text-main); cursor: pointer;">📍 Mostrar cómo llegar desde mi ubicación</button>
            <p id="geo-error" style="color: var(--brand-terracotta); font-size: 0.8rem; margin-top: 0.25rem; display: none;"></p>
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <script>
                var map = L.map('map', {{ zoomControl: false }}).setView([{lat}, {lng}], 15);
                L.tileLayer('https://{{s}}.tile.openstreetmap.org/{{z}}/{{x}}/{{y}}.png').addTo(map);
                var customIcon = L.divIcon({{
                    className: 'custom-div-icon',
                    html: "<div style='background-color:#E6A620; width:14px; height:14px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                }});
                var orgMarker = L.marker([{lat}, {lng}], {{icon: customIcon}}).addTo(map);
                
                var userMarker = null;
                document.getElementById('btn-locate').addEventListener('click', function() {{
                    var errEl = document.getElementById('geo-error');
                    errEl.style.display = 'none';
                    this.innerHTML = "Buscando...";
                    this.disabled = true;
                    
                    if (!navigator.geolocation) {{
                        errEl.textContent = "La geolocalización no está disponible.";
                        errEl.style.display = 'block';
                        this.innerHTML = "📍 Mostrar cómo llegar desde mi ubicación";
                        this.disabled = false;
                        return;
                    }}
                    
                    navigator.geolocation.getCurrentPosition(function(pos) {{
                        document.getElementById('btn-locate').innerHTML = "📍 Ubicación encontrada";
                        var ulat = pos.coords.latitude;
                        var ulng = pos.coords.longitude;
                        
                        if (userMarker) {{
                            userMarker.setLatLng([ulat, ulng]);
                        }} else {{
                            var uIcon = L.divIcon({{
                                className: 'user-icon',
                                html: "<div style='background-color:#2196F3; width:12px; height:12px; border-radius:50%; border:3px solid white; box-shadow:0 0 5px rgba(0,0,0,0.5);'></div>",
                                iconSize: [18, 18],
                                iconAnchor: [9, 9]
                            }});
                            userMarker = L.marker([ulat, ulng], {{icon: uIcon}}).addTo(map).bindPopup("Tu ubicación");
                        }}
                        var bounds = L.latLngBounds([{lat}, {lng}], [ulat, ulng]);
                        map.fitBounds(bounds, {{padding: [20, 20]}});
                    }}, function(err) {{
                        document.getElementById('btn-locate').innerHTML = "📍 Mostrar cómo llegar desde mi ubicación";
                        document.getElementById('btn-locate').disabled = false;
                        errEl.textContent = "No pudimos acceder a tu ubicación. Igualmente podés abrir la dirección en el mapa.";
                        errEl.style.display = 'block';
                    }}, {{ enableHighAccuracy: true, timeout: 10000 }});
                }});
            </script>
            """
            
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
            <style>
                :root {{
                    --bg-main: #FCFBF7;
                    --bg-card: #FFFFFF;
                    --brand-terracotta: #D36C4F;
                    --brand-mustard: #E6A620;
                    --brand-rose: #E5A3A0;
                    --text-main: #4C433D;
                    --text-muted: #7E7771;
                    --border-color: #EFECE6;
                }}
                * {{ box-sizing: border-box; font-family: 'Inter', -apple-system, sans-serif; }}
                body {{ background: var(--bg-main); margin: 0; padding: 1rem; display: flex; justify-content: center; min-height: 100vh; }}
                .card {{ background: var(--bg-card); width: 100%; max-width: 450px; border-radius: 20px; padding: 1.5rem; box-shadow: 0 8px 30px rgba(76, 67, 61, 0.08); border: 1px solid var(--border-color); display: flex; flex-direction: column; }}
                h1 {{ color: var(--brand-terracotta); font-size: 1.5rem; font-weight: 700; margin: 0 0 0.25rem 0; }}
                .status {{ display: inline-block; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: rgba(76, 175, 80, 0.1); color: #2E7D32; margin-bottom: 1rem; }}
                .address {{ color: var(--text-main); font-size: 0.95rem; font-weight: 500; margin: 0 0 0.5rem 0; line-height: 1.4; }}
                h2 {{ color: var(--text-main); font-size: 1.1rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }}
                .logo {{ width: 120px; margin-bottom: 1rem; object-fit: contain; }}
            </style>
        </head>
        <body>
            <div class="card">
                {f'<img src="{logo_data_uri}" class="logo">' if logo_data_uri else ''}
                <h1>{org.get('name', 'Organización')}</h1>
                <span class="status">{"Activo" if org.get('status') == 'active' else "Inactivo"}</span>
                
                <p class="address">📍 {address}</p>
                {phone_html}
                
                <h2>Servicios disponibles</h2>
                {services_html}
                
                {map_script}
                {directions_btn}
            </div>
        </body>
        </html>
        """
        
        components.html(html_content, height=850, scrolling=True)
    
    st.stop()
# -----------------------------------------------

if not st.session_state.get("current_user"):
    st.markdown("""
        <style>
            #MainMenu {visibility: hidden;}
            header {visibility: hidden;}
            footer {visibility: hidden;}
            
            .stApp {
                background-color: #fbf9f6;
            }
            
            div[data-testid="column"]:nth-of-type(2) {
                background-color: #ffffff;
                padding: 3rem 2.5rem;
                border-radius: 24px;
                box-shadow: 0 8px 24px rgba(76, 67, 61, 0.08);
                border: 1px solid rgba(76, 67, 61, 0.08);
                margin-top: 2rem;
            }
            
            .stMarkdown h2 {
                display: none;
            }
            
            .logo-container {
                text-align: center;
                margin-bottom: 1.5rem;
            }
            .logo-container img {
                width: 72px;
                height: 72px;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .welcome-title {
                color: #4C433D;
                font-size: 1.75rem;
                font-weight: 800;
                text-align: center;
                margin-bottom: 0.5rem;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .welcome-subtitle {
                color: #7A706A;
                font-size: 1.05rem;
                text-align: center;
                margin-bottom: 2rem;
                line-height: 1.4;
                font-family: system-ui, -apple-system, sans-serif;
            }
            .divider {
                text-align: center;
                margin: 2rem 0 1.5rem 0;
                position: relative;
            }
            .divider::before {
                content: "";
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: rgba(76, 67, 61, 0.1);
                z-index: 1;
            }
            .divider span {
                background: #ffffff;
                padding: 0 1rem;
                color: #7A706A;
                font-size: 0.9rem;
                position: relative;
                z-index: 2;
            }
        </style>
    """, unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns([1, 1.2, 1])
    
    with col2:
        st.markdown(f"""
            <div class="logo-container">
                <img src="{logo_data_uri}" alt="COMUNITAS Logo">
            </div>
            <h1 class="welcome-title">Bienvenido a COMUNITAS</h1>
            <p class="welcome-subtitle">Conectamos personas con recursos comunitarios cercanos.</p>
        """, unsafe_allow_html=True)
        
        pending_email = st.session_state.get('pending_verification_email')
        
        if pending_email:
            st.markdown("<h3 style='text-align: center; color: #4C433D; margin-bottom: 1rem;'>Verificar tu correo</h3>", unsafe_allow_html=True)
            st.info(f"Enviamos un código de 6 dígitos a **{pending_email}**. (Por ahora revisá la consola del servidor para verlo).")
            ver_code = st.text_input("Código de verificación", max_chars=6)
            
            if st.button("Verificar", type="primary", use_container_width=True):
                from database.mongo_client import verify_user_email
                if verify_user_email(pending_email, ver_code):
                    st.session_state['verified_success_msg'] = True
                    del st.session_state['pending_verification_email']
                    st.rerun()
                else:
                    st.error("Código incorrecto.")
            
            st.markdown('<div class="divider"><span>O</span></div>', unsafe_allow_html=True)
            if st.button("Volver al inicio", type="secondary", use_container_width=True):
                del st.session_state['pending_verification_email']
                st.rerun()
                
        elif st.session_state.get('show_forgot_password'):
            st.markdown("<h3 style='text-align: center; color: #4C433D; margin-bottom: 1rem;'>Recuperar contraseña</h3>", unsafe_allow_html=True)
            
            # Etapa 1: Pedir Email
            if not st.session_state.get('recovery_email_sent'):
                st.info("Ingresá tu correo electrónico y te enviaremos un código para recuperar tu contraseña.")
                rec_email = st.text_input("Email", key="rec_email")
                
                if st.button("Enviar código", type="primary", use_container_width=True):
                    from database.mongo_client import generate_recovery_code
                    code = generate_recovery_code(rec_email)
                    if code:
                        try:
                            import smtplib
                            from email.mime.text import MIMEText
                            from email.mime.multipart import MIMEMultipart
                            
                            gmail_address = st.secrets.get("GMAIL_ADDRESS", "")
                            gmail_password = st.secrets.get("GMAIL_APP_PASSWORD", "")
                            
                            msg = MIMEMultipart()
                            msg['From'] = gmail_address
                            msg['To'] = rec_email
                            msg['Subject'] = "Código de recuperación de COMUNITAS"
                            
                            html_content = f"""
                            <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
                                <h2 style="color: #D36C4F;">Recuperación de contraseña</h2>
                                <p>Tu código de recuperación es:</p>
                                <h1 style="background: #FCFBF7; border: 1px solid #EFECE6; padding: 1rem; border-radius: 8px; color: #4C433D; letter-spacing: 5px;">{code}</h1>
                            </div>
                            """
                            msg.attach(MIMEText(html_content, 'html'))
                            
                            with smtplib.SMTP("smtp.gmail.com", 587) as server:
                                server.starttls()
                                server.login(gmail_address, gmail_password)
                                server.send_message(msg)
                                
                            st.session_state['recovery_email_sent'] = rec_email
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error al enviar el correo: {e}")
                    else:
                        st.error("No encontramos una cuenta con ese correo.")
            
            # Etapa 2: Validar Código
            elif not st.session_state.get('recovery_code_verified'):
                st.info(f"Enviamos un código a **{st.session_state['recovery_email_sent']}**.")
                rec_code = st.text_input("Código de 6 dígitos", max_chars=6)
                if st.button("Verificar código", type="primary", use_container_width=True):
                    from database.mongo_client import verify_recovery_code
                    if verify_recovery_code(st.session_state['recovery_email_sent'], rec_code):
                        st.session_state['recovery_code_verified'] = True
                        st.rerun()
                    else:
                        st.error("Código incorrecto o expirado.")
            
            # Etapa 3: Nueva Contraseña
            else:
                st.info("Ingresá tu nueva contraseña.")
                new_pass = st.text_input("Nueva contraseña", type="password")
                confirm_pass = st.text_input("Confirmar nueva contraseña", type="password")
                
                if st.button("Guardar contraseña", type="primary", use_container_width=True):
                    if len(new_pass) < 6:
                        st.error("La contraseña debe tener al menos 6 caracteres.")
                    elif new_pass != confirm_pass:
                        st.error("Las contraseñas no coinciden.")
                    else:
                        from database.mongo_client import update_password
                        update_password(st.session_state['recovery_email_sent'], new_pass)
                        st.success("¡Contraseña actualizada con éxito!")
                        # Limpiar variables de estado
                        del st.session_state['show_forgot_password']
                        del st.session_state['recovery_email_sent']
                        del st.session_state['recovery_code_verified']
                        st.rerun()
                        
            st.markdown('<div class="divider"><span>O</span></div>', unsafe_allow_html=True)
            if st.button("Volver al inicio", type="secondary", use_container_width=True):
                del st.session_state['show_forgot_password']
                if 'recovery_email_sent' in st.session_state: del st.session_state['recovery_email_sent']
                if 'recovery_code_verified' in st.session_state: del st.session_state['recovery_code_verified']
                st.rerun()

        elif not st.session_state.get('show_register', False):
            if st.session_state.get('verified_success_msg'):
                st.success("¡Correo verificado con éxito! Ya podés iniciar sesión.")
                # Lo borramos para que no aparezca siempre
                del st.session_state['verified_success_msg']
                
            email = st.text_input("Email")
            password = st.text_input("Contraseña", type="password")
            
            if st.button("Iniciar sesión", type="primary", use_container_width=True):
                from database.mongo_client import authenticate_user
                auth_data = authenticate_user(email, password)
                if auth_data:
                    if auth_data.get("email_verified", True) == False:
                        st.session_state['pending_verification_email'] = auth_data["email"]
                        st.rerun()
                    else:
                        url = st.secrets.get("SUPABASE_URL", "")
                        key = st.secrets.get("SUPABASE_KEY", "")
                        if url and key:
                            supabase = create_client(url, key)
                            res_current_user = supabase.table("view_users_public").select(
                                "user_id, full_name, email, role, created_at"
                            ).eq("user_id", auth_data["supabase_user_id"]).single().execute()
                            if res_current_user and hasattr(res_current_user, "data") and res_current_user.data:
                                st.session_state["current_user"] = {
                                    "user_id": res_current_user.data["user_id"],
                                    "full_name": res_current_user.data["full_name"],
                                    "email": res_current_user.data["email"],
                                    "role": res_current_user.data["role"],
                                    "created_at": res_current_user.data["created_at"],
                                    "supabase_user_id": res_current_user.data["user_id"]
                                }
                                st.rerun()
                else:
                    st.error("Email o contraseña incorrectos.")
                    
            if st.button("¿Olvidaste tu contraseña?", type="tertiary" if hasattr(st, "tertiary") else "secondary", use_container_width=True):
                st.session_state['show_forgot_password'] = True
                st.rerun()
                    
            st.markdown('<div class="divider"><span>¿No tenés cuenta?</span></div>', unsafe_allow_html=True)
            
            if st.button("Registrarse", type="secondary", use_container_width=True):
                st.session_state['show_register'] = True
                st.rerun()
        else:
            st.markdown("<h3 style='text-align: center; color: #4C433D; margin-bottom: 1rem;'>Crear cuenta</h3>", unsafe_allow_html=True)
            reg_name = st.text_input("Nombre completo")
            reg_email = st.text_input("Email")
            reg_password = st.text_input("Contraseña", type="password")
            reg_confirm = st.text_input("Confirmar contraseña", type="password")
            
            if st.button("Crear cuenta", type="primary", use_container_width=True):
                import re
                reg_name = reg_name.strip()
                reg_email = reg_email.strip().lower()
                
                if not reg_name:
                    st.error("El nombre completo no puede estar vacío.")
                elif not reg_email:
                    st.error("El email no puede estar vacío.")
                elif not re.match(r"[^@]+@[^@]+\.[^@]+", reg_email):
                    st.error("El formato del email es inválido.")
                elif not reg_password:
                    st.error("La contraseña no puede estar vacía.")
                elif len(reg_password) < 6:
                    st.error("La contraseña debe tener al menos 6 caracteres.")
                elif reg_password != reg_confirm:
                    st.error("Las contraseñas no coinciden.")
                else:
                    from database.mongo_client import get_user_by_email, create_user
                    
                    url = st.secrets.get("SUPABASE_URL", "")
                    service_key = st.secrets.get("SUPABASE_SERVICE_ROLE_KEY", "")
                    
                    if not url or not service_key:
                        st.error("Error de configuración de Supabase.")
                    else:
                        supabase_admin = create_client(url, service_key)
                        
                        res_supa = supabase_admin.table("users").select("user_id").eq("email", reg_email).execute()
                        if res_supa and hasattr(res_supa, "data") and len(res_supa.data) > 0:
                            st.error("Este email ya está registrado.")
                        else:
                            if get_user_by_email(reg_email):
                                st.error("Este email ya está registrado.")
                            else:
                                try:
                                    res_insert = supabase_admin.table("users").insert({
                                        "full_name": reg_name,
                                        "email": reg_email,
                                        "role": "beneficiary",
                                        "password_hash": "mongo_auth_only"
                                    }).execute()
                                    
                                    new_user_id = res_insert.data[0]["user_id"]
                                    
                                    try:
                                        import random
                                        import smtplib
                                        from email.mime.text import MIMEText
                                        from email.mime.multipart import MIMEMultipart
                                        
                                        verification_code = str(random.randint(100000, 999999))
                                        
                                        gmail_address = st.secrets.get("GMAIL_ADDRESS", "")
                                        gmail_password = st.secrets.get("GMAIL_APP_PASSWORD", "")
                                        
                                        if not gmail_address or not gmail_password:
                                            raise Exception("Falta configurar GMAIL_ADDRESS o GMAIL_APP_PASSWORD en secrets.toml")
                                            
                                        # Armar el correo
                                        msg = MIMEMultipart()
                                        msg['From'] = gmail_address
                                        msg['To'] = reg_email
                                        msg['Subject'] = "Tu código de verificación de COMUNITAS"
                                        
                                        html_content = f"""
                                        <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
                                            <h2 style="color: #D36C4F;">¡Bienvenido a COMUNITAS!</h2>
                                            <p>Para activar tu cuenta, ingresá el siguiente código de verificación:</p>
                                            <h1 style="background: #FCFBF7; border: 1px solid #EFECE6; padding: 1rem; border-radius: 8px; color: #4C433D; letter-spacing: 5px;">{verification_code}</h1>
                                            <p style="color: #7E7771; font-size: 0.9rem;">Si no solicitaste este registro, podés ignorar este correo.</p>
                                        </div>
                                        """
                                        msg.attach(MIMEText(html_content, 'html'))
                                        
                                        # Enviar usando SMTP de Gmail
                                        with smtplib.SMTP("smtp.gmail.com", 587) as server:
                                            server.starttls()
                                            server.login(gmail_address, gmail_password)
                                            server.send_message(msg)
                                        
                                        create_user(reg_email, reg_password, new_user_id, verification_code=verification_code)
                                        st.session_state['pending_verification_email'] = reg_email
                                        st.session_state['show_register'] = False
                                        st.rerun()
                                    except Exception as e:
                                        supabase_admin.table("users").delete().eq("user_id", new_user_id).execute()
                                        st.error(f"Ocurrió un error al guardar credenciales. Detalle técnico: {e}")
                                except Exception:
                                    st.error("Ocurrió un error al crear la cuenta. Por favor intentá de nuevo.")
            
            st.markdown('<div class="divider"><span>O</span></div>', unsafe_allow_html=True)
            if st.button("Ya tengo cuenta", type="secondary", use_container_width=True):
                st.session_state['show_register'] = False
                st.rerun()

    st.stop()

# Setup Supabase connection
url = st.secrets.get("SUPABASE_URL", "")
key = st.secrets.get("SUPABASE_KEY", "")
service_key = st.secrets.get("SUPABASE_SERVICE_ROLE_KEY", "")

injected_data = {}
try:
    if not url or not key:
        raise Exception("Credenciales de Supabase no encontradas.")
    supabase = create_client(url, key)
    supabase_admin = create_client(url, service_key)
    
    # Using view_map_organizations as validated
    res_home = supabase.table("view_map_organizations").select("*").execute()
    
    # Using view_services_full for Screen 2.1
    res_services = supabase.table("view_services_full").select("*").execute()
    
    # Extra views for Screen 2.2 (Detail)
    res_orgs = supabase.table("view_organizations_with_rating").select("*").execute()
    res_reviews = supabase.table("view_reviews_full").select("*").execute()
    res_needs = supabase.table("view_active_needs").select("*").execute()
    
    # Favorites
    res_favs = supabase.table("view_favorites_full").select("*").execute()
    
    # Suggested Organizations
    res_suggested_orgs = supabase.table("view_suggested_organizations_full").select("*").execute()
    res_suggested_services = supabase.table("view_suggested_services_full").select("*").execute()
    
    # Tags
    res_tags = supabase_admin.table("tags").select("*").execute()
    
    # Service Types
    res_service_types = supabase_admin.table("service_types").select("*").execute()
    
    # Organization Members (may be blocked by RLS)
    res_members = None
    try:
        res_members = supabase.table("organization_members").select("*").execute()
    except Exception:
        pass
        
    # Users (safe fields only)
    res_users = None
    try:
        res_users = supabase.table("view_users_public").select("user_id, full_name, email, role, created_at").execute()
    except Exception as e:
        print(f"Error fetching users: {e}")
        pass

    # View Organization Members Full
    res_members_full = None
    try:
        res_members_full = supabase.table("view_organization_members_full").select("*").execute()
    except Exception:
        pass
    
    injected_data = {
        "status": "success",
        "current_user": st.session_state.get("current_user"),
        "logout_signal": st.session_state.pop("logout_signal", False),
        "data": res_home.data,
        "services_full": res_services.data,
        "organizations_with_rating": res_orgs.data,
        "reviews_full": res_reviews.data,
        "active_needs": res_needs.data,
        "favorites_full": res_favs.data,
        "tags": res_tags.data,
        "service_types": res_service_types.data,
        "org_members": res_members.data if res_members else None,
        "users": res_users.data if res_users and hasattr(res_users, 'data') and res_users.data else [],
        "organization_members_full": res_members_full.data if res_members_full else None,
        "suggested_organizations_full": res_suggested_orgs.data,
        "suggested_services_full": res_suggested_services.data,
        "credentials": {
            "url": url,
            "anon_key": key
        }
    }
except Exception as e:
    injected_data = {
        "status": "error",
        "message": str(e),
        "current_user": st.session_state.get("current_user"),
        "logout_signal": st.session_state.pop("logout_signal", False),
        "data": None,
        "services_full": None,
        "organizations_with_rating": None,
        "reviews_full": None,
        "active_needs": None,
        "favorites_full": None,
        "tags": None,
        "service_types": None,
        "org_members": None,
        "users": [],
        "organization_members_full": None,
        "suggested_organizations_full": None,
        "suggested_services_full": None,
        "credentials": None
    }

html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

css_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "style.css")
with open(css_path, "r", encoding="utf-8") as f:
    css_content = f.read()

js_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.js")
with open(js_path, "r", encoding="utf-8") as f:
    js_content = f.read()

# Replace external local links with inline and base64
html_content = html_content.replace('<link rel="stylesheet" href="style.css?v=3">', '')
html_content = html_content.replace('<script src="app.js?v=3"></script>', '')
html_content = html_content.replace('src="assets/logo_comunitas.png"', f'src="{logo_data_uri}"')

# Inject the payload and the inline scripts/styles
injection = f"""
<style>{css_content}</style>
<script>
    window.INJECTED_DATA = {json.dumps(injected_data)};
</script>
<script>{js_content}</script>
<style>
    /* Override: reduce .main-content padding-top inside Streamlit iframe
       In the native browser, 3.5rem top padding is fine because the browser
       has a full viewport. Inside the iframe, this padding creates a visible
       white gap. We reduce it to 1.5rem to match the visual result. */
    .main-content {{
        padding-top: 1.5rem !important;
    }}
</style>
"""
html_content = html_content.replace("<head>", f"<head>\n{injection}")

# Strip Streamlit default padding
st.markdown("""
    <style>
        /* Ocultar el header superior de Streamlit (menú, deploy, etc) */
        header { 
            display: none !important; 
            height: 0px !important;
            padding: 0px !important;
            margin: 0px !important;
        }
        
        /* Eliminar el padding del contenedor principal y sus envoltorios */
        .block-container,
        .stMainBlockContainer,
        .stAppViewBlockContainer,
        div[data-testid="stAppViewBlockContainer"],
        div[data-testid="stAppViewContainer"] > section > div > div {
            padding-top: 0rem !important;
            padding-bottom: 0rem !important;
            padding-left: 0rem !important;
            padding-right: 0rem !important;
            margin-top: 0rem !important;
            max-width: 100% !important;
        }

        /* Eliminar márgenes del componente iframe/html de Streamlit */
        div[data-testid="stHtml"],
        div[data-testid="element-container"] {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
        }

        /* Asegurar que el iframe no tenga márgenes */
        iframe {
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
        }
    </style>
""", unsafe_allow_html=True)

current_user = st.session_state.get("current_user")

if current_user:
    col1, col2 = st.columns([4, 1])
    with col1:
        st.caption(f"Sesión iniciada como: {current_user.get('full_name', 'Usuario')}")
    with col2:
        if st.button("Cerrar sesión"):
            st.session_state.pop("current_user", None)
            st.session_state["logout_signal"] = True
            st.rerun()

    # Logica de Organización
    url = st.secrets.get("SUPABASE_URL", "")
    service_key = st.secrets.get("SUPABASE_SERVICE_ROLE_KEY", "")
    
    if url and service_key:
        supabase_admin = create_client(url, service_key)
        current_uid = current_user.get("supabase_user_id")
        
        # Consultar organization_members
        res_mem = supabase_admin.table("organization_members").select("*").eq("user_id", current_uid).execute()
        
        if res_mem and hasattr(res_mem, "data"):
            active_memberships = [m for m in res_mem.data if m.get("is_active")]
            has_any_membership = len(res_mem.data) > 0
            
            # Bloqueo o visualización
            if not has_any_membership:
                st.warning("No estás vinculado a ninguna organización.\n\nSi pertenecés a una organización, comunicate con ellos para que te agreguen. Si tu organización es nueva y no tiene miembros, contactate con el equipo de COMUNITAS (comunitas.admin@gmail.com).")
            elif len(active_memberships) == 0:
                st.warning("Tu acceso a esta organización no está activo.\n\nSi creés que es un error, comunicate con el equipo administrador de COMUNITAS.")
            else:
                # El usuario tiene membresía activa. Tomamos la primera.
                my_org_id = active_memberships[0]["org_id"]
                
                with st.expander("🛠️ Panel de Administración de Miembros (Mi Organización)", expanded=False):
                    st.markdown("### Miembros Actuales")
                    org_members_res = supabase_admin.table("organization_members").select("*, users(full_name, email)").eq("org_id", my_org_id).execute()
                    
                    if org_members_res and hasattr(org_members_res, "data"):
                        active_count = sum(1 for m in org_members_res.data if m.get("is_active"))
                        
                        for member in org_members_res.data:
                            u_data = member.get("users") or {}
                            name = u_data.get("full_name", "Desconocido")
                            email = u_data.get("email", "")
                            status = "Activo" if member.get("is_active") else "Inactivo"
                            
                            mc1, mc2, mc3 = st.columns([3, 1, 2])
                            mc1.write(f"**{name}** ({email})")
                            mc2.write(status)
                            
                            if member.get("is_active"):
                                if mc3.button("Quitar acceso", key=f"rem_{member['user_id']}"):
                                    if member['user_id'] == current_uid:
                                        st.error("No podés quitarte el acceso a vos mismo.")
                                    elif active_count <= 1:
                                        st.error("No podés dejar la organización sin miembros activos.")
                                    else:
                                        supabase_admin.table("organization_members").update({"is_active": False}).eq("user_id", member['user_id']).eq("org_id", my_org_id).execute()
                                        st.success("Acceso removido correctamente.")
                                        st.rerun()
                                        
                    st.markdown("---")
                    st.markdown("### Agregar / Reactivar Miembro")
                    
                    with st.form("add_member_form"):
                        new_member_email = st.text_input("Email del usuario registrado")
                        submit_add = st.form_submit_button("Agregar Miembro", type="primary")
                        
                        if submit_add:
                            import re
                            email_norm = new_member_email.strip().lower()
                            
                            if not email_norm or not re.match(r"[^@]+@[^@]+\.[^@]+", email_norm):
                                st.error("Formato de email inválido.")
                            else:
                                target_res = supabase_admin.table("users").select("user_id").eq("email", email_norm).execute()
                                if not target_res or not target_res.data:
                                    st.error("No encontramos un usuario registrado con ese email. Primero debe crear una cuenta en COMUNITAS.")
                                else:
                                    target_uid = target_res.data[0]["user_id"]
                                    target_mems = supabase_admin.table("organization_members").select("*").eq("user_id", target_uid).execute()
                                    
                                    if target_mems and hasattr(target_mems, "data"):
                                        target_active_in_same = any(m for m in target_mems.data if m.get("org_id") == my_org_id and m.get("is_active"))
                                        target_inactive_in_same = next((m for m in target_mems.data if m.get("org_id") == my_org_id and not m.get("is_active")), None)
                                        target_active_in_other = any(m for m in target_mems.data if m.get("org_id") != my_org_id and m.get("is_active"))
                                        
                                        if target_active_in_same:
                                            st.error("El usuario ya es miembro activo de esta organización.")
                                        elif target_active_in_other:
                                            st.error("El usuario ya es miembro activo de otra organización.")
                                        elif target_inactive_in_same:
                                            supabase_admin.table("organization_members").update({"is_active": True}).eq("user_id", target_uid).eq("org_id", my_org_id).execute()
                                            st.success("Miembro reactivado correctamente.")
                                            st.rerun()
                                        else:
                                            supabase_admin.table("organization_members").insert({
                                                "user_id": target_uid,
                                                "org_id": my_org_id,
                                                "member_role": "voluntario",
                                                "is_active": True
                                            }).execute()
                                            st.success("Miembro agregado correctamente.")
                                            st.rerun()

        with st.expander("🔒 Seguridad (Cambiar Contraseña)", expanded=False):
            st.markdown("### Cambiar mi contraseña")
            with st.form("change_password_form"):
                current_pass = st.text_input("Contraseña actual", type="password")
                new_pass = st.text_input("Nueva contraseña", type="password")
                confirm_new_pass = st.text_input("Confirmar nueva contraseña", type="password")
                submit_pwd = st.form_submit_button("Cambiar Contraseña", type="primary")
                
                if submit_pwd:
                    from database.mongo_client import authenticate_user, update_password
                    # Verificamos si la actual es correcta
                    auth_check = authenticate_user(current_user["email"], current_pass)
                    
                    if not auth_check:
                        st.error("La contraseña actual es incorrecta.")
                    elif len(new_pass) < 6:
                        st.error("La nueva contraseña debe tener al menos 6 caracteres.")
                    elif new_pass != confirm_new_pass:
                        st.error("Las nuevas contraseñas no coinciden.")
                    else:
                        update_password(current_user["email"], new_pass)
                        st.success("¡Contraseña actualizada con éxito!")

        components.html(html_content, height=1000, scrolling=True)
