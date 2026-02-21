import asyncio
import asyncpg
import decimal

async def main():
    conn = await asyncpg.connect('postgresql://postgres:rqlCKNPanWJKienluVgruvHeIkqLiGFg@switchback.proxy.rlwy.net:40220/railway')
    
    # Let's get the 5 most recent completed transactions for TON
    rows = await conn.fetch('''
        SELECT t.id, t.partner_id, t.amount, t.currency, t.network, t.status, t.created_at, p.telegram_username, p.tier, p.id
        FROM partnertransaction t
        JOIN partner p ON t.partner_id = p.id
        WHERE t.currency IN ('TON', 'USDT') AND t.status = 'completed'
        ORDER BY t.created_at DESC
        LIMIT 5;
    ''')
    
    print("Recent Transactions:")
    for row in rows:
        print(dict(row))

if __name__ == '__main__':
    asyncio.run(main())
