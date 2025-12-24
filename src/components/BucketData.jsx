import { useState, useEffect } from 'react';

export default function BucketData({ bucketId, bucketName, connection, onBack, onDisconnect }) {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const apiCall = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(connection.username && connection.password && {
        'Authorization': 'Basic ' + btoa(`${connection.username}:${connection.password}`)
      })
    };

    const response = await fetch(`${connection.url}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  };

  const loadBucketData = async () => {
    try {
      const data = await apiCall(`/api/v1/bucket_data/${bucketId}?cleanup=false`);
      setRequests(Array.isArray(data) ? data : []);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load bucket data:', error);
      setIsLoading(false);
    }
  };

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all data from this bucket?')) return;

    try {
      await apiCall(`/api/v1/bucket_data/${bucketId}`, { method: 'DELETE' });
      setRequests([]);
      setSelectedRequest(null);
    } catch (error) {
      alert('Failed to clear bucket data: ' + error.message);
    }
  };

  useEffect(() => {
    loadBucketData();

    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        loadBucketData();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bucketId, autoRefresh]);

  const getMethodColor = (method) => {
    const colors = {
      GET: 'bg-green-600',
      POST: 'bg-yellow-600',
      PUT: 'bg-blue-600',
      PATCH: 'bg-violet-600',
      DELETE: 'bg-red-600',
      HEAD: 'bg-lime-600',
      OPTIONS: 'bg-purple-600'
    };
    return colors[method] || 'bg-gray-600';
  };

  // Comprehensive search filter function
  const filterRequests = (requests, query) => {
    if (!query || query.trim() === '') {
      return requests;
    }

    const searchTerm = query.toLowerCase();

    return requests.filter((request) => {
      // Search in endpoint/URL
      if (request.endpoint && request.endpoint.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in method
      if (request.method && request.method.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in IP address
      if (request.ip && request.ip.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in headers (both keys and values)
      if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
          const headerKey = key.toLowerCase();
          const headerValue = typeof value === 'object' ? JSON.stringify(value).toLowerCase() : String(value).toLowerCase();

          if (headerKey.includes(searchTerm) || headerValue.includes(searchTerm)) {
            return true;
          }
        }
      }

      // Search in query parameters (both keys and values)
      if (request.query) {
        for (const [key, value] of Object.entries(request.query)) {
          const queryKey = key.toLowerCase();
          const queryValue = typeof value === 'object' ? JSON.stringify(value).toLowerCase() : String(value).toLowerCase();

          if (queryKey.includes(searchTerm) || queryValue.includes(searchTerm)) {
            return true;
          }
        }
      }

      // Search in payload
      if (request.payload) {
        const payloadStr = typeof request.payload === 'object'
          ? JSON.stringify(request.payload).toLowerCase()
          : String(request.payload).toLowerCase();

        if (payloadStr.includes(searchTerm)) {
          return true;
        }
      }

      return false;
    });
  };

  const filteredRequests = filterRequests(requests, searchQuery);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-8 py-5">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="w-10 h-10 border-2 border-gray-200 bg-white rounded-lg flex items-center justify-center text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
              title="Back to buckets"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </button>

            <nav className="flex items-center text-sm flex-1">
              <button
                onClick={onBack}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                Buckets
              </button>
              <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-gray-900 font-semibold">{bucketName}</span>
            </nav>

            <div className="flex gap-3 items-center">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="cursor-pointer"
                />
                <span>Auto-refresh</span>
              </label>
              <button
                onClick={clearData}
                className="px-5 py-2.5 bg-white border-2 border-red-200 rounded-lg text-red-700 font-semibold transition-all hover:bg-red-50"
              >
                Clear Data
              </button>
              <button
                onClick={onDisconnect}
                className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-semibold transition-all hover:border-gray-300 hover:bg-gray-50"
              >
                Disconnect
              </button>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{bucketName}</h1>
            <p className="text-sm text-gray-600 font-mono">ID: {bucketId}</p>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 min-h-[calc(100vh-140px)]">
        <div className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden max-h-[400px] lg:max-h-none">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                Requests ({filteredRequests.length}{filteredRequests.length !== requests.length && ` of ${requests.length}`})
              </h2>
              <button
                onClick={loadBucketData}
                className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-50 rounded-md flex items-center justify-center text-gray-700 transition-all hover:bg-gray-200"
                title="Refresh"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="sm:w-4 sm:h-4">
                  <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                  <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                </svg>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in URL, headers, params, payload..."
                className="w-full px-3 py-2 pl-9 text-xs sm:text-sm border-2 border-gray-200 rounded-lg transition-all outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 placeholder-gray-400"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-15 text-gray-600">
              <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-3 sm:mb-4"></div>
              <p className="text-sm sm:text-base">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-15 text-gray-300 text-center">
              <svg width="48" height="48" viewBox="0 0 60 60" fill="none" className="mb-2 sm:mb-3 sm:w-15 sm:h-15">
                <rect x="10" y="15" width="40" height="30" rx="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M15 25 L45 25" stroke="currentColor" strokeWidth="2"/>
                <circle cx="30" cy="35" r="4" fill="currentColor" opacity="0.3"/>
              </svg>
              <p className="text-sm sm:text-base text-gray-600 mb-1">No requests captured yet</p>
              <p className="text-xs sm:text-sm text-gray-400">Send data to this bucket's endpoint</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-15 text-gray-300 text-center">
              <svg width="48" height="48" viewBox="0 0 60 60" fill="none" className="mb-2 sm:mb-3 sm:w-15 sm:h-15">
                <path d="M30 10 L50 30 L30 50 L10 30 Z" stroke="currentColor" strokeWidth="2" fill="none"/>
                <circle cx="30" cy="30" r="3" fill="currentColor" opacity="0.3"/>
              </svg>
              <p className="text-sm sm:text-base text-gray-600 mb-1">No matching requests found</p>
              <p className="text-xs sm:text-sm text-gray-400">Try a different search term</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-2">
              {[...filteredRequests].reverse().map((request) => {
                const index = requests.indexOf(request);
                return (
                  <div
                    key={index}
                    className={`p-3 sm:p-4 border-2 rounded-lg mb-2 cursor-pointer transition-all ${
                      selectedRequest === index
                        ? 'border-purple-600 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRequest(index)}
                  >
                    <div className="flex justify-between items-center mb-1.5 sm:mb-2">
                      <span className={`px-2 sm:px-2.5 py-0.5 sm:py-1 ${getMethodColor(request.method)} text-white rounded text-[10px] sm:text-xs font-bold font-mono tracking-wide`}>
                        {request.method}
                      </span>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-semibold">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-600 mb-1">
                      {new Date(request.timestamp).toLocaleString()}
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-700 font-mono break-all">
                      {request.endpoint}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden">
          {selectedRequest === null ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-20 text-gray-300">
              <svg width="60" height="60" viewBox="0 0 80 80" fill="none" className="mb-4 sm:mb-6 sm:w-20 sm:h-20">
                <rect x="15" y="20" width="50" height="40" rx="4" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3"/>
                <path d="M25 35 L55 35" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M25 45 L50 45" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                <path d="M25 52 L45 52" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
              </svg>
              <p className="text-sm sm:text-base text-gray-600">Select a request to view details</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="flex justify-between items-start mb-4 sm:mb-8 pb-3 sm:pb-5 border-b-2 border-gray-200">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Request Details</h2>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {new Date(requests[selectedRequest].timestamp).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`px-2 py-1 sm:px-4 sm:py-2 ${getMethodColor(requests[selectedRequest].method)} text-white rounded-md text-xs sm:text-sm font-bold font-mono tracking-wider sm:tracking-widest`}>
                  {requests[selectedRequest].method}
                </span>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <section>
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4">General</h3>
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="flex flex-col sm:flex-row py-2 sm:py-2.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-0 sm:w-36 sm:flex-shrink-0">Method:</span>
                      <span className="text-xs sm:text-sm text-gray-900 break-all">{requests[selectedRequest].method}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-2 sm:py-2.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-0 sm:w-36 sm:flex-shrink-0">Endpoint:</span>
                      <span className="text-xs sm:text-sm text-gray-900 bg-gray-50 px-2 py-1 rounded font-mono break-all">
                        {requests[selectedRequest].endpoint}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-2 sm:py-2.5 border-b border-gray-100">
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-0 sm:w-36 sm:flex-shrink-0">IP Address:</span>
                      <span className="text-xs sm:text-sm text-gray-900 break-all">{requests[selectedRequest].ip}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row py-2 sm:py-2.5">
                      <span className="text-xs sm:text-sm font-semibold text-gray-600 mb-1 sm:mb-0 sm:w-36 sm:flex-shrink-0">Timestamp:</span>
                      <span className="text-xs sm:text-sm text-gray-900 break-all">{requests[selectedRequest].timestamp}</span>
                    </div>
                  </div>
                </section>

                {requests[selectedRequest].headers && Object.keys(requests[selectedRequest].headers).length > 0 && (
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Headers</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Header
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(requests[selectedRequest].headers).map(([key, value]) => (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono text-gray-900 break-all">
                                {key}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-700 break-all">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {requests[selectedRequest].query && Object.keys(requests[selectedRequest].query).length > 0 && (
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Query Parameters</h3>
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Key
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(requests[selectedRequest].query).map(([key, value]) => (
                            <tr key={key} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-mono text-gray-900 break-all">
                                {key}
                              </td>
                              <td className="px-4 py-3 text-sm font-mono text-gray-700 break-all">
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                )}

                {requests[selectedRequest].payload && (
                  <section>
                    <h3 className="text-base font-semibold text-gray-900 mb-4">
                      Payload
                      {requests[selectedRequest].payload_type && (
                        <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {requests[selectedRequest].payload_type}
                        </span>
                      )}
                    </h3>
                    {(() => {
                      const payloadType = requests[selectedRequest].payload_type;
                      const payload = requests[selectedRequest].payload;

                      // Show as table for form-urlencoded and multipart-form-data
                      if ((payloadType === 'form-urlencoded' || payloadType === 'multipart-form-data') && typeof payload === 'object' && !Array.isArray(payload)) {
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Field
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Value
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {Object.entries(payload).map(([key, value]) => (
                                  <tr key={key} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-mono text-gray-900 break-all">
                                      {key}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-mono text-gray-700 break-all">
                                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      } else {
                        // Show as code block for JSON, XML, text, binary
                        return (
                          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                              {typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2)}
                            </pre>
                          </div>
                        );
                      }
                    })()}
                  </section>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
