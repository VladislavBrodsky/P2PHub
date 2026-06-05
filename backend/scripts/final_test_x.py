import asyncio
import os
import sys
import logging
import tweepy

# Ensure backend root is in PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up basic logging
logging.basicConfig(level=logging.INFO)

async def test_post():
    # SET 2 (Part 2 keys)
    ckey = 'wTtSl8s91NUkmclzCGf3zzvqm'
    csecret = 'k5Jn0UfnEGdeu4b6qWhWxsCw8H9fXJg7IiY3vzRJUDfzsaMUOA'
    
    # NEW ACCESS TOKENS (Part 5)
    atoken = '2024651657028784128-WfrlUdY5e8LQ6vAeORRWOIcRD8d2qy'
    asecret = 'hrv0xH85CN5XpVlkwIOz7nbQ3GAOQTDumpQkXRqSWkvna'
    
    print(f"\n--- Testing X Post for @DRudskikh ---")
    try:
        client = tweepy.Client(
            consumer_key=ckey,
            consumer_secret=csecret,
            access_token=atoken,
            access_token_secret=asecret
        )
        test_content = "This is a final test post from the P2PHub Marketing Studio! 🚀 #P2PHub #AI (Final verification)"
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: client.create_tweet(text=test_content))
        
        tweet_id = response.data.get("id")
        print(f"✅ SUCCESS! Created Tweet ID: {tweet_id}")
        return True
    except Exception as e:
        print(f"❌ FAILED: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_post())
