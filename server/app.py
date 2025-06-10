import os
import jwt
import PyPDF2
import openai
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from functools import wraps
import tempfile
from datetime import datetime
import uuid
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
import json

# Initialize Flask app
app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# OpenAI Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

# Firebase Configuration
try:
    # Initialize Firebase Admin SDK
    # You can either use a service account key file or environment variables
    if os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
        # If using environment variable with JSON string
        service_account_info = json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'))
        cred = credentials.Certificate(service_account_info)
    else:
        # If using service account key file
        cred = credentials.Certificate('path/to/your/serviceAccountKey.json')
    
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print(f"Firebase initialization error: {e}")
    db = None

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from PDF file"""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """Split text into overlapping chunks for better RAG processing"""
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        if end > len(text):
            end = len(text)
        
        # Try to break at sentence boundary
        if end < len(text):
            last_period = text.rfind('.', start, end)
            if last_period > start + chunk_size // 2:
                end = last_period + 1
        
        chunks.append(text[start:end].strip())
        start = end - overlap
        
        if start >= len(text):
            break
    
    return chunks

def summarize_with_openai(text_chunks: List[str], job_context: Dict[str, Any]) -> Dict[str, Any]:
    """Use OpenAI to summarize and extract meaningful information from PDF chunks"""
    try:
        # Combine chunks for context
        full_text = "\n".join(text_chunks)
        
        # Create a comprehensive prompt for job description enhancement
        prompt = f"""
        You are an expert HR assistant. I have a job posting with the following details:
        
        Title: {job_context.get('title', 'Not specified')}
        Company: {job_context.get('company', 'Not specified')}
        Location: {job_context.get('location', 'Not specified')}
        Description: {job_context.get('description', 'Not specified')}
        
        Additionally, I have uploaded a PDF document with the following content:
        {full_text[:4000]}  # Limit to avoid token limits
        
        Please analyze this information and provide:
        1. An enhanced job description that combines the form data with relevant PDF content
        2. Key requirements extracted from the PDF
        3. Key responsibilities extracted from the PDF
        4. Preferred qualifications mentioned in the PDF
        5. Any salary/compensation information if mentioned
        6. Any other relevant details from the PDF
        
        Format your response as a JSON object with the following structure:
        {{
            "enhanced_description": "Enhanced job description combining form data and PDF content",
            "key_requirements": ["requirement1", "requirement2", ...],
            "key_responsibilities": ["responsibility1", "responsibility2", ...],
            "preferred_qualifications": ["qualification1", "qualification2", ...],
            "compensation_info": "Any salary or compensation details mentioned",
            "additional_details": "Any other relevant information",
            "pdf_summary": "Brief summary of the PDF content"
        }}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert HR assistant that helps create comprehensive job postings."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        # Try to parse the JSON response
        try:
            result = json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            # If JSON parsing fails, create a structured response
            result = {
                "enhanced_description": response.choices[0].message.content,
                "key_requirements": [],
                "key_responsibilities": [],
                "preferred_qualifications": [],
                "compensation_info": "",
                "additional_details": "",
                "pdf_summary": "PDF content processed but structured parsing failed"
            }
        
        return result
        
    except Exception as e:
        raise Exception(f"Error processing with OpenAI: {str(e)}")

def token_required(f):
    """Decorator to verify JWT token and check user role"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decode the JWT token (replace with your actual secret)
            data = jwt.decode(token, os.getenv('JWT_SECRET_KEY', 'your-secret-key'), algorithms=['HS256'])
            current_user_id = data['user_id']
            current_user_role = data.get('role')
            
            # Check if user has requester role
            if current_user_role != 'requester':
                return jsonify({'error': 'Insufficient permissions. Only requesters can post jobs.'}), 403
            
            # Add user info to request context
            request.current_user_id = current_user_id
            request.current_user_role = current_user_role
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401
        except Exception as e:
            return jsonify({'error': 'Token verification failed'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

@app.route('/jobs/post', methods=['POST'])
@token_required
def post_job():
    """Handle job posting with optional PDF processing using RAG and OpenAI"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Get form data
        title = request.form.get('title')
        company = request.form.get('company')
        location = request.form.get('location')
        description = request.form.get('description')
        
        # Validate required fields
        if not all([title, company, location, description]):
            return jsonify({'error': 'All fields (title, company, location, description) are required'}), 400
        
        # Initialize job data
        job_id = str(uuid.uuid4())
        job_data = {
            'id': job_id,
            'title': title,
            'company': company,
            'location': location,
            'description': description,
            'posted_by': request.current_user_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'pdf_processed': False,
            'ai_enhanced': False,
            'is_active': True,
            'enhanced_description': description,
            'key_requirements': [],
            'key_responsibilities': [],
            'preferred_qualifications': [],
            'compensation_info': '',
            'additional_details': '',
            'pdf_summary': ''
        }
        
        pdf_processing_error = None
        
        # Check if PDF file is uploaded
        if 'pdf' in request.files:
            pdf_file = request.files['pdf']
            
            if pdf_file and pdf_file.filename != '':
                # Validate file
                if not allowed_file(pdf_file.filename):
                    return jsonify({'error': 'Invalid file type. Only PDF files are allowed.'}), 400
                
                # Check file size
                pdf_file.seek(0, 2)  # Seek to end
                file_size = pdf_file.tell()
                pdf_file.seek(0)  # Reset to beginning
                
                if file_size > MAX_FILE_SIZE:
                    return jsonify({'error': 'File size exceeds 5MB limit'}), 400
                
                # Save file temporarily
                filename = secure_filename(pdf_file.filename)
                temp_path = os.path.join(tempfile.gettempdir(), f"{job_id}_{filename}")
                pdf_file.save(temp_path)
                
                try:
                    # Extract text from PDF
                    pdf_text = extract_text_from_pdf(temp_path)
                    
                    if pdf_text.strip():
                        # Chunk the text for better processing
                        text_chunks = chunk_text(pdf_text)
                        
                        # Process with OpenAI
                        job_context = {
                            'title': title,
                            'company': company,
                            'location': location,
                            'description': description
                        }
                        
                        ai_result = summarize_with_openai(text_chunks, job_context)
                        
                        # Update job data with AI-enhanced information
                        job_data.update({
                            'enhanced_description': ai_result.get('enhanced_description', description),
                            'key_requirements': ai_result.get('key_requirements', []),
                            'key_responsibilities': ai_result.get('key_responsibilities', []),
                            'preferred_qualifications': ai_result.get('preferred_qualifications', []),
                            'compensation_info': ai_result.get('compensation_info', ''),
                            'additional_details': ai_result.get('additional_details', ''),
                            'pdf_summary': ai_result.get('pdf_summary', ''),
                            'original_pdf_text': pdf_text[:2000],  # Store first 2000 chars
                            'pdf_processed': True,
                            'ai_enhanced': True
                        })
                    
                    else:
                        pdf_processing_error = 'No text could be extracted from the PDF'
                
                except Exception as e:
                    pdf_processing_error = str(e)
                
                finally:
                    # Clean up temporary file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
        
        # Save job to Firebase Firestore
        try:
            # Add the job document to the 'jobs' collection
            job_ref = db.collection('jobs').document(job_id)
            job_ref.set(job_data)
            
            # Also add to user's posted jobs collection for easier querying
            user_jobs_ref = db.collection('users').document(request.current_user_id).collection('posted_jobs').document(job_id)
            user_jobs_ref.set({
                'job_id': job_id,
                'title': title,
                'company': company,
                'created_at': job_data['created_at'],
                'is_active': True
            })
            
        except Exception as e:
            return jsonify({'error': f'Failed to save job to Firebase: {str(e)}'}), 500
        
        # Return success response
        response_data = {
            'message': 'Job posted successfully',
            'job_id': job_id,
            'pdf_processed': job_data['pdf_processed'],
            'ai_enhanced': job_data['ai_enhanced']
        }
        
        # Add processing warnings if any
        if pdf_processing_error:
            response_data['warning'] = f"PDF processing failed: {pdf_processing_error}"
        
        return jsonify(response_data), 201
    
    except Exception as e:
        return jsonify({'error': f'Job posting failed: {str(e)}'}), 500

@app.route('/jobs/<job_id>', methods=['GET'])
@token_required
def get_job_details(job_id):
    """Get detailed job information including AI-enhanced content"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Get job from Firebase
        job_ref = db.collection('jobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_doc.to_dict()
        
        # Convert datetime objects to ISO strings for JSON serialization
        if 'created_at' in job_data and job_data['created_at']:
            job_data['created_at'] = job_data['created_at'].isoformat()
        if 'updated_at' in job_data and job_data['updated_at']:
            job_data['updated_at'] = job_data['updated_at'].isoformat()
        
        return jsonify(job_data), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve job details: {str(e)}'}), 500

@app.route('/jobs/my-jobs', methods=['GET'])
@token_required
def get_my_jobs():
    """Get all jobs posted by the current user"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Query jobs posted by current user
        jobs_ref = db.collection('jobs').where('posted_by', '==', request.current_user_id).where('is_active', '==', True)
        jobs = jobs_ref.stream()
        
        job_list = []
        for job in jobs:
            job_data = job.to_dict()
            
            # Convert datetime objects to ISO strings
            if 'created_at' in job_data and job_data['created_at']:
                job_data['created_at'] = job_data['created_at'].isoformat()
            if 'updated_at' in job_data and job_data['updated_at']:
                job_data['updated_at'] = job_data['updated_at'].isoformat()
            
            job_list.append(job_data)
        
        # Sort by creation date (most recent first)
        job_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'jobs': job_list,
            'total': len(job_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve jobs: {str(e)}'}), 500

@app.route('/jobs/<job_id>', methods=['PUT'])
@token_required
def update_job(job_id):
    """Update a job posting"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Get job from Firebase
        job_ref = db.collection('jobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_doc.to_dict()
        
        # Check if current user is the owner
        if job_data.get('posted_by') != request.current_user_id:
            return jsonify({'error': 'Unauthorized to update this job'}), 403
        
        # Get update data from request
        update_data = request.get_json()
        allowed_fields = ['title', 'company', 'location', 'description', 'is_active']
        
        # Update only allowed fields
        for field in allowed_fields:
            if field in update_data:
                job_data[field] = update_data[field]
        
        job_data['updated_at'] = datetime.utcnow()
        
        # Update in Firebase
        job_ref.update(job_data)
        
        # Convert datetime for response
        if 'created_at' in job_data and job_data['created_at']:
            job_data['created_at'] = job_data['created_at'].isoformat()
        if 'updated_at' in job_data and job_data['updated_at']:
            job_data['updated_at'] = job_data['updated_at'].isoformat()
        
        return jsonify({
            'message': 'Job updated successfully',
            'job': job_data
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to update job: {str(e)}'}), 500

@app.route('/jobs/<job_id>', methods=['DELETE'])
@token_required
def delete_job(job_id):
    """Soft delete a job posting (set is_active to False)"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Get job from Firebase
        job_ref = db.collection('jobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_doc.to_dict()
        
        # Check if current user is the owner
        if job_data.get('posted_by') != request.current_user_id:
            return jsonify({'error': 'Unauthorized to delete this job'}), 403
        
        # Soft delete - set is_active to False
        job_ref.update({
            'is_active': False,
            'updated_at': datetime.utcnow()
        })
        
        return jsonify({'message': 'Job deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to delete job: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050)