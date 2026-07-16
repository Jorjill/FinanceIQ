export const beginnerCourses = [
  {
    id: 'b1',
    level: 'Beginner',
    icon: '💡',
    title: 'What Is Investing?',
    subtitle: 'The foundational concept that builds all wealth',
    duration: '8 min',
    lessons: [
      {
        id: 'b1l1',
        title: 'Saving vs Investing',
        duration: '3 min',
        content: `## Saving vs Investing\n\n**Saving** means putting money in safe, liquid accounts. Your money is protected but barely grows — savings accounts pay 0.01%–5% APY.\n\n**Investing** means putting money to work in assets that grow over time. Higher potential returns come with higher risk.\n\n### Why Invest?\nInflation erodes purchasing power at ~3% per year. If your savings earn 1%, you're losing buying power.\n\n### The Real Cost of NOT Investing\n- $30,000 in savings at 1% for 30 years → **$40,000**\n- $30,000 invested in S&P 500 (~10%/yr) for 30 years → **$524,000**\n\nThe difference: **$484,000** — just from investing instead of saving.\n\n### Key Takeaway\nYou don't become wealthy by saving money. You become wealthy by making your money work harder than you do.`,
      },
      {
        id: 'b1l2',
        title: 'How Markets Work',
        duration: '3 min',
        content: `## How Financial Markets Work\n\nA **market** is where buyers and sellers exchange assets. Financial markets let companies raise capital and investors put money to work.\n\n### The Stock Market\nWhen a company wants to raise money, it sells **shares** (pieces of ownership) to the public. Investors profit when:\n1. The company becomes more valuable (share price rises)\n2. The company distributes profits (**dividends**)\n\n### Who Sets Prices?\nSupply and demand. More buyers → price rises. More sellers → price falls.\n\n### Market Participants\n- **Retail investors** – Individuals like you\n- **Institutional investors** – Mutual funds, pension funds, hedge funds\n- **Market makers** – Ensure liquidity\n\n### NYSE & NASDAQ\nThe two largest US exchanges. NASDAQ is tech-heavy (Apple, Google, Microsoft).`,
      },
      {
        id: 'b1l3',
        title: 'Asset Classes Overview',
        duration: '2 min',
        content: `## The Main Asset Classes\n\n### Stocks (Equities)\nOwnership in companies. Highest long-term return (~10%/yr), highest volatility.\n\n### Bonds (Fixed Income)\nLoans to companies/governments paying interest. Lower return (~3-5%), lower risk.\n\n### Real Estate\nPhysical property or REITs. Income + appreciation. ~8% annual return historically.\n\n### Cash & Equivalents\nSavings accounts, money market funds, T-bills. Safest, lowest return.\n\n### Commodities\nGold, oil, wheat. Useful for inflation protection.\n\n### Crypto\nBitcoin, Ethereum. Highest risk/reward. Treat as speculative (5-10% max).\n\n### Historical Return Hierarchy\nStocks > Real Estate > Bonds > Cash`,
      },
    ],
  },
  {
    id: 'b2',
    level: 'Beginner',
    icon: '⏰',
    title: 'Compound Interest',
    subtitle: "The 8th wonder of the world",
    duration: '10 min',
    lessons: [
      {
        id: 'b2l1',
        title: 'The Magic of Compounding',
        duration: '4 min',
        content: `## Compound Interest: The 8th Wonder of the World\n\n**Simple interest** earns returns only on your principal.\n**Compound interest** earns returns on your principal AND on previous returns.\n\n### Formula: A = P × (1 + r/n)^(n×t)\n\n### Real Example with Your $30,000\n| Years | 7% Return | 10% Return | 15% Return |\n|-------|-----------|------------|------------|\n| 10    | $59,027   | $77,812    | $121,367   |\n| 20    | $116,092  | $201,825   | $490,950   |\n| 30    | $228,367  | $523,482   | $1,986,086 |\n\n### The Rule of 72\nDivide 72 by your annual return to find how long to **double** your money:\n- 7% → doubles every ~10.3 years\n- 10% → doubles every ~7.2 years\n\n### The Critical Insight\n**Time matters more than the amount you invest.** Starting at 25 vs 35 can mean $500,000+ difference by retirement.`,
      },
      {
        id: 'b2l2',
        title: 'Start Early: The Time Factor',
        duration: '3 min',
        content: `## Why Starting Early Is Everything\n\n### The Tale of Two Investors\n**Early Emma** invests $5,000/year from age 22-32 (10 years, $50K total), then stops.\n**Late Larry** invests $5,000/year from age 32-62 (30 years, $150K total).\n\nAt 62, assuming 10% returns:\n- Emma: **$1,348,000** (invested $50K)\n- Larry: **$822,000** (invested $150K)\n\nEmma wins by $526,000 despite investing 3x LESS. This is the power of time.\n\n### Don't Wait for the "Right Time"\nStudies show market timing costs the average investor 1.5-2% per year. The best time to invest was yesterday. The second best time is **today**.`,
      },
      {
        id: 'b2l3',
        title: 'Dividend Reinvestment',
        duration: '3 min',
        content: `## Supercharging Compounding with Dividends\n\n**Dividends** are cash payments companies make to shareholders quarterly.\n\n### DRIP (Dividend Reinvestment Plan)\nInstead of taking dividends as cash, reinvest them to buy more shares. Accelerates compounding significantly.\n\n### Example: $30,000 in a 3% Dividend Payer\n- Without DRIP (8% growth): $30K → **$201,825** in 20 years\n- With DRIP (8% + 3% = 11% effective): $30K → **$265,000** in 20 years\n\nThat's **$63,000 extra** just from reinvesting dividends.\n\n### Dividend Aristocrats\nCompanies with 25+ years of consecutive dividend increases:\n- Johnson & Johnson\n- Coca-Cola\n- Procter & Gamble\n- Realty Income (REIT)`,
      },
    ],
  },
  {
    id: 'b3',
    level: 'Beginner',
    icon: '⚖️',
    title: 'Risk & Return',
    subtitle: 'Understanding the fundamental trade-off in investing',
    duration: '9 min',
    lessons: [
      {
        id: 'b3l1',
        title: 'Risk Tolerance',
        duration: '3 min',
        content: `## Understanding Your Risk Tolerance\n\nRisk tolerance is how much volatility you can stomach without panic-selling.\n\n### Factors That Determine It\n1. **Time horizon** – Longer = more risk you can take\n2. **Income stability** – Steady job = more risk capacity\n3. **Emergency fund** – Fully funded = more risk capacity\n4. **Personality** – Can you sleep with a 30% portfolio drop?\n\n### The 3 Investor Profiles\n**Conservative:** 70% bonds, 30% stocks. Slow, steady. Near-retirement.\n**Moderate:** 60% stocks, 40% bonds. Balanced growth.\n**Aggressive:** 90%+ stocks. Maximum growth. For young investors with 10+ year horizon.\n\n### For Your $30K\nAt a young age with a long horizon, an **aggressive to moderate** approach makes most sense. A 30% market drop is temporary — the S&P 500 has ALWAYS recovered.\n\n### Inflation Risk\nThe risk of NOT investing is often greater than market risk. Inflation at 3%/year means $30K today is worth only $16,600 in 20 years if left in cash.`,
      },
      {
        id: 'b3l2',
        title: 'Types of Risk',
        duration: '3 min',
        content: `## Types of Investment Risk\n\n**Market Risk:** Entire market falls. Can't be diversified away. Managed by long time horizon.\n\n**Company Risk:** A single company fails (Enron, Lehman). CAN be diversified away — own 20+ stocks or an index fund.\n\n**Inflation Risk:** Returns don't keep up with inflation. Combat with stocks and real assets.\n\n**Liquidity Risk:** Can't sell quickly at fair value. Real estate, private equity.\n\n**Interest Rate Risk:** Bond prices fall when rates rise.\n\n**Concentration Risk:** Too much in one stock or sector.\n\n### The Most Dangerous Risk for New Investors: Behavioral Risk\n**YOU** are your biggest investment risk. Panic selling at the bottom and FOMO buying at the top destroys more wealth than any market crash.`,
      },
      {
        id: 'b3l3',
        title: 'Volatility vs Permanent Loss',
        duration: '3 min',
        content: `## Volatility Is Not the Same as Loss\n\nThis is one of the most important distinctions in investing.\n\n### Volatility\nA temporary price decline. The S&P 500 drops 20% but historically always recovers to new highs.\n- Average intra-year decline since 1980: **-14%**\n- Yet the market was positive 75% of years\n\n### Permanent Loss of Capital\nHappens when:\n1. A company goes bankrupt (individual stocks)\n2. You SELL during a downturn (locking in losses)\n3. Fraud (Enron, FTX)\n\n### The 2020 COVID Crash\nThe S&P 500 dropped 34% in 33 days. Investors who sold locked in massive losses. Those who held recovered 100% within 5 months.\n\n**The Key Rule:** Only invest money you won't need for 5+ years. This lets you HOLD through volatility without being forced to sell at a loss.`,
      },
    ],
  },
  {
    id: 'b4',
    level: 'Beginner',
    icon: '🛡️',
    title: 'Financial Foundation',
    subtitle: 'Build the base before investing a single dollar',
    duration: '12 min',
    lessons: [
      {
        id: 'b4l1',
        title: 'Emergency Fund First',
        duration: '4 min',
        content: `## Build Your Emergency Fund Before Investing\n\n**Rule:** Keep 3-6 months of living expenses in a high-yield savings account BEFORE investing.\n\n### Why This Matters\nWithout an emergency fund:\n- Medical bill → forced to sell investments at a loss\n- Job loss → forced to sell during a market downturn\n- Car repair → credit card debt at 20% interest\n\n### Where to Keep It\n**High-Yield Savings Accounts (HYSA)** – earn 4-5% with zero risk:\n- Marcus by Goldman Sachs\n- Ally Bank\n- SoFi\n- Discover Savings\n\n### Your $30K Plan\nIf monthly expenses are $3,000:\n- Emergency fund: $9,000-18,000 (3-6 months)\n- Investable capital: $12,000-21,000\n\n### The Investor's Order of Operations\n1. Emergency fund (3-6 months expenses)\n2. Pay off high-interest debt (>7%)\n3. Max 401(k) to employer match (free money!)\n4. Max Roth IRA ($7,000/year)\n5. Invest remainder in taxable brokerage`,
      },
      {
        id: 'b4l2',
        title: 'Debt Management',
        duration: '4 min',
        content: `## Good Debt vs Bad Debt\n\n**The Math:** If debt costs more than your expected investment return, pay off the debt first.\n\n### Bad Debt (Pay Off Immediately)\n- Credit cards: 18-29% — guaranteed negative return\n- Personal loans: 8-15%\n- Payday loans: 300%+\n\n### Neutral Debt (Case-by-Case)\n- Student loans: 5-8%\n- Auto loans: 5-8%\n\n### Good Debt (Invest Alongside)\n- Mortgage: 3-7% — stocks likely win long-term\n\n### Avalanche Method (Mathematically Optimal)\nPay minimum on all debts, throw extra cash at the highest interest rate first.\n\n### Snowball Method (Psychologically Motivating)\nPay off smallest balance first. Less optimal but builds momentum.\n\n### With $30K\nIf you have $10K in credit card debt at 20%, paying it off = guaranteed **20% return**. No investment reliably beats that.`,
      },
      {
        id: 'b4l3',
        title: 'Budgeting for Investors',
        duration: '4 min',
        content: `## The Investor's Budget\n\n### Modified 50/30/20 Rule\n- **50%** → Needs (housing, food, utilities)\n- **20%** → Wants (entertainment, dining)\n- **30%** → Investments and savings\n\n### Pay Yourself First\n**Automate** investments before spending. Set up automatic transfers on payday. You won't miss what you never see.\n\n### The Power of Consistency\n$1,000/month invested at 10% for 30 years = **$2.27 million**\n\nEvery $100/month you cut from expenses = $12,000+ extra wealth over 30 years.\n\n### Track Net Worth, Not Income\nWealthy people measure success by **net worth** (assets minus liabilities), not how much they earn.\n\n### Automate Everything\n- Auto-invest on payday\n- Auto-pay all bills\n- HYSA auto-transfer for emergency fund\nRemove emotion and friction from the process.`,
      },
    ],
  },
];
