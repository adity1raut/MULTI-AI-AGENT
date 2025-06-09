import React, { useState } from "react";
import Sidebar from "../components/Sidebar";

const Landing = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  return (
    <div className="min-h-screen bg-black text-white flex">
      <div className="sticky top-0 h-screen bg-black">
        <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      </div>
      
      <div className={`flex-1 transition-margin duration-200 ease-in-out ${isSidebarOpen ? "ml-64" : "ml-0"} flex flex-col`}>
  
        <div className="p-6 border-b border-gray-800 bg-black">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Welcome to PRAVESH</h2>
        </div>

        <div className="flex-1 p-6 overflow-y-auto bg-black">
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">PRAVESH AI </h1>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl">
            This is a RAG-based AI module to help students get information about colleges, placements, cutoffs, and other details.
            </p>
            
            <div className="max-w-2xl w-full">
              <h3 className="text-xl font-bold mb-4">Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-2">Instant Answers</h4>
                  <p className="text-gray-400">Get immediate responses to your command</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-2">Student help</h4>
                  <p className="text-gray-400">Get information about college cutoffs, academic details, and placement records</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-2">Admin accese</h4>
                  <p className="text-gray-400">College directors can sign up and update their college information in a PDF form</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <h4 className="font-bold mb-2">24/7 Availability</h4>
                  <p className="text-gray-400">Access help whenever you need it, day or night</p>
                </div>
              </div>
            </div>

            {/* <button className="mt-10 p-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02]">
              Start Chatting Now
            </button> */}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-black text-center text-gray-500">
          <p>© 2025 PRAVESH - Empowering students through AI</p>
        </div>
      </div>
    </div>
  );
};

export default Landing;