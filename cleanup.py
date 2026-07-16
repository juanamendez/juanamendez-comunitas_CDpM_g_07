import os
import toml
from supabase import create_client

def cleanup():
    # Cargar secretos locales
    secrets = toml.load('.streamlit/secrets.toml')
    
    # Supabase
    supabase = create_client(secrets['SUPABASE_URL'], secrets['SUPABASE_SERVICE_ROLE_KEY'])
    
    # Buscar todos los que terminan en @example.com en Supabase
    users_supa = supabase.table('users').select('*').like('email', '%@example.com').execute()
    
    deleted_count_supa = 0
    for u in users_supa.data:
        print(f"Eliminando {u['email']} de Supabase...")
        # Primero eliminamos sus dependencias si es necesario (favoritos, miembros, etc)
        supabase.table("favorites").delete().eq("user_id", u["user_id"]).execute()
        supabase.table("organization_members").delete().eq("user_id", u["user_id"]).execute()
        # Ahora el usuario
        supabase.table("users").delete().eq("user_id", u["user_id"]).execute()
        deleted_count_supa += 1

    # Mongo
    try:
        from pymongo import MongoClient
        client = MongoClient(secrets["MONGO_URI"])
        db = client[secrets.get("MONGO_DB_NAME", "comunitas")]
        res_mongo = db.users.delete_many({"email": {"$regex": "@example\\.com$"}})
        print(f"Eliminados {res_mongo.deleted_count} usuarios falsos de MongoDB.")
    except Exception as e:
        print(f"No se pudo limpiar Mongo: {e}")

    print(f"Limpieza finalizada. Eliminados de Supabase: {deleted_count_supa}")

if __name__ == '__main__':
    cleanup()
