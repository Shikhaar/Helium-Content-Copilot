"""
End-to-End Live API Health & Verification Suite for BrandBrew
Tests all REST endpoints on http://127.0.0.1:8000
"""
import sys
import json
import httpx

BASE_URL = "http://127.0.0.1:8000"

def log_test(name: str, passed: bool, details: str = ""):
    symbol = " PASS " if passed else " FAIL "
    print(f"[{symbol}] {name:<45} {details}")

def run_suite():
    print("\n========================================================")
    print("  BrandBrew Live API Verification Suite")
    print(f"  Target: {BASE_URL}")
    print("========================================================\n")
    
    passed_count = 0
    total_count = 0

    headers = {"Authorization": "Bearer dev-token"}

    with httpx.Client(base_url=BASE_URL, headers=headers, timeout=30.0) as client:
        # 1. Root / Docs check
        total_count += 1
        r = client.get("/docs")
        ok = r.status_code == 200
        log_test("GET /docs (Swagger UI)", ok, f"Status {r.status_code}")
        if ok: passed_count += 1

        # 2. Auth / User profile
        total_count += 1
        r = client.get("/api/auth/me")
        ok = r.status_code == 200 and "email" in r.json()
        log_test("GET /api/auth/me", ok, f"Status {r.status_code}, user: {r.json().get('email', '')}")
        if ok: passed_count += 1

        total_count += 1
        r = client.post("/api/auth/sync")
        ok = r.status_code == 200
        log_test("POST /api/auth/sync", ok, f"Status {r.status_code}")
        if ok: passed_count += 1

        # 3. Brands
        total_count += 1
        r = client.get("/api/brands")
        brands = r.json() if r.status_code == 200 else []
        ok = r.status_code == 200 and len(brands) > 0
        brand_ids = [b["id"] for b in brands] if ok else []
        log_test("GET /api/brands", ok, f"Found {len(brands)} brands: {brand_ids}")
        if ok: passed_count += 1

        test_brand_id = "blissclub" if "blissclub" in brand_ids else (brand_ids[0] if brand_ids else "snitch")

        # 4. Brand details
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}")
        ok = r.status_code == 200 and r.json().get("id") == test_brand_id
        log_test(f"GET /api/brands/{test_brand_id}", ok, f"Brand: {r.json().get('name', '')}")
        if ok: passed_count += 1

        # 5. Default brand backwards compatibility
        total_count += 1
        r = client.get("/api/brand")
        ok = r.status_code == 200 and "name" in r.json()
        log_test("GET /api/brand", ok, f"Active: {r.json().get('name', '')}")
        if ok: passed_count += 1

        # 6. Brand stats
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/stats")
        ok = r.status_code == 200 and "products" in r.json()
        stats = r.json() if ok else {}
        log_test(f"GET /api/brands/{test_brand_id}/stats", ok, f"Products: {stats.get('products')}, Opps: {stats.get('opportunities')}, Drafts: {stats.get('content_drafts')}")
        if ok: passed_count += 1

        # 7. Products listing
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/products")
        products = r.json() if r.status_code == 200 else []
        ok = r.status_code == 200 and len(products) > 0
        log_test(f"GET /api/brands/{test_brand_id}/products", ok, f"{len(products)} products loaded")
        if ok: passed_count += 1

        # 8. Product CRUD (Create + Delete)
        total_count += 1
        prod_payload = {
            "name": "Live Verification Yoga Pants",
            "category": "Bottoms",
            "price_inr": 1999,
            "description": "Test product for live verification suite",
            "inventory_status": "In Stock",
            "season": "All Season"
        }
        r = client.post(f"/api/brands/{test_brand_id}/products", json=prod_payload)
        created_prod = r.json() if r.status_code == 201 else {}
        created_prod_id = created_prod.get("id")
        ok = r.status_code == 201 and created_prod_id is not None
        log_test(f"POST /api/brands/{test_brand_id}/products", ok, f"Created id: {created_prod_id}")
        if ok: passed_count += 1

        if created_prod_id:
            total_count += 1
            r = client.delete(f"/api/brands/{test_brand_id}/products/{created_prod_id}")
            ok = r.status_code == 200
            log_test(f"DELETE /api/brands/{test_brand_id}/products/{created_prod_id}", ok, f"Status {r.status_code}")
            if ok: passed_count += 1

        # 9. Historical Posts
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/posts")
        posts = r.json() if r.status_code == 200 else []
        ok = r.status_code == 200 and len(posts) > 0
        log_test(f"GET /api/brands/{test_brand_id}/posts", ok, f"{len(posts)} posts loaded")
        if ok: passed_count += 1

        # 10. Performance Analytics
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/performance")
        perf = r.json() if r.status_code == 200 else {}
        ok = r.status_code == 200 and "total_posts" in perf
        log_test(f"GET /api/brands/{test_brand_id}/performance", ok, f"Avg ER: {perf.get('avg_engagement_rate')}%, Total posts: {perf.get('total_posts')}")
        if ok: passed_count += 1

        # 11. Opportunities listing
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/opportunities")
        opps = r.json() if r.status_code == 200 else []
        ok = r.status_code == 200 and len(opps) > 0
        log_test(f"GET /api/brands/{test_brand_id}/opportunities", ok, f"{len(opps)} opportunities retrieved")
        if ok: passed_count += 1

        first_opp = opps[0] if opps else None
        first_opp_id = first_opp.get("id") if first_opp else None

        # 12. Single Opportunity lookup
        if first_opp_id:
            total_count += 1
            r = client.get(f"/api/opportunities/{first_opp_id}")
            ok = r.status_code == 200 and r.json().get("id") == first_opp_id
            log_test(f"GET /api/opportunities/{first_opp_id[:8]}...", ok, f"Title: {r.json().get('title', '')[:35]}...")
            if ok: passed_count += 1

        # 13. Analyze Recommendation Engine
        total_count += 1
        r = client.post(f"/api/brands/{test_brand_id}/analyze")
        analysis = r.json() if r.status_code == 200 else {}
        ok = r.status_code == 200 and "opportunities" in analysis
        log_test(f"POST /api/brands/{test_brand_id}/analyze", ok, f"Generated {len(analysis.get('opportunities', []))} ranked opportunities")
        if ok: passed_count += 1

        # 14. Content Generation
        target_opp_id = analysis.get("opportunities", [{}])[0].get("id") or first_opp_id
        draft_id = None
        if target_opp_id:
            total_count += 1
            gen_payload = {
                "opportunity_id": target_opp_id,
                "format": "Reel",
                "tone": "Bold",
                "aspect_ratio": "9:16"
            }
            r = client.post("/api/content/generate", json=gen_payload)
            draft = r.json() if r.status_code == 200 else {}
            draft_id = draft.get("id")
            ok = r.status_code == 200 and draft_id is not None
            log_test("POST /api/content/generate", ok, f"Generated draft id: {draft_id[:8] if draft_id else 'none'}... Status: {draft.get('status')}")
            if ok: passed_count += 1

        # 15. Content Draft Lookup
        if draft_id:
            total_count += 1
            r = client.get(f"/api/content/{draft_id}")
            ok = r.status_code == 200 and r.json().get("id") == draft_id
            log_test(f"GET /api/content/{draft_id[:8]}...", ok, f"Format: {r.json().get('format')}, Brand: {r.json().get('brand_id')}")
            if ok: passed_count += 1

            # 16. Content Draft Update (Patch)
            total_count += 1
            patch_payload = {
                "caption": "Updated caption for live API test verification #LiveTest",
                "cta": "Shop Now"
            }
            r = client.patch(f"/api/content/{draft_id}", json=patch_payload)
            ok = r.status_code == 200 and r.json().get("cta") == "Shop Now"
            log_test(f"PATCH /api/content/{draft_id[:8]}...", ok, f"Status {r.status_code}, CTA updated")
            if ok: passed_count += 1

            # 17. Content Draft Approve
            total_count += 1
            r = client.post(f"/api/content/{draft_id}/approve")
            ok = r.status_code == 200 and r.json().get("status") == "approved"
            log_test(f"POST /api/content/{draft_id[:8]}.../approve", ok, f"Status updated to: {r.json().get('status')}")
            if ok: passed_count += 1

            # 18. Content Draft Schedule
            total_count += 1
            sched_payload = {
                "scheduled_date": "2026-08-28",
                "scheduled_time": "18:30"
            }
            r = client.post(f"/api/content/{draft_id}/schedule", json=sched_payload)
            ok = r.status_code == 200 and r.json().get("status") == "scheduled"
            log_test(f"POST /api/content/{draft_id[:8]}.../schedule", ok, f"Scheduled for {r.json().get('scheduled_date')} {r.json().get('scheduled_time')}")
            if ok: passed_count += 1

            # 19. Content Draft Regenerate
            total_count += 1
            regen_payload = {
                "opportunity_id": target_opp_id,
                "format": "Carousel",
                "tone": "Educational",
                "aspect_ratio": "4:5"
            }
            r = client.post("/api/content/regenerate", json=regen_payload)
            ok = r.status_code == 200 and r.json().get("format") == "Carousel"
            log_test("POST /api/content/regenerate", ok, f"Regenerated as {r.json().get('format')}")
            if ok: passed_count += 1

        # 20. Editorial Calendar Listing
        total_count += 1
        r = client.get(f"/api/brands/{test_brand_id}/calendar")
        cal_entries = r.json() if r.status_code == 200 else []
        ok = r.status_code == 200 and len(cal_entries) > 0
        log_test(f"GET /api/brands/{test_brand_id}/calendar", ok, f"{len(cal_entries)} calendar items retrieved")
        if ok: passed_count += 1

        # 21. Calendar Reschedule / Update
        if cal_entries:
            first_entry = cal_entries[0]
            first_entry_id = first_entry.get("id")
            total_count += 1
            cal_patch = {"scheduled_datetime": "2026-08-30T20:00:00"}
            r = client.patch(f"/api/calendar/{first_entry_id}", json=cal_patch)
            ok = r.status_code == 200 and r.json().get("scheduled_datetime") == "2026-08-30T20:00:00"
            log_test(f"PATCH /api/calendar/{first_entry_id[:8]}...", ok, f"Rescheduled to {r.json().get('scheduled_datetime')}")
            if ok: passed_count += 1

    print("\n========================================================")
    print(f"  Summary: {passed_count}/{total_count} API endpoints verified successfully!")
    print("========================================================\n")
    return passed_count == total_count

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
