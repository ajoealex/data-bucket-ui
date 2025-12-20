import { useState } from 'react';

export default function ConnectForm({ onConnect }) {
  const [url, setUrl] = useState('http://localhost:8080');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsConnecting(true);

    try {
      const response = await fetch(`${url}/api/v1/ping`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(username && password && {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
          })
        },
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();

      if (data.status === 'ok') {
        localStorage.setItem('dataBucketUrl', url);
        localStorage.setItem('dataBucketUsername', username);
        localStorage.setItem('dataBucketPassword', password);
        onConnect({ url, username, password });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError('Failed to connect to Data Bucket API. Please check the URL and credentials.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-purple-900 p-5">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full animate-slideUp">
        <div className="text-center mb-10">
          <div className="inline-block text-purple-600 mb-4 animate-float">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mx-auto">
              <rect x="8" y="16" width="48" height="40" rx="4" stroke="currentColor" strokeWidth="3" fill="none"/>
              <path d="M16 28 L48 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="32" cy="40" r="6" fill="currentColor"/>
              <path d="M8 24 L56 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Bucket</h1>
          <p className="text-gray-600">Connect to your Data Bucket API</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-2">
              API URL
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:8080"
              required
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all outline-none bg-gray-50 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username (optional)"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all outline-none bg-gray-50 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 placeholder-gray-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password (optional)"
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl text-base transition-all outline-none bg-gray-50 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-100 placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm border-l-4 border-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isConnecting}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-xl font-semibold text-base transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
          >
            {isConnecting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Don't have a Data Bucket instance?{' '}
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-purple-600 font-semibold hover:underline">
              Check the docs
            </a>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-slideUp {
          animation: slideUp 0.5s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
