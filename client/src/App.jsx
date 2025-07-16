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

  // Fetch users and headers on component mount
  useEffect(() => {
    fetchUsers();
    fetchHeaders();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      setMessage('Error fetching users: ' + error.message);
    }
  };

  const fetchHeaders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/headers');
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
      await axios.post('http://localhost:5000/api/users/upload', formData, {
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
      await axios.post('http://localhost:5000/api/email/send', {
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
        await axios.delete('http://localhost:5000/api/users/delete-all');
        setMessage('All users deleted successfully');
        fetchUsers();
        fetchHeaders();
      } catch (error) {
        setMessage('Error deleting users: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-8 font-sans">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">User Management Dashboard</h1>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-center ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Upload CSV
          </button>
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition duration-200"
          >
            Send Email
          </button>
          <button
            onClick={handleDeleteAll}
            className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-700 transition duration-200"
          >
            Delete All Users
          </button>
        </div>

        {/* User Table */}
        <div className="bg-gray-50 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-100">
                  {headers.length > 0 ? (
                    headers.map((header, index) => (
                      <th key={index} className="border border-gray-300 p-3 text-left text-gray-600">
                        {header}
                      </th>
                    ))
                  ) : (
                    <th className="border border-gray-300 p-3 text-center">No headers available</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user, index) => (
                    <tr key={index} className="hover:bg-blue-50 transition duration-150">
                      {headers.map((header, hIndex) => (
                        <td key={hIndex} className="border border-gray-300 p-3">
                          {user[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length || 1} className="border border-gray-300 p-3 text-center text-gray-600">
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Upload Users (CSV)</h2>
              <form onSubmit={handleCsvUpload} className="flex flex-col gap-4">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="border border-gray-300 p-2 rounded-lg"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCsvModalOpen(false)}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">Send Email to All Users</h2>
              <form onSubmit={handleSendEmail} className="flex flex-col gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isHtml}
                    onChange={() => setIsHtml(!isHtml)}
                    className="mr-2"
                  />
                  <label className="text-gray-600">Send as HTML</label>
                </div>
                <input
                  type="text"
                  placeholder="Email Subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg"
                />
                <textarea
                  placeholder={isHtml ? "Enter HTML content" : "Enter plain text email"}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="border border-gray-300 p-2 rounded-lg h-40"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition duration-200"
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