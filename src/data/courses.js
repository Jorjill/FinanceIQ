import { beginnerCourses } from './beginner';
import { intermediateCourses } from './intermediate';
import { advancedCourses } from './advanced';

export const courses = [
  ...beginnerCourses,
  ...intermediateCourses,
  ...advancedCourses,
];

export const dailyTips = [
  "The S&P 500 has returned an average of ~10%/year for the past 100 years.",
  "Compound interest doubles your money every 7.2 years at 10% returns.",
  "80%+ of professional fund managers underperform the S&P 500 over 15 years.",
  "Every $1 you invest at 25 is worth ~$11 by age 65 (at 10%/yr).",
  "The Rule of 72: divide 72 by your return rate to find doubling time.",
  "A 1% fee difference on $100K costs $100,000 over 30 years.",
  "Rebalancing once a year is better than trying to time the market.",
  "Dollar-cost averaging removes the stress of trying to buy at the perfect time.",
  "Missing just the 10 best trading days per decade cuts your returns in half.",
  "Your emergency fund is what lets you stay invested during market crashes.",
  "The Roth IRA may be the single best tax vehicle ever created for wealth building.",
  "Time in the market always beats timing the market — statistically proven.",
  "Diversification is the only free lunch in investing.",
  "Paying yourself first (automating investments) is the #1 wealth habit.",
  "Volatility is the price you pay for superior long-term returns.",
];
