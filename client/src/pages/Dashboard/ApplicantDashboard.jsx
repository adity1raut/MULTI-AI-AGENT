import React, { useState } from "react";
import Sidebar from "../../components/Sidebar";

const ApplicantDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sample job application data
  const applications = [
    { id: 1, title: "Software Engineer", company: "Tech Corp", status: "Applied", date: "2025-06-01" },
    { id: 2, title: "Product Manager", company: "Innovate Inc.", status: "Interview", date: "2025-05-28" },
    { id: 3, title: "Data Analyst", company: "Data Solutions", status: "Rejected", date: "2025-05-20" },
    { id: 4, title: "UX Designer", company: "Creative Labs", status: "Offer", date: "2025-06-05" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="sticky top-0 h-screen bg-black">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>

      <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
        <div className="p-6 border-b border-gray-800 bg-black">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Applicant Dashboard
          </h2>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-black">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Your Job Applications
            </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl">
              Track your job applications, view their status, and apply for new opportunities with ease.
            </p>

            <div className="mb-10">
              <button className="p-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02]">
                Apply for a New Job
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4">Application Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-2">{app.title}</h4>
                  <p className="text-gray-400 mb-2">{app.company}</p>
                  <p className="text-gray-500 mb-2">Applied on: {app.date}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
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
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
          <p>© 2025 Job Portal - Empowering your career journey</p>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDashboard;