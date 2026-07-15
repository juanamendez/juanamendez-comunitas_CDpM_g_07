from pymongo import MongoClient
import streamlit as st
import bcrypt

def get_mongo_client():
    return MongoClient(st.secrets["mongodb"]["uri"])

def get_users_collection():
    client = get_mongo_client()
    db = client[st.secrets["mongodb"]["database"]]
    return db[st.secrets["mongodb"]["users_collection"]]

def get_user_by_email(email):
    collection = get_users_collection()
    return collection.find_one({"email": email})

def create_user(email, password, supabase_user_id):
    hash_val = hash_password(password)
    collection = get_users_collection()
    collection.insert_one({
        "email": email,
        "password_hash": hash_val,
        "supabase_user_id": supabase_user_id
    })

def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), password_hash.encode('utf-8'))

def authenticate_user(email, password):
    user = get_user_by_email(email)

    if not user:
        return None

    if "password_hash" in user:
        if not verify_password(password, user["password_hash"]):
            return None
    elif "password" in user:
        if user["password"] != password:
            return None
            
        new_hash = hash_password(password)
        collection = get_users_collection()
        collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password_hash": new_hash},
                "$unset": {"password": ""}
            }
        )
    else:
        return None

    # Remove any sensitive data from the returned dict just in case
    user.pop("password", None)
    user.pop("password_hash", None)

    return {
        "email": user.get("email"),
        "supabase_user_id": user.get("supabase_user_id")
    }
