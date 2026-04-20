import pytest


# ─── Helpers ────────────────────────────────────────────────────────────────

def make_post(client, content="Hello world!", user_name="testuser"):
    return client.post("/posts/", json={"content": content, "user_name": user_name})


# ─── POST /posts/ ────────────────────────────────────────────────────────────

class TestCreatePost:

    def test_create_post_success(self, client):
        resp = make_post(client)
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hello world!"
        assert data["user_name"] == "testuser"
        assert data["id"] is not None
        assert data["likes_count"] == 0
        assert "created_at" in data

    def test_create_post_exactly_280_chars(self, client):
        content = "A" * 280
        resp = make_post(client, content=content)
        assert resp.status_code == 201
        assert resp.json()["content"] == content

    def test_create_post_281_chars_rejected(self, client):
        content = "A" * 281
        resp = make_post(client, content=content)
        assert resp.status_code == 422

    def test_create_post_empty_content_rejected(self, client):
        resp = make_post(client, content="")
        assert resp.status_code == 422

    def test_create_post_whitespace_only_rejected(self, client):
        resp = make_post(client, content="   ")
        assert resp.status_code == 422

    def test_create_post_empty_username_rejected(self, client):
        resp = make_post(client, user_name="")
        assert resp.status_code == 422

    def test_create_post_whitespace_username_rejected(self, client):
        resp = make_post(client, user_name="   ")
        assert resp.status_code == 422

    def test_create_post_missing_fields_rejected(self, client):
        resp = client.post("/posts/", json={"content": "hi"})
        assert resp.status_code == 422

    def test_create_multiple_posts(self, client):
        make_post(client, content="First post", user_name="alice")
        make_post(client, content="Second post", user_name="bob")
        resp = client.get("/posts/")
        assert len(resp.json()) == 2


# ─── GET /posts/ ────────────────────────────────────────────────────────────

class TestGetPosts:

    def test_get_posts_empty(self, client):
        resp = client.get("/posts/")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_get_posts_returns_list(self, client):
        make_post(client, content="Post one", user_name="alice")
        resp = client.get("/posts/")
        assert resp.status_code == 200
        posts = resp.json()
        assert isinstance(posts, list)
        assert len(posts) == 1

    def test_get_posts_newest_first(self, client):
        make_post(client, content="First", user_name="alice")
        make_post(client, content="Second", user_name="bob")
        posts = client.get("/posts/").json()
        assert posts[0]["content"] == "Second"
        assert posts[1]["content"] == "First"

    def test_get_posts_includes_likes_count(self, client):
        make_post(client, content="A post", user_name="alice")
        resp = client.get("/posts/")
        assert "likes_count" in resp.json()[0]
        assert resp.json()[0]["likes_count"] == 0


# ─── POST /posts/{id}/like ───────────────────────────────────────────────────

class TestLikePost:

    def test_like_post_success(self, client):
        post_id = make_post(client).json()["id"]
        resp = client.post(f"/posts/{post_id}/like", json={"user_name": "alice"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Post liked successfully"
        assert data["total_likes"] == 1

    def test_like_count_increments(self, client):
        post_id = make_post(client).json()["id"]
        client.post(f"/posts/{post_id}/like", json={"user_name": "alice"})
        client.post(f"/posts/{post_id}/like", json={"user_name": "bob"})
        posts = client.get("/posts/").json()
        assert posts[0]["likes_count"] == 2

    def test_duplicate_like_rejected(self, client):
        post_id = make_post(client).json()["id"]
        client.post(f"/posts/{post_id}/like", json={"user_name": "alice"})
        resp = client.post(f"/posts/{post_id}/like", json={"user_name": "alice"})
        assert resp.status_code == 409
        assert "already liked" in resp.json()["detail"].lower()

    def test_different_users_can_like_same_post(self, client):
        post_id = make_post(client).json()["id"]
        r1 = client.post(f"/posts/{post_id}/like", json={"user_name": "alice"})
        r2 = client.post(f"/posts/{post_id}/like", json={"user_name": "bob"})
        r3 = client.post(f"/posts/{post_id}/like", json={"user_name": "charlie"})
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r3.status_code == 200
        assert r3.json()["total_likes"] == 3

    def test_like_nonexistent_post_returns_404(self, client):
        resp = client.post("/posts/99999/like", json={"user_name": "alice"})
        assert resp.status_code == 404
        assert "not found" in resp.json()["detail"].lower()

    def test_like_with_empty_username_rejected(self, client):
        post_id = make_post(client).json()["id"]
        resp = client.post(f"/posts/{post_id}/like", json={"user_name": ""})
        assert resp.status_code == 422

    def test_like_invalid_post_id_rejected(self, client):
        resp = client.post("/posts/abc/like", json={"user_name": "alice"})
        assert resp.status_code == 422

    def test_same_user_can_like_different_posts(self, client):
        id1 = make_post(client, content="Post 1", user_name="alice").json()["id"]
        id2 = make_post(client, content="Post 2", user_name="alice").json()["id"]
        r1 = client.post(f"/posts/{id1}/like", json={"user_name": "bob"})
        r2 = client.post(f"/posts/{id2}/like", json={"user_name": "bob"})
        assert r1.status_code == 200
        assert r2.status_code == 200


# ─── Health & Root ───────────────────────────────────────────────────────────

class TestHealthEndpoints:

    def test_root_returns_running(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        assert resp.json()["status"] == "running"

    def test_health_check(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
