import re
with open('backend/app/services/admin_service.py', 'r') as f: content = f.read()
content = re.sub(r'round\(([^,]+),\s*(\d+)\)', r'float(f"{\1:.\2f}")', content)
content = content.replace("total_revenue += (amount or 0.0) * ton_price", "total_revenue += float(amount or 0.0) * float(ton_price)")
content = content.replace("if not partner: return None", "if not partner: return {}")
with open('backend/app/services/admin_service.py', 'w') as f: f.write(content)
