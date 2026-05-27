import os
import sys
import json

import pytest


# Make backend/ importable to get app factory
CURRENT_DIR = os.path.dirname(__file__)
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app  # noqa: E402


@pytest.fixture(scope='module')
def client():
    app = create_app()
    app.testing = True
    with app.test_client() as c:
        yield c


def test_tax_info_us_success(client):
    resp = client.get('/api/tax-info/US')
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'federal' in data and 'payroll_taxes' in data


def test_us_tax_comparison_success_single(client):
    payload = {"income": 230000, "filing_status": "single"}
    resp = client.post('/api/us-tax-comparison', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert {'stateCode', 'effectiveRate', 'afterTaxIncome'} <= set(data[0].keys())


def test_us_tax_comparison_invalid_income(client):
    payload = {"income": 0, "filing_status": "single"}
    resp = client.post('/api/us-tax-comparison', json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data


def test_tax_endpoint_invalid_missing_state(client):
    payload = {"income": 100000}
    resp = client.post('/api/tax', json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data


def test_calculate_endpoint_success(client):
    payload = {
        'currentAge': 30,
        'endAge': 35,
        'currentNetWorth': 100000,
        'annualReturn': 7,
        'inflationRate': 2,
        'retirementSpending': 40000,
        'withdrawalRate': 4,
        'preTax401k': 10000,
        'employerMatch': 50,
        'country': 'US',
        'state': 'CA',
        'filingStatus': 'single',
        'yearlyIncome': [{'startAge': 30, 'endAge': 35, 'amount': 100000}],
        'yearlySpending': [{'startAge': 30, 'endAge': 35, 'amount': 50000}],
        'stopAtFire': False
    }
    resp = client.post('/api/calculate', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert 'years' in data and 'realNetWorth' in data
    assert len(data['years']) == 6


def test_calculate_endpoint_missing_field(client):
    payload = {
        # 'currentAge' is missing
        'endAge': 35,
        'currentNetWorth': 100000,
        'annualReturn': 7,
        'inflationRate': 2,
        'retirementSpending': 40000,
        'withdrawalRate': 4,
        'preTax401k': 10000,
        'employerMatch': 50,
        'country': 'US',
        'state': 'CA',
        'filingStatus': 'single',
        'yearlyIncome': [{'startAge': 30, 'endAge': 35, 'amount': 100000}],
        'yearlySpending': [{'startAge': 30, 'endAge': 35, 'amount': 50000}],
        'stopAtFire': False
    }
    resp = client.post('/api/calculate', json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert 'error' in data
