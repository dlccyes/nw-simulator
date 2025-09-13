import pytest

from validation import (
    validate_calculate_payload,
    validate_us_tax_comparison_payload,
    validate_tax_payload,
)


def test_validate_calculate_payload_ok():
    payload = {
        'currentAge': 30,
        'endAge': 31,
        'currentNetWorth': 0,
        'annualReturn': 7,
        'inflationRate': 2,
        'retirementSpending': 10000,
        'withdrawalRate': 4,
        'preTax401k': 0,
        'employerMatch': 0,
        'country': 'US',
        'state': 'CA',
        'filingStatus': 'single',
        'yearlyIncome': [{'startAge': 30, 'endAge': 31, 'amount': 100000}],
        'yearlySpending': [{'startAge': 30, 'endAge': 31, 'amount': 50000}],
        'stopAtFire': False,
    }
    validate_calculate_payload(payload)  # should not raise


@pytest.mark.parametrize('missing', [
    'currentAge', 'endAge', 'currentNetWorth', 'annualReturn', 'inflationRate',
    'retirementSpending', 'withdrawalRate', 'preTax401k', 'employerMatch',
    'country', 'state', 'filingStatus', 'yearlyIncome', 'yearlySpending'
])
def test_validate_calculate_payload_missing(missing):
    base = {
        'currentAge': 30,
        'endAge': 31,
        'currentNetWorth': 0,
        'annualReturn': 7,
        'inflationRate': 2,
        'retirementSpending': 10000,
        'withdrawalRate': 4,
        'preTax401k': 0,
        'employerMatch': 0,
        'country': 'US',
        'state': 'CA',
        'filingStatus': 'single',
        'yearlyIncome': [{'startAge': 30, 'endAge': 31, 'amount': 100000}],
        'yearlySpending': [{'startAge': 30, 'endAge': 31, 'amount': 50000}],
        'stopAtFire': False,
    }
    base.pop(missing)
    with pytest.raises(ValueError):
        validate_calculate_payload(base)


def test_validate_us_tax_comparison_ok():
    validate_us_tax_comparison_payload({'income': 100000, 'filing_status': 'single'})
    validate_us_tax_comparison_payload({'income': 100000, 'filing_status': 'married', 'partner_income': 50000})
    validate_us_tax_comparison_payload({'income': 100000, 'filing_status': 'compare'})


def test_validate_us_tax_comparison_invalid():
    with pytest.raises(ValueError):
        validate_us_tax_comparison_payload({'income': 0})
    with pytest.raises(ValueError):
        validate_us_tax_comparison_payload({'income': 100000, 'filing_status': 'weird'})


def test_validate_tax_payload_ok():
    validate_tax_payload({'income': 0, 'state': 'CA'})


def test_validate_tax_payload_invalid():
    with pytest.raises(ValueError):
        validate_tax_payload({'income': 100000})  # missing state

