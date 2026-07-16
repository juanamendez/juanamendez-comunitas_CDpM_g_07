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

def create_user(email, password, supabase_user_id, verification_code=None):
    hash_val = hash_password(password)
    collection = get_users_collection()
    
    doc = {
        "email": email,
        "password_hash": hash_val,
        "supabase_user_id": supabase_user_id
    }
    
    if verification_code:
        doc["email_verified"] = False
        doc["verification_code"] = verification_code
        
    collection.insert_one(doc)

def verify_user_email(email, code):
    collection = get_users_collection()
    user = collection.find_one({"email": email})
    if not user:
        return False
    
    if user.get("verification_code") == code:
        collection.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"email_verified": True},
                "$unset": {"verification_code": ""}
            }
        )
        return True
    return False

def generate_recovery_code(email):
    import random
    collection = get_users_collection()
    user = collection.find_one({"email": email})
    if not user:
        return None
        
    code = str(random.randint(100000, 999999))
    collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"recovery_code": code}}
    )
    return code

def verify_recovery_code(email, code):
    collection = get_users_collection()
    user = collection.find_one({"email": email})
    if not user:
        return False
    
    return user.get("recovery_code") == code

def update_password(email, new_password):
    hash_val = hash_password(new_password)
    collection = get_users_collection()
    
    collection.update_one(
        {"email": email},
        {
            "$set": {"password_hash": hash_val},
            "$unset": {"recovery_code": ""}
        }
    )
    return True

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
    
    # We pass the verified status (defaults to True for old users)
    is_verified = user.get("email_verified", True)

    return {
        "email": user.get("email"),
        "supabase_user_id": user.get("supabase_user_id"),
        "email_verified": is_verified
    }
