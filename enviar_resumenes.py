import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from supabase import create_client, Client

def send_newsletters():
    # 1. Obtener secretos de variables de entorno (proveídas por GitHub Actions)
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    gmail_address = os.environ.get("GMAIL_ADDRESS")
    gmail_password = os.environ.get("GMAIL_APP_PASSWORD")

    if not all([supabase_url, supabase_key, gmail_address, gmail_password]):
        print("Error: Faltan variables de entorno para ejecutar el script.")
        return

    # 2. Conectar a Supabase
    supabase: Client = create_client(supabase_url, supabase_key)

    # 3. Calcular la fecha de hace 7 días
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

    # 4. Obtener a todos los usuarios
    print("Obteniendo usuarios...")
    res_users = supabase.table("users").select("user_id, email, full_name").execute()
    if not res_users.data:
        print("No hay usuarios registrados.")
        return
    
    users = res_users.data

    # Configurar la conexión SMTP de Gmail de forma global
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(gmail_address, gmail_password)
        print("Conexión exitosa a Gmail.")
    except Exception as e:
        print(f"Error conectando a Gmail: {e}")
        return

    emails_sent = 0

    # 5. Iterar sobre los usuarios
    for user in users:
        user_id = user["user_id"]
        user_email = user["email"]
        user_name = user.get("full_name", "Usuario").split()[0] # Primer nombre

        # Obtener los favoritos de este usuario
        res_favs = supabase.table("view_favorites_full").select("org_id, organization_name").eq("user_id", user_id).execute()
        
        if not res_favs.data:
            continue # Si no tiene favoritos, no le enviamos resumen

        org_updates_html = ""

        # Revisar cada organización favorita
        for fav in res_favs.data:
            org_id = fav["org_id"]
            org_name = fav["organization_name"]

            # Buscar nuevas necesidades en los últimos 7 días
            res_needs = supabase.table("organization_needs").select("title").eq("org_id", org_id).gte("created_at", seven_days_ago).execute()
            new_needs = res_needs.data if res_needs.data else []

            # Buscar nuevas reseñas en los últimos 7 días
            res_reviews = supabase.table("reviews").select("rating").eq("org_id", org_id).gte("created_at", seven_days_ago).execute()
            new_reviews = res_reviews.data if res_reviews.data else []

            if len(new_needs) > 0 or len(new_reviews) > 0:
                # Hubo novedades en esta organización
                org_updates_html += f"""
                <div style="background: #FCFBF7; border: 1px solid #EFECE6; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; text-align: left;">
                    <h3 style="color: #4C433D; margin-top: 0; margin-bottom: 0.5rem; border-bottom: 2px solid #D36C4F; display: inline-block; padding-bottom: 4px;">{org_name}</h3>
                """
                
                if len(new_needs) > 0:
                    org_updates_html += f'<p style="color: #4C433D; margin: 0.5rem 0;">📌 Han publicado <strong>{len(new_needs)} nueva(s) necesidad(es)</strong> esta semana.</p>'
                
                if len(new_reviews) > 0:
                    avg_rating = sum([r["rating"] for r in new_reviews]) / len(new_reviews)
                    org_updates_html += f'<p style="color: #4C433D; margin: 0.5rem 0;">⭐ Recibieron <strong>{len(new_reviews)} nueva(s) reseña(s)</strong> (Promedio: {avg_rating:.1f}/5.0).</p>'
                
                org_updates_html += "</div>"

        # Si encontramos al menos una novedad, enviamos el mail a este usuario
        if org_updates_html != "":
            print(f"Enviando resumen a {user_email}...")
            
            msg = MIMEMultipart()
            msg['From'] = gmail_address
            msg['To'] = user_email
            msg['Subject'] = "Tu resumen semanal de COMUNITAS"
            
            html_content = f"""
            <div style="font-family: sans-serif; text-align: center; padding: 2rem; background-color: #FAFAFA;">
                <div style="max-width: 600px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <h2 style="color: #D36C4F; margin-top: 0;">¡Hola {user_name}! 👋</h2>
                    <p style="color: #7E7771; font-size: 1.1rem; margin-bottom: 2rem;">Acá tenés el resumen de lo que pasó esta semana en las organizaciones que guardaste en favoritos.</p>
                    
                    {org_updates_html}
                    
                    <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #EFECE6;">
                        <a href="https://comunitas.streamlit.app" style="display: inline-block; background-color: #D36C4F; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">Ir a COMUNITAS</a>
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
    print(f"Proceso finalizado. Se enviaron {emails_sent} resúmenes semanales.")

if __name__ == "__main__":
    send_newsletters()
