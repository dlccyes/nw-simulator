from pymongo import MongoClient
from bson.objectid import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

# Get MongoDB connection string from environment variable
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
client = MongoClient(MONGODB_URI)
db = client.fire_calculator
profiles = db.profiles

def save_profile(name, config):
    """Save a new profile configuration"""
    profile = {
        'name': name,
        'config': config
    }
    result = profiles.insert_one(profile)
    return str(result.inserted_id)

def get_profiles():
    """Get all saved profiles"""
    return list(profiles.find({}, {'_id': 1, 'name': 1}))

def get_profile(profile_id):
    """Get a specific profile by ID"""
    profile = profiles.find_one({'_id': ObjectId(profile_id)})
    if profile:
        profile['_id'] = str(profile['_id'])
    return profile

def delete_profile(profile_id):
    """Delete a profile by ID"""
    result = profiles.delete_one({'_id': ObjectId(profile_id)})
    return result.deleted_count > 0 