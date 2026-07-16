import toml
from supabase import create_client
from pymongo import MongoClient

secrets = toml.load('.streamlit/secrets.toml')

# Supabase
supabase = create_client(secrets['SUPABASE_URL'], secrets['SUPABASE_SERVICE_ROLE_KEY'])
res_supa = supabase.table('users').update({'email': 'comunitas.admin@gmail.com'}).eq('email', 'admin@comunitas.com').execute()
print('Supabase update count:', len(res_supa.data))

# MongoDB
mongo_uri = secrets['mongodb']['uri']
client = MongoClient(mongo_uri)
db = client[secrets['mongodb']['database']]
col = db[secrets['mongodb']['users_collection']]

res_mongo = col.update_one({'email': 'admin@comunitas.com'}, {'$set': {'email': 'comunitas.admin@gmail.com'}})
print('Mongo update count:', res_mongo.modified_count)
