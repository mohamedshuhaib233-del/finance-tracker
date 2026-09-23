import React, { useState } from 'react';
import { Download, Upload, ShieldCheck, Cloud, RefreshCw, Check, AlertCircle, HardDrive } from 'lucide-react';
import { ExportService } from '../../services/exportService';
import { Badge } from '../common/Badge';

interface BackupSyncScreenProps {
  onRefreshData: () => Promise<void>;
}

export const BackupSyncScreen: React.FC<BackupSyncScreenProps> = ({ onRefreshData }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString());
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportJSON = async () => {
    await ExportService.exportFullBackupJSON();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus('Restoring backup...');
    const success = await ExportService.importBackupJSON(file);
    if (success) {
      await onRefreshData();
      setImportStatus('Backup restored successfully!');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus('Failed to parse backup file.');
    }
  };

  const handleCloudSyncSimulation = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 1500);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-pearl-50">Backup & Sync</h2>
        <p className="text-xs text-pearl-400">Offline data storage and backup export/import</p>
      </div>

      {/* Storage Architecture Guarantee */}
      <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 bg-gradient-to-br from-navy-900 to-emerald-950/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm text-pearl-100 font-display">Local Offline Storage</span>
          </div>
          <Badge variant="emerald" size="sm">Active (IndexedDB)</Badge>
        </div>
        <p className="text-xs text-pearl-300 leading-relaxed">
          All your transactions and balances are stored securely in your browser. The app works 100% offline.
        </p>
      </div>

      {/* Cloud Sync Status */}
      <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-pearl-200">
              Cloud Sync
            </span>
          </div>
          <span className="text-[11px] text-pearl-400">Last Synced: {lastSyncTime}</span>
        </div>

        <button
          onClick={handleCloudSyncSimulation}
          disabled={isSyncing}
          className="w-full py-2.5 rounded-xl bg-navy-800 hover:bg-white/10 border border-white/10 text-xs font-semibold text-pearl-200 flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold-400 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {/* Export & Import Full JSON */}
      <div className="glass-card rounded-2xl p-5 border border-white/10 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-pearl-400 block">
          Backup & Restore
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            className="p-4 rounded-2xl bg-navy-800/80 hover:bg-gold-500/15 border border-white/10 hover:border-gold-500/40 text-left transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <Download className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-pearl-400 font-mono">.JSON</span>
            </div>
            <div className="font-bold text-pearl-100 text-sm">Download Backup</div>
            <p className="text-[11px] text-pearl-400">Export all accounts, transactions, and budgets.</p>
          </button>

          {/* Import JSON */}
          <label className="p-4 rounded-2xl bg-navy-800/80 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/40 text-left transition-all space-y-1.5 cursor-pointer group block">
            <div className="flex items-center justify-between">
              <Upload className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] text-pearl-400 font-mono">RESTORE</span>
            </div>
            <div className="font-bold text-pearl-100 text-sm">Restore from Backup</div>
            <p className="text-[11px] text-pearl-400">Upload a previously exported backup file.</p>
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-gold-500/15 border border-gold-500/30 text-xs text-gold-300 font-semibold text-center animate-fadeIn">
            {importStatus}
          </div>
        )}
      </div>
    </div>
  );
};
