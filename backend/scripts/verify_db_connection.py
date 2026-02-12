#!/usr/bin/env python3
"""
Database Connection Verification Script
========================================
This script helps diagnose database connection issues by:
1. Checking if DATABASE_URL is properly set
2. Parsing and validating the connection string
3. Attempting to connect to the database
4. Providing clear error messages

Usage: python scripts/verify_db_connection.py
"""

import os
import sys
import asyncio
from urllib.parse import urlparse
import asyncpg


async def verify_connection():
    """Verify database connection with detailed diagnostics."""
    
    print("🔍 Database Connection Verification")
    print("=" * 60)
    
    # Step 1: Check if DATABASE_URL is set
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable is not set!")
        print("\n📋 To fix this:")
        print("1. Export the DATABASE_URL in your shell:")
        print("   export DATABASE_URL='postgresql://user:password@host:port/database'")
        print("2. Or add it to your .env file")
        return False
    
    print(f"✅ DATABASE_URL is set")
    
    # Step 2: Parse the URL
    try:
        parsed = urlparse(database_url)
        
        # Handle Railway's postgres:// prefix
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
            print("🔧 Converted postgres:// to postgresql://")
        
        parsed = urlparse(database_url)
        
        # Extract components
        username = parsed.username
        password = parsed.password
        hostname = parsed.hostname
        port = parsed.port or 5432
        database = parsed.path.lstrip('/')
        
        print("\n📊 Connection Details:")
        print(f"   Host: {hostname}")
        print(f"   Port: {port}")
        print(f"   Database: {database}")
        print(f"   Username: {username}")
        print(f"   Password: {'*' * len(password) if password else 'NOT SET'}")
        
        if not all([username, password, hostname, database]):
            print("\n❌ ERROR: Incomplete connection details!")
            if not username:
                print("   - Username is missing")
            if not password:
                print("   - Password is missing")
            if not hostname:
                print("   - Hostname is missing") 
            if not database:
                print("   - Database name is missing")
            return False
        
    except Exception as e:
        print(f"\n❌ ERROR: Failed to parse DATABASE_URL: {e}")
        print("\n📋 Expected format:")
        print("   postgresql://username:password@hostname:port/database")
        return False
    
    # Step 3: Attempt connection
    print("\n🔌 Attempting database connection...")
    
    try:
        conn = await asyncpg.connect(
            host=hostname,
            port=port,
            user=username,
            password=password,
            database=database,
            timeout=10
        )
        
        # Test query
        version = await conn.fetchval('SELECT version()')
        print(f"✅ Connection successful!")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        
        await conn.close()
        return True
        
    except asyncpg.InvalidPasswordError:
        print("\n❌ ERROR: Invalid password!")
        print("\n📋 Possible causes:")
        print("   1. The password in DATABASE_URL is incorrect")
        print("   2. The password has been changed in Railway but not updated in the environment variable")
        print("\n🔧 To fix:")
        print("   1. Go to Railway dashboard → your project → PostgreSQL service")
        print("   2. Click on 'Variables' tab")
        print("   3. Find the DATABASE_URL variable")
        print("   4. Copy the correct DATABASE_URL")
        print("   5. Go to your backend service → Variables")
        print("   6. Update the DATABASE_URL variable with the new value")
        print("   7. Redeploy the service")
        return False
        
    except asyncpg.InvalidCatalogNameError:
        print(f"\n❌ ERROR: Database '{database}' does not exist!")
        print("\n📋 To fix:")
        print("   1. Check if the database name is correct")
        print("   2. Create the database if it doesn't exist")
        return False
        
    except asyncpg.CannotConnectNowError:
        print("\n❌ ERROR: Database is not accepting connections!")
        print("\n📋 Possible causes:")
        print("   1. Database is starting up")
        print("   2. Database is under maintenance")
        print("   3. Too many connections")
        return False
        
    except asyncpg.ConnectionRefusedError:
        print(f"\n❌ ERROR: Connection refused to {hostname}:{port}")
        print("\n📋 Possible causes:")
        print("   1. Database server is not running")
        print("   2. Firewall blocking the connection")
        print("   3. Wrong host or port")
        return False
        
    except asyncio.TimeoutError:
        print(f"\n❌ ERROR: Connection timeout to {hostname}:{port}")
        print("\n📋 Possible causes:")
        print("   1. Network connectivity issues")
        print("   2. Database server is slow to respond")
        print("   3. Wrong host or port")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: Unexpected error: {type(e).__name__}: {e}")
        return False


async def main():
    success = await verify_connection()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All checks passed!")
        sys.exit(0)
    else:
        print("❌ Database connection failed!")
        print("\n💡 Next steps:")
        print("   1. Verify DATABASE_URL in Railway dashboard")
        print("   2. Check if password was recently changed")
        print("   3. Ensure all connection parameters are correct")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
