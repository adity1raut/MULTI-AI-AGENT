import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, Upload } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

const JobPostingForm = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, apiCall } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    description: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      if (file.size <= 5 * 1024 * 1024) { // 5MB limit
        setPdfFile(file);
        setError("");
      } else {
        setError("PDF file size must be less than 5MB.");
        setPdfFile(null);
      }
    } else {
      setError("Please upload a valid PDF file.");
      setPdfFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || user.role !== "requester") {
      toast.error("You are not authorized to post jobs.");
      return;
    }

    if (!formData.title || !formData.company || !formData.location || !formData.description) {
      setError("All text fields are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const jobData = new FormData();
      jobData.append("title", formData.title);
      jobData.append("company", formData.company);
      jobData.append("location", formData.location);
      jobData.append("description", formData.description);
      if (pdfFile) {
        jobData.append("pdf", pdfFile);
      }

      await fetch("http://localhost:5050/jobs/post", {
        method: "POST",
        body: jobData,
      });

      toast.success("Job posted successfully!");
      setFormData({ title: "", company: "", location: "", description: "" });
      setPdfFile(null);
      navigate("/my-jobs");
    } catch (err) {
      console.error("Job posting error:", err);
      setError(err.message || "Failed to post job. Please try again.");
      toast.error(err.message || "Failed to post job.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <ToastContainer />
      <div className="sticky top-0 h-screen bg-black">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
        <div className="p-6 border-b border-gray-800 bg-black">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Post a New Job
          </h2>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-black">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Create Job Posting
            </h1>
            <p className="text-gray-400 text-lg mb-10">
              Fill out the details below to post a new job opportunity. You can provide details in text or upload a PDF.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-800 rounded-lg text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg">
                  <Briefcase size={18} className="ml-3 text-gray-500" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-transparent text-white focus:outline-none"
                    placeholder="Enter job title"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                  Company
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg">
                  <Briefcase size={18} className="ml-3 text-gray-500" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-transparent text-white focus:outline-none"
                    placeholder="Enter company name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">
                  Location
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg">
                  <Briefcase size={18} className="ml-3 text-gray-500" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-transparent text-white focus:outline-none"
                    placeholder="Enter job location"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Job Description
                </label>
                <div className="flex bg-gray-900 border border-gray-800 rounded-lg">
                  <FileText size={18} className="ml-3 mt-3 text-gray-500" />
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-transparent text-white focus:outline-none resize-y"
                    placeholder="Enter job description"
                    rows={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pdf" className="block text-sm font-medium text-gray-300 mb-2">
                  Upload PDF (Optional)
                </label>
                <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-3">
                  <Upload size={18} className="mr-2 text-gray-500" />
                  <input
                    type="file"
                    id="pdf"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                  />
                </div>
                {pdfFile && (
                  <p className="mt-2 text-sm text-gray-400">Selected file: {pdfFile.name}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full p-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02] ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
          <p>© 2025 Job Portal - Empowering your career journey</p>
        </div>
      </div>
    </div>
  );
};

export default JobPostingForm;