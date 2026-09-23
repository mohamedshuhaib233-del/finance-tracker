import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  PieChart,
  Activity,
  Lightbulb,
  Search,
  LineChart,
  Check,
  X,
  Send,
  Sliders,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  Account,
  Budget,
  CoachRecommendation,
  ForecastScenario,
  HealthIndicator,
  IncomeAllocationProposal,
  SavingsGoal,
  Subscription,
  Transaction,
} from '../../types';
import { AiCoachEngine } from '../../services/aiCoach';
import { Badge } from '../common/Badge';
import { FinancialHealthScreen } from './FinancialHealthScreen';

interface AiCoachScreenProps {
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: SavingsGoal[];
  subscriptions: Subscription[];
  healthIndicators: HealthIndicator[];
  currencySymbol: string;
  onNavigate: (screen: string) => void;
}

export const AiCoachScreen: React.FC<AiCoachScreenProps> = ({
  accounts,
  transactions,
  budgets,
  goals,
  subscriptions,
  healthIndicators,
  currencySymbol,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<
    'allocation' | 'health' | 'changes' | 'savings_finder' | 'forecast' | 'chat'
  >('allocation');

  // Income Allocation Planner State
  const [incomeAmountInput, setIncomeAmountInput] = useState('50000');
  const [allocationProposal, setAllocationProposal] = useState<IncomeAllocationProposal>(() =>
    AiCoachEngine.generateIncomeAllocation(50000, accounts, subscriptions, [], goals, 48000)
  );
  const [allocationSaved, setAllocationSaved] = useState(false);

  const handleRecalculateAllocation = (newAmt: number) => {
    const proposal = AiCoachEngine.generateIncomeAllocation(
      newAmt,
      accounts,
      subscriptions,
      [],
      goals,
      48000
    );
    setAllocationProposal(proposal);
    setAllocationSaved(false);
  };

  const handleUpdateAllocationItem = (id: string, newAmount: number) => {
    setAllocationProposal((prev) => {
      const updated = prev.allocations.map((item) =>
        item.id === id ? { ...item, allocatedAmount: newAmount } : item
      );
      return { ...prev, allocations: updated };
    });
  };

  // "What Should I Change?" State
  const [recommendations, setRecommendations] = useState<CoachRecommendation[]>(() =>
    AiCoachEngine.generateRecommendations(accounts, budgets, subscriptions, transactions)
  );

  const handleToggleComplete = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  const handleDismiss = (id: string) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isDismissed: true } : r))
    );
  };

  // Savings Opportunity Finder
  const savingsData = AiCoachEngine.getSavingsOpportunities();

  // Forecast Simulator State
  const [forecastMonthlySavings, setForecastMonthlySavings] = useState(10000);
  const [forecastOneTimePurchase, setForecastOneTimePurchase] = useState(0);
  const [forecastHorizon, setForecastHorizon] = useState(12);

  const netWorth = accounts
    .filter((a) => a.type !== 'credit_card')
    .reduce((sum, a) => sum + a.currentBalance, 0) -
    accounts
      .filter((a) => a.type === 'credit_card')
      .reduce((sum, a) => sum + a.currentBalance, 0);

  const forecastResult: ForecastScenario = AiCoachEngine.runForecast(
    netWorth,
    22000,
    {
      monthlySavingsDelta: forecastMonthlySavings,
      oneTimePurchase: forecastOneTimePurchase,
      expenseReductionPct: 10,
      projectionHorizonMonths: forecastHorizon,
    }
  );

  // Conversational Assistant Chat State
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'coach'; text: string; time: string }>
  >([
    {
      sender: 'coach',
      text: 'Hello! I am your AI Money Coach. Ask me anything about your spending, budgets, savings goals, or financial forecasts.',
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleSendChat = (queryText?: string) => {
    const q = queryText || chatInput;
    if (!q.trim()) return;

    const userMsg = { sender: 'user' as const, text: q, time: 'Just now' };
    const answer = AiCoachEngine.answerUserQuery(q, {
      accounts,
      transactions,
      budgets,
      goals,
      netWorth,
      surplus: 27000,
    });
    const coachMsg = { sender: 'coach' as const, text: answer, time: 'Just now' };

    setChatMessages((prev) => [...prev, userMsg, coachMsg]);
    if (!queryText) setChatInput('');
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gold-400" />
            </div>
            <h2 className="text-xl font-bold font-display text-pearl-50">AI Money Coach</h2>
          </div>
          <p className="text-xs text-pearl-400 mt-0.5">
            Diagnostic analytics, income allocation, and strategic recommendations
          </p>
        </div>
      </div>

      {/* Sub-Pillar Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-navy-900/90 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar text-xs font-semibold">
        {[
          { id: 'allocation', label: 'Income Planner', icon: PieChart },
          { id: 'health', label: 'Health (9 Metrics)', icon: Activity },
          { id: 'changes', label: 'What to Change?', icon: Lightbulb },
          { id: 'savings_finder', label: 'Savings Finder', icon: Search },
          { id: 'forecast', label: 'Forecast', icon: LineChart },
          { id: 'chat', label: 'Ask Coach', icon: Bot },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all ${
                isActive
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 shadow-sm'
                  : 'text-pearl-400 hover:text-pearl-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. INCOME ALLOCATION PLANNER */}
      {/* ========================================================================= */}
      {activeTab === 'allocation' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-gold-500/30 bg-gradient-to-br from-navy-900 to-navy-850">
            <h3 className="text-lg font-bold font-display text-pearl-50">
              Income Allocation Planner
            </h3>
            <p className="text-xs text-pearl-300 mt-1 leading-relaxed">
              Plan how to distribute incoming money across expenses, bills, and savings.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-gold-400 text-sm">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  value={incomeAmountInput}
                  onChange={(e) => {
                    setIncomeAmountInput(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    if (val > 0) handleRecalculateAllocation(val);
                  }}
                  className="w-full bg-navy-950 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-sm font-bold font-display text-pearl-50 focus:outline-none focus:border-gold-500"
                  placeholder="50,000"
                />
              </div>
              <div className="flex gap-1.5 w-full sm:w-auto">
                {[25000, 50000, 75000, 100000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setIncomeAmountInput(preset.toString());
                      handleRecalculateAllocation(preset);
                    }}
                    className="flex-1 sm:flex-initial text-[11px] px-2.5 py-1.5 rounded-lg bg-navy-800 border border-white/10 text-pearl-300 hover:text-gold-300"
                  >
                    {currencySymbol}{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Proposal List */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-pearl-100">
                  AI Allocation Proposal
                </h4>
                <span className="text-[11px] text-pearl-400">Total: {currencySymbol}{allocationProposal.totalIncome.toLocaleString('en-IN')}</span>
              </div>
              <Badge variant="gold" size="sm">The AI Recommends • You Decide</Badge>
            </div>

            <div className="space-y-3">
              {allocationProposal.allocations.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-navy-800/70 border border-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-pearl-100 text-xs">{item.label}</span>
                      <p className="text-[11px] text-pearl-400">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gold-400 font-bold">{currencySymbol}</span>
                        <input
                          type="number"
                          value={item.allocatedAmount}
                          onChange={(e) =>
                            handleUpdateAllocationItem(item.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-24 bg-navy-950 border border-white/10 rounded-lg px-2 py-1 text-right text-xs font-bold font-display text-pearl-50 focus:outline-none focus:border-gold-500"
                        />
                      </div>
                      <span className="text-[10px] text-pearl-400">
                        {Math.round((item.allocatedAmount / (allocationProposal.totalIncome || 1)) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Slider to adjust */}
                  <input
                    type="range"
                    min="0"
                    max={allocationProposal.totalIncome}
                    step="500"
                    value={item.allocatedAmount}
                    onChange={(e) =>
                      handleUpdateAllocationItem(item.id, parseFloat(e.target.value) || 0)
                    }
                    className="w-full h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-gold-400"
                  />
                </div>
              ))}
            </div>

            {allocationSaved ? (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 font-semibold flex items-center justify-center gap-2">
                <Check className="w-4 h-4 stroke-[3]" /> Allocation Confirmed & Scheduled!
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAllocationSaved(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-600 via-gold-400 to-gold-300 text-navy-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-gold hover:opacity-95 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Confirm & Execute Allocation Plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FINANCIAL HEALTH ANALYSIS (9 MEASURABLE INDICATORS) */}
      {/* ========================================================================= */}
      {activeTab === 'health' && (
        <FinancialHealthScreen
          indicators={healthIndicators}
          onTakeAction={(screen) => onNavigate(screen)}
        />
      )}

      {/* ========================================================================= */}
      {/* 3. "WHAT SHOULD I CHANGE?" ANALYSIS */}
      {/* ========================================================================= */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <h3 className="text-base font-bold font-display text-pearl-50">
              Recommendations
            </h3>
            <p className="text-xs text-pearl-300 mt-1">
              Suggestions based on your recent spending and budgets.
            </p>
          </div>

          <div className="space-y-3">
            {recommendations
              .filter((r) => !r.isDismissed)
              .map((rec) => (
                <div
                  key={rec.id}
                  className={`glass-card rounded-2xl p-4 border transition-all ${
                    rec.isCompleted
                      ? 'border-emerald-500/30 opacity-75 bg-emerald-950/10'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-pearl-100 text-sm">{rec.title}</h4>
                        <Badge
                          variant={rec.category === 'risk' ? 'crimson' : rec.category === 'budget' ? 'gold' : 'blue'}
                          size="sm"
                        >
                          {rec.category.toUpperCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleComplete(rec.id)}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          rec.isCompleted
                            ? 'bg-emerald-500 text-navy-950 border-emerald-400'
                            : 'bg-navy-800 text-pearl-300 border-white/10 hover:border-emerald-400'
                        }`}
                        title="Mark Completed"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <button
                        onClick={() => handleDismiss(rec.id)}
                        className="p-1.5 rounded-lg bg-navy-800 text-pearl-400 hover:text-crimson-400 border border-white/10 transition-colors"
                        title="Dismiss Recommendation"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Evidence from data */}
                  <div className="mt-3 p-3 rounded-xl bg-navy-950/70 border border-white/5 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pearl-400 block">
                        Evidence from Recorded Data:
                      </span>
                      <span className="text-pearl-200">{rec.evidence}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block">
                        Potential Financial Impact:
                      </span>
                      <span className="text-gold-300 font-medium">{rec.potentialImpact}</span>
                    </div>
                  </div>

                  {/* Suggested Action */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-pearl-300 font-medium">
                      <strong className="text-emerald-400">Action:</strong> {rec.suggestedAction}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SAVINGS OPPORTUNITY FINDER */}
      {/* ========================================================================= */}
      {activeTab === 'savings_finder' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <h3 className="text-base font-bold font-display text-pearl-50">
              Savings Opportunities
            </h3>
            <p className="text-xs text-pearl-300 mt-1">
              Identify where you can reduce expenses and increase savings.
            </p>
          </div>

          {/* Three Tier Distinction Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="glass-card rounded-2xl p-3 border border-emerald-500/30 bg-emerald-950/10">
              <span className="text-[10px] uppercase font-bold text-pearl-400 block">
                Actual Savings Achieved
              </span>
              <div className="text-base sm:text-xl font-bold font-display text-emerald-400 mt-1">
                {currencySymbol}{savingsData.actualSavingsAchieved.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-pearl-400">Already in bank</span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-gold-500/30 bg-gold-950/10">
              <span className="text-[10px] uppercase font-bold text-pearl-400 block">
                Potential Savings
              </span>
              <div className="text-base sm:text-xl font-bold font-display text-gold-400 mt-1">
                {currencySymbol}{savingsData.potentialSavingsProposed.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-pearl-400">If proposed changes made</span>
            </div>

            <div className="glass-card rounded-2xl p-3 border border-blue-500/30 bg-blue-950/10">
              <span className="text-[10px] uppercase font-bold text-pearl-400 block">
                Committed Fixed Load
              </span>
              <div className="text-base sm:text-xl font-bold font-display text-pearl-200 mt-1">
                {currencySymbol}{savingsData.committedObligations.toLocaleString('en-IN')}
              </div>
              <span className="text-[9px] text-pearl-400">Unavoidable bills</span>
            </div>
          </div>

          <div className="space-y-3">
            {savingsData.opportunities.map((opp, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 border border-white/10 space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-bold text-pearl-100 text-sm">{opp.title}</h4>
                  <Badge variant="gold" size="sm">
                    Potential: +{currencySymbol}{opp.potentialMonthlySaving.toLocaleString('en-IN')}/mo
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-pearl-400 pt-1">
                  <span>Current Outflow: {currencySymbol}{opp.currentSpend.toLocaleString('en-IN')}</span>
                  <span>Target Benchmark: {currencySymbol}{opp.benchmarkSpend.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-xs text-pearl-300 leading-relaxed pt-1">{opp.explanation}</p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-navy-900/90 border border-white/10 text-[11px] text-pearl-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
            <span>{savingsData.importantNote}</span>
          </div>
        </div>
      )}

      {/* 5. FINANCIAL FORECAST SIMULATOR */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10">
            <h3 className="text-base font-bold font-display text-pearl-50">
              Financial Forecast
            </h3>
            <p className="text-xs text-pearl-300 mt-1">
              Simulate savings scenarios and future net worth projections.
            </p>
          </div>

          {/* Interactive Sliders */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-pearl-200 mb-1">
                <span>Additional Monthly Savings Commitment</span>
                <span className="text-gold-400 font-display font-bold">
                  +{currencySymbol}{forecastMonthlySavings.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30000"
                step="2500"
                value={forecastMonthlySavings}
                onChange={(e) => setForecastMonthlySavings(parseFloat(e.target.value))}
                className="w-full h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-gold-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-pearl-200 mb-1">
                <span>Planned One-Time Major Expense</span>
                <span className="text-crimson-400 font-display font-bold">
                  -{currencySymbol}{forecastOneTimePurchase.toLocaleString('en-IN')}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150000"
                step="10000"
                value={forecastOneTimePurchase}
                onChange={(e) => setForecastOneTimePurchase(parseFloat(e.target.value))}
                className="w-full h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-crimson-400"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-pearl-200 mb-1">
                <span>Projection Time Horizon</span>
                <span className="text-pearl-100 font-display font-bold">{forecastHorizon} Months</span>
              </div>
              <input
                type="range"
                min="3"
                max="36"
                step="3"
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(parseFloat(e.target.value))}
                className="w-full h-1 bg-navy-950 rounded-lg appearance-none cursor-pointer accent-blue-400"
              />
            </div>
          </div>

          {/* Forecast Output Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-gold-950/20 border border-gold-500/40 shadow-gold space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-gold-400">
              Projected Wealth Horizon ({forecastHorizon} Months)
            </span>
            <div className="text-3xl font-extrabold font-display text-pearl-50">
              {currencySymbol}{forecastResult.projectedNetWorth.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-pearl-200 leading-relaxed">{forecastResult.summary}</p>

            <div className="pt-2 border-t border-white/10 space-y-1">
              {forecastResult.assumptions.map((assump, i) => (
                <div key={i} className="text-[10px] text-pearl-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gold-400 shrink-0" />
                  <span>{assump}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONVERSATIONAL ASSISTANT */}
      {/* ========================================================================= */}
      {activeTab === 'chat' && (
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-4 border border-white/10 flex flex-col h-[480px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gold-500 text-navy-950 font-medium'
                        : 'bg-navy-800 text-pearl-100 border border-white/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested Prompts */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
              {[
                'What is my total net worth?',
                'How much did I spend on food this month?',
                'Am I on track for my emergency fund?',
                'Can I afford a ₹40,000 purchase next month?',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSendChat(p)}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-navy-800 border border-white/10 text-pearl-300 hover:text-gold-300 whitespace-nowrap"
                >
                  "{p}"
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChat();
              }}
              className="flex gap-2 pt-2 border-t border-white/10"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask financial question..."
                className="flex-1 bg-navy-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-pearl-100 focus:outline-none focus:border-gold-500"
              />
              <button
                type="submit"
                className="p-2 px-3 rounded-xl bg-gold-500 text-navy-950 font-bold hover:bg-gold-400 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
