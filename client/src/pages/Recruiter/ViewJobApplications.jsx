import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

const ViewJobApplications = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, apiCall } = useContext(AuthContext);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [expandedJob, setExpandedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "requester") {
      toast.error("You are not authorized to view this page.");
      navigate("/home");
      return;
    }

    const fetchJobs = async () => {
      setLoading(true);
      try {
        const data = await apiCall("/jobs/my-postings");
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err.message || "Failed to load job postings.");
        toast.error(err.message || "Failed to load job postings.");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [user, apiCall, navigate]);

  const toggleJobExpansion = (jobId) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const handleStatusUpdate = async (jobId, applicationId, newStatus) => {
    try {
      await apiCall(`/jobs/${jobId}/applications/${applicationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success("Application status updated successfully!");
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId
            ? {
                ...job,
                applications: job.applications.map((app) =>
                  app.id === applicationId ? { ...app, status: newStatus } : app
                ),
              }
            : job
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err.message || "Failed to update application status.");
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
            My Job Postings
          </h2>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-black">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              View Job Applications
            </h1>
            <p className="text-gray-400 text-lg mb-10">
              Review your job postings and manage candidate applications below.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-900 border border-red-800 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center p-8 text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-2">Loading...</span>
              </div>
            ) : jobs.length === 0 ? (
              <p className="text-gray-400 text-center">No job postings found.</p>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => toggleJobExpansion(job.id)}
                    >
                      <div>
                        <h4 className="font-bold text-lg mb-2">{job.title}</h4>
                        <p className="text-gray-400 mb-2">{job.company}</p>
                        <p className="text-gray-500 mb-2">Location: {job.location}</p>
                        <p className="text-gray-500">Posted on: {new Date(job.createdAt).toLocaleDateString()}</p>
                      </div>
                      {expandedJob === job.id ? (
                        <ChevronUp size={24} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={24} className="text-gray-400" />
                      )}
                    </div>

                    {expandedJob === job.id && (
                      <div className="mt-4 border-t border-gray-800 pt-4">
                        <h5 className="font-bold mb-4">Applications</h5>
                        {job.applications && job.applications.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4">
                            {job.applications.map((app) => (
                              <div
                                key={app.id}
                                className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-gray-300 font-medium">
                                      {app.applicantName || app.applicantEmail}
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                      Applied on: {new Date(app.appliedAt).toLocaleDateString()}
                                    </p>
                                    <span
                                      className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
                                        app.status === "Offer"
                                          ? "bg-green-600 text-white"
                                          : app.status === "Interview"
                                          ? "bg-blue-600 text-white"
                                          : app.status === "Rejected"
                                          ? "bg-red-600 text-white"
                                          : "bg-yellow-600 text-white"
                                      }`}
                                    >
                                      {app.status}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    {app.status !== "Interview" && (
                                      <button
                                        onClick={() => handleStatusUpdate(job.id, app.id, "Interview")}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                      >
                                        Set to Interview
                                      </button>
                                    )}
                                    {app.status !== "Offer" && (
                                      <button
                                        onClick={() => handleStatusUpdate(job.id, app.id, "Offer")}
                                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                                      >
                                        Offer
                                      </button>
                                    )}
                                    {app.status !== "Rejected" && (
                                      <button
                                        onClick={() => handleStatusUpdate(job.id, app.id, "Rejected")}
                                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                                      >
                                        Reject
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {app.pdfUrl && (
                                  <a
                                    href={app.pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-flex items-center text-blue-400 hover:text-blue-300"
                                  >
                                    <FileText size={16} className="mr-1" />
                                    View Resume
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">No applications for this job yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
          <p>© 2025 Job Portal - Empowering your career journey</p>
        </div>
      </div>
    </div>
  );
};

export default ViewJobApplications;