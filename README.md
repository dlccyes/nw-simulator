# FIRE Calculator + NW Simulator

A Financial Independence, Retire Early (FIRE) calculator with net worth projection. Supports US and Taiwan with country-specific tax calculations, retirement accounts, and payroll deductions.

**🌐 Website: [https://nw.derricklin.net/](https://nw.derricklin.net/)**

**⚠️ Disclaimer: This is 95% vibe-coded. Accuracy not guaranteed.**

## Features

- 🇺🇸 **US Support**: Federal/state taxes, 401k, Social Security, Medicare
- 🇹🇼 **Taiwan Support**: Income tax, labor insurance, health insurance  
- 📊 **Projections**: Real vs nominal net worth, tax breakdowns, FIRE timeline
- 💼 **Flexible Income & Spending**: Multiple income and spending phases
- 🎯 **Scenarios**: Stop at FIRE vs continue working options

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

## Testing

Run all tests:
```bash
cd backend/api
python3 -m pytest -v
```

