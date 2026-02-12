# P2PHub Testing Guide

## Running Tests

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File
```bash
pytest tests/test_referral_system.py -v
```

### Run Specific Test
```bash
pytest tests/test_referral_system.py::TestXPDistribution::test_single_level_xp_distribution -v
```

### Run with Coverage
```bash
pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html to see coverage report
```

### Run with Print Statements
```bash
pytest tests/ -v -s
```

## Test Structure

```
tests/
├── __init__.py                      # Package marker
├── conftest.py                      # Shared fixtures
├── test_referral_system.py          # Referral chain tests
└── test_notification_system.py      # Notification tests
```

## What's Tested

### Referral System (test_referral_system.py)
- ✅ Referral chain creation (1-9 levels)
- ✅ XP distribution across all levels
- ✅ PRO multiplier (5x XP)
- ✅ Commission distribution (30%, 5%, 3%, 1%...)
- ✅ Transaction atomicity
- ✅ Edge cases (no referrer, invalid codes)
- ✅ Concurrent referrals
- ✅ **Bug #1**: No infinite loop on errors
- ✅ **Bug #2**: Direct referrer gets commissions
- ✅ **Bug #3**: Direct referrer gets XP
- ✅ **Bug #4**: Atomic PRO upgrades

### Notification System (test_notification_system.py)
- ✅ Notification enqueueing
- ✅ Skipping invalid notifications
- ✅ Fallback mechanism on broker failure

## Adding New Tests

1. Create test file: `tests/test_your_feature.py`
2. Use fixtures from `conftest.py`
3. Add #comment blocks explaining what you're testing
4. Run tests to verify

Example:
```python
async def test_my_feature(session, create_test_partner):
    """
    Test description here.
    
    Verifies:
    - Thing 1
    - Thing 2
    """
    # #comment: Explain why this test matters
    partner = await create_test_partner(telegram_id="test", username="test")
    
    # Your test logic here
    assert partner.id is not None
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.13'
      - run: pip install -r requirements.txt
      - run: pytest tests/ --cov=app
```

## Next Steps

1. ✅ Referral system tests created
2. ✅ Notification system tests created
3. ⏳ Add payment system tests
4. ⏳ Add load tests (1000+ concurrent users)
5. ⏳ Set up CI/CD pipeline
