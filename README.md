# FIRE Calculator + Retirement Simulator + US Tax Comparison

A comprehensive financial planning tool featuring a FIRE (Financial Independence, Retire Early) calculator, detailed retirement simulator, and US state tax comparison tool. Supports US and Taiwan with accurate tax calculations, retirement accounts, and payroll deductions.

**🌐 Website: [https://nw.approximator.net/](https://nw.approximator.net/)**

**⚠️ Disclaimer: This is 95% vibe-coded. Accuracy not guaranteed.**

## Features

### 🔥 FIRE Calculator
- 🇺🇸 **US Support**: Federal/state taxes, 401k, Social Security, Medicare
- 🇹🇼 **Taiwan Support**: Income tax, labor insurance, health insurance  
- 📊 **Projections**: Real vs nominal net worth, tax breakdowns, FIRE timeline
- 💼 **Flexible Income & Spending**: Multiple income and spending phases
- 🎯 **Scenarios**: Stop at FIRE vs continue working options
- 🌓 **Dark Mode**: Toggle between light and dark themes
- 💾 **Profile Management**: Save and load calculation profiles (local development)

### 🏖️ Retirement Simulator
- 💰 **Account Tracking**: Separate tracking for Traditional IRA, Roth IRA, Traditional 401k, Roth 401k, and taxable accounts
- 🏦 **Social Security**: Benefit calculations based on income with age adjustment (62-70)
- 📊 **Smart Withdrawals**: Optimal withdrawal strategy considering tax implications
- 🗺️ **State Tax Treatment**: State-specific retirement income taxation rules
- 📈 **Visual Projections**: Interactive charts showing account balances, withdrawals, and taxes over time
- 🎯 **Detailed Planning**: Year-by-year breakdown of retirement finances

### 🗺️ US Tax Comparison
- 📊 **State-by-State Analysis**: Compare effective tax rates across all 50 US states
- 👥 **Partner Income Support**: Calculate taxes for couples with dual incomes
- 📈 **Interactive Charts**: Visual breakdown of tax components with pie charts
- 🔄 **Filing Status Options**: Single, Married Filing Jointly, or Compare Both
- 🎯 **Smart Filtering**: Filter states and filing types to focus your comparison
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Backend**: Flask (Python) deployed on GCP Cloud Run
- **Frontend**: React (TypeScript) deployed on GitHub Pages
- **Tax Data**: JSON configuration files for easy updates
- **Database**: MongoDB for profile storage
- **CI/CD**: GitHub Actions for automated testing and deployment

## Quick Start

Start local mongodb server:
```bash
brew services start mongodb-community
```

Run backend server:
```bash
cd backend
python3 app.py
```

Run frontend server:
```bash
npm run dev
```

### Configuration (Backend)

Environment variables:
- `PORT` (default: 5000) — Flask port
- `ENABLE_PROFILES` (default: false) — enable profile save/load endpoints
- `MONGODB_URI` (default: mongodb://localhost:27017) — Mongo connection
- `CORS_ORIGINS` (comma-separated) — allowed CORS origins
- `MAX_CONTENT_LENGTH` (default: 1000000) — request size limit in bytes

## Development

### Using Makefile Commands

Run all tests, build, and cleanup:
```bash
make test
```

Run individual commands:
```bash
make test-backend    # Backend tests only
make test-frontend   # Frontend tests only
make build          # Production build
make build-clean    # Build and cleanup artifacts
make clean          # Cleanup build artifacts
make dev            # Start development server
make lint           # Run linting
```

### Manual Testing

Run backend tests:
```bash
cd backend/api
python3 -m pytest -v
```

## Key Features Explained

### Partner Income Calculations
- **Single Filing**: Calculates taxes separately for each person and sums them
- **Married Filing Jointly**: Combines income for tax brackets but calculates Social Security tax individually
- **Interactive Pie Chart**: Adjust income distribution between partners with visual feedback

### Tax Information Integration
- **Clickable Tax Components**: Click on Federal, FICA, or State taxes for detailed breakdowns
- **2024 Tax Data**: Current tax brackets, standard deductions, and payroll tax rates
- **Country-Specific Details**: Different tax structures for US vs Taiwan

### SPA Deployment
- **GitHub Pages Compatible**: Includes 404.html redirect for client-side routing
- **Custom Domain Ready**: Configured for both project sites and custom domains
