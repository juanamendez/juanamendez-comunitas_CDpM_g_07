from pymongo import MongoClient
import streamlit as st

def get_mongo_client():
    return MongoClient(st.secrets["mongodb"]["uri"])

def get_users_collection():
    client = get_mongo_client()
    db = client[st.secrets["mongodb"]["database"]]
    return db[st.secrets["mongodb"]["users_collection"]]

def get_user_by_email(email):
    collection = get_users_collection()
    return collection.find_one({"email": email})

def authenticate_user(email, password):
    user = get_user_by_email(email)

    if not user:
        return None

    # PROTOTIPO: login simple para demo. En producción usar hash seguro de contraseñas.
    if user.get("password") != password:
        return None

    return {
        "email": user.get("email"),
        "supabase_user_id": user.get("supabase_user_id")
    }
