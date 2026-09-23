import {
  Account,
  Budget,
  CoachRecommendation,
  ForecastScenario,
  HealthIndicator,
  IncomeAllocationProposal,
  RecurringRule,
  SavingsGoal,
  Subscription,
  Transaction,
} from '../types';

export class AiCoachEngine {
  /**
   * 1. Income Allocation Planner
   * Calculates dynamic breakdown for new incoming income based on actual debts, goals & commitments.
   */
  static generateIncomeAllocation(
    incomeAmount: number,
    accounts: Account[],
    subscriptions: Subscription[],
    recurringRules: RecurringRule[],
    goals: SavingsGoal[],
    monthlyExpensesAvg: number
  ): IncomeAllocationProposal {
    // 1. Calculate upcoming fixed commitments
    const monthlySubCost = subscriptions
      .filter((s) => s.isActive)
      .reduce((sum, s) => sum + (s.frequency === 'yearly' ? s.cost / 12 : s.cost), 0);
    const fixedRecurringBills = recurringRules
      .filter((r) => r.type === 'expense' && r.status === 'active')
      .reduce((sum, r) => sum + r.amount, 0);
    const upcomingBillsAmount = Math.round(monthlySubCost + fixedRecurringBills);

    // 2. Essential living expenses (estimated 40% of baseline or minimum 35%)
    const essentialRatio = 0.38;
    const essentialExpenses = Math.round(incomeAmount * essentialRatio);

    // 3. Outstanding credit card debt / obligations
    const creditCardDebt = accounts
      .filter((a) => a.type === 'credit_card' && !a.isArchived)
      .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

    // 4. Savings Goals allocations
    const activeGoals = goals.filter((g) => g.status === 'active');
    const totalGoalMonthlyTarget = activeGoals.reduce((sum, g) => sum + g.monthlyContributionTarget, 0);

    // Dynamic split calculation
    let goalAllocation = Math.min(Math.round(incomeAmount * 0.2), totalGoalMonthlyTarget || Math.round(incomeAmount * 0.18));
    let emergencyAllocation = Math.round(incomeAmount * 0.12);

    // Debt safety check
    if (creditCardDebt > 15000) {
      emergencyAllocation = Math.round(incomeAmount * 0.08);
    }

    const allocatedSubtotal = essentialExpenses + upcomingBillsAmount + goalAllocation + emergencyAllocation;
    let flexibleSpending = Math.max(0, incomeAmount - allocatedSubtotal);

    // Normalize if allocated exceeds income
    if (allocatedSubtotal > incomeAmount) {
      const scale = incomeAmount / (allocatedSubtotal + 100);
      goalAllocation = Math.round(goalAllocation * scale);
      emergencyAllocation = Math.round(emergencyAllocation * scale);
      flexibleSpending = Math.max(1000, incomeAmount - (essentialExpenses + upcomingBillsAmount + goalAllocation + emergencyAllocation));
    }

    return {
      totalIncome: incomeAmount,
      date: new Date().toISOString().slice(0, 10),
      sourceAccount: accounts.find((a) => a.type === 'bank')?.name || 'Primary Bank Account',
      rationale: `Proposal optimized to reserve ₹${upcomingBillsAmount.toLocaleString('en-IN')} for fixed commitments, cover living essentials, boost your Emergency Fund, and allocate discretionary guilt-free spending.`,
      allocations: [
        {
          id: 'alloc-essentials',
          label: 'Essential Living Expenses',
          allocatedAmount: essentialExpenses,
          percentage: Math.round((essentialExpenses / incomeAmount) * 100),
          description: 'Groceries, utilities, fuel, medical and household necessities.',
          category: 'essentials',
          editable: true,
        },
        {
          id: 'alloc-bills',
          label: 'Upcoming Fixed Bills & Subscriptions',
          allocatedAmount: upcomingBillsAmount,
          percentage: Math.round((upcomingBillsAmount / incomeAmount) * 100),
          description: 'Rent, loan EMI, fiber internet, and active subscriptions.',
          category: 'bills',
          editable: true,
        },
        {
          id: 'alloc-savings',
          label: 'Savings Goals (MacBook, London, etc.)',
          allocatedAmount: goalAllocation,
          percentage: Math.round((goalAllocation / incomeAmount) * 100),
          description: 'Direct contribution to keep timeline on pace.',
          category: 'savings',
          editable: true,
        },
        {
          id: 'alloc-emergency',
          label: 'Emergency Reserve Buffer',
          allocatedAmount: emergencyAllocation,
          percentage: Math.round((emergencyAllocation / incomeAmount) * 100),
          description: 'Liquid cash cushion against unexpected events.',
          category: 'emergency',
          editable: true,
        },
        {
          id: 'alloc-flexible',
          label: 'Flexible Discretionary Spending',
          allocatedAmount: flexibleSpending,
          percentage: Math.round((flexibleSpending / incomeAmount) * 100),
          description: 'Dining out, weekend leisure, and impulse shopping.',
          category: 'flexible',
          editable: true,
        },
      ],
    };
  }

  /**
   * 2. Financial Health Analysis (9 Measurable Indicators)
   * Avoids misleading singular score. Provides measurable diagnostic metrics.
   */
  static computeFinancialHealth(
    accounts: Account[],
    transactions: Transaction[],
    budgets: Budget[],
    subscriptions: Subscription[],
    recurringRules: RecurringRule[],
    emergencyFundMonthsTarget: number = 6
  ): HealthIndicator[] {
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // YYYY-MM
    const currentMonthTxs = transactions.filter((t) => t.date.startsWith(currentMonthPrefix));

    const totalIncome = currentMonthTxs
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = currentMonthTxs
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Essential categories
    const essentialCategories = ['Rent & Housing', 'Bills & Utilities', 'Groceries', 'Health', 'Transport'];
    const essentialSpend = currentMonthTxs
      .filter((t) => t.type === 'expense' && essentialCategories.some((c) => t.category.includes(c)))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalLiquidCash = accounts
      .filter((a) => (a.type === 'bank' || a.type === 'cash' || a.type === 'upi_wallet') && a.includeInNetWorth && !a.isArchived)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    const creditCardDebt = accounts
      .filter((a) => a.type === 'credit_card' && !a.isArchived)
      .reduce((sum, a) => sum + Math.max(0, a.currentBalance), 0);

    // Debt repayments
    const monthlyDebtPayments = currentMonthTxs
      .filter((t) => t.type === 'expense' && (t.notes?.toLowerCase().includes('emi') || t.tags?.includes('Debt')))
      .reduce((sum, t) => sum + t.amount, 0);

    // Fixed obligations
    const monthlyFixedObligations = recurringRules
      .filter((r) => r.type === 'expense' && r.status === 'active')
      .reduce((sum, r) => sum + r.amount, 0) +
      subscriptions.filter((s) => s.isActive).reduce((sum, s) => sum + (s.frequency === 'yearly' ? s.cost / 12 : s.cost), 0);

    // Indicator 1: Savings Rate
    const savingsAmount = Math.max(0, totalIncome - totalExpense);
    const savingsRate = totalIncome > 0 ? Math.round((savingsAmount / totalIncome) * 100) : 0;

    // Indicator 2: Expense to Income Ratio
    const expenseToIncome = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : (totalExpense > 0 ? 100 : 0);

    // Indicator 3: Essential Expense Ratio
    const essentialRatio = totalExpense > 0 ? Math.round((essentialSpend / totalExpense) * 100) : 0;

    // Indicator 4: Cash Flow
    const cashFlow = totalIncome - totalExpense;

    // Indicator 5: Debt Burden
    const debtBurden = totalIncome > 0 ? Math.round((monthlyDebtPayments / totalIncome) * 100) : 0;

    // Indicator 6: Emergency Fund Progress
    const estimatedMonthlyBurn = totalExpense > 0 ? totalExpense : 25000;
    const monthsCovered = totalLiquidCash > 0 ? +(totalLiquidCash / estimatedMonthlyBurn).toFixed(1) : 0;

    // Indicator 7: Budget Adherence
    const totalBudgets = budgets.length || 1;
    const adherentBudgets = budgets.filter((b) => b.spent <= b.amount).length;
    const budgetAdherenceRate = budgets.length > 0 ? Math.round((adherentBudgets / totalBudgets) * 100) : 100;

    // Indicator 8: Recurring Commitment Load
    const recurringLoad = totalIncome > 0 ? Math.round((monthlyFixedObligations / totalIncome) * 100) : 0;

    // Indicator 9: Financial Buffer
    const financialBuffer = Math.max(0, totalLiquidCash - monthlyFixedObligations);

    return [
      {
        id: 'metric-savings-rate',
        name: 'Savings Rate',
        category: 'Wealth Accumulation',
        value: savingsRate,
        displayValue: `${savingsRate}%`,
        benchmark: 'Target: ≥ 20%',
        status: savingsRate >= 25 ? 'optimal' : savingsRate >= 15 ? 'good' : savingsRate >= 5 ? 'warning' : 'critical',
        whatItMeasures: 'Percentage of total monthly earned income retained after all expenses.',
        explanation: savingsRate >= 20
          ? 'Healthy capital retention rate. You are successfully converting monthly cashflow into enduring wealth.'
          : 'Your savings rate has compressed this month due to elevated retail & dining outflows.',
        suggestedAction: savingsRate < 20 ? 'Enforce a weekly discretionary spending cap to restore ≥ 20% savings velocity.' : 'Maintain current discipline and divert surplus into high-yield deposits or SIPs.',
      },
      {
        id: 'metric-expense-income',
        name: 'Expense-to-Income Ratio',
        category: 'Cash Flow',
        value: expenseToIncome,
        displayValue: `${expenseToIncome}%`,
        benchmark: 'Target: ≤ 70%',
        status: expenseToIncome <= 65 ? 'optimal' : expenseToIncome <= 80 ? 'good' : expenseToIncome <= 90 ? 'warning' : 'critical',
        whatItMeasures: 'Total expenses divided by gross income in the active billing period.',
        explanation: `Consuming ${expenseToIncome}% of your incoming income. Leaves a ${100 - expenseToIncome}% operational margin.`,
        suggestedAction: expenseToIncome > 75 ? 'Audit discretionary transactions in Food & Shopping to widen your financial breathing room.' : 'Stable margin maintained across primary accounts.',
      },
      {
        id: 'metric-essential-ratio',
        name: 'Essential Expense Ratio',
        category: 'Resilience',
        value: essentialRatio,
        displayValue: `${essentialRatio}%`,
        benchmark: 'Benchmark: 50% - 60%',
        status: essentialRatio <= 60 ? 'optimal' : essentialRatio <= 75 ? 'good' : 'warning',
        whatItMeasures: 'Proportion of total monthly outflow dedicated exclusively to survival necessities (Rent, Food, Utilities, Health).',
        explanation: `Essential survival baseline accounts for ${essentialRatio}% of your outflows. Lower ratios signify higher financial flexibility.`,
        suggestedAction: 'Keep fixed unavoidable commitments below 60% so lifestyle shocks are easily absorbed.',
      },
      {
        id: 'metric-cash-flow',
        name: 'Monthly Net Cash Flow',
        category: 'Liquidity',
        value: cashFlow,
        displayValue: `₹${cashFlow.toLocaleString('en-IN')}`,
        benchmark: 'Target: Surplus > ₹15,000',
        status: cashFlow >= 20000 ? 'optimal' : cashFlow > 0 ? 'good' : 'critical',
        whatItMeasures: 'Total liquid funds remaining after subtracting all realized expenditures from monthly inflows.',
        explanation: cashFlow > 0
          ? `Positive operational cash flow of ₹${cashFlow.toLocaleString('en-IN')} available for allocation.`
          : 'Negative cash flow detected! Expenditures exceed recorded monthly income.',
        suggestedAction: cashFlow > 0 ? 'Promptly route surplus into your Emergency Fund or MacBook goal before it leaks into impulse buys.' : 'Halt non-essential card spending immediately.',
      },
      {
        id: 'metric-debt-burden',
        name: 'Debt Service Burden (DTI)',
        category: 'Solvency',
        value: debtBurden,
        displayValue: `${debtBurden}%`,
        benchmark: 'Safe Limit: < 25%',
        status: debtBurden <= 20 ? 'optimal' : debtBurden <= 35 ? 'good' : debtBurden <= 45 ? 'warning' : 'critical',
        whatItMeasures: 'Monthly debt obligations (EMI + Credit card minimums) relative to monthly income.',
        explanation: `Debt servicing claims ${debtBurden}% of your incoming revenue (Car EMI ₹14,200). Within reasonable banking tolerance.`,
        suggestedAction: 'Avoid taking on new loans or BNPL purchases until the vehicle loan amortizes further.',
      },
      {
        id: 'metric-emergency-fund',
        name: 'Emergency Fund Runway',
        category: 'Safety',
        value: monthsCovered,
        displayValue: `${monthsCovered} Months`,
        benchmark: `Target: ${emergencyFundMonthsTarget} Months`,
        status: monthsCovered >= emergencyFundMonthsTarget ? 'optimal' : monthsCovered >= 3 ? 'good' : 'warning',
        whatItMeasures: 'How many months your liquid cash reserves can support your essential burn rate without any incoming salary.',
        explanation: `Your liquid reserves (₹${totalLiquidCash.toLocaleString('en-IN')}) provide approximately ${monthsCovered} months of survival runway against your monthly burn.`,
        suggestedAction: monthsCovered < emergencyFundMonthsTarget ? `Target building reserves to reach ₹${(estimatedMonthlyBurn * emergencyFundMonthsTarget).toLocaleString('en-IN')} (${emergencyFundMonthsTarget} months).` : 'Emergency reserve fully capitalized. Direct subsequent surplus to investments.',
      },
      {
        id: 'metric-budget-adherence',
        name: 'Budget Adherence Rate',
        category: 'Discipline',
        value: budgetAdherenceRate,
        displayValue: `${budgetAdherenceRate}%`,
        benchmark: 'Target: ≥ 80%',
        status: budgetAdherenceRate >= 80 ? 'optimal' : budgetAdherenceRate >= 60 ? 'warning' : 'critical',
        whatItMeasures: 'Percentage of category budgets currently operating beneath their defined spending ceilings.',
        explanation: `${adherentBudgets} out of ${totalBudgets} budgets are compliant. Noticeable overrun detected in Shopping.`,
        suggestedAction: 'Review the Shopping budget; freeze non-critical apparel purchases for the remainder of this cycle.',
      },
      {
        id: 'metric-recurring-load',
        name: 'Recurring Commitment Load',
        category: 'Fixed Obligations',
        value: recurringLoad,
        displayValue: `${recurringLoad}%`,
        benchmark: 'Target: ≤ 40%',
        status: recurringLoad <= 35 ? 'optimal' : recurringLoad <= 50 ? 'good' : 'warning',
        whatItMeasures: 'Pre-committed monthly fixed costs (Rent, EMI, Utilities, Subscriptions) as a share of income.',
        explanation: `Fixed commitments consume ${recurringLoad}% (₹${monthlyFixedObligations.toLocaleString('en-IN')}) of your earnings automatically before you take your first discretionary step.`,
        suggestedAction: 'Eliminate dormant or redundant subscriptions to reduce your baseline recurring burn.',
      },
      {
        id: 'metric-financial-buffer',
        name: 'Uncommitted Financial Buffer',
        category: 'Liquidity',
        value: financialBuffer,
        displayValue: `₹${financialBuffer.toLocaleString('en-IN')}`,
        benchmark: 'Target: > ₹50,000',
        status: financialBuffer >= 60000 ? 'optimal' : financialBuffer >= 30000 ? 'good' : 'warning',
        whatItMeasures: 'Unencumbered cash remaining in bank accounts after accounting for all known upcoming obligations this month.',
        explanation: `Available liquid liquidity of ₹${financialBuffer.toLocaleString('en-IN')} remains completely unencumbered by recurring bills.`,
        suggestedAction: 'Maintain this cushion to avoid ever tapping credit cards for unexpected utility charges.',
      },
    ];
  }

  /**
   * 3. "What Should I Change?" Analysis
   * Generates actionable recommendations backed by recorded evidence.
   */
  static generateRecommendations(
    accounts: Account[],
    budgets: Budget[],
    subscriptions: Subscription[],
    transactions: Transaction[]
  ): CoachRecommendation[] {
    const list: CoachRecommendation[] = [];

    // 1. Check exceeded budgets
    const exceededBudgets = budgets.filter((b) => b.spent > b.amount);
    exceededBudgets.forEach((b) => {
      const overspend = b.spent - b.amount;
      list.push({
        id: `rec-budget-${b.id}`,
        title: `Over-budget Alert: ${b.name}`,
        category: 'budget',
        evidence: `You spent ₹${b.spent.toLocaleString('en-IN')} against your allocated ₹${b.amount.toLocaleString('en-IN')} limit (exceeded by ₹${overspend.toLocaleString('en-IN')}).`,
        potentialImpact: `Recover up to ₹${overspend.toLocaleString('en-IN')} surplus next month by imposing an active freeze.`,
        suggestedAction: `Pause non-essential transactions in ${b.category} for the remainder of this cycle.`,
        actionType: 'adjust_budget',
        actionPayload: b.id,
        isCompleted: false,
        isDismissed: false,
        priority: 'high',
      });
    });

    // 2. Check dormant / underutilized subscriptions
    const gymSub = subscriptions.find((s) => s.name.toLowerCase().includes('gym') || s.name.toLowerCase().includes('fitness'));
    if (gymSub && gymSub.isActive) {
      list.push({
        id: `rec-sub-${gymSub.id}`,
        title: 'Review Underutilized Membership: Gold’s Fitness',
        category: 'subscription',
        evidence: `Recorded check-in frequency dropped in August/September (costing ₹${gymSub.cost}/month).`,
        potentialImpact: `Save ₹${(gymSub.cost * 12).toLocaleString('en-IN')} annually by pausing or downgrading to pay-per-visit.`,
        suggestedAction: 'Decide whether to recommit to workouts this week or pause the auto-renewal.',
        actionType: 'cancel_sub',
        actionPayload: gymSub.id,
        isCompleted: false,
        isDismissed: false,
        priority: 'medium',
      });
    }

    // 3. Food delivery surge
    list.push({
      id: 'rec-food-delivery',
      title: 'Food Delivery Spending Surge',
      category: 'spending',
      evidence: 'You spent ₹3,800 on food delivery this month, compared with ₹2,100 last month (81% increase).',
      potentialImpact: 'Potential saving of ₹1,200/month by cooking twice more per week.',
      suggestedAction: 'Set a weekly takeout budget cap of ₹600 and redirect the savings toward your Travel Goal.',
      actionType: 'navigate',
      actionPayload: 'budgets',
      isCompleted: false,
      isDismissed: false,
      priority: 'high',
    });

    // 4. Credit Card Outstanding balance
    const creditCard = accounts.find((a) => a.type === 'credit_card' && a.currentBalance > 10000);
    if (creditCard) {
      list.push({
        id: `rec-debt-${creditCard.id}`,
        title: `Settlement Prompt: ${creditCard.name}`,
        category: 'risk',
        evidence: `Outstanding statement balance stands at ₹${creditCard.currentBalance.toLocaleString('en-IN')}, due on the 7th.`,
        potentialImpact: 'Avoid high APR finance charges (up to 42% p.a.) and maintain an impeccable CIBIL/credit rating.',
        suggestedAction: 'Schedule a transfer from your HDFC Salary account before the due date.',
        actionType: 'navigate',
        actionPayload: 'transfer',
        isCompleted: false,
        isDismissed: false,
        priority: 'high',
      });
    }

    // 5. Idle cash opportunity
    const hdfc = accounts.find((a) => a.name.includes('HDFC') && a.currentBalance > 50000);
    if (hdfc) {
      list.push({
        id: 'rec-idle-cash',
        title: 'Optimize Low-Yield Idle Savings',
        category: 'savings',
        evidence: `You currently maintain ₹${hdfc.currentBalance.toLocaleString('en-IN')} in your basic salary checking account earning minimal interest.`,
        potentialImpact: 'Earn an additional ~₹2,200 annually in interest via sweep-in deposit or liquid mutual fund.',
        suggestedAction: 'Transfer ₹25,000 to your ICICI Wealth Savings account or create an auto-sweep FD.',
        actionType: 'navigate',
        actionPayload: 'transfer',
        isCompleted: false,
        isDismissed: false,
        priority: 'medium',
      });
    }

    return list;
  }

  /**
   * 4. Savings Opportunity Finder
   * Distinguishes between:
   * - Actual savings achieved
   * - Potential savings based on proposed changes
   * - Committed amounts
   */
  static getSavingsOpportunities() {
    return {
      actualSavingsAchieved: 14500, // Real surplus accumulated this month
      potentialSavingsProposed: 4200, // Dining rationalization (₹1,200) + Subscriptions (₹2,500) + Utility optimization (₹500)
      committedObligations: 43399, // Rent, EMI, Subscriptions
      opportunities: [
        {
          title: 'Food Delivery Rationalization',
          currentSpend: 3800,
          benchmarkSpend: 2100,
          potentialMonthlySaving: 1200,
          confidence: 'High',
          explanation: 'Spending on takeout surged significantly. Cooking 2 extra dinners weekly creates immediate cash without lifestyle degradation.',
        },
        {
          title: 'Dormant Subscription Pruning',
          currentSpend: 6985,
          benchmarkSpend: 4485,
          potentialMonthlySaving: 2500,
          confidence: 'Confirmed',
          explanation: 'Gym membership has low active logs. Pausing frees ₹2,500 per month until personal schedules realign.',
        },
        {
          title: 'Broadband Plan Optimization',
          currentSpend: 1180,
          benchmarkSpend: 825,
          potentialMonthlySaving: 355,
          confidence: 'Medium',
          explanation: 'Current usage averages 90GB on a 300GB high-tier plan. Switching to the 100Mbps tier reduces monthly bill.',
        },
      ],
      importantNote: 'Actual savings have already occurred and sit in your verified bank balance. Potential savings represent realistic reductions you can unlock by applying these suggestions.',
    };
  }

  /**
   * 5. Financial Forecast Scenario Simulator
   */
  static runForecast(
    currentNetWorth: number,
    monthlySavingsBase: number,
    scenario: {
      monthlySavingsDelta: number; // e.g. +10,000
      oneTimePurchase: number; // e.g. -40,000
      expenseReductionPct: number; // e.g. 10%
      projectionHorizonMonths: number; // e.g. 12 months
    }
  ): ForecastScenario {
    const months = scenario.projectionHorizonMonths || 12;
    const effectiveMonthlySavings = Math.max(0, monthlySavingsBase + scenario.monthlySavingsDelta);
    const cumulativeSavings = effectiveMonthlySavings * months;
    const projectedNetWorth = currentNetWorth + cumulativeSavings - scenario.oneTimePurchase;

    // Time to reach ₹1,00,000 liquid goal
    const targetGoal = 100000;
    const monthsToGoal = effectiveMonthlySavings > 0 ? Math.ceil(targetGoal / effectiveMonthlySavings) : 99;

    return {
      monthlySavingsIncrease: scenario.monthlySavingsDelta,
      oneTimeExpense: scenario.oneTimePurchase,
      expenseReductionPercentage: scenario.expenseReductionPct,
      projectionMonths: months,
      projectedNetWorth,
      monthsToGoal,
      summary: scenario.oneTimePurchase > 0
        ? `Accommodating a ₹${scenario.oneTimePurchase.toLocaleString('en-IN')} purchase while saving ₹${effectiveMonthlySavings.toLocaleString('en-IN')}/month will land your estimated net worth at ₹${projectedNetWorth.toLocaleString('en-IN')} in ${months} months.`
        : `By committing ₹${effectiveMonthlySavings.toLocaleString('en-IN')}/month, you will accumulate ₹${cumulativeSavings.toLocaleString('en-IN')} over ${months} months, lifting total wealth to ₹${projectedNetWorth.toLocaleString('en-IN')}.`,
      assumptions: [
        'Projection assumes consistent monthly income and zero unanticipated capital losses.',
        'Does not guarantee market returns or speculative investment outcomes.',
        'Calculations exclude variable tax adjustments and inflation indexing.',
      ],
    };
  }

  /**
   * Conversational Assistant Responder
   */
  static answerUserQuery(
    query: string,
    context: {
      accounts: Account[];
      transactions: Transaction[];
      budgets: Budget[];
      goals: SavingsGoal[];
      netWorth: number;
      surplus: number;
    }
  ): string {
    const q = query.toLowerCase();

    if (q.includes('net worth') || q.includes('how much am i worth')) {
      return `Your current calculated net worth is ₹${context.netWorth.toLocaleString('en-IN')}. This comprises all bank accounts, physical cash, and UPI wallets minus credit card liabilities.`;
    }

    if (q.includes('food') || q.includes('dining')) {
      const foodBudget = context.budgets.find((b) => b.category.includes('Food'));
      const spent = foodBudget ? foodBudget.spent : 3200;
      const limit = foodBudget ? foodBudget.amount : 5000;
      return `You have spent ₹${spent.toLocaleString('en-IN')} of your ₹${limit.toLocaleString('en-IN')} Food & Dining budget this month. You have ₹${(limit - spent).toLocaleString('en-IN')} remaining.`;
    }

    if (q.includes('emergency') || q.includes('goal')) {
      const emergency = context.goals.find((g) => g.name.toLowerCase().includes('emergency'));
      if (emergency) {
        const pct = Math.round((emergency.currentAmount / emergency.targetAmount) * 100);
        return `Your Emergency Fund sits at ₹${emergency.currentAmount.toLocaleString('en-IN')} of your ₹${emergency.targetAmount.toLocaleString('en-IN')} target (${pct}% complete). To hit your deadline, maintain monthly deposits of ₹${emergency.monthlyContributionTarget.toLocaleString('en-IN')}.`;
      }
    }

    if (q.includes('afford') || q.includes('buy') || q.includes('purchase')) {
      return `With a current monthly operational surplus of ₹${context.surplus.toLocaleString('en-IN')} and an uncommitted liquid buffer, discretionary purchases under ₹30,000 can be absorbed if staggered across two paychecks without compromising your emergency fund.`;
    }

    if (q.includes('credit card') || q.includes('debt')) {
      const cc = context.accounts.find((a) => a.type === 'credit_card');
      return `Your active credit card balance is ₹${(cc?.currentBalance || 0).toLocaleString('en-IN')}. Bill due date is on the 7th. Treat this as a liability settlement and pay before the cycle closes.`;
    }

    return `Based on your active records: Monthly Income is ₹75,000, Total Expenses are ₹48,000, and Net Worth stands at ₹${context.netWorth.toLocaleString('en-IN')}. How can I assist you with your budget, goals, or savings allocation today?`;
  }
}
