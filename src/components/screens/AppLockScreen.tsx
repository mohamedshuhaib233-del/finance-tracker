import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, Shield, Crown, Loader2, AlertCircle, Plus, Check, UserCheck, KeyRound } from 'lucide-react';
import { findVaultByPin, registerVault, getRegisteredVaults, VaultMeta } from '../../db/database';

interface AppLockScreenProps {
  onUnlock: (vaultId: string, userName?: string) => void;
  onSwitchUser?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({
  onUnlock,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);

  // New Vault Creation Modal state when an unrecognised PIN is entered
  const [pendingNewPin, setPendingNewPin] = useState<string | null>(null);
  const [newVaultName, setNewVaultName] = useState('');

  // List registered vaults count
  const [vaultsList, setVaultsList] = useState<VaultMeta[]>([]);

  useEffect(() => {
    setVaultsList(getRegisteredVaults());
  }, []);

  const handleDigit = (digit: string) => {
    if (pendingNewPin) return;

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      setErrorMessage('');
      setBiometricStatus(null);

      if (nextPin.length === 4) {
        // Look up registered vault by PIN
        const matched = findVaultByPin(nextPin);
        if (matched) {
          // Success! Unlock this specific vault immediately
          onUnlock(matched.id, matched.userName);
        } else {
          // Prompt user to create a new vault with this new PIN
          setPendingNewPin(nextPin);
          setNewVaultName(`User ${nextPin}`);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pendingNewPin) return;
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMessage('');
    setBiometricStatus(null);
  };

  const handleConfirmNewVault = () => {
    if (!pendingNewPin) return;
    const newVault = registerVault(pendingNewPin, newVaultName);
    setPendingNewPin(null);
    setPin('');
    onUnlock(newVault.id, newVault.userName);
  };

  const handleCancelNewVault = () => {
    setPendingNewPin(null);
    setPin('');
    setError(true);
    setErrorMessage('PIN entry cancelled. Try again.');
    setTimeout(() => {
      setError(false);
      setErrorMessage('');
    }, 2500);
  };

  // Real WebAuthn platform biometric authentication
  const handleBiometric = async () => {
    if (isAuthenticating || pendingNewPin) return;

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
            // Unlock owner vault by default for registered biometrics
            onUnlock('vault_0000', 'Owner');
          }, 300);
          return;
        }
      } else {
        const userId = new Uint8Array(16);
        window.crypto.getRandomValues(userId);

        const credential = (await navigator.credentials.create({
          publicKey: {
            challenge,
            rp: { name: 'Finance Tracker' },
            user: {
              id: userId,
              name: 'owner@financetracker.local',
              displayName: 'Finance Tracker Owner',
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
          setBiometricStatus('Fingerprint enrolled! Unlocking...');
          setTimeout(() => {
            onUnlock('vault_0000', 'Owner');
          }, 300);
          return;
        }
      }

      throw new Error('Biometric verification cancelled.');
    } catch (err: any) {
      console.warn('Biometric error:', err);
      setError(true);
      if (err?.name === 'NotAllowedError') {
        setErrorMessage('Biometric scan cancelled. Please enter your PIN.');
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingNewPin) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pendingNewPin]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAF8] text-slate-800 flex flex-col items-center justify-between p-6 select-none overflow-y-auto">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center pt-4 sm:pt-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center mb-3 shadow-lg shadow-emerald-700/20">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold font-display text-emerald-950 tracking-tight">Finance Tracker</h2>
        <div className="flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300/60 text-emerald-800 text-xs font-semibold">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Private Multi-Vault System</span>
        </div>
      </div>

      {/* Center PIN Section */}
      <div className="flex flex-col items-center my-auto py-4 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
          <KeyRound className="w-3.5 h-3.5 text-emerald-600" /> Enter 4-Digit Lock PIN
        </div>

        {/* 4 dots */}
        <div className={`flex items-center gap-4 transition-transform ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-5 h-5 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-emerald-600 scale-110 shadow-md shadow-emerald-600/30 ring-2 ring-emerald-200'
                    : 'bg-white border-2 border-slate-300'
                } ${error ? 'border-red-500 bg-red-100' : ''}`}
              />
            );
          })}
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2 text-center max-w-xs shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {biometricStatus && (
          <div className="mt-4 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2 text-center max-w-xs shadow-sm">
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-emerald-600" />
            <span>{biometricStatus}</span>
          </div>
        )}


      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs pb-4">
        <div className="grid grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              disabled={isAuthenticating || Boolean(pendingNewPin)}
              className="w-16 h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-2xl font-bold font-display text-slate-800 flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger */}
          <button
            onClick={handleBiometric}
            disabled={isAuthenticating || Boolean(pendingNewPin)}
            className={`w-16 h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 border text-emerald-700 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
              isAuthenticating
                ? 'border-emerald-500 bg-emerald-100/50 animate-pulse ring-2 ring-emerald-300'
                : 'border-slate-200 hover:border-emerald-300'
            }`}
            title="Fingerprint / Biometric Unlock"
          >
            {isAuthenticating ? (
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
            ) : (
              <Fingerprint className="w-7 h-7" />
            )}
          </button>

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isAuthenticating || Boolean(pendingNewPin)}
            className="w-16 h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-2xl font-bold font-display text-slate-800 flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            disabled={isAuthenticating || Boolean(pendingNewPin)}
            className="w-16 h-16 mx-auto rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all active:scale-95 shadow-sm disabled:opacity-50"
            title="Delete"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Registered Vault count indicator */}
        <div className="pt-4 text-center">
          <span className="text-[11px] text-slate-400">
            {vaultsList.length} secure vault{vaultsList.length === 1 ? '' : 's'} registered on this device
          </span>
        </div>
      </div>

      {/* New Vault Setup Dialog when an unrecognised PIN is entered */}
      {pendingNewPin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-emerald-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Create New Vault?</h3>
                <p className="text-xs text-slate-500">PIN: <strong className="text-emerald-700 tracking-widest">{pendingNewPin}</strong></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              No vault is currently linked to this PIN. Would you like to create a new, completely isolated personal vault for this PIN?
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Vault / User Name (Optional)
              </label>
              <input
                type="text"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                placeholder="e.g. My Vault, Personal, Work"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-900 font-medium outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleCancelNewVault}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmNewVault}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" /> Create & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
