import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Sidebar from "../components/Sidebar";

const SignUp = () => {
    const { signUpWithGoogle, user, loading, error: authError } = useContext(AuthContext);
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);

    useEffect(() => {
        if (user && !loading) {
            // Navigate based on user role after successful signup
            const role = user.role;
            if (role === 'requester') {
                navigate('/requester-dashboard', { replace: true });
            } else if (role === 'applicant') {
                navigate('/applicant-dashboard', { replace: true });
            }
        }
    }, [user, loading, navigate]);

    // Clear error when role changes
    useEffect(() => {
        if (error) {
            setError(null);
        }
    }, [selectedRole]);

    const handleGoogleSignUp = async () => {
        if (isLoading || !selectedRole) {
            if (!selectedRole) {
                setError('Please select your role first');
            }
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const response = await signUpWithGoogle({
                signal: controller.signal,
                role: selectedRole
            });

            clearTimeout(timeoutId);

            // Check if user was newly created
            if (response && response.user) {
                const role = response.user.role;
                // Navigation will be handled by useEffect above
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                setError('Request timed out. Please try again.');
            } else if (error.message && error.message.includes('already exists')) {
                setError('Account already exists. Please try logging in instead.');
            } else if (error.status === 409) {
                setError('Account already exists. Please try logging in instead.');
            } else {
                setError(error.message || 'Signup failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Show auth error if any
    useEffect(() => {
        if (authError) {
            setError(authError);
        }
    }, [authError]);

    return (
        <div className="min-h-screen bg-black text-white flex">
            <div className="sticky top-0 h-screen bg-black">
                <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>

            <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
                <div className="p-6 border-b border-gray-800 bg-black">
                    <h2 className="text-2xl font-bold">Create Account</h2>
                </div>

                {/* Signup Form Area */}
                <div className="flex-1 p-6 overflow-y-auto bg-black">
                    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)]">
                        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-8 mb-6">
                            <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                                Join Pravesh
                            </h1>
                            <p className="text-center text-gray-400 mb-8">Create an account to start your journey</p>

                            {error && (
                                <div className="mb-6 p-3 rounded-lg bg-red-900/50 border border-red-800 text-red-200 flex items-start">
                                    <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                    <div className="text-sm">
                                        <p>{error}</p>
                                        {error.includes('already exists') && (
                                            <Link 
                                                to="/login" 
                                                className="text-blue-300 hover:text-blue-200 underline mt-1 inline-block"
                                            >
                                                Login to your account
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {/* Role Selection */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-gray-300 mb-3">
                                        Choose your role:
                                    </label>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() => setSelectedRole('requester')}
                                            className={`p-4 rounded-lg border transition-all text-left ${selectedRole === 'requester'
                                                    ? 'border-blue-500 bg-blue-900/20 text-white'
                                                    : 'border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <div className="font-medium">Requester</div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                I want to post jobs and hire talent
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => setSelectedRole('applicant')}
                                            className={`p-4 rounded-lg border transition-all text-left ${selectedRole === 'applicant'
                                                    ? 'border-blue-500 bg-blue-900/20 text-white'
                                                    : 'border-gray-700 hover:border-gray-600 text-gray-300 hover:bg-gray-800/50'
                                                }`}
                                        >
                                            <div className="font-medium">Applicant</div>
                                            <div className="text-sm text-gray-400 mt-1">
                                                I want to find job opportunities
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-700"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-gray-900 text-gray-400">
                                            Sign up with
                                        </span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGoogleSignUp}
                                    disabled={isLoading || !selectedRole || loading}
                                    className={`group relative w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-700 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 ${isLoading || loading
                                            ? 'bg-gray-800 cursor-not-allowed text-gray-400'
                                            : !selectedRole
                                                ? 'bg-gray-800 cursor-not-allowed text-gray-500'
                                                : 'bg-gray-800 hover:bg-gray-700 hover:border-gray-600 text-white'
                                        }`}
                                >
                                    {isLoading || loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Creating account...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="flex items-center">
                                                <FcGoogle size={20} className="mr-2" />
                                                Continue with Google
                                            </span>
                                            <span className="absolute right-3 inset-y-0 flex items-center">
                                                <ArrowRight
                                                    size={16}
                                                    className="ml-1 group-hover:translate-x-1 transition-transform duration-200"
                                                />
                                            </span>
                                        </>
                                    )}
                                </button>

                                <div className="text-center">
                                    <p className="text-sm text-gray-400">
                                        Already have an account?{' '}
                                        <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                                            Sign in here
                                        </Link>
                                    </p>
                                </div>

                                <div className="text-center text-sm text-gray-400 mt-4">
                                    By signing up, you agree to our{' '}
                                    <Link to="/terms" className="text-blue-400 hover:text-blue-300 hover:underline">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="text-blue-400 hover:text-blue-300 hover:underline">
                                        Privacy Policy
                                    </Link>
                                    .
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
                    <p>© {new Date().getFullYear()} Pravesh. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;