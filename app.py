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
            st.info("El registro estará disponible próximamente.\\n\\nPróximamente vas a poder crear una cuenta e indicar si sos beneficiario, colaborador o miembro de una organización.")
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

components.html(html_content, height=1000, scrolling=True)
