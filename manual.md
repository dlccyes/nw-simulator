# Financial Planning Tools Usage Manual

A comprehensive guide to using the FIRE Calculator and US Tax Comparison tools.

**⚠️ Disclaimer: This is 95% vibe-coded. Accuracy not guaranteed.**

**Links: [GitHub](https://github.com/dlccyes/nw-simulator) | [Doc](https://nw.derricklin.net/doc)**

## Table of Contents

1. [Getting Started](#getting-started)
2. [FIRE Calculator](#fire-calculator)
   - [Basic Information](#basic-information)
   - [Income Planning](#income-planning)
   - [Spending Planning](#spending-planning)
   - [Retirement Accounts (US Only)](#retirement-accounts-us-only)
   - [Understanding Results](#understanding-results)
   - [Advanced Scenarios](#advanced-scenarios)
3. [US Tax Comparison](#us-tax-comparison)
   - [Overview](#overview)
   - [Partner Income Features](#partner-income-features)
   - [Filing Status Options](#filing-status-options)
   - [Filtering and Sorting](#filtering-and-sorting)
4. [Country-Specific Features](#country-specific-features)
5. [Tips & Best Practices](#tips-best-practices)

## Getting Started

### Website Access
Visit [https://nw.approximator.net/](https://nw.approximator.net/) to access both tools:
- **FIRE Calculator**: Main page for retirement planning and net worth projections
- **US Tax Comparison**: Navigate to the tax comparison tool via the top navigation

### Navigation
- **Dark Mode Toggle**: Available on both pages - click the moon/sun icon in the top-right
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Collapsible Sections**: Info sections are expanded by default but can be collapsed

### Tool Overview
1. **FIRE Calculator**: Plan your path to financial independence with detailed projections
2. **US Tax Comparison**: Compare tax burdens across all 50 US states for optimal location planning

## FIRE Calculator

### First Steps
1. **Select Your Country**: Choose between US or Taiwan for country-specific tax calculations
2. **Enter Basic Info**: Set your current age, target retirement age, and starting net worth
3. **Configure Income**: Add your income phases with different amounts and age ranges
4. **Set Spending**: Define your spending patterns throughout different life stages
5. **Calculate**: Hit the calculate button to see your FIRE projection

## Basic Information

### Current Age & End Age
- **Current Age**: Your age today (used as starting point for projections)
- **End Age**: The age until which you want to run projections (typically 50-65)

### Financial Assumptions
- **Current Age Starting Net Worth**: Your total assets minus liabilities today
- **Annual Return**: Expected annual investment return (typically 6-10%)
- **Inflation Rate**: Expected annual inflation (typically 2-4%)

### FIRE Target
- **Retirement Spending**: Annual spending needed in retirement (today's dollars)
- **Withdrawal Rate**: Safe withdrawal rate from your portfolio (typically 3-4%)

## Income Planning

### Multiple Income Phases
You can define different income levels for different periods of your life:

#### Examples:
```
Phase 1: Age 25-30, $80,000/year (Early career)
Phase 2: Age 31-40, $120,000/year (Mid career)
Phase 3: Age 41-50, $150,000/year (Senior level)
```

### Adding Income Phases
1. Click **"Add Income"** button
2. Set **Start Age** and **End Age** for the income period
3. Enter **Annual Income** amount
4. Repeat for different career phases

### Income Tips
- Include salary increases and promotions
- Consider career changes or sabbaticals
- Account for part-time work in later years
- Use today's dollars (inflation adjusted automatically)

## Spending Planning

### Flexible Spending Phases
Like income, you can set different spending levels for different life periods:

#### Examples:
```
Phase 1: Age 25-35, $50,000/year (Frugal living)
Phase 2: Age 36-45, $70,000/year (Family expenses)
Phase 3: Age 46+, $60,000/year (Empty nest)
```

### Adding Spending Phases
1. Click **"Add Spending"** button
2. Set **Start Age** and **End Age** for the spending period
3. Enter **Annual Spending** amount
4. Repeat for different life stages

### Spending Considerations
- Include all living expenses (housing, food, transportation, etc.)
- Account for family changes (marriage, children)
- Consider healthcare costs increases with age
- Plan for major expenses (home purchases, education)

## Retirement Accounts (US Only)

### 401(k) Contributions
- **Pre-tax 401(k)**: Annual contribution amount (reduces taxable income)
- **Employer Match**: Percentage of salary your employer matches
- **Tax Benefits**: Contributions reduce current year taxes

### How It Works
1. **Tax Reduction**: 401(k) contributions lower your taxable income
2. **Employer Match**: Free money added to your retirement savings
3. **Compound Growth**: Tax-deferred growth until retirement

### Example
```
Salary: $100,000
401(k) Contribution: $20,000
Employer Match: 5%

Result:
- Taxable Income: $80,000 (reduced by $20,000)
- Employer Match: $5,000 (5% of $100,000)
- Total Retirement Savings: $25,000/year
```

## Country-Specific Features

### United States 🇺🇸

#### Tax System
- **Federal Taxes**: Progressive tax brackets (10%-37%)
- **State Taxes**: Varies by state (0%-13.3%)
- **Standard Deduction**: $14,600 for single filers
- **Payroll Taxes**: Social Security (6.2%) + Medicare (1.45%)

#### Supported States
All 50 states with accurate tax brackets and deductions.

#### Special Features
- 401(k) tax benefits
- Employer matching calculations
- Social Security wage base caps
- Medicare additional tax on high earners

### Taiwan 🇹🇼

#### Tax System
- **Income Tax**: Progressive brackets (5%-40%)
- **Standard Deduction**: NT$446,000 for unmarried, non-disabled under 70
- **Labor Insurance**: 2.5% of income
- **Health Insurance**: 1.55% of income (capped at NT$56,364/year)

#### Currency
All amounts in Taiwan dollars (TWD/NT$).

#### Default Values
Taiwan defaults are 10x US monetary values to reflect currency differences.

## Understanding Results

### Key Metrics

#### FIRE Age
The age at which your net worth reaches your FIRE target (retirement spending ÷ withdrawal rate).

#### Required Savings
Total amount needed for FIRE based on your withdrawal rate and spending goals.

#### Net Worth Projection
- **Nominal**: Future dollars (includes inflation)
- **Real**: Today's purchasing power (inflation-adjusted)

### Charts & Graphs

#### Net Worth Over Time
Shows how your wealth grows from current age to end age.

#### Income vs Spending
Displays your earnings and expenses across different life phases.

#### Tax Analysis
Breakdown of federal, state, and payroll taxes by year.

### Tax Information
Click the **"Info"** section to see:
- Tax brackets for your country/state
- Standard deductions
- Payroll tax rates and caps

## US Tax Comparison

### Overview
The US Tax Comparison tool helps you compare effective tax rates across all 50 US states to make informed decisions about where to live for optimal tax efficiency.

### Basic Usage
1. **Enter Your Income**: Input your annual income (e.g., $230,000)
2. **Select Filing Status**: Choose Single, Married Filing Jointly, or Compare Both
3. **Calculate**: Click "Calculate Tax Comparison" to see results
4. **Analyze**: Review the sortable table with tax breakdowns by state

### Partner Income Features

#### Adding a Partner
1. Click **"Add Partner Income"** button
2. Enter your partner's annual income
3. Use the **interactive pie chart** to adjust income distribution
4. **Quick Split Options**: Use 50/50, 60/40, 70/30, 80/20, 90/10, or 100/0 buttons

#### How Partner Calculations Work
- **Single Filing**: Taxes calculated separately for each person, then summed
- **Married Filing Jointly**: Combined income for tax brackets, but Social Security calculated individually
- **Pie Chart**: Visual representation of income split with real-time updates

#### Interactive Income Distribution
- **Drag the Slider**: Adjust the percentage split between partners
- **Live Updates**: Income boxes update automatically as you drag
- **Precise Control**: Slider snaps to clean 5% increments
- **Total Display**: Shows combined household income prominently

### Filing Status Options

#### Single
- Calculates taxes as if both partners file separately
- Useful for unmarried couples or comparing scenarios

#### Married Filing Jointly
- Uses married tax brackets for combined income
- Applies proper standard deductions for married couples
- Calculates Social Security tax individually for each partner

#### Compare Both
- Shows **both** Single and Married scenarios side-by-side
- Each state appears twice in the table: once for Single, once for Married
- Helpful for couples deciding whether marriage saves on taxes
- Uses emoji indicators: 🫃 for Single, 👩‍❤️‍👩 for Married

### Filtering and Sorting

#### State Filtering
- **Search Box**: Type to filter specific states (e.g., "California", "CA")
- **Multiple Selection**: Choose multiple states to compare
- **Clear Filters**: Remove all filters to see all states again

#### Filing Type Filtering (Compare Mode)
- **Single 🫃**: Show only single filing results
- **Married 👩‍❤️‍👩**: Show only married filing results
- **Both**: Show all results (default)

#### Sorting Options
- **Click Column Headers**: Sort by any column (Total Tax, State Tax, Federal Tax, etc.)
- **Default Sort**: Total Tax descending (highest to lowest)
- **Medal Rankings**: 🥇 🥈 🥉 for top 3 states in current sort

### Understanding the Results

#### Tax Breakdown Columns
- **State**: State name with ranking medal
- **Total Tax**: Combined federal, state, and payroll taxes
- **Effective Rate**: Total tax as percentage of income
- **Federal Tax**: Federal income tax amount and percentage
- **State Tax**: State income tax amount and percentage
- **Payroll Tax**: Combined Social Security and Medicare taxes
- **After-Tax Income**: Take-home pay after all taxes

#### Federal & FICA Section
Displays detailed breakdown of federal taxes:
- **Federal Income Tax**: Progressive tax brackets
- **Social Security**: 6.2% up to wage base limit
- **Medicare**: 1.45% + additional 0.9% for high earners
- **Total Federal & FICA**: Combined amount

#### Interactive Elements
- **Clickable Tax Types**: Click "Federal", "FICA", or "State" for detailed information
- **Tax Bracket Details**: See exact brackets and rates
- **Payroll Tax Caps**: Understand Social Security wage base limits

### Pro Tips for Tax Comparison
1. **Consider Total Tax Burden**: Don't just look at state income tax
2. **Factor in Cost of Living**: Low taxes might mean higher living costs
3. **Plan for Retirement**: Some states don't tax retirement income
4. **Compare Both Scenarios**: If married, check if filing jointly saves money
5. **Account for Deductions**: State and local tax deduction limits may apply

## Advanced Scenarios

### Stop at FIRE vs Continue Working

#### Stop at FIRE (Default)
- Income stops when you reach FIRE number
- Spending continues from portfolio withdrawals
- Conservative approach

#### Continue Working
- Keep earning income even after reaching FIRE
- Build additional wealth beyond FIRE target
- Provides extra security and higher final net worth

### Scenario Planning

#### Conservative Scenario
- Lower investment returns (6-7%)
- Higher inflation (3-4%)
- Higher withdrawal rate (4%)

#### Aggressive Scenario
- Higher investment returns (8-10%)
- Lower inflation (2%)
- Lower withdrawal rate (3%)

#### Realistic Scenario
- Moderate returns (7-8%)
- Moderate inflation (2.5-3%)
- Standard withdrawal rate (3.5-4%)

## Tips & Best Practices

### Investment Returns
- **Historical Average**: US stock market ~10% nominal, ~7% real
- **Conservative Estimate**: Use 6-7% for planning
- **Diversification**: Don't assume 100% stocks

### Withdrawal Rates
- **4% Rule**: Traditional safe withdrawal rate
- **3.5% Rule**: More conservative for early retirement
- **Sequence Risk**: Consider market timing at retirement

### Tax Planning
- **Location**: Consider state taxes when choosing where to live
- **Account Types**: Mix of taxable, tax-deferred, and tax-free accounts
- **Roth Conversions**: Consider tax optimization strategies

### Income Planning
- **Raises**: Account for career progression
- **Side Income**: Include rental properties, consulting, etc.
- **Geographic Arbitrage**: Consider cost of living differences

### Spending Planning
- **Lifestyle Inflation**: Avoid increasing spending with income
- **Geographic Arbitrage**: Lower costs in retirement locations
- **Healthcare**: Plan for increasing medical expenses

### Common Mistakes to Avoid
1. **Overly Optimistic Returns**: Don't assume 10%+ forever
2. **Ignoring Taxes**: Taxes significantly impact net worth
3. **Static Planning**: Update projections regularly
4. **Lifestyle Inflation**: Control spending growth
5. **Sequence Risk**: Consider poor market timing

### Regular Reviews
- **Annual Check**: Review and update projections yearly
- **Life Changes**: Update for marriage, children, job changes
- **Market Changes**: Adjust assumptions based on economic conditions

## Frequently Asked Questions

### General Questions

### Q: How accurate are the tax calculations?
A: The calculator uses current 2024 tax brackets and rates but is "95% vibe-coded." Consult a tax professional for precise calculations.

### Q: Can I use this on mobile devices?
A: Yes! Both tools are fully responsive and work well on phones, tablets, and desktop computers.

### Q: Is my data saved or shared?
A: No personal data is stored or shared. All calculations happen in your browser or on our servers temporarily.

### FIRE Calculator Questions

### Q: Should I include home equity in net worth?
A: Yes, but consider that your primary residence isn't a liquid investment.

### Q: What if I live in multiple states/countries?
A: Use the location where you'll spend most of your earning years for the FIRE calculator.

### Q: How often should I update my projections?
A: At least annually, or when major life changes occur.

### Q: What's a safe withdrawal rate?
A: 3.5-4% is commonly cited, but consider your specific situation and risk tolerance.

### US Tax Comparison Questions

### Q: How does partner income calculation work?
A: For Single filing, we calculate taxes separately for each person and sum them. For Married Filing Jointly, we combine income for tax brackets but calculate Social Security tax individually.

### Q: Why are Social Security taxes calculated individually for married couples?
A: The Social Security wage base ($160,200 in 2024) applies to each individual, not the combined household income.

### Q: Should I use the Compare Both filing option?
A: Yes! If you're married or considering marriage, this shows whether filing jointly saves money compared to filing separately.

### Q: Which states have no income tax?
A: Alaska, Florida, Nevada, New Hampshire, South Dakota, Tennessee, Texas, Washington, and Wyoming have no state income tax.

### Q: Does the tax comparison include local taxes?
A: No, it only includes federal and state taxes. Local taxes vary significantly by city and county.

---

**Remember**: This calculator provides estimates for planning purposes. Consult financial professionals for personalized advice. 