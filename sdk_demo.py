"""
SDK Demo — proves the auto-generated Python SDK works.

Run AFTER:
  1. Backend is running  (runapplication.bat or: cd backend && uvicorn main:app --reload)
  2. SDK is generated   (see README.md → SDK Generation)

Then:
  python sdk_demo.py
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'microblog_sdk'))

try:
    from microblog_sdk.api.posts_api import PostsApi
    from microblog_sdk import ApiClient, Configuration
except ImportError:
    print("ERROR: SDK not found.")
    print("Generate it first:\n")
    print("  npm install -g @openapitools/openapi-generator-cli")
    print("  openapi-generator-cli generate -i http://localhost:8000/openapi.json -g python -o microblog_sdk")
    sys.exit(1)

config = Configuration(host="http://localhost:8000")
client = ApiClient(configuration=config)
api = PostsApi(client)

print("=" * 50)
print("  Microblog SDK Demo")
print("=" * 50)

# 1. Create a post via SDK
print("\n[1] Creating a post via SDK...")
try:
    from microblog_sdk.models.post_create import PostCreate
    new_post = api.create_post_posts_post(
        PostCreate(content="Hello from the auto-generated SDK!", user_name="sdk_demo")
    )
    print(f"    Created post #{new_post.id}: '{new_post.content}'")
    created_id = new_post.id
except Exception as e:
    print(f"    Error: {e}")
    created_id = None

# 2. Get all posts via SDK
print("\n[2] Fetching all posts via SDK...")
try:
    posts = api.get_posts_posts_get()
    print(f"    Found {len(posts)} post(s):")
    for p in posts[:5]:
        print(f"    - [{p.id}] @{p.user_name}: {p.content[:50]}... ({p.likes_count} likes)")
except Exception as e:
    print(f"    Error: {e}")

# 3. Like the created post via SDK
if created_id:
    print(f"\n[3] Liking post #{created_id} via SDK...")
    try:
        from microblog_sdk.models.like_request import LikeRequest
        result = api.like_post_posts_post_id_like_post(
            post_id=created_id,
            like_request=LikeRequest(user_name="sdk_demo_liker")
        )
        print(f"    {result.message} — total likes: {result.total_likes}")
    except Exception as e:
        print(f"    Error: {e}")

    # 4. Test duplicate like rejection via SDK
    print(f"\n[4] Testing duplicate like rejection via SDK...")
    try:
        from microblog_sdk.models.like_request import LikeRequest
        api.like_post_posts_post_id_like_post(
            post_id=created_id,
            like_request=LikeRequest(user_name="sdk_demo_liker")
        )
        print("    ERROR: Should have rejected duplicate like!")
    except Exception as e:
        status = getattr(getattr(e, 'status', None), '__str__', lambda: str(e))()
        print(f"    Correctly rejected duplicate like (HTTP {getattr(e, 'status', '?')})")

print("\n" + "=" * 50)
print("  SDK Demo complete!")
print("=" * 50)
