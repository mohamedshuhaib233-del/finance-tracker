import React, { useState } from 'react';
import { Lock, Fingerprint, Delete, Shield, Crown, Loader2, AlertCircle } from 'lucide-react';

interface AppLockScreenProps {
  correctPin: string;
  onUnlock: () => void;
  userName?: string;
  onSwitchUser?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  correctPin = '0000',
  onUnlock,
  userName = 'User',
  onSwitchUser,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      setErrorMessage('');
      setBiometricStatus(null);
      if (nextPin.length === 4) {
        if (nextPin === correctPin) {
          onUnlock();
        } else {
          setError(true);
          setErrorMessage('Incorrect PIN');
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
    setBiometricStatus(null);
  };

  // Real WebAuthn platform biometric authentication (Windows Hello / Android Fingerprint / Touch ID)
  const handleBiometric = async () => {
    if (isAuthenticating) return;

    setIsAuthenticating(true);
    setError(false);
    setErrorMessage('');
    setBiometricStatus('Touch fingerprint sensor or scan face...');

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometric authentication is not supported by your browser. Please enter your PIN.');
      }

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error('No biometric sensor detected on this device. Please use your PIN.');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const savedCredId = localStorage.getItem('finance_tracker_biometric_id');

      if (savedCredId) {
        // Authenticate existing credential
        const rawId = Uint8Array.from(atob(savedCredId), (c) => c.charCodeAt(0));
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            allowCredentials: [
              {
                id: rawId,
                type: 'public-key',
              },
            ],
            userVerification: 'required',
            timeout: 60000,
          },
        });

        if (assertion) {
          setBiometricStatus('Verified! Unlocking...');
          setTimeout(() => {
            onUnlock();
          }, 300);
          return;
        }
      } else {
        // First-time biometric registration with platform authenticator
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'Finance Tracker' },
            user: {
              id: userId,
              name: 'user@financetracker.local',
              displayName: userName || 'Finance Tracker User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },  // ES256
              { alg: -257, type: 'public-key' }, // RS256
            ],
            authenticatorSelection: {
              authenticatorAttachment: 'platform',
              userVerification: 'required',
              residentKey: 'preferred',
            },
            timeout: 60000,
          },
        })) as PublicKeyCredential | null;

        if (credential && credential.rawId) {
          const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
          localStorage.setItem('finance_tracker_biometric_id', credIdBase64);
          setBiometricStatus('Verified! Unlocking...');
          setTimeout(() => {
            onUnlock();
          }, 300);
          return;
        }
      }

      throw new Error('Biometric verification cancelled.');
    } catch (err: any) {
      console.warn('Biometric error:', err);
      // Strictly DO NOT open if cancelled or failed
      setError(true);
      if (err?.name === 'NotAllowedError') {
        setErrorMessage('Biometric scan cancelled. Please enter PIN.');
      } else if (err?.message) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Biometric verification failed. Please enter PIN.');
      }
      setBiometricStatus(null);
    } finally {
      setIsAuthenticating(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, correctPin]);

  return (
    <div className="fixed inset-0 z-50 bg-navy-950 flex flex-col items-center justify-between p-8">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center pt-8">
        <div className="w-14 h-14 rounded-2xl bg-navy-800 border border-gold-500/40 flex items-center justify-center mb-3 shadow-gold">
          <Crown className="w-7 h-7 text-gold-400" />
        </div>
        <h2 className="text-xl font-bold font-display text-pearl-50 tracking-wide">Finance Tracker</h2>
        <p className="text-xs text-pearl-400 mt-1">Welcome back, {userName}</p>
      </div>

      {/* Center PIN Indicator */}
      <div className="flex flex-col items-center my-auto">
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-wider text-pearl-400 uppercase">
          <Lock className="w-3.5 h-3.5 text-gold-400" /> Enter PIN
        </div>

        {/* 4 dots */}
        <div className={`flex items-center gap-4 transition-transform ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-gold-400 scale-110 shadow-gold'
                    : 'bg-navy-800 border border-white/20'
                } ${error ? 'border-crimson-500 bg-crimson-500/40' : ''}`}
              />
            );
          })}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-crimson-500/10 border border-crimson-500/20 text-xs text-crimson-400 font-medium flex items-center gap-1.5 text-center max-w-xs">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage || 'Incorrect PIN'}</span>
          </div>
        )}

        {biometricStatus && (
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-xs text-gold-300 font-medium flex items-center gap-1.5 text-center max-w-xs animate-pulse">
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-gold-400" />
            <span>{biometricStatus}</span>
          </div>
        )}
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              disabled={isAuthenticating}
              className="w-16 h-16 mx-auto rounded-full bg-navy-900/80 hover:bg-white/10 active:bg-gold-500/20 border border-white/10 text-xl font-medium text-pearl-100 flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            onClick={handleBiometric}
            disabled={isAuthenticating}
            className={`w-16 h-16 mx-auto rounded-full bg-navy-900/40 hover:bg-white/10 border text-gold-400 flex items-center justify-center transition-all active:scale-95 ${
              isAuthenticating
                ? 'border-gold-500/60 bg-gold-500/20 animate-pulse text-gold-300 shadow-gold'
                : 'border-white/10'
            }`}
            title="Fingerprint / Biometric Unlock"
          >
            {isAuthenticating ? (
              <Loader2 className="w-6 h-6 animate-spin text-gold-400" />
            ) : (
              <Fingerprint className="w-6 h-6" />
            )}
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isAuthenticating}
            className="w-16 h-16 mx-auto rounded-full bg-navy-900/80 hover:bg-white/10 active:bg-gold-500/20 border border-white/10 text-xl font-medium text-pearl-100 flex items-center justify-center transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            disabled={isAuthenticating}
            className="w-16 h-16 mx-auto rounded-full bg-navy-900/40 hover:bg-white/10 border border-white/10 text-pearl-300 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Switch User / Setup New Profile */}
        {onSwitchUser && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={onSwitchUser}
              className="text-xs text-pearl-400 hover:text-gold-300 transition-colors underline underline-offset-4"
            >
              Switch Account / Set Up New Vault
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
