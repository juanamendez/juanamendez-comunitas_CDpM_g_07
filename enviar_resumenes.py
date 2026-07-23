import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from supabase import create_client, Client

def send_newsletters():
    # 1. Obtener secretos de variables de entorno (proveídas por GitHub Actions o entorno local)
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    gmail_address = os.environ.get("GMAIL_ADDRESS")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")

    # Fallback a local secrets si no estamos en GitHub Actions (para testing manual local)
    if not supabase_url:
        import toml
        try:
            secrets = toml.load('.streamlit/secrets.toml')
            supabase_url = secrets['SUPABASE_URL']
            supabase_key = secrets['SUPABASE_SERVICE_ROLE_KEY']
            gmail_address = secrets['GMAIL_ADDRESS']
            gmail_password = secrets['GMAIL_APP_PASSWORD']
        except Exception:
            pass

    if not all([supabase_url, supabase_key, gmail_address, gmail_password]):
        print("Error: Faltan variables de entorno para ejecutar el script.")
        return

    # 2. Conectar a Supabase
    supabase: Client = create_client(supabase_url, supabase_key)

    # 3. Obtener a los usuarios suscritos al newsletter
    print("Obteniendo usuarios suscritos...")
    res_users = supabase.table("users").select("user_id, email, full_name").eq("wants_newsletter", True).execute()
    if not res_users.data:
        print("No hay usuarios registrados.")
        return
    
    users = res_users.data

    # Configurar la conexión SMTP de Gmail
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail_address, gmail_password)
        print("Conexión exitosa a Gmail.")
    except Exception as e:
        print(f"Error conectando a Gmail: {e}")
        return

    # Módulo Global: Obtener las 3 organizaciones más recientes agregadas a la plataforma
    res_new_orgs = supabase.table("organizations").select("name").order("created_at", desc=True).limit(3).execute()
    global_orgs_html = ""
    if res_new_orgs.data:
        orgs_list = "".join([f"<li style='margin-bottom: 5px; color: #4C433D;'>✨ {o['name']}</li>" for o in res_new_orgs.data])
        global_orgs_html = f"""
        <div style="background: #E8F3F1; border: 1px solid #CDE5E0; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; text-align: left;">
            <h3 style="color: #2D6A5F; margin-top: 0; margin-bottom: 1rem;">Nuevas organizaciones en la red</h3>
            <p style="color: #4C433D; margin-top: 0;">Le damos la bienvenida a la plataforma a:</p>
            <ul style="padding-left: 20px; margin: 0;">
                {orgs_list}
            </ul>
        </div>
        """

    emails_sent = 0

    # 5. Iterar sobre los usuarios
    for user in users:
        user_id = user["user_id"]
        user_email = user["email"]
        user_name = user.get("full_name", "Usuario").split()[0] # Primer nombre

        # Obtener los favoritos de este usuario
        res_favs = supabase.table("view_favorites_full").select("org_id, organization_name").eq("user_id", user_id).execute()
        
        # Si no tiene favoritos pero queremos mandar igual por las orgs globales, descomentar la siguiente validación.
        # Por ahora enviamos a todos para el demo.
        org_updates_html = ""

        if res_favs.data:
            # Revisar cada organización favorita
            for fav in res_favs.data:
                org_id = fav["org_id"]
                org_name = fav["organization_name"]

                # Obtener Top 3 Necesidades
                res_needs = supabase.table("organization_needs").select("title").eq("org_id", org_id).order("created_at", desc=True).limit(3).execute()
                new_needs = res_needs.data if res_needs.data else []

                # Obtener Top 3 Servicios
                res_services = supabase.table("services").select("title").eq("org_id", org_id).order("created_at", desc=True).limit(3).execute()
                new_services = res_services.data if res_services.data else []

                # Obtener Top 3 Miembros (nuevos ingresos)
                res_members = supabase.table("organization_members").select("users(full_name)").eq("org_id", org_id).order("joined_at", desc=True).limit(3).execute()
                new_members = res_members.data if res_members.data else []

                # Obtener Top 3 Reseñas
                res_reviews = supabase.table("reviews").select("rating").eq("org_id", org_id).order("created_at", desc=True).limit(3).execute()
                new_reviews = res_reviews.data if res_reviews.data else []

                has_activity = any(len(x) > 0 for x in [new_needs, new_services, new_members, new_reviews])

                if has_activity:
                    org_updates_html += f"""
                    <div style="background: #FCFBF7; border: 1px solid #EFECE6; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: left;">
                        <h3 style="color: #D36C4F; margin-top: 0; margin-bottom: 1rem; border-bottom: 2px solid #EFECE6; padding-bottom: 8px;">{org_name}</h3>
                    """
                    
                    if len(new_needs) > 0:
                        needs_str = ", ".join([f"<strong>{n['title']}</strong>" for n in new_needs])
                        org_updates_html += f'<p style="color: #4C433D; margin: 0.5rem 0; font-size: 0.95rem;">📌 <strong>Necesidades activas:</strong> {needs_str}</p>'
                    
                    if len(new_services) > 0:
                        serv_str = ", ".join([f"<strong>{s['title']}</strong>" for s in new_services])
                        org_updates_html += f'<p style="color: #4C433D; margin: 0.5rem 0; font-size: 0.95rem;">💼 <strong>Servicios destacados:</strong> {serv_str}</p>'

                    if len(new_members) > 0:
                        m_str = ", ".join([f"<strong>{m['users']['full_name']}</strong>" for m in new_members if m.get('users')])
                        if m_str:
                            org_updates_html += f'<p style="color: #4C433D; margin: 0.5rem 0; font-size: 0.95rem;">🤝 <strong>Voluntarios destacados:</strong> {m_str}</p>'

                    if len(new_reviews) > 0:
                        org_updates_html += f'<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px dashed #EFECE6;">'
                        org_updates_html += f'<p style="color: #7E7771; font-size: 0.9rem; margin-top: 0; margin-bottom: 0.5rem;"><strong>Calificaciones destacadas:</strong></p>'
                        for r in new_reviews:
                            stars = "⭐" * int(r['rating'])
                            org_updates_html += f'<p style="margin: 0.2rem 0; font-size: 0.9rem; color: #4C433D;">{stars}</p>'
                        org_updates_html += '</div>'
                    
                    org_updates_html += "</div>"

        # Armamos el contenido total del correo
        # Si no hay orgs favoritas con actualizaciones, le mandamos al menos el módulo global de nuevas orgs.
        final_content = global_orgs_html + (f"""
        <h3 style="color: #4C433D; border-bottom: 2px solid #D36C4F; display: inline-block; padding-bottom: 4px; margin-bottom: 1.5rem; text-align: left; width: 100%;">Novedades en tus Favoritos</h3>
        {org_updates_html}
        """ if org_updates_html != "" else "<p style='color: #7E7771; text-align: left;'>Tus organizaciones favoritas no han tenido actividad reciente.</p>")
        
        print(f"Enviando resumen a {user_email}...")
        
        msg = MIMEMultipart()
        msg['From'] = gmail_address
        msg['To'] = user_email
        msg['Subject'] = "Tu Resumen de Impacto en COMUNITAS 🚀"
        
        html_content = f"""
        <div style="font-family: sans-serif; text-align: center; padding: 2rem; background-color: #FAFAFA;">
            <div style="max-width: 650px; margin: 0 auto; background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <h2 style="color: #D36C4F; margin-top: 0; font-size: 1.8rem;">¡Hola {user_name}! 👋</h2>
                <p style="color: #7E7771; font-size: 1.1rem; margin-bottom: 2rem;">Acá tenés tu reporte con lo más destacado de COMUNITAS.</p>
                
                {final_content}
                
                <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #EFECE6;">
                    <a href="https://comunitas.streamlit.app" style="display: inline-block; background-color: #D36C4F; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 1.1rem;">Visitar COMUNITAS</a>
                </div>
            </div>
        </div>
        """
        
        msg.attach(MIMEText(html_content, 'html'))
        
        try:
            server.send_message(msg)
            emails_sent += 1
        except Exception as e:
            print(f"Error al enviar a {user_email}: {e}")

    server.quit()
    print(f"Proceso finalizado. Se enviaron {emails_sent} correos de demostración.")

if __name__ == "__main__":
    send_newsletters()
