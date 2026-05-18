def artist_revenue(gross: float, share_pct: float) -> float:
    return round(gross * share_pct / 100, 2)


def label_revenue(gross: float, share_pct: float) -> float:
    return round(gross - artist_revenue(gross, share_pct), 2)


def calc_payment(gross_amount: float) -> dict:
    commission = round(gross_amount * 0.10, 2)
    tax = round(gross_amount * 0.06, 2)
    net_payout = round(gross_amount - commission - tax, 2)
    return {
        "gross_amount": gross_amount,
        "commission": commission,
        "tax": tax,
        "net_payout": net_payout,
    }


def calc_balance(income: float, payouts: float) -> float:
    return round(income - payouts, 2)
