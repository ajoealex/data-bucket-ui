import { useState, useEffect } from 'react';
import ConnectForm from './ConnectForm';
import Dashboard from './Dashboard';

export default function App() {
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('dataBucketUrl');
    const savedUsername = localStorage.getItem('dataBucketUsername');
    const savedPassword = localStorage.getItem('dataBucketPassword');

    if (savedUrl) {
      setConnection({
        url: savedUrl,
        username: savedUsername || '',
        password: savedPassword || ''
      });
    }
  }, []);

  const handleConnect = (connectionData) => {
    setConnection(connectionData);
  };

  const handleDisconnect = () => {
    localStorage.removeItem('dataBucketUrl');
    localStorage.removeItem('dataBucketUsername');
    localStorage.removeItem('dataBucketPassword');
    setConnection(null);
  };

  if (!connection) {
    return <ConnectForm onConnect={handleConnect} />;
  }

  return <Dashboard connection={connection} onDisconnect={handleDisconnect} />;
}
