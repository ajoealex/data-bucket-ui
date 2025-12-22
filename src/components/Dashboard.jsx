import { useState, useEffect } from 'react';
import BucketData from './BucketData';

export default function Dashboard({ connection, onDisconnect }) {
  const [buckets, setBuckets] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBucket, setEditingBucket] = useState(null);
  const [currentView, setCurrentView] = useState('list');
  const [selectedBucketId, setSelectedBucketId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

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

  const loadBuckets = async () => {
    try {
      setIsLoading(true);
      const response = await apiCall('/api/v1/buckets');
      setBuckets(response.buckets || {});
    } catch (error) {
      console.error('Failed to load buckets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBuckets();

    const interval = setInterval(() => {
      loadBuckets();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const createBucket = async (name, mockResponse, mockHeaders, mockStatusCode, mockResponseType) => {
    try {
      const result = await apiCall('/api/v1/create_bucket', {
        method: 'POST',
        body: JSON.stringify({
          name,
          mock_response: mockResponse || {},
          mock_headers: mockHeaders || {},
          mock_status_code: mockStatusCode || 200,
          mock_response_type: mockResponseType || 'json'
        })
      });

      setBuckets(prev => ({
        ...prev,
        [result.bucket_id]: {
          name,
          mock_response: mockResponse || {},
          mock_headers: mockHeaders || {},
          mock_status_code: mockStatusCode || 200,
          mock_response_type: mockResponseType || 'json'
        }
      }));

      setShowCreateModal(false);
    } catch (error) {
      alert('Failed to create bucket: ' + error.message);
    }
  };

  const updateBucket = async (bucketId, updates) => {
    try {
      await apiCall(`/api/v1/bucket/${bucketId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });

      setBuckets(prev => ({
        ...prev,
        [bucketId]: {
          ...prev[bucketId],
          ...updates
        }
      }));

      setShowEditModal(false);
      setEditingBucket(null);
    } catch (error) {
      alert('Failed to update bucket: ' + error.message);
    }
  };

  const deleteBucket = async (bucketId) => {
    if (!confirm('Are you sure you want to delete this bucket?')) return;

    try {
      await apiCall(`/api/v1/bucket/${bucketId}/clean`, { method: 'DELETE' });
      setBuckets(prev => {
        const newBuckets = { ...prev };
        delete newBuckets[bucketId];
        return newBuckets;
      });
    } catch (error) {
      alert('Failed to delete bucket: ' + error.message);
    }
  };

  const openBucket = (bucketId) => {
    setSelectedBucketId(bucketId);
    setCurrentView('data');
  };

  const openEditModal = (bucketId) => {
    setEditingBucket({ id: bucketId, ...buckets[bucketId] });
    setShowEditModal(true);
  };

  const backToList = () => {
    setCurrentView('list');
    setSelectedBucketId(null);
    loadBuckets();
  };

  const copyEndpoint = (e, bucketId) => {
    e.stopPropagation();
    const fullEndpoint = `${connection.url}/api/v1/bucket_data/${bucketId}/data`;
    navigator.clipboard.writeText(fullEndpoint).then(() => {
      setCopiedId(bucketId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy endpoint:', err);
      alert('Failed to copy to clipboard');
    });
  };

  if (currentView === 'data' && selectedBucketId) {
    return (
      <BucketData
        bucketId={selectedBucketId}
        bucketName={buckets[selectedBucketId]?.name}
        connection={connection}
        onBack={backToList}
        onDisconnect={onDisconnect}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Data Bucket</h1>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
              Connected to {connection.url}
            </span>
          </div>
          <button
            onClick={onDisconnect}
            className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-semibold transition-all hover:border-gray-300 hover:bg-gray-50"
          >
            Disconnect
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Buckets</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            + Create New Bucket
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading buckets...</p>
          </div>
        ) : Object.keys(buckets).length === 0 ? (
          <div className="bg-white rounded-2xl p-20 text-center shadow-sm">
            <div className="text-gray-300 mb-6">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
                <rect x="10" y="20" width="60" height="50" rx="5" stroke="currentColor" strokeWidth="3" fill="none"/>
                <path d="M20 35 L60 35" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                <circle cx="40" cy="50" r="8" fill="currentColor" opacity="0.3"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No buckets yet</h3>
            <p className="text-gray-600 mb-8">Create your first bucket to start capturing webhook data</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-7 py-3.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Your First Bucket
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(buckets).map(([id, bucket]) => (
              <div
                key={id}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 transition-all hover:border-gray-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
              >
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-xl font-bold text-gray-900 flex-1">{bucket.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(id)}
                      className="w-8 h-8 bg-blue-50 text-blue-700 rounded-md flex items-center justify-center transition-all hover:bg-blue-100"
                      title="Edit bucket"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.25.25 0 0 0-.064.108l-.558 1.953 1.953-.558a.249.249 0 0 0 .108-.064l6.286-6.286Z"/>
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteBucket(id)}
                      className="w-8 h-8 bg-red-50 text-red-700 rounded-md flex items-center justify-center transition-all hover:bg-red-200"
                      title="Delete bucket"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-5 flex-1">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Bucket ID:</span>
                    <code className="text-sm text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded block break-all font-mono">
                      {id}
                    </code>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Endpoint:</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-700 bg-gray-50 px-2.5 py-1.5 rounded block break-all font-mono flex-1">
                        {connection.url}/api/v1/bucket_data/{id}/data
                      </code>
                      <button
                        onClick={(e) => copyEndpoint(e, id)}
                        className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                          copiedId === id
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                        }`}
                        title={copiedId === id ? "Copied!" : "Copy full endpoint URL"}
                      >
                        {copiedId === id ? (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                            <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Created:</span>
                    <span className="text-sm text-gray-700">
                      {bucket.created_at ? new Date(bucket.created_at).toLocaleString() : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Requests:</span>
                    <span className="text-sm text-gray-700">
                      {bucket.request_count || 0} / {bucket.max_requests || '∞'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Last Request:</span>
                    <span className="text-sm text-gray-700">
                      {bucket.last_request_at ? new Date(bucket.last_request_at).toLocaleString() : 'None'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openBucket(id)}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  Open Bucket
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <BucketModal
          title="Create New Bucket"
          onClose={() => setShowCreateModal(false)}
          onSubmit={createBucket}
          existingBuckets={buckets}
        />
      )}

      {showEditModal && editingBucket && (
        <BucketModal
          title="Edit Bucket"
          initialData={editingBucket}
          onClose={() => {
            setShowEditModal(false);
            setEditingBucket(null);
          }}
          onSubmit={(name, mockResponse, mockHeaders, mockStatusCode, mockResponseType) => {
            updateBucket(editingBucket.id, {
              name,
              mock_response: mockResponse,
              mock_headers: mockHeaders,
              mock_status_code: mockStatusCode,
              mock_response_type: mockResponseType
            });
          }}
          existingBuckets={buckets}
        />
      )}
    </div>
  );
}

function BucketModal({ title, initialData, onClose, onSubmit, existingBuckets }) {
  const [name, setName] = useState(initialData?.name || '');
  const [mockResponseType, setMockResponseType] = useState(initialData?.mock_response_type || 'json');
  const [mockResponse, setMockResponse] = useState(() => {
    if (!initialData?.mock_response) {
      return '{"message": "Success"}';
    }
    // If response type is json and mock_response is an object, stringify it
    if ((initialData.mock_response_type === 'json' || !initialData.mock_response_type) && typeof initialData.mock_response === 'object') {
      return JSON.stringify(initialData.mock_response, null, 2);
    }
    // Otherwise, it's already a string (xml or text)
    return initialData.mock_response;
  });
  const [mockStatusCode, setMockStatusCode] = useState((initialData?.mock_status_code || 200).toString());
  const [nameError, setNameError] = useState('');

  // Update mock response when response type changes (only if creating new bucket)
  const handleResponseTypeChange = (newType) => {
    setMockResponseType(newType);

    // Only update content if this is a new bucket (no initialData) or if user hasn't customized the content
    if (!initialData || mockResponse === '{"message": "Success"}' ||
        mockResponse === '<?xml version="1.0"?>\n<response>\n  <message>Success</message>\n</response>' ||
        mockResponse === 'Success message') {
      if (newType === 'json') {
        setMockResponse('{"message": "Success"}');
      } else if (newType === 'xml') {
        setMockResponse('<?xml version="1.0"?>\n<response>\n  <message>Success</message>\n</response>');
      } else if (newType === 'text') {
        setMockResponse('ok recieved!');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setNameError('');

    // Check for duplicate bucket name (only when creating new bucket or changing name)
    if (existingBuckets) {
      const isDuplicate = Object.values(existingBuckets).some(bucket => {
        // When editing, allow the same name if it's the current bucket
        if (initialData && bucket.name === initialData.name) {
          return name !== initialData.name && bucket.name === name;
        }
        return bucket.name === name;
      });

      if (isDuplicate) {
        setNameError('A bucket with this name already exists. Please choose a different name.');
        return;
      }
    }

    try {
      let parsedResponse;
      if (mockResponseType === 'json') {
        parsedResponse = JSON.parse(mockResponse);
      } else {
        // For xml and text, send as string
        parsedResponse = mockResponse;
      }
      onSubmit(name, parsedResponse, {}, parseInt(mockStatusCode), mockResponseType);
    } catch (error) {
      alert('Invalid JSON in mock response');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-5" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl animate-modalSlide" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-50 rounded-md text-gray-600 text-2xl flex items-center justify-center transition-all hover:bg-gray-200 hover:text-gray-900"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Bucket Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder="My Webhook Bucket"
              required
              className={`w-full px-3 py-3 border-2 rounded-lg transition-all outline-none ${
                nameError
                  ? 'border-red-500 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                  : 'border-gray-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100'
              }`}
            />
            {nameError && (
              <p className="mt-2 text-sm text-red-600 font-medium">{nameError}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Response Type
            </label>
            <select
              value={mockResponseType}
              onChange={(e) => handleResponseTypeChange(e.target.value)}
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg transition-all outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            >
              <option value="json">JSON (application/json)</option>
              <option value="xml">XML (application/xml)</option>
              <option value="text">Plain Text (text/plain)</option>
            </select>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mock Response {mockResponseType === 'json' ? '(JSON)' : mockResponseType === 'xml' ? '(XML)' : '(Text)'}
            </label>
            <textarea
              value={mockResponse}
              onChange={(e) => setMockResponse(e.target.value)}
              rows={6}
              placeholder={mockResponseType === 'json' ? '{"message": "Success"}' : mockResponseType === 'xml' ? '<?xml version="1.0"?>\n<response>\n  <message>Success</message>\n</response>' : 'Success message'}
              required
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg font-mono resize-y transition-all outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mock Status Code
            </label>
            <input
              type="number"
              value={mockStatusCode}
              onChange={(e) => setMockStatusCode(e.target.value)}
              placeholder="200"
              required
              className="w-full px-3 py-3 border-2 border-gray-200 rounded-lg transition-all outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-semibold transition-all hover:border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {initialData ? 'Update Bucket' : 'Create Bucket'}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes modalSlide {
            from {
              opacity: 0;
              transform: translateY(-30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-modalSlide {
            animation: modalSlide 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
