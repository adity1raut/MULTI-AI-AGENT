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
from sqlalchemy import create_engine, Column, String, Integer, Text, JSON
from sqlalchemy.orm import declarative_base, sessionmaker
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
    """Use RAG to extract comprehensive resume information with focus on skills"""
    try:
        # Create vector store
        knowledge_base = create_rag_index(text)
        
        # Comprehensive questions to ask the RAG system
        questions = [
            "List all concrete technical skills mentioned (programming languages, software, tools, technologies, frameworks, databases, platforms). Exclude generic phrases like 'I build'. Return as comma-separated values.",
            "List all soft skills mentioned (leadership, communication, teamwork, etc.). Return as comma-separated values.",
            "List all programming languages mentioned. Return as comma-separated values.",
            "List all frameworks, libraries, and development tools mentioned. Return as comma-separated values.",
            "List all certifications mentioned.",
            "Summarize work experience in bullet points focusing on key achievements and responsibilities.",
            "Summarize education background including degrees and institutions.",
            "List the candidate's top 3 professional achievements.",
            "What industries has the candidate worked in?",
            "What is the candidate's apparent experience level (entry-level, mid-level, senior, etc.)?"
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
        
        # Process and categorize skills
        def parse_skills_list(skills_text):
            if not skills_text or skills_text == "Not available":
                return []
            # Clean and split skills
            skills = [skill.strip().title() for skill in skills_text.split(',') if skill.strip()]
            # Remove duplicates while preserving order
            seen = set()
            return [skill for skill in skills if not (skill in seen or seen.add(skill))][:15]  # Limit to top 15
        
        technical_skills = parse_skills_list(answers.get(questions[0], ""))
        soft_skills = parse_skills_list(answers.get(questions[1], ""))
        programming_languages = parse_skills_list(answers.get(questions[2], ""))
        frameworks_tools = parse_skills_list(answers.get(questions[3], ""))
        
        # Create structured summary
        experience_summary = answers.get(questions[5], 'Not available')
        education_summary = answers.get(questions[6], 'Not available')
        achievements = answers.get(questions[7], 'Not available')
        industries = answers.get(questions[8], 'Not available')
        career_level = answers.get(questions[9], 'Not available')
        
        comprehensive_summary = f"""
## Professional Summary
Level: {career_level}
Industries: {industries}

## Technical Skills
• {", ".join(technical_skills)}

## Work Experience
{experience_summary}

## Education
{education_summary}

## Key Achievements
{achievements}
        """.strip()
        
        return {
            'technical_skills': technical_skills,
            'soft_skills': soft_skills,
            'programming_languages': programming_languages,
            'frameworks_tools': frameworks_tools,
            'certifications': answers.get(questions[4], ''),
            'summary': comprehensive_summary,
            'experience_summary': experience_summary,
            'education_summary': education_summary
        }
    except Exception as e:
        print(f"RAG processing failed: {str(e)}")
        return extract_fallback_skills(text)

def extract_fallback_skills(text):
    """Fallback skill extraction using regex patterns"""
    if not text:
        return {
            'technical_skills': [],
            'soft_skills': [],
            'programming_languages': [],
            'frameworks_tools': [],
            'certifications': '',
            'summary': 'Unable to generate summary due to processing error.',
            'experience_summary': 'Not available',
            'education_summary': 'Not available'
        }
    
    # Common skill patterns (expanded list)
    programming_langs = ['Python', 'Java', 'JavaScript', 'C++', 'C#', 'PHP', 'Ruby', 
                        'Go', 'Swift', 'Kotlin', 'TypeScript', 'R', 'SQL', 'HTML', 
                        'CSS', 'Scala', 'Perl', 'Rust', 'Dart']
    
    frameworks = ['React', 'Angular', 'Vue', 'Django', 'Flask', 'Spring', 'Express', 
                 'Laravel', 'Rails', 'Node.js', 'Bootstrap', 'jQuery', '.NET', 
                 'TensorFlow', 'PyTorch', 'Hadoop', 'Spark']
    
    tools = ['Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Jenkins', 
            'Jira', 'Confluence', 'VS Code', 'IntelliJ', 'Tableau', 'PowerBI', 
            'PostgreSQL', 'MongoDB', 'MySQL', 'Firebase']
    
    soft_skills_list = ['Leadership', 'Communication', 'Teamwork', 'Problem Solving', 
                       'Project Management', 'Time Management', 'Critical Thinking',
                       'Adaptability', 'Creativity', 'Attention to Detail']
    
    # Find matches in text (case insensitive)
    text_lower = text.lower()
    found_programming = [lang for lang in programming_langs if lang.lower() in text_lower]
    found_frameworks = [fw for fw in frameworks if fw.lower() in text_lower]
    found_tools = [tool for tool in tools if tool.lower() in text_lower]
    found_soft_skills = [skill for skill in soft_skills_list if skill.lower() in text_lower]
    
    # Create basic summary
    summary = f"""
## Technical Skills Found
• Programming Languages: {', '.join(found_programming)}
• Frameworks: {', '.join(found_frameworks)}
• Tools: {', '.join(found_tools)}

## Soft Skills
• {', '.join(found_soft_skills)}
    """.strip()
    
    return {
        'technical_skills': found_programming + found_frameworks + found_tools,
        'soft_skills': found_soft_skills,
        'programming_languages': found_programming,
        'frameworks_tools': found_frameworks + found_tools,
        'certifications': '',
        'summary': summary,
        'experience_summary': 'Experience details extracted using pattern matching.',
        'education_summary': 'Education details not available with current processing.'
    }



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
        return resume.id
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
            resume_id = store_resume_data(contact_info, comprehensive_results, cleaned_text)
            
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
                'message': 'Resume processed successfully with comprehensive analysis'
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
                'education_summary': resume.education_summary
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Database error: {str(e)}'}), 500
    finally:
        session.close()

@app.route('/api/skills-analytics', methods=['GET'])
def get_skills_analytics():
    """New endpoint for skills analytics across all resumes"""
    session = Session()
    try:
        resumes = session.query(Resume).all()
        
        all_technical_skills = []
        all_programming_languages = []
        all_frameworks_tools = []
        
        for resume in resumes:
            if resume.technical_skills:
                all_technical_skills.extend(resume.technical_skills)
            if resume.programming_languages:
                all_programming_languages.extend(resume.programming_languages)
            if resume.frameworks_tools:
                all_frameworks_tools.extend(resume.frameworks_tools)
        
        # Count frequency of skills
        technical_skills_count = Counter(all_technical_skills)
        programming_languages_count = Counter(all_programming_languages)
        frameworks_tools_count = Counter(all_frameworks_tools)
        
        return jsonify({
            'total_resumes': len(resumes),
            'most_common_technical_skills': dict(technical_skills_count.most_common(10)),
            'most_common_programming_languages': dict(programming_languages_count.most_common(10)),
            'most_common_frameworks_tools': dict(frameworks_tools_count.most_common(10))
        })
    except Exception as e:
        return jsonify({'error': f'Analytics error: {str(e)}'}), 500
    finally:
        session.close()

if __name__ == '__main__':
    app.run(debug=True)