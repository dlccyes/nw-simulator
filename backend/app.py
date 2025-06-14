from flask import Flask, request, jsonify, g
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from api.calculator import calculate_fire_projection
from api.tax import calculate_tax
import logging
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",  # Local development
    "https://www.derricklin.net",  # Production domain
    "https://derricklin.net",  # Root domain
    "https://nw.derricklin.net"  # Subdomain
], max_age=3600)

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client.fire_calculator
profiles = db.profiles

@app.before_request
def before_request():
    g.start_time = time.time()
    logger.info(f'Received {request.method} request to {request.path}')

@app.after_request
def after_request(response):
    duration = time.time() - g.start_time
    logger.info(f'Completed {request.method} request to {request.path} in {duration:.2f}s with status {response.status_code}')
    return response

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    try:
        result = calculate_fire_projection(data)
        return jsonify(result)
    except Exception as e:
        logger.error(f'Calculate request failed: {str(e)}')
        return jsonify({'error': str(e)}), 400

@app.route('/api/tax', methods=['POST'])
def tax():
    data = request.json
    try:
        result = calculate_tax(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles', methods=['GET'])
def list_profiles():
    try:
        profiles_list = list(profiles.find({}, {'_id': 1, 'name': 1}))
        # Convert ObjectId to string for JSON serialization
        for profile in profiles_list:
            profile['_id'] = str(profile['_id'])
        return jsonify(profiles_list)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles', methods=['POST'])
def create_profile():
    logger.info('Received create profile request')
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        profile = {
            'name': data['name'],
            'config': data['config']
        }
        result = profiles.insert_one(profile)
        return jsonify({'id': str(result.inserted_id)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles/<profile_id>', methods=['GET'])
def get_profile_by_id(profile_id):
    try:
        profile = profiles.find_one({'_id': ObjectId(profile_id)})
        if profile:
            profile['_id'] = str(profile['_id'])
            return jsonify(profile)
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/profiles/<profile_id>', methods=['DELETE'])
def delete_profile_by_id(profile_id):
    try:
        result = profiles.delete_one({'_id': ObjectId(profile_id)})
        if result.deleted_count > 0:
            return jsonify({'success': True})
        return jsonify({'error': 'Profile not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)