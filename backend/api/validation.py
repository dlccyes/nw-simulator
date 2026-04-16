from typing import Any, Dict, List, Optional


ALLOWED_COUNTRIES = {"US", "TW"}
ALLOWED_FILING_STATUSES = {"single", "married", "compare"}


def _require_number(name: str, value: Any, *, min_value: Optional[float] = None) -> None:
    if not isinstance(value, (int, float)):
        raise ValueError(f"{name} must be a number")
    if min_value is not None and value < min_value:
        raise ValueError(f"{name} must be >= {min_value}")


def _require_int(name: str, value: Any, *, min_value: Optional[int] = None) -> None:
    if not isinstance(value, int):
        raise ValueError(f"{name} must be an integer")
    if min_value is not None and value < min_value:
        raise ValueError(f"{name} must be >= {min_value}")


def _require_str(name: str, value: Any) -> None:
    if not isinstance(value, str) or not value:
        raise ValueError(f"{name} must be a non-empty string")


def _require_bool(name: str, value: Any) -> None:
    if not isinstance(value, bool):
        raise ValueError(f"{name} must be a boolean")


def _require_array_of_objects(name: str, value: Any, required_fields: List[str]) -> None:
    if not isinstance(value, list):
        raise ValueError(f"{name} must be an array")
    for idx, item in enumerate(value):
        if not isinstance(item, dict):
            raise ValueError(f"{name}[{idx}] must be an object")
        for rf in required_fields:
            if rf not in item:
                raise ValueError(f"{name}[{idx}].{rf} is required")


def validate_calculate_payload(data: Dict[str, Any]) -> None:
    required_fields = [
        'currentAge', 'endAge', 'currentNetWorth', 'annualReturn', 'inflationRate',
        'retirementSpending', 'withdrawalRate', 'preTax401k', 'employerMatch',
        'country', 'state', 'filingStatus', 'yearlyIncome', 'yearlySpending'
    ]
    for f in required_fields:
        if f not in data:
            raise ValueError(f"Missing required field: {f}")

    _require_int('currentAge', data['currentAge'], min_value=0)
    _require_int('endAge', data['endAge'], min_value=data['currentAge'])

    _require_number('currentNetWorth', data['currentNetWorth'], min_value=0)
    _require_number('annualReturn', data['annualReturn'])
    _require_number('inflationRate', data['inflationRate'])
    _require_number('retirementSpending', data['retirementSpending'], min_value=0)
    _require_number('withdrawalRate', data['withdrawalRate'], min_value=0)
    _require_number('preTax401k', data['preTax401k'], min_value=0)
    _require_number('employerMatch', data['employerMatch'], min_value=0)

    _require_str('country', data['country'])
    if data['country'] not in ALLOWED_COUNTRIES:
        raise ValueError('Unsupported country')

    # state required for US
    if data['country'] == 'US':
        _require_str('state', data['state'])

    filing = data['filingStatus']
    _require_str('filingStatus', filing)
    if filing not in {"single", "married"}:
        raise ValueError('filingStatus must be "single" or "married"')

    _require_array_of_objects('yearlyIncome', data['yearlyIncome'], ['startAge', 'endAge', 'amount'])
    _require_array_of_objects('yearlySpending', data['yearlySpending'], ['startAge', 'endAge', 'amount'])

    # Optional
    if 'stopAtFire' in data:
        _require_bool('stopAtFire', data['stopAtFire'])

def validate_us_tax_comparison_payload(data: Dict[str, Any]) -> None:
    if 'income' not in data:
        raise ValueError('income is required')
    _require_number('income', data['income'], min_value=1)

    filing = data.get('filing_status', 'single')
    if filing not in ALLOWED_FILING_STATUSES:
        raise ValueError('filing_status must be one of single, married, compare')

    if 'partner_income' in data:
        _require_number('partner_income', data['partner_income'], min_value=0)

    if 'tax_exempt_income' in data:
        _require_number('tax_exempt_income', data['tax_exempt_income'], min_value=0)
    if 'partner_tax_exempt_income' in data:
        _require_number('partner_tax_exempt_income', data['partner_tax_exempt_income'], min_value=0)


def validate_tax_payload(data: Dict[str, Any]) -> None:
    for f in ['income', 'state']:
        if f not in data:
            raise ValueError(f"Missing required field: {f}")
    _require_number('income', data['income'], min_value=0)
    _require_str('state', data['state'])
    # country optional, defaults to US
