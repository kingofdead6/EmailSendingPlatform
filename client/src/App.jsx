import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [users, setUsers] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [message, setMessage] = useState('');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Dynamic base URL from environment variable
  const API_BASE_URL = 'https://emailsendingplatform.onrender.com';

  // Fetch users and headers on component mount
  useEffect(() => {
    fetchUsers();
    fetchHeaders();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      setMessage('Error fetching users: ' + error.message);
    }
  };

  const fetchHeaders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/headers`);
      setHeaders(response.data.headers || []);
    } catch (error) {
      setMessage('Error fetching headers: ' + error.message);
    }
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      setMessage('Please select a CSV file');
      return;
    }
    const formData = new FormData();
    formData.append('file', csvFile);
    try {
      await axios.post(`${API_BASE_URL}/api/users/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage('Users uploaded successfully');
      fetchUsers();
      fetchHeaders();
      setCsvFile(null);
      setIsCsvModalOpen(false);
    } catch (error) {
      setMessage('Error uploading CSV: ' + error.message);
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/email/send`, {
        subject: emailSubject,
        body: emailBody,
        isHtml,
      });
      setMessage('Emails sent successfully');
      setEmailSubject('');
      setEmailBody('');
      setIsHtml(false);
      setIsEmailModalOpen(false);
    } catch (error) {
      setMessage('Error sending emails: ' + error.message);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all users?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/users/delete-all`);
        setMessage('All users deleted successfully');
        fetchUsers();
        fetchHeaders();
      } catch (error) {
        setMessage('Error deleting users: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-gray-100 to-teal-50 p-10 font-sans">
      <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl p-10 transition-all duration-300">
        <h1 className="text-5xl font-extrabold text-center text-indigo-900 mb-10 tracking-tight">
          UserSync Dashboard
        </h1>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-8 p-5 rounded-xl text-center font-medium text-lg transition-opacity duration-300 ${
              message.includes('Error')
                ? 'bg-red-100 text-red-800 border border-red-300'
                : 'bg-teal-100 text-teal-800 border border-teal-300'
            }`}
          >
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="cursor-pointer bg-indigo-600 text-white py-3 px-8 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition duration-200 font-semibold shadow-md"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="cursor-pointer bg-teal-600 text-white py-3 px-8 rounded-xl hover:bg-teal-700 focus:ring-4 focus:ring-teal-300 transition duration-200 font-semibold shadow-md"
          >
            Send Email
          </button>
          <button
            onClick={handleDeleteAll}
            className="cursor-pointer bg-red-600 text-white py-3 px-8 rounded-xl hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition duration-200 font-semibold shadow-md"
          >
            Delete All Users
          </button>
        </div>

        {/* User Table */}
        <div className="bg-gray-50 p-8 rounded-xl shadow-inner">
          <h2 className="text-3xl font-semibold text-indigo-900 mb-6">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-indigo-100">
                  {headers.length > 0 ? (
                    headers.map((header, index) => (
                      <th
                        key={index}
                        className="border border-indigo-200 p-4 text-left text-indigo-700 font-medium uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))
                  ) : (
                    <th className="border border-indigo-200 p-4 text-center text-indigo-700">
                      No headers available
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr
                      key={index}
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-indigo-50'
                      } hover:bg-indigo-100 transition duration-150`}
                    >
                      {headers.map((header, hIndex) => (
                        <td key={hIndex} className="border border-indigo-200 p-4 text-gray-700">
                          {user[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={headers.length || 1}
                      className="border border-indigo-200 p-4 text-center text-gray-600"
                    >
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* CSV Upload Modal */}
        {isCsvModalOpen && (
          <div className="fixed inset-0 bg-[#0000004f] backdrop-blur-md flex items-center justify-center transition-opacity duration-300">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-900">Upload Users (CSV)</h2>
              <form onSubmit={handleCsvUpload} className="flex flex-col gap-5">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition duration-200"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="cursor-pointer bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-300 transition duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer bg-indigo-600 text-white py-2 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-300 transition duration-200 font-medium"
                  >
                    Upload
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Email Modal */}
        {isEmailModalOpen && (
          <div className="fixed inset-0 bg-[#0000004f] backdrop-blur-md  flex items-center justify-center transition-opacity duration-300">
            <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl transform transition-all duration-300 scale-100">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-900">Send Email to All Users</h2>
              <form onSubmit={handleSendEmail} className="flex flex-col gap-5">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isHtml}
                    onChange={() => setIsHtml(!isHtml)}
                    className="cursor-pointer h-5 w-5 text-indigo-600 focus:ring-indigo-300"
                  />
                  <label className="ml-2 text-gray-700 font-medium">Send as HTML</label>
                </div>
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition duration-200"
                />
                <textarea
                  placeholder={isHtml ? "Enter HTML content" : "Enter plain text email"}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="border border-gray-300 p-3 rounded-lg h-48 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 transition duration-200"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="cursor-pointer bg-gray-200 text-gray-800 py-2 px-6 rounded-lg hover:bg-gray-300 focus:ring-2 focus:ring-gray-300 transition duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer bg-teal-600 text-white py-2 px-6 rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-300 transition duration-200 font-medium"
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;