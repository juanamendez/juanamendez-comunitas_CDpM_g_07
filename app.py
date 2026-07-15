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

# --- Ficha Pública Web Interception ---
share_org_id = st.query_params.get("share_org")
if share_org_id:
    st.markdown("""
        <style>
            #MainMenu {visibility: hidden;}
            header {visibility: hidden;}
            footer {visibility: hidden;}
            .stApp { background-color: #fbf9f6; }
            .block-container { padding-top: 0 !important; padding-bottom: 0 !important; max-width: 100% !important; }
        </style>
    """, unsafe_allow_html=True)
    
    url = st.secrets.get("SUPABASE_URL", "")
    key = st.secrets.get("SUPABASE_KEY", "")
    
    if url and key:
        try:
            supabase = create_client(url, key)
            
            # Fetch Org Data
            org_res = supabase.table("view_organizations_public").select("*").eq("org_id", int(share_org_id)).execute()
            
            if org_res.data and len(org_res.data) > 0:
                org_data = org_res.data[0]
                name = org_data.get("name", "Organización")
                address = org_data.get("address", "Dirección no disponible")
                phone = org_data.get("phone", "")
                lat = org_data.get("latitude")
                lng = org_data.get("longitude")
                
                # Fetch Services
                srv_res = supabase.table("view_services_full").select("*").eq("org_id", int(share_org_id)).execute()
                
                services_names = []
                scheds_html = ""
                
                if srv_res.data:
                    active_srvs = [s for s in srv_res.data if s.get("service_status") in ["active", "full"] or s.get("status") in ["active", "full"]]
                    for s in active_srvs:
                        s_name = s.get("service_type") or s.get("type_name") or s.get("title") or "Servicio"
                        services_names.append(s_name)
                        sched = s.get("schedule")
                        if sched:
                            scheds_html += f'<div class="sched-item"><strong>{s_name}:</strong> {sched}</div>'
                
                services_list = ", ".join(services_names) if services_names else "Sin servicios informados"
                if not scheds_html:
                    scheds_html = '<div style="color:#827B75;">Horario no informado</div>'
                
                phone_html = ""
                if phone:
                    phone_html = f'''
                    <div class="info-row">
                        <div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                        <div style="font-size:16px;">{phone}</div>
                    </div>
                    '''
                
                map_html = ""
                maps_btn = ""
                has_coords = "false"
                if lat and lng:
                    has_coords = "true"
                    map_html = '<div id="map"></div>'
                    maps_url = f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"
                    maps_btn = f'''
                    <a href="{maps_url}" target="_blank" class="btn">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:-4px;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                        Cómo llegar
                    </a>
                    '''
                
                from public_card_template import PUBLIC_CARD_HTML
                
                final_html = PUBLIC_CARD_HTML.format(
                    name=name,
                    address=address,
                    phone_html=phone_html,
                    services_list=services_list,
                    schedules_html=scheds_html,
                    map_html=map_html,
                    maps_btn=maps_btn,
                    has_coords=has_coords,
                    lat=lat or 0,
                    lng=lng or 0
                )
                
                components.html(final_html, height=800, scrolling=True)
            else:
                st.warning("Organización no encontrada.")
        except Exception as e:
            st.error(f"Error cargando ficha: {e}")
    else:
        st.error("Error de configuración.")
        
    st.stop()
# ----------------------------------------

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
        
        if not st.session_state.get('show_register', False):
            email = st.text_input("Email")
            password = st.text_input("Contraseña", type="password")
            
            if st.button("Iniciar sesión", type="primary", use_container_width=True):
                from database.mongo_client import authenticate_user
                auth_data = authenticate_user(email, password)
                if auth_data:
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
                                        create_user(reg_email, reg_password, new_user_id)
                                        st.success("Cuenta creada correctamente. Ahora podés iniciar sesión.")
                                        st.session_state['show_register'] = False
                                    except Exception:
                                        supabase_admin.table("users").delete().eq("user_id", new_user_id).execute()
                                        st.error("Ocurrió un error al guardar credenciales. Por favor intentá de nuevo.")
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
                st.warning("No estás vinculado a ninguna organización.\\nSi pertenecés a una, comunicate con el equipo administrador de COMUNITAS para solicitar acceso.")
            elif len(active_memberships) == 0:
                st.warning("Tu acceso a esta organización no está activo.\\nSi creés que es un error, comunicate con el equipo administrador de COMUNITAS.")
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

        components.html(html_content, height=1000, scrolling=True)
