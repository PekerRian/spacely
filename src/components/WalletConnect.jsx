
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/wallet.css';

export function WalletConnect() {
  const { 
    connect,
    disconnect,
    account,
    connected,
    wallet: activeWallet,
    wallets = [], // Provide default empty array
    isLoading
  } = useWallet() || {}; // Provide default empty object
  
  // Ensure all values are available
  const safeWallets = useMemo(() => Array.isArray(wallets) ? wallets : [], [wallets]);
  const isConnected = Boolean(connected && account);
  const displayAddress = account?.address;

  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddressMenu, setShowAddressMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowAddressMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnect = async (wallet) => {
    try {
      setError(null);
      
      // If wallet has a deeplinkProvider (for mobile), use it
      if ("deeplinkProvider" in wallet && wallet.deeplinkProvider) {
        window.location.href = `${wallet.deeplinkProvider}?link=${window.location.href}`;
        return;
      }
      
      // Otherwise connect normally
      await connect(wallet.name);
      setShowModal(false);
    } catch (err) {
      const message = err.message || 'Failed to connect wallet';
      setError(message);
      console.error('Wallet connection error:', { name: err.name, message });
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setError(null);
      setShowAddressMenu(false);
    } catch (err) {
      setError(err.message || 'Failed to disconnect wallet');
      console.error(err);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    const addr = address.toString();
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-container">
      {error && <div className="error">{error}</div>}
      
      <button 
        ref={buttonRef}
        className={`login-button ${connected ? 'connected' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={() => !connected ? setShowModal(true) : setShowAddressMenu(!showAddressMenu)}
        disabled={isLoading}
      >
        <span className="login-icon">
          {isLoading ? '⌛' : connected ? '👤' : '👥'}
        </span>
        {isLoading 
          ? 'Connecting...'
          : connected 
            ? formatAddress(account?.address)
            : 'Connect Wallet'
        }
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="wallet-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
            <h2 className="modal-title">Connect Wallet</h2>
            
            {error && (
              <div className="error">
                {error}
              </div>
            )}

            <div className="wallet-section">
              <h3 className="wallet-section-title">Available Wallets</h3>
              {safeWallets.length > 0 ? (
                safeWallets.map((wallet) => (
                  <button
                    key={wallet.name}
                    className={`wallet-option ${activeWallet?.name === wallet.name ? 'active' : ''}`}
                    onClick={() => handleConnect(wallet)}
                  >
                    {wallet.icon && <img src={wallet.icon} alt={wallet.name} className="social-icon" />}
                    <span className="wallet-option-text">{wallet.name}</span>
                  </button>
                ))
              ) : (
                <div className="no-wallets-message">
                  No wallets detected. Please install a supported wallet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddressMenu && connected && !error && (
        <div 
          ref={menuRef}
          className="address-menu"
        >
          <div 
            className="menu-item"
            onClick={() => {
              navigator.clipboard.writeText(account?.address);
              setShowAddressMenu(false);
            }}
          >
            Copy Address
          </div>
          <div 
            className="menu-item"
            onClick={() => {
              handleDisconnect();
              setShowAddressMenu(false);
            }}
          >
            Disconnect
          </div>
        </div>
      )}
    </div>
  );
}
