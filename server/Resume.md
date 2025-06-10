import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from docx import Document
import openai
from langchain.text_splitter import CharacterTextSplitter
from langchain_openai import OpenAIEmbeddings  # Updated import
from langchain_community.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain_openai import OpenAI  # Updated import
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import re
import json
from collections import Counter

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Database setup
Base = declarative_base()
engine = create_engine(os.getenv('DATABASE_URL'))
Session = sessionmaker(bind=engine)

class Resume(Base):
    __tablename__ = 'resumes'
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    technical_skills = Column(JSON)  # Store as JSON for better structure
    soft_skills = Column(JSON)
    programming_languages = Column(JSON)
    frameworks_tools = Column(JSON)
    certifications = Column(Text)
    summary = Column(Text)
    experience_summary = Column(Text)
    education_summary = Column(Text)
    raw_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with skills
    skills = relationship("Skill", back_populates="resume")

class Skill(Base):
    __tablename__ = 'skills'
    id = Column(Integer, primary_key=True)
    resume_id = Column(Integer, ForeignKey('resumes.id'))
    skill_name = Column(String(100))
    skill_category = Column(String(50))  # technical, soft, programming, framework, tool, certification
    confidence_score = Column(Integer, default=0)  # 0-100 based on context
    context = Column(Text)  # Context where skill was found
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship with resume
    resume = relationship("Resume", back_populates="skills")

class SkillMaster(Base):
    __tablename__ = 'skill_master'
    id = Column(Integer, primary_key=True)
    skill_name = Column(String(100), unique=True)
    category = Column(String(50))
    frequency = Column(Integer, default=1)  # How many times this skill appeared across all resumes
    first_seen = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

# Create tables
Base.metadata.create_all(engine)

# Initialize OpenAI - Updated approach
def initialize_openai():
    """Initialize OpenAI with proper error handling"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not found in environment variables")
    
    # For newer versions of openai, use the client approach
    try:
        from openai import OpenAI as OpenAIClient
        client = OpenAIClient(api_key=api_key)
        return client
    except ImportError:
        # Fallback for older versions
        openai.api_key = api_key
        return None

# Initialize OpenAI client
try:
    openai_client = initialize_openai()
except Exception as e:
    print(f"Warning: OpenAI initialization failed: {e}")
    openai_client = None

def extract_text_from_file(filepath):
    """Extract text from PDF or DOCX files"""
    try:
        if filepath.endswith('.pdf'):
            reader = PdfReader(filepath)
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
    """Create a RAG vector index from the resume text"""
    if not text or len(text.strip()) == 0:
        raise ValueError("No text content to process")
    
    # Check if OpenAI API key is available
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
    """Use RAG to extract comprehensive resume information focusing on actual skills mentioned"""
    try:
        # Create vector store
        knowledge_base = create_rag_index(text)
        
        # Enhanced questions to extract actual skills from resume
        questions = [
            "Extract all specific technical skills, technologies, software tools, and programming languages explicitly mentioned in this resume. Return only the exact terms found, separated by commas. Do not add any skills not explicitly mentioned.",
            "Extract all soft skills and interpersonal abilities explicitly mentioned in this resume. Return only the exact terms found, separated by commas.",
            "Extract all programming languages specifically mentioned in this resume. Return only the exact language names found, separated by commas.",
            "Extract all frameworks, libraries, development tools, and platforms specifically mentioned in this resume. Return only the exact names found, separated by commas.",
            "Extract all certifications, licenses, or professional credentials mentioned in this resume. Include the full certification names.",
            "Provide a comprehensive summary of the candidate's work experience, highlighting key roles, responsibilities, and achievements mentioned in the resume.",
            "Summarize the candidate's educational background including degrees, institutions, and relevant academic achievements mentioned.",
            "Extract and list all specific projects mentioned in the resume with their key details.",
            "Identify the industries and domains the candidate has worked in based on the resume content.",
            "Determine the candidate's experience level and career stage based on the information provided in the resume."
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
        
        # Process extracted skills - only use what's actually found in the resume
        def parse_extracted_skills(skills_text):
            if not skills_text or skills_text == "Not available" or skills_text.lower() == "none":
                return []
            # Clean and split skills, remove empty strings and common non-skills
            skills = [skill.strip().title() for skill in skills_text.split(',') if skill.strip()]
            # Filter out generic phrases and keep only meaningful skills
            filtered_skills = []
            for skill in skills:
                # Skip generic phrases
                if len(skill) > 2 and not any(phrase in skill.lower() for phrase in ['not mentioned', 'not available', 'none found']):
                    filtered_skills.append(skill)
            return list(set(filtered_skills))[:20]  # Remove duplicates and limit to top 20
        
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
    """Fallback skill extraction using NLP patterns to find actual skills in text"""
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
    
    # Use regex patterns to find skills mentioned in context
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
            # Split by common separators and clean
            skills_in_match = re.split(r'[,;|\n•·]', match)
            for skill in skills_in_match:
                skill = skill.strip().title()
                if len(skill) > 2 and skill not in found_skills:
                    found_skills.append(skill)
    
    # Create basic summary with found skills
    summary = f"""
## Skills Extracted from Resume
• Found Skills: {', '.join(found_skills[:15]) if found_skills else 'No specific skills identified in standard format'}

Note: This resume was processed using pattern matching. For better results, ensure skills are listed in standard resume sections.
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

def store_skills_in_database(resume_id, comprehensive_results):
    """Store individual skills in the skills database"""
    session = Session()
    try:
        all_skills = []
        
        # Collect all skills with their categories
        skill_categories = {
            'technical': comprehensive_results.get('technical_skills', []),
            'soft': comprehensive_results.get('soft_skills', []),
            'programming': comprehensive_results.get('programming_languages', []),
            'framework': comprehensive_results.get('frameworks_tools', [])
        }
        
        for category, skills in skill_categories.items():
            for skill_name in skills:
                if skill_name and len(skill_name.strip()) > 1:
                    # Create skill entry
                    skill = Skill(
                        resume_id=resume_id,
                        skill_name=skill_name.strip(),
                        skill_category=category,
                        confidence_score=85,  # Default confidence score
                        context=f"Extracted from {category} skills section"
                    )
                    session.add(skill)
                    all_skills.append(skill_name.strip())
                    
                    # Update or create skill master entry
                    skill_master = session.query(SkillMaster).filter_by(skill_name=skill_name.strip()).first()
                    if skill_master:
                        skill_master.frequency += 1
                        skill_master.last_seen = datetime.utcnow()
                    else:
                        skill_master = SkillMaster(
                            skill_name=skill_name.strip(),
                            category=category,
                            frequency=1
                        )
                        session.add(skill_master)
        
        session.commit()
        return all_skills
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

def store_resume_data(contact_info, comprehensive_results, raw_text):
    """Store extracted data in database with enhanced structure"""
    session = Session()
    try:
        resume = Resume(
            name=contact_info.get('name'),
            email=contact_info.get('email'),
            phone=contact_info.get('phone'),
            technical_skills=comprehensive_results.get('technical_skills', []),
            soft_skills=comprehensive_results.get('soft_skills', []),
            programming_languages=comprehensive_results.get('programming_languages', []),
            frameworks_tools=comprehensive_results.get('frameworks_tools', []),
            certifications=comprehensive_results.get('certifications', ''),
            summary=comprehensive_results.get('summary', ''),
            experience_summary=comprehensive_results.get('experience_summary', ''),
            education_summary=comprehensive_results.get('education_summary', ''),
            raw_text=raw_text
        )
        
        session.add(resume)
        session.commit()
        
        # Store skills in separate database
        stored_skills = store_skills_in_database(resume.id, comprehensive_results)
        
        return resume.id, stored_skills
    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()

@app.route('/api/process-resume', methods=['POST'])
def process_resume():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and (file.filename.endswith('.pdf') or file.filename.endswith('.docx')):
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
            resume_id, stored_skills = store_resume_data(contact_info, comprehensive_results, cleaned_text)
            
            # Step 5: Return comprehensive results
            return jsonify({
                'id': resume_id,
                'contact_info': contact_info,
                'technical_skills': comprehensive_results['technical_skills'],
                'soft_skills': comprehensive_results['soft_skills'],
                'programming_languages': comprehensive_results['programming_languages'],
                'frameworks_tools': comprehensive_results['frameworks_tools'],
                'certifications': comprehensive_results['certifications'],
                'summary': comprehensive_results['summary'],
                'experience_summary': comprehensive_results['experience_summary'],
                'education_summary': comprehensive_results['education_summary'],
                'projects': comprehensive_results.get('projects', 'Not available'),
                'industries': comprehensive_results.get('industries', 'Not available'),
                'career_level': comprehensive_results.get('career_level', 'Not available'),
                'total_skills_stored': len(stored_skills),
                'stored_skills': stored_skills,
                'message': 'Resume processed successfully with comprehensive analysis and skills extraction'
            })
            
        except Exception as e:
            print(f"Processing error: {str(e)}")  # Add logging
            return jsonify({'error': f'Processing error: {str(e)}'}), 500
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    else:
        return jsonify({'error': 'Invalid file format. Only PDF and DOCX are supported.'}), 400

@app.route('/api/resumes', methods=['GET'])
def get_resumes():
    session = Session()
    try:
        resumes = session.query(Resume).all()
        
        result = []
        for resume in resumes:
            result.append({
                'id': resume.id,
                'name': resume.name,
                'email': resume.email,
                'phone': resume.phone,
                'technical_skills': resume.technical_skills or [],
                'soft_skills': resume.soft_skills or [],
                'programming_languages': resume.programming_languages or [],
                'frameworks_tools': resume.frameworks_tools or [],
                'certifications': resume.certifications,
                'summary': resume.summary,
                'experience_summary': resume.experience_summary,
                'education_summary': resume.education_summary,
                'created_at': resume.created_at.isoformat() if resume.created_at else None
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        session.close()

@app.route('/api/skills-analytics', methods=['GET'])
def get_skills_analytics():
    """Enhanced endpoint for skills analytics across all resumes"""
    session = Session()
    try:
        # Get data from skills master table
        skill_masters = session.query(SkillMaster).all()
        
        analytics = {
            'total_unique_skills': len(skill_masters),
            'skills_by_category': {},
            'most_frequent_skills': {},
            'skill_trends': {}
        }
        
        # Group by category
        for skill in skill_masters:
            if skill.category not in analytics['skills_by_category']:
                analytics['skills_by_category'][skill.category] = []
            analytics['skills_by_category'][skill.category].append({
                'skill_name': skill.skill_name,
                'frequency': skill.frequency,
                'first_seen': skill.first_seen.isoformat() if skill.first_seen else None,
                'last_seen': skill.last_seen.isoformat() if skill.last_seen else None
            })
        
        # Get most frequent skills overall
        all_skills = session.query(SkillMaster).order_by(SkillMaster.frequency.desc()).limit(20).all()
        analytics['most_frequent_skills'] = [
            {'skill_name': skill.skill_name, 'frequency': skill.frequency, 'category': skill.category}
            for skill in all_skills
        ]
        
        # Get resume count
        resume_count = session.query(Resume).count()
        analytics['total_resumes'] = resume_count
        
        return jsonify(analytics)
    except Exception as e:
        return jsonify({'error': f'Analytics error: {str(e)}'}), 500
    finally:
        session.close()

@app.route('/api/skills', methods=['GET'])
def get_all_skills():
    """Get all skills with their details"""
    session = Session()
    try:
        skills = session.query(Skill).join(Resume).all()
        
        result = []
        for skill in skills:
            result.append({
                'id': skill.id,
                'skill_name': skill.skill_name,
                'category': skill.skill_category,
                'confidence_score': skill.confidence_score,
                'context': skill.context,
                'resume_name': skill.resume.name,
                'resume_id': skill.resume_id,
                'created_at': skill.created_at.isoformat() if skill.created_at else None
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Skills retrieval error: {str(e)}'}), 500
    finally:
        session.close()

@app.route('/api/skills/search', methods=['GET'])
def search_skills():
    """Search for specific skills across all resumes"""
    skill_name = request.args.get('skill', '')
    category = request.args.get('category', '')
    
    session = Session()
    try:
        query = session.query(Skill).join(Resume)
        
        if skill_name:
            query = query.filter(Skill.skill_name.ilike(f'%{skill_name}%'))
        
        if category:
            query = query.filter(Skill.skill_category == category)
        
        skills = query.all()
        
        result = []
        for skill in skills:
            result.append({
                'skill_name': skill.skill_name,
                'category': skill.skill_category,
                'resume_name': skill.resume.name,
                'resume_email': skill.resume.email,
                'confidence_score': skill.confidence_score
            })
        
        return jsonify({
            'total_matches': len(result),
            'skills': result
        })
    except Exception as e:
        return jsonify({'error': f'Search error: {str(e)}'}), 500
    finally:
        session.close()

if __name__ == '__main__':
    app.run(debug=True)