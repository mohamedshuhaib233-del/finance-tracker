import React, { useState, useEffect } from 'react';
import {
  Lock,
  Fingerprint,
  Delete,
  Shield,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Plus,
  Check,
  KeyRound,
  UserPlus,
  User,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  findVaultByPin,
  registerVault,
  getRegisteredVaults,
  getActiveVaultId,
  VaultMeta,
} from '../../db/database';

interface AppLockScreenProps {
  onUnlock: (vaultId: string, userName?: string) => void;
  onSwitchUser?: () => void;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlock }) => {
  // Check existing vaults on device
  const [vaultsList, setVaultsList] = useState<VaultMeta[]>([]);
  // If no vaults are registered yet (first time visitor on this browser), start directly in 'register' mode!
  const [mode, setMode] = useState<'unlock' | 'register'>('unlock');

  // Unlock mode state
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<string | null>(null);

  // New Vault Registration state
  const [registerName, setRegisterName] = useState('');
  const [registerPin, setRegisterPin] = useState('');
  const [registerConfirmPin, setRegisterConfirmPin] = useState('');
  const [registerActiveField, setRegisterActiveField] = useState<'pin' | 'confirm'>('pin');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Prompt when unrecognised PIN is entered in unlock mode
  const [pendingNewPin, setPendingNewPin] = useState<string | null>(null);
  const [newVaultName, setNewVaultName] = useState('');

  useEffect(() => {
    const list = getRegisteredVaults();
    setVaultsList(list);
    // If no vault exists on this browser/device, start in registration mode
    if (list.length === 0) {
      setMode('register');
    }
  }, []);

  // --- UNLOCK MODE KEYPAD HANDLERS ---
  const handleDigit = (digit: string) => {
    if (pendingNewPin) return;

    if (mode === 'unlock') {
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
    } else {
      // In register mode using keypad
      if (registerActiveField === 'pin') {
        if (registerPin.length < 4) {
          const next = registerPin + digit;
          setRegisterPin(next);
          setRegisterError('');
          if (next.length === 4) {
            setRegisterActiveField('confirm');
          }
        }
      } else {
        if (registerConfirmPin.length < 4) {
          const next = registerConfirmPin + digit;
          setRegisterConfirmPin(next);
          setRegisterError('');
        }
      }
    }
  };

  const handleDelete = () => {
    if (pendingNewPin) return;

    if (mode === 'unlock') {
      setPin((prev) => prev.slice(0, -1));
      setError(false);
      setErrorMessage('');
      setBiometricStatus(null);
    } else {
      if (registerActiveField === 'confirm') {
        if (registerConfirmPin.length > 0) {
          setRegisterConfirmPin((prev) => prev.slice(0, -1));
        } else {
          setRegisterActiveField('pin');
        }
      } else {
        setRegisterPin((prev) => prev.slice(0, -1));
      }
      setRegisterError('');
    }
  };

  // --- NEW VAULT SUBMIT (REGISTER MODE) ---
  const handleCreateNewVault = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (registerPin.length !== 4) {
      setRegisterError('Please enter a 4-digit PIN.');
      return;
    }
    if (registerConfirmPin.length !== 4) {
      setRegisterError('Please confirm your 4-digit PIN.');
      return;
    }
    if (registerPin !== registerConfirmPin) {
      setRegisterError('PINs do not match. Please re-enter.');
      return;
    }

    // Check if this PIN is already registered on this device
    const existing = findVaultByPin(registerPin);
    if (existing) {
      setRegisterError('This PIN is already used on this device. Choose a different PIN or log in.');
      return;
    }

    setRegisterError('');
    setRegisterSuccess(true);

    const vaultName = registerName.trim() || `User ${registerPin}`;
    const newVault = registerVault(registerPin, vaultName);

    setTimeout(() => {
      onUnlock(newVault.id, newVault.userName);
    }, 600);
  };

  // --- UNRECOGNISED PIN PROMPT HANDLERS ---
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

  // --- BIOMETRICS ---
  const handleBiometric = async () => {
    if (isAuthenticating || pendingNewPin || mode === 'register') return;

    setIsAuthenticating(true);
    setError(false);
    setErrorMessage('');
    setBiometricStatus('Touch fingerprint sensor or scan face...');

    try {
      if (!window.PublicKeyCredential) {
        throw new Error('Biometrics not supported by your browser. Please enter your PIN.');
      }

      const isAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!isAvailable) {
        throw new Error('No biometric sensor detected. Please use your PIN.');
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const savedCredId = localStorage.getItem('finance_tracker_biometric_id');
      const activeVaultId = getActiveVaultId();

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
            onUnlock(activeVaultId);
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
              name: 'user@financetracker.local',
              displayName: 'Finance Tracker User',
            },
            pubKeyCredParams: [
              { alg: -7, type: 'public-key' },
              { alg: -257, type: 'public-key' },
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
            onUnlock(activeVaultId);
          }, 300);
          return;
        }
      }

      throw new Error('Biometric verification cancelled.');
    } catch (err: any) {
      console.warn('Biometric error:', err);
      setError(true);
      setErrorMessage(err.message || 'Biometric check failed.');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 3000);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Hardware keyboard entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (pendingNewPin) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && mode === 'register') {
        if (registerPin.length === 4 && registerConfirmPin.length === 4) {
          handleCreateNewVault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, pendingNewPin, mode, registerPin, registerConfirmPin, registerActiveField]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAF8] text-slate-800 flex flex-col items-center justify-between p-4 sm:p-6 select-none overflow-y-auto">
      {/* Top Brand Header */}
      <div className="flex flex-col items-center pt-3 sm:pt-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center filter drop-shadow-md">
          <img src="/logo.png" alt="Finance Tracker Logo" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold font-display text-emerald-950 tracking-tight">
          Finance Tracker
        </h2>
        <div className="flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300/60 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Private Multi-Vault System</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: REGISTER NEW USER PIN ("First time setup")         */}
      {/* ========================================================= */}
      {mode === 'register' && (
        <div className="w-full max-w-sm my-auto py-2 space-y-4 animate-fadeIn">
          <div className="text-center space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Create Your Personal PIN
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Set a 4-digit passcode for your private financial tracker. Your data stays completely isolated and secure.
            </p>
          </div>

          {registerError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{registerError}</span>
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Vault created successfully! Opening your dashboard...</span>
            </div>
          )}

          <div className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-sm">
            {/* User Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Name (Optional)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={registerName}
                  onChange={(e) => setRegisterName(e.target.value)}
                  placeholder="e.g. Rahul, Amina, Personal"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm text-slate-900 font-medium outline-none transition-all"
                />
              </div>
            </div>

            {/* Choose 4-Digit PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Choose 4-Digit PIN</label>
                {registerActiveField === 'pin' && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Entering PIN
                  </span>
                )}
              </div>
              <div
                onClick={() => setRegisterActiveField('pin')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  registerActiveField === 'pin'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const filled = registerPin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                        filled ? 'bg-emerald-600 scale-110 shadow-sm' : 'bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Confirm 4-Digit PIN */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Confirm 4-Digit PIN</label>
                {registerActiveField === 'confirm' && (
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    Confirming PIN
                  </span>
                )}
              </div>
              <div
                onClick={() => setRegisterActiveField('confirm')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-3 cursor-pointer transition-all ${
                  registerActiveField === 'confirm'
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                {[0, 1, 2, 3].map((idx) => {
                  const filled = registerConfirmPin.length > idx;
                  const isMatching =
                    filled &&
                    registerConfirmPin[idx] === registerPin[idx];
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all ${
                        filled
                          ? isMatching
                            ? 'bg-emerald-600 scale-110 shadow-sm'
                            : 'bg-red-500 scale-110'
                          : 'bg-slate-300'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Create Vault Button */}
            <button
              type="button"
              onClick={handleCreateNewVault}
              disabled={registerPin.length !== 4 || registerConfirmPin.length !== 4}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" /> Create My Vault & Enter
            </button>
          </div>

          {/* Toggle back to Unlock if vaults exist */}
          {vaultsList.length > 0 && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('unlock');
                  setPin('');
                  setError(false);
                }}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline transition-all"
              >
                Already have a PIN? Unlock Vault →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: UNLOCK MODE (ENTER 4-DIGIT PIN)                    */}
      {/* ========================================================= */}
      {mode === 'unlock' && (
        <div className="flex flex-col items-center my-auto py-3 w-full max-w-sm animate-fadeIn">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold tracking-wider text-slate-500 uppercase">
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
            <div className="mt-3 px-3.5 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2 text-center max-w-xs shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {biometricStatus && (
            <div className="mt-3 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-medium flex items-center gap-2 text-center max-w-xs shadow-sm">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-emerald-600" />
              <span>{biometricStatus}</span>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* NUMERIC KEYPAD (Works for both unlock and registration)    */}
      {/* ========================================================= */}
      <div className="w-full max-w-xs pb-2">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num.toString())}
              disabled={isAuthenticating || Boolean(pendingNewPin)}
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-xl sm:text-2xl font-bold font-display text-slate-800 flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          {/* Biometric trigger (only in unlock mode) */}
          {mode === 'unlock' ? (
            <button
              onClick={handleBiometric}
              disabled={isAuthenticating || Boolean(pendingNewPin)}
              className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 border text-emerald-700 flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                isAuthenticating
                  ? 'border-emerald-500 bg-emerald-100/50 animate-pulse ring-2 ring-emerald-300'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
              title="Fingerprint / Biometric Unlock"
            >
              {isAuthenticating ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <Fingerprint className="w-6 h-6" />
              )}
            </button>
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto flex items-center justify-center text-slate-300">
              <Shield className="w-5 h-5 opacity-40" />
            </div>
          )}

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            disabled={isAuthenticating || Boolean(pendingNewPin)}
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white hover:bg-emerald-50 active:bg-emerald-100 border border-slate-200 hover:border-emerald-300 text-xl sm:text-2xl font-bold font-display text-slate-800 flex items-center justify-center transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            0
          </button>

          {/* Backspace */}
          <button
            onClick={handleDelete}
            disabled={isAuthenticating || Boolean(pendingNewPin)}
            className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all active:scale-95 shadow-sm disabled:opacity-50"
            title="Delete"
          >
            <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* BOTTOM TRIGGER: "New User? Create Your 4-Digit PIN" in Unlock Mode */}
        {mode === 'unlock' && (
          <div className="pt-3 text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegisterPin('');
                setRegisterConfirmPin('');
                setRegisterError('');
              }}
              className="w-full py-2.5 px-3 rounded-2xl bg-white hover:bg-emerald-50 border border-emerald-300/80 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01] active:scale-95"
            >
              <UserPlus className="w-4 h-4 text-emerald-600" />
              <span>New User? Create Your Personal PIN</span>
            </button>

            <span className="text-[11px] text-slate-400 block">
              Public Platform — Each user gets their own private vault
            </span>
          </div>
        )}
      </div>

      {/* New Vault Setup Dialog when an unrecognised PIN is entered in unlock mode */}
      {pendingNewPin && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-emerald-100 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">Create New Vault?</h3>
                <p className="text-xs text-slate-500">
                  PIN:{' '}
                  <strong className="text-emerald-700 tracking-widest">{pendingNewPin}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              No vault is linked to this PIN. Would you like to create a new, isolated personal workspace for this PIN?
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Your Name / Vault Name (Optional)
              </label>
              <input
                type="text"
                value={newVaultName}
                onChange={(e) => setNewVaultName(e.target.value)}
                placeholder="e.g. Rahul, Personal, Work"
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
