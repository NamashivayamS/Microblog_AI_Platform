import urllib.request, json

posts = [
    {"content": "FastAPI is incredible for building REST APIs! #FastAPI #Python #Backend", "user_name": "devguru"},
    {"content": "Building real-time apps with #ReactJS and #FastAPI as my stack today!", "user_name": "codesmith"},
    {"content": "OpenAPI auto-generated SDKs are a game changer #OpenAPI #SDK #Python", "user_name": "alice"},
    {"content": "SQLite is underrated for rapid prototyping #SQLite #Database #Backend", "user_name": "charlie"},
    {"content": "Loving the new microblog UI! So clean #ReactJS #Design #UI", "user_name": "diana"},
    {"content": "Aumne.ai is going to revolutionize AI customer experience #AumneAI #LLM #GenAI", "user_name": "bob"},
]

for p in posts:
    data = json.dumps(p).encode()
    req = urllib.request.Request(
        "http://localhost:8000/posts/",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    obj = json.loads(res.read())
    print(f"Created post {obj['id']} with tags: {obj['tags']}")

print("All hashtag posts seeded!")
