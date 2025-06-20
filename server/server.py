import os
import jwt
import PyPDF2
import openai
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from functools import wraps
import tempfile
from datetime import datetime, timedelta
import uuid
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, auth, firestore
import json
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
import logging
import datetime as dt
from docx import Document
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import OpenAI
import re
from collections import Counter

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Enable CORS
CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# OpenAI Configuration
openai.api_key = os.getenv('OPENAI_API_KEY')

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise ValueError("JWT_SECRET not set in .env")

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXP = 3600  # 1 hour
REFRESH_TOKEN_EXP = 7 * 24 * 3600  # 7 days

# Initialize Firebase Admin SDK
cred_path = os.getenv("FIREBASE_CREDENTIALS")
if not cred_path:
    raise ValueError("FIREBASE_CREDENTIALS not set in .env")

if not os.path.exists(cred_path):
    raise FileNotFoundError(f"Firebase credentials file not found: {cred_path}")

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase Admin SDK and Firestore initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Firebase: {e}")
    raise

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Utility Functions
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(filepath):
    """Extract text from PDF or DOCX files"""
    try:
        if filepath.endswith('.pdf'):
            reader = PyPDF2.PdfReader(filepath)
            text = "".join([page.extract_text() for page in reader.pages])
        elif filepath.endswith('.docx'):
            doc = Document(filepath)
            text = "\n".join([para.text for para in doc.paragraphs])
        else:
            raise ValueError("Unsupported file format")
        return text
    except Exception as e:
        raise Exception(f"Error extracting text from file: {str(e)}")

def preprocess_text(text):
    """Clean and preprocess extracted text"""
    if not text:
        return ""
    # Remove multiple whitespaces
    text = re.sub(r'\s+', ' ', text)
    # Remove special characters except those used in contact info
    text = re.sub(r'[^\w\s@\+\(\)\-\.\,\#\&]', '', text)
    return text.strip()

def extract_contact_info(text):
    """Extract name, email, and phone using regex"""
    if not text:
        return {'name': None, 'email': None, 'phone': None}
    
    # Email extraction
    email = re.search(r'[\w\.-]+@[\w\.-]+', text)
    email = email.group(0) if email else None
    
    # Phone extraction (improved pattern)
    phone_patterns = [
        r'(\+?\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4})',
        r'(\(\d{3}\)\s?\d{3}[\s\-]?\d{4})',
        r'(\d{10})'
    ]
    phone = None
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            phone = match.group(0)
            break
    
    # Name extraction (improved - look for patterns before email/phone)
    lines = text.split('\n')
    name = None
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if line and len(line.split()) <= 4 and not re.search(r'[@\+\d]', line):
            name = line
            break
    
    return {
        'name': name,
        'email': email,
        'phone': phone
    }

def create_rag_index(text):
    """Create a RAG vector index from the text"""
    if not text or len(text.strip()) == 0:
        raise ValueError("No text content to process")
    
    if not os.getenv('OPENAI_API_KEY'):
        raise ValueError("OpenAI API key not configured")
    
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    chunks = text_splitter.split_text(text)
    
    if not chunks:
        raise ValueError("No text chunks created")
    
    try:
        embeddings = OpenAIEmbeddings()
        knowledge_base = FAISS.from_texts(chunks, embeddings)
        return knowledge_base
    except Exception as e:
        raise Exception(f"Failed to create embeddings: {str(e)}")

def extract_comprehensive_info_with_rag(text):
    """Use RAG to extract comprehensive information from text"""
    try:
        # Create vector store
        knowledge_base = create_rag_index(text)
        
        # Enhanced questions to extract actual skills from resume
        questions = [
            "Extract all specific technical skills, technologies, software tools, and programming languages explicitly mentioned. Return only the exact terms found, separated by commas.",
            "Extract all soft skills and interpersonal abilities explicitly mentioned. Return only the exact terms found, separated by commas.",
            "Extract all programming languages specifically mentioned. Return only the exact language names found, separated by commas.",
            "Extract all frameworks, libraries, development tools, and platforms specifically mentioned. Return only the exact names found, separated by commas.",
            "Extract all certifications, licenses, or professional credentials mentioned. Include the full certification names.",
            "Provide a comprehensive summary of the work experience, highlighting key roles, responsibilities, and achievements mentioned.",
            "Summarize the educational background including degrees, institutions, and relevant academic achievements mentioned.",
            "Extract and list all specific projects mentioned with their key details.",
            "Identify the industries and domains mentioned.",
            "Determine the experience level and career stage based on the information provided."
        ]
        
        # Initialize LLM chain
        try:
            llm = OpenAI(temperature=0.1)
            chain = load_qa_chain(llm, chain_type="stuff")
        except Exception as e:
            raise Exception(f"Failed to initialize LLM chain: {str(e)}")
        
        answers = {}
        for question in questions:
            try:
                docs = knowledge_base.similarity_search(question, k=4)
                if docs:
                    answer = chain.run(input_documents=docs, question=question)
                    answers[question] = answer.strip() if answer else "Not available"
                else:
                    answers[question] = "Not available"
            except Exception as e:
                print(f"Error processing question '{question}': {str(e)}")
                answers[question] = "Not available"
        
        # Process extracted skills - only use what's actually found
        def parse_extracted_skills(skills_text):
            if not skills_text or skills_text == "Not available" or skills_text.lower() == "none":
                return []
            skills = [skill.strip().title() for skill in skills_text.split(',') if skill.strip()]
            filtered_skills = []
            for skill in skills:
                if len(skill) > 2 and not any(phrase in skill.lower() for phrase in ['not mentioned', 'not available', 'none found']):
                    filtered_skills.append(skill)
            return list(set(filtered_skills))[:20]
        
        technical_skills = parse_extracted_skills(answers.get(questions[0], ""))
        soft_skills = parse_extracted_skills(answers.get(questions[1], ""))
        programming_languages = parse_extracted_skills(answers.get(questions[2], ""))
        frameworks_tools = parse_extracted_skills(answers.get(questions[3], ""))
        
        # Create structured summary
        certifications = answers.get(questions[4], 'Not available')
        experience_summary = answers.get(questions[5], 'Not available')
        education_summary = answers.get(questions[6], 'Not available')
        projects = answers.get(questions[7], 'Not available')
        industries = answers.get(questions[8], 'Not available')
        career_level = answers.get(questions[9], 'Not available')
        
        comprehensive_summary = f"""
## Professional Summary
Career Level: {career_level}
Industries: {industries}

## Technical Expertise
• Technical Skills: {", ".join(technical_skills) if technical_skills else "Not specified"}
• Programming Languages: {", ".join(programming_languages) if programming_languages else "Not specified"}
• Frameworks & Tools: {", ".join(frameworks_tools) if frameworks_tools else "Not specified"}

## Work Experience
{experience_summary}

## Education
{education_summary}

## Projects
{projects}

## Certifications
{certifications}

## Soft Skills
• {", ".join(soft_skills) if soft_skills else "Not specified"}
        """.strip()
        
        return {
            'technical_skills': technical_skills,
            'soft_skills': soft_skills,
            'programming_languages': programming_languages,
            'frameworks_tools': frameworks_tools,
            'certifications': certifications,
            'summary': comprehensive_summary,
            'experience_summary': experience_summary,
            'education_summary': education_summary,
            'projects': projects,
            'industries': industries,
            'career_level': career_level
        }
    except Exception as e:
        print(f"RAG processing failed: {str(e)}")
        return extract_fallback_skills_from_text(text)

def extract_fallback_skills_from_text(text):
    """Fallback skill extraction using NLP patterns"""
    if not text:
        return {
            'technical_skills': [],
            'soft_skills': [],
            'programming_languages': [],
            'frameworks_tools': [],
            'certifications': '',
            'summary': 'Unable to generate summary due to processing error.',
            'experience_summary': 'Not available',
            'education_summary': 'Not available',
            'projects': 'Not available',
            'industries': 'Not available',
            'career_level': 'Not available'
        }
    
    text_lower = text.lower()
    
    # Look for skills in common contexts
    skill_contexts = [
        r'skills?[:\s]+([^\.]+)',
        r'technologies?[:\s]+([^\.]+)',
        r'proficient in[:\s]+([^\.]+)',
        r'experience with[:\s]+([^\.]+)',
        r'knowledge of[:\s]+([^\.]+)',
        r'familiar with[:\s]+([^\.]+)',
        r'worked with[:\s]+([^\.]+)'
    ]
    
    found_skills = []
    for pattern in skill_contexts:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        for match in matches:
            skills_in_match = re.split(r'[,;|\n•·]', match)
            for skill in skills_in_match:
                skill = skill.strip().title()
                if len(skill) > 2 and skill not in found_skills:
                    found_skills.append(skill)
    
    summary = f"""
## Skills Extracted
• Found Skills: {', '.join(found_skills[:15]) if found_skills else 'No specific skills identified in standard format'}
    """.strip()
    
    return {
        'technical_skills': found_skills[:10],
        'soft_skills': [],
        'programming_languages': [],
        'frameworks_tools': [],
        'certifications': '',
        'summary': summary,
        'experience_summary': 'Experience details extracted using pattern matching.',
        'education_summary': 'Education details not available with current processing.',
        'projects': 'Projects not identified',
        'industries': 'Industries not identified',
        'career_level': 'Career level not determined'
    }

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

def summarize_with_openai(text_chunks: List[str], context: Dict[str, Any]) -> Dict[str, Any]:
    """Use OpenAI to summarize and extract meaningful information from text chunks"""
    try:
        full_text = "\n".join(text_chunks)
        
        prompt = f"""
        Analyze this information and provide:
        1. An enhanced description that combines the form data with relevant content
        2. Key requirements extracted
        3. Key responsibilities extracted
        4. Preferred qualifications mentioned
        5. Any salary/compensation information if mentioned
        6. Any other relevant details
        
        Context:
        {json.dumps(context, indent=2)}
        
        Content:
        {full_text[:4000]}
        
        Format your response as a JSON object with:
        {{
            "enhanced_description": "Enhanced description",
            "key_requirements": ["requirement1", "requirement2"],
            "key_responsibilities": ["responsibility1", "responsibility2"],
            "preferred_qualifications": ["qualification1", "qualification2"],
            "compensation_info": "Any compensation details",
            "additional_details": "Any other relevant information",
            "summary": "Brief summary of the content"
        }}
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are an expert assistant that helps create comprehensive documents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.3
        )
        
        try:
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {
                "enhanced_description": response.choices[0].message.content,
                "key_requirements": [],
                "key_responsibilities": [],
                "preferred_qualifications": [],
                "compensation_info": "",
                "additional_details": "",
                "summary": "Content processed but structured parsing failed"
            }
    except Exception as e:
        raise Exception(f"Error processing with OpenAI: {str(e)}")

def create_access_token(uid, email=None, provider_id=None, role=None):
    """Create access JWT token"""
    payload = {
        "uid": uid,
        "email": email,
        "provider_id": provider_id,
        "role": role,
        "type": "access",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=ACCESS_TOKEN_EXP)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(uid):
    """Create refresh JWT token"""
    payload = {
        "uid": uid,
        "type": "refresh",
        "iat": datetime.now(dt.UTC),
        "exp": datetime.now(dt.UTC) + timedelta(seconds=REFRESH_TOKEN_EXP)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def jwt_required(token_type="access"):
    """Decorator to protect routes with JWT authentication"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            auth_header = request.headers.get("Authorization")
            
            if not auth_header:
                return jsonify({"error": "Authorization header missing"}), 401
            
            if not auth_header.startswith("Bearer "):
                return jsonify({"error": "Invalid authorization header format"}), 401
            
            token = auth_header.split("Bearer ")[1]
            
            try:
                payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
                if payload.get("type") != token_type:
                    return jsonify({"error": f"Invalid token type, expected {token_type}"}), 401
                if token_type == "access" and payload.get("provider_id") != "google.com":
                    return jsonify({"error": "Invalid authentication provider"}), 401
                request.uid = payload["uid"]
                request.user_email = payload.get("email")
                request.user_role = payload.get("role")
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token has expired"}), 401
            except jwt.InvalidTokenError as e:
                return jsonify({"error": f"Invalid token: {str(e)}"}), 401
            except Exception as e:
                logger.error(f"JWT verification error: {e}")
                return jsonify({"error": "Token verification failed"}), 401
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def role_required(required_role):
    """Decorator to check user role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if request.user_role != required_role:
                return jsonify({"error": f"Insufficient permissions. Requires {required_role} role."}), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Routes
@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "timestamp": datetime.now(dt.UTC).isoformat()})

# Authentication Routes
@app.route("/auth/signup", methods=["POST"])
@limiter.limit("5 per minute")
def signup():
    """Signup endpoint that creates a new user with role"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        id_token = data.get("idToken")
        role = data.get("role")
        
        if not id_token:
            return jsonify({"error": "idToken is required"}), 400
        
        if not role or role not in ["requester", "applicant"]:
            return jsonify({"error": "Valid role (requester or applicant) is required"}), 400
        
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        
        # Check if the provider is Google
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        if provider_id != "google.com":
            return jsonify({"error": "Only Google Sign-In is supported"}), 401
        
        # Check if user already exists in Firestore
        user_ref = db.collection("users").document(uid)
        existing_user = user_ref.get()
        
        if existing_user.exists:
            return jsonify({"error": "User already exists. Please try logging in instead."}), 409
        
        # Get user record from Firebase Auth
        user_record = auth.get_user(uid)
        
        # Create new user in Firestore
        user_data = {
            "email": email,
            "displayName": user_record.display_name,
            "photoURL": user_record.photo_url,
            "role": role,
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": datetime.now(dt.UTC),
            "lastLogin": datetime.now(dt.UTC),
            "isActive": True,
            "resumeId": None,  # For applicants
            "postedJobs": []   # For requesters
        }
        
        user_ref.set(user_data)
        
        # Create tokens
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        logger.info(f"New user {email} signed up with role {role}")
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid Google Sign-In token"}), 401
    except auth.UserNotFoundError:
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Signup error: {e}")
        return jsonify({"error": f"Signup failed: {str(e)}"}), 500

@app.route("/auth/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """Login endpoint that verifies Firebase Google Sign-In ID token and returns JWTs"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        id_token = data.get("idToken")
        role = data.get("role")
        
        if not id_token:
            return jsonify({"error": "idToken is required"}), 400
        
        if not role or role not in ["requester", "applicant"]:
            return jsonify({"error": "Valid role (requester or applicant) is required"}), 400
        
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email")
        
        # Check if the provider is Google
        provider_id = decoded_token.get("firebase", {}).get("sign_in_provider", "")
        if provider_id != "google.com":
            return jsonify({"error": "Only Google Sign-In is supported"}), 401
        
        # Check if user exists in Firestore and has the correct role
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({
                "error": "Account not found. Please sign up first.",
                "needsSignup": True
            }), 404
        
        user_data = user_doc.to_dict()
        stored_role = user_data.get("role")
        
        if stored_role != role:
            return jsonify({
                "error": f"Account exists with different role. You are registered as {stored_role}.",
                "needsSignup": True
            }), 403
        
        # Get user record for additional info
        user_record = auth.get_user(uid)
        
        # Update last login
        user_ref.update({
            "lastLogin": datetime.now(dt.UTC),
            "updatedAt": datetime.now(dt.UTC)
        })
        
        # Create tokens
        access_token = create_access_token(uid, email, provider_id, role)
        refresh_token = create_refresh_token(uid)
        
        logger.info(f"User {email} logged in with role {role}")
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except auth.InvalidIdTokenError:
        return jsonify({"error": "Invalid Google Sign-In token"}), 401
    except auth.UserNotFoundError:
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({"error": f"Login failed: {str(e)}"}), 500

@app.route("/auth/refresh", methods=["POST"])
@limiter.limit("5 per minute")
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get("refreshToken")
        if not refresh_token:
            return jsonify({"error": "refreshToken is required"}), 400
        
        payload = jwt.decode(refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401
        
        uid = payload["uid"]
        user_record = auth.get_user(uid)
        
        # Get user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_doc.to_dict()
        role = user_data.get("role")
        
        # Create new access token
        access_token = create_access_token(uid, user_record.email, "google.com", role)
        
        return jsonify({
            "success": True,
            "accessToken": access_token,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Refresh token has expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid refresh token"}), 401
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        return jsonify({"error": f"Token refresh failed: {str(e)}"}), 401

@app.route("/auth/verify", methods=["GET"])
@jwt_required("access")
def verify_token():
    """Verify JWT token and return user info"""
    try:
        uid = request.uid
        user_record = auth.get_user(uid)
        
        # Get user role from Firestore
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return jsonify({"error": "User data not found"}), 404
        
        user_data = user_doc.to_dict()
        role = user_data.get("role")
        
        return jsonify({
            "success": True,
            "user": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": role
            }
        })
    except Exception as e:
        logger.error(f"Token verification error: {e}")
        return jsonify({"error": f"Token verification failed: {str(e)}"}), 401

@app.route("/user/profile", methods=["GET"])
@jwt_required("access")
def get_profile():
    """Get user profile information"""
    try:
        uid = request.uid
        user_record = auth.get_user(uid)
        user_doc = db.collection("users").document(uid).get()
        
        user_data = user_doc.to_dict() if user_doc.exists else {}
        
        # Get resume data if applicant
        resume_data = {}
        if user_data.get("role") == "applicant" and user_data.get("resumeId"):
            resume_doc = db.collection("resumes").document(user_data["resumeId"]).get()
            if resume_doc.exists:
                resume_data = resume_doc.to_dict()
                # Remove raw text to reduce payload size
                if "raw_text" in resume_data:
                    del resume_data["raw_text"]
        
        return jsonify({
            "success": True,
            "profile": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": user_data.get("role"),
                "createdAt": user_data.get("createdAt"),
                "lastLogin": user_data.get("lastLogin"),
                "additionalInfo": user_data.get("additionalInfo", {})
            },
            "resume": resume_data if resume_data else None
        })
    except Exception as e:
        logger.error(f"Profile fetch error: {e}")
        return jsonify({"error": f"Failed to fetch profile: {str(e)}"}), 500

@app.route("/user/profile", methods=["PUT"])
@jwt_required("access")
def update_profile():
    """Update user profile information"""
    try:
        uid = request.uid
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400
        
        # Update Firebase user record
        update_data = {}
        if "displayName" in data:
            update_data["display_name"] = data["displayName"]
        if "photoURL" in data:
            update_data["photo_url"] = data["photoURL"]
        
        if update_data:
            auth.update_user(uid, **update_data)
        
        # Update Firestore user data
        user_ref = db.collection("users").document(uid)
        firestore_update = {
            "updatedAt": datetime.now(dt.UTC)
        }
        if "additionalInfo" in data:
            firestore_update["additionalInfo"] = data["additionalInfo"]
        
        user_ref.set(firestore_update, merge=True)
        
        logger.info(f"Profile updated for user {uid}")
        
        # Return updated profile
        user_record = auth.get_user(uid)
        user_data = user_ref.get().to_dict()
        
        return jsonify({
            "success": True,
            "profile": {
                "uid": user_record.uid,
                "email": user_record.email,
                "displayName": user_record.display_name,
                "emailVerified": user_record.email_verified,
                "photoURL": user_record.photo_url,
                "role": user_data.get("role"),
                "createdAt": user_data.get("createdAt"),
                "lastLogin": user_data.get("lastLogin"),
                "additionalInfo": user_data.get("additionalInfo", {})
            }
        })
        
    except Exception as e:
        logger.error(f"Profile update error: {e}")
        return jsonify({"error": f"Failed to update profile: {str(e)}"}), 500

@app.route("/auth/logout", methods=["POST"])
@jwt_required("access")
def logout():
    """Logout endpoint (client should remove tokens)"""
    uid = request.uid
    logger.info(f"User {uid} logged out")
    return jsonify({"success": True, "message": "Logged out successfully"})

# Resume Processing Routes
@app.route('/resume/upload', methods=['POST'])
@jwt_required("access")
@role_required("applicant")
def upload_resume():
    """Handle resume upload and processing for applicants"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Step 1: Extract text
            raw_text = extract_text_from_file(filepath)
            if not raw_text or len(raw_text.strip()) == 0:
                return jsonify({'error': 'Could not extract text from file'}), 400
            
            cleaned_text = preprocess_text(raw_text)
            
            # Step 2: Extract contact info
            contact_info = extract_contact_info(cleaned_text)
            
            # Step 3: Comprehensive processing with RAG
            comprehensive_results = extract_comprehensive_info_with_rag(cleaned_text)
            
            # Step 4: Store in database
            resume_data = {
                "name": contact_info.get("name"),
                "email": contact_info.get("email") or request.user_email,
                "phone": contact_info.get("phone"),
                "technical_skills": comprehensive_results['technical_skills'],
                "soft_skills": comprehensive_results['soft_skills'],
                "programming_languages": comprehensive_results['programming_languages'],
                "frameworks_tools": comprehensive_results['frameworks_tools'],
                "certifications": comprehensive_results['certifications'],
                "summary": comprehensive_results['summary'],
                "experience_summary": comprehensive_results['experience_summary'],
                "education_summary": comprehensive_results['education_summary'],
                "projects": comprehensive_results.get('projects', 'Not available'),
                "industries": comprehensive_results.get('industries', 'Not available'),
                "career_level": comprehensive_results.get('career_level', 'Not available'),
                "raw_text": cleaned_text,
                "userId": request.uid,
                "createdAt": datetime.now(dt.UTC),
                "updatedAt": datetime.now(dt.UTC),
                "isActive": True
            }
            
            # Check if user already has a resume
            user_ref = db.collection("users").document(request.uid)
            user_data = user_ref.get().to_dict()
            
            if user_data.get("resumeId"):
                # Update existing resume
                resume_ref = db.collection("resumes").document(user_data["resumeId"])
                resume_ref.update(resume_data)
                resume_id = user_data["resumeId"]
            else:
                # Create new resume
                resume_ref = db.collection("resumes").document()
                resume_id = resume_ref.id
                resume_ref.set(resume_data)
                # Update user with resume ID
                user_ref.update({"resumeId": resume_id})
            
            return jsonify({
                'id': resume_id,
                'contact_info': contact_info,
                'technical_skills': comprehensive_results['technical_skills'],
                'soft_skills': comprehensive_results['soft_skills'],
                'programming_languages': comprehensive_results['programming_languages'],
                'frameworks_tools': comprehensive_results['frameworks_tools'],
                'certifications': comprehensive_results['certifications'],
                'summary': comprehensive_results['summary'],
                'message': 'Resume processed successfully'
            })
            
        except Exception as e:
            print(f"Processing error: {str(e)}")
            return jsonify({'error': f'Processing error: {str(e)}'}), 500
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    else:
        return jsonify({'error': 'Invalid file format. Only PDF and DOCX are supported.'}), 400

@app.route('/resume', methods=['GET'])
@jwt_required("access")
@role_required("applicant")
def get_resume():
    """Get the current user's resume"""
    try:
        user_ref = db.collection("users").document(request.uid)
        user_data = user_ref.get().to_dict()
        
        if not user_data.get("resumeId"):
            return jsonify({"error": "No resume found for this user"}), 404
        
        resume_ref = db.collection("resumes").document(user_data["resumeId"])
        resume_data = resume_ref.get().to_dict()
        
        if not resume_data:
            return jsonify({"error": "Resume not found"}), 404
        
        # Remove raw text to reduce payload size
        if "raw_text" in resume_data:
            del resume_data["raw_text"]
        
        return jsonify(resume_data)
    except Exception as e:
        return jsonify({"error": f"Failed to get resume: {str(e)}"}), 500

# Job Posting Routes
@app.route('/jobs/post', methods=['POST'])
@jwt_required("access")
@role_required("requester")
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
            'posted_by': request.uid,
            'created_at': datetime.now(dt.UTC),
            'updated_at': datetime.now(dt.UTC),
            'pdf_processed': False,
            'ai_enhanced': False,
            'is_active': True,
            'enhanced_description': description,
            'key_requirements': [],
            'key_responsibilities': [],
            'preferred_qualifications': [],
            'compensation_info': '',
            'additional_details': '',
            'pdf_summary': '',
            'applicants': []  # Track applicants
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
                    pdf_text = extract_text_from_file(temp_path)
                    
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
                            'pdf_summary': ai_result.get('summary', ''),
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
            user_jobs_ref = db.collection('users').document(request.uid).collection('posted_jobs').document(job_id)
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
@jwt_required("access")
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
@jwt_required("access")
@role_required("requester")
def get_my_jobs():
    """Get all jobs posted by the current user"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Query jobs posted by current user
        jobs_ref = db.collection('jobs').where('posted_by', '==', request.uid).where('is_active', '==', True)
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
@jwt_required("access")
@role_required("requester")
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
        if job_data.get('posted_by') != request.uid:
            return jsonify({'error': 'Unauthorized to update this job'}), 403
        
        # Get update data from request
        update_data = request.get_json()
        allowed_fields = ['title', 'company', 'location', 'description', 'is_active']
        
        # Update only allowed fields
        for field in allowed_fields:
            if field in update_data:
                job_data[field] = update_data[field]
        
        job_data['updated_at'] = datetime.now(dt.UTC)
        
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
@jwt_required("access")
@role_required("requester")
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
        if job_data.get('posted_by') != request.uid:
            return jsonify({'error': 'Unauthorized to delete this job'}), 403
        
        # Soft delete - set is_active to False
        job_ref.update({
            'is_active': False,
            'updated_at': datetime.now(dt.UTC)
        })
        
        return jsonify({'message': 'Job deleted successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to delete job: {str(e)}'}), 500

@app.route('/jobs', methods=['GET'])
@jwt_required("access")
def get_all_jobs():
    """Get all active jobs (for applicants to browse)"""
    try:
        if not db:
            return jsonify({'error': 'Firebase not initialized'}), 500
            
        # Query active jobs
        jobs_ref = db.collection('jobs').where('is_active', '==', True)
        jobs = jobs_ref.stream()
        
        job_list = []
        for job in jobs:
            job_data = job.to_dict()
            
            # Convert datetime objects to ISO strings
            if 'created_at' in job_data and job_data['created_at']:
                job_data['created_at'] = job_data['created_at'].isoformat()
            if 'updated_at' in job_data and job_data['updated_at']:
                job_data['updated_at'] = job_data['updated_at'].isoformat()
            
            # Remove large fields to reduce payload
            if 'original_pdf_text' in job_data:
                del job_data['original_pdf_text']
            
            job_list.append(job_data)
        
        # Sort by creation date (most recent first)
        job_list.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify({
            'jobs': job_list,
            'total': len(job_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve jobs: {str(e)}'}), 500

# Job Application Routes
@app.route('/jobs/<job_id>/apply', methods=['POST'])
@jwt_required("access")
@role_required("applicant")
def apply_to_job(job_id):
    """Apply to a job with the current user's resume"""
    try:
        # Get job details
        job_ref = db.collection('jobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_doc.to_dict()
        
        if not job_data.get('is_active', False):
            return jsonify({'error': 'This job is no longer active'}), 400
        
        # Get user's resume
        user_ref = db.collection('users').document(request.uid)
        user_data = user_ref.get().to_dict()
        
        if not user_data.get('resumeId'):
            return jsonify({'error': 'No resume found. Please upload a resume first.'}), 400
        
        resume_ref = db.collection('resumes').document(user_data['resumeId'])
        resume_data = resume_ref.get().to_dict()
        
        if not resume_data:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Create application
        application_id = str(uuid.uuid4())
        application_data = {
            'id': application_id,
            'job_id': job_id,
            'applicant_id': request.uid,
            'resume_id': user_data['resumeId'],
            'status': 'submitted',
            'applied_at': datetime.now(dt.UTC),
            'updated_at': datetime.now(dt.UTC),
            'applicant_name': resume_data.get('name', ''),
            'applicant_email': resume_data.get('email', ''),
            'job_title': job_data['title'],
            'company': job_data['company']
        }
        
        # Store application
        db.collection('applications').document(application_id).set(application_data)
        
        # Add applicant to job
        job_ref.update({
            'applicants': firestore.ArrayUnion([{
                'applicant_id': request.uid,
                'application_id': application_id,
                'status': 'submitted',
                'applied_at': datetime.now(dt.UTC)
            }])
        })
        
        # Add to user's applications
        user_ref.collection('applications').document(application_id).set({
            'job_id': job_id,
            'job_title': job_data['title'],
            'company': job_data['company'],
            'status': 'submitted',
            'applied_at': datetime.now(dt.UTC)
        })
        
        return jsonify({
            'message': 'Application submitted successfully',
            'application_id': application_id
        }), 201
    
    except Exception as e:
        return jsonify({'error': f'Failed to submit application: {str(e)}'}), 500

@app.route('/jobs/<job_id>/applicants', methods=['GET'])
@jwt_required("access")
@role_required("requester")
def get_job_applicants(job_id):
    """Get all applicants for a job (for recruiters)"""
    try:
        # Verify job exists and belongs to requester
        job_ref = db.collection('jobs').document(job_id)
        job_doc = job_ref.get()
        
        if not job_doc.exists:
            return jsonify({'error': 'Job not found'}), 404
        
        job_data = job_doc.to_dict()
        
        if job_data.get('posted_by') != request.uid:
            return jsonify({'error': 'Unauthorized to view applicants for this job'}), 403
        
        # Get applicants from job document
        applicants = job_data.get('applicants', [])
        
        # Get detailed applicant info
        detailed_applicants = []
        for applicant in applicants:
            # Get user info
            user_ref = db.collection('users').document(applicant['applicant_id'])
            user_data = user_ref.get().to_dict()
            
            # Get resume info
            resume_ref = db.collection('resumes').document(user_data.get('resumeId', ''))
            resume_data = resume_ref.get().to_dict()
            
            if resume_data:
                detailed_applicants.append({
                    'application_id': applicant['application_id'],
                    'applicant_id': applicant['applicant_id'],
                    'name': resume_data.get('name', ''),
                    'email': resume_data.get('email', ''),
                    'summary': resume_data.get('summary', ''),
                    'technical_skills': resume_data.get('technical_skills', []),
                    'status': applicant.get('status', 'submitted'),
                    'applied_at': applicant.get('applied_at').isoformat() if applicant.get('applied_at') else None
                })
        
        return jsonify({
            'applicants': detailed_applicants,
            'total': len(detailed_applicants)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to get applicants: {str(e)}'}), 500

@app.route('/applications/my-applications', methods=['GET'])
@jwt_required("access")
@role_required("applicant")
def get_my_applications():
    """Get all applications submitted by the current user"""
    try:
        applications_ref = db.collection('users').document(request.uid).collection('applications')
        applications = applications_ref.stream()
        
        application_list = []
        for app in applications:
            app_data = app.to_dict()
            app_data['id'] = app.id
            
            # Convert datetime to string
            if 'applied_at' in app_data and app_data['applied_at']:
                app_data['applied_at'] = app_data['applied_at'].isoformat()
            
            application_list.append(app_data)
        
        # Sort by application date (most recent first)
        application_list.sort(key=lambda x: x.get('applied_at', ''), reverse=True)
        
        return jsonify({
            'applications': application_list,
            'total': len(application_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to get applications: {str(e)}'}), 500

# Matching System
@app.route('/jobs/match', methods=['GET'])
@jwt_required("access")
@role_required("applicant")
def get_matched_jobs():
    """Get jobs that match the applicant's skills"""
    try:
        # Get user's resume
        user_ref = db.collection('users').document(request.uid)
        user_data = user_ref.get().to_dict()
        
        if not user_data.get('resumeId'):
            return jsonify({'error': 'No resume found. Please upload a resume first.'}), 400
        
        resume_ref = db.collection('resumes').document(user_data['resumeId'])
        resume_data = resume_ref.get().to_dict()
        
        if not resume_data:
            return jsonify({'error': 'Resume not found'}), 404
        
        # Get active jobs
        jobs_ref = db.collection('jobs').where('is_active', '==', True)
        jobs = jobs_ref.stream()
        
        matched_jobs = []
        user_skills = set(resume_data.get('technical_skills', []) + resume_data.get('programming_languages', []))
        
        for job in jobs:
            job_data = job.to_dict()
            
            # Calculate match score based on skills
            job_skills = set(job_data.get('key_requirements', []) + job_data.get('preferred_qualifications', []))
            common_skills = user_skills.intersection(job_skills)
            match_score = len(common_skills) / len(job_skills) if len(job_skills) > 0 else 0
            
            # Only include jobs with at least 30% match
            if match_score >= 0.3:
                # Convert datetime to string
                if 'created_at' in job_data and job_data['created_at']:
                    job_data['created_at'] = job_data['created_at'].isoformat()
                
                # Remove large fields to reduce payload
                if 'original_pdf_text' in job_data:
                    del job_data['original_pdf_text']
                
                job_data['match_score'] = round(match_score * 100, 1)
                job_data['matching_skills'] = list(common_skills)
                matched_jobs.append(job_data)
        
        # Sort by match score (highest first)
        matched_jobs.sort(key=lambda x: x['match_score'], reverse=True)
        
        return jsonify({
            'jobs': matched_jobs,
            'total': len(matched_jobs)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'Failed to get matched jobs: {str(e)}'}), 500

# Error Handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)