import streamlit as st
import streamlit.components.v1 as components
from supabase import create_client
import json
import threading
import http.server
import socketserver
import socket
import os

st.set_page_config(page_title="COMUNITAS", layout="wide", initial_sidebar_state="collapsed")

@st.cache_resource
def start_static_server():
    # Start a background HTTP server so we can serve local assets without Base64 
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self, format, *args):
            pass # Suppress logging
    
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("", 0))
    port = s.getsockname()[1]
    s.close()
    
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", port), CustomHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return port

port = start_static_server()

# Setup Supabase connection
url = st.secrets.get("SUPABASE_URL", "")
key = st.secrets.get("SUPABASE_KEY", "")

injected_data = {}
try:
    if not url or not key:
        raise Exception("Credenciales de Supabase no encontradas.")
    supabase = create_client(url, key)
    # Using view_map_organizations as validated, it provides service_types, average_rating, total_reviews
    res = supabase.table("view_map_organizations").select("*").execute()
    injected_data = {
        "status": "success",
        "data": res.data
    }
except Exception as e:
    injected_data = {
        "status": "error",
        "message": str(e),
        "data": None
    }

html_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html")
with open(html_path, "r", encoding="utf-8") as f:
    html_content = f.read()

# Inject the payload and base tag for local asset fetching
injection = f"""
<base href="http://localhost:{port}/">
<script>
    window.INJECTED_DATA = {json.dumps(injected_data)};
</script>
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

components.html(html_content, height=1000, scrolling=True)
