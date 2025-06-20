import { Link } from 'react-router-dom';
import { useAuth } from "../utils/auth.jsx";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="bg-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Find Your Perfect Career Match</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Connect with opportunities that align with your skills and aspirations
            </p>
            <div className="flex justify-center gap-4">
              {user ? (
                <Link 
                  to={user.role === 'applicant' ? '/applicant' : '/requester'}
                  className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    to="/signup?role=applicant" 
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
                  >
                    I'm Job Seeking
                  </Link>
                  <Link 
                    to="/signup?role=requester" 
                    className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium"
                  >
                    I'm Hiring
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Upload Your Resume</h3>
                <p className="text-gray-600">
                  Our AI analyzes your skills, experience, and qualifications to understand your profile.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">Get Smart Matches</h3>
                <p className="text-gray-600">
                  We match you with jobs that truly fit your skills and career aspirations.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="text-blue-600 text-4xl mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Apply with Confidence</h3>
                <p className="text-gray-600">
                  Apply to jobs knowing you're a strong match based on your actual qualifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Find Your Match?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who found their perfect job through our platform
            </p>
            <Link 
              to="/signup" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium inline-block"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}