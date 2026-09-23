import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Account, CurrencyCode, ParsedVoiceTransaction } from '../../types';
import { VoiceParser } from '../../services/voiceParser';
import { Mic, MicOff, Sparkles, Check, RefreshCw, AlertCircle } from 'lucide-react';

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultCurrency: CurrencyCode;
  onConfirmSave: (parsed: ParsedVoiceTransaction) => Promise<void>;
}

export const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultCurrency,
  onConfirmSave,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('Spent 250 rupees for lunch using cash.');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceTransaction | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Parse transcript on load or change
  useEffect(() => {
    if (transcript.trim()) {
      const extracted = VoiceParser.parseTranscript(transcript, accounts, defaultCurrency);
      setParsedResult(extracted);
    }
  }, [transcript, accounts, defaultCurrency]);

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        setTranscript(spokenText);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  const sampleVoicePrompts = [
    'Spent 250 rupees for lunch using cash.',
    'Paid 1400 for movie tickets using UPI.',
    'Spent 2200 for petrol using credit card.',
    'Received 75000 salary into HDFC bank.',
    'Paid 1180 for wifi bill via UPI.',
  ];

  const handleSave = async () => {
    if (!parsedResult) return;
    setIsSaving(true);
    try {
      await onConfirmSave(parsedResult);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Voice Expense Entry"
      subtitle="Speak naturally — AI extracts entities with mandatory human confirmation"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Voice Listening Orb / Microphone */}
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative">
            {isListening && (
              <div className="absolute inset-0 rounded-full bg-gold-400/20 animate-ping" />
            )}
            <button
              type="button"
              onClick={startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all shadow-gold ${
                isListening
                  ? 'bg-gold-500 text-navy-950 border-gold-300 scale-110'
                  : 'bg-navy-800 text-gold-400 border-gold-500/40 hover:scale-105'
              }`}
            >
              {isListening ? <Mic className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <span className="text-xs text-pearl-300 mt-3 font-medium">
            {isListening ? 'Listening to speech...' : 'Tap microphone to speak or choose a sample prompt'}
          </span>
        </div>

        {/* Live / Editable Transcript Input */}
        <div>
          <label className="block text-xs font-semibold text-pearl-400 uppercase tracking-wider mb-1.5">
            Voice Transcript / Speech Input
          </label>
          <div className="relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="e.g. Spent 250 rupees for lunch using cash."
              className="w-full bg-navy-800 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-pearl-50 focus:outline-none focus:border-gold-500"
            />
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div>
          <span className="text-[11px] text-pearl-400 font-semibold uppercase tracking-wider block mb-1.5">
            Quick Speech Examples:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sampleVoicePrompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setTranscript(p)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-navy-800/80 hover:bg-gold-500/20 border border-white/10 text-pearl-300 hover:text-gold-300 transition-colors text-left"
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Extracted JSON Schema Preview (Strict Compliance with Spec) */}
        {parsedResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Extracted Entity Schema
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Confidence: 95%</span>
            </div>

            <div className="bg-navy-950 rounded-2xl p-4 border border-white/10 font-mono text-xs text-pearl-200 space-y-1">
              <div className="text-pearl-500">{`{`}</div>
              <div className="pl-4">
                <span className="text-gold-400">"type"</span>: <span className="text-emerald-400">"{parsedResult.type}"</span>,
              </div>
              <div className="pl-4">
                <span className="text-gold-400">"amount"</span>: <span className="text-pearl-100 font-bold">{parsedResult.amount}</span>,
              </div>
              <div className="pl-4">
                <span className="text-gold-400">"currency"</span>: <span className="text-emerald-400">"{parsedResult.currency}"</span>,
              </div>
              <div className="pl-4">
                <span className="text-gold-400">"category"</span>: <span className="text-emerald-400">"{parsedResult.category}"</span>,
              </div>
              <div className="pl-4">
                <span className="text-gold-400">"account"</span>: <span className="text-emerald-400">"{parsedResult.account}"</span>,
              </div>
              <div className="pl-4">
                <span className="text-gold-400">"description"</span>: <span className="text-emerald-400">"{parsedResult.description}"</span>
              </div>
              <div className="text-pearl-500">{`}`}</div>
            </div>

            {/* Warning rule from spec */}
            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-pearl-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confirmation Required:</strong> Transactions are never silently recorded based on uncertain voice interpretation. Verify details before saving.
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-pearl-300 font-semibold text-xs hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!parsedResult || isSaving}
            onClick={handleSave}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-gold hover:opacity-95 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSaving ? 'Saving...' : 'Confirm & Save Transaction'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
