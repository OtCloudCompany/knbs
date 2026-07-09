#!/usr/bin/env python3
"""
Create the CSA 2.1 community/sub-community/collection hierarchy on a
DSpace 7+/9.x repository via the REST API.

Target: https://repository.knbs.or.ke/server/api

Usage:
    python3 create_csa_hierarchy.py [--dry-run]

Requires:
    pip install requests

Reads csa_2_1_structure.json (must be in the same directory or pass
--structure /path/to/file.json).

Notes:
  * Authenticates with email + password (password prompted securely,
    never echoed).
  * Handles the DSpace CSRF/XSRF token workflow, including token
    rotation on every response.
  * Skips objects that already exist (matched by exact name under the
    same parent), so the script is safe to re-run.
"""

import argparse
import getpass
import json
import sys
import time

try:
    import requests
except ImportError:
    sys.exit("The 'requests' library is required. Install it with: pip install requests")


DEFAULT_BASE_URL = "https://repository.knbs.or.ke/server/api"
DEFAULT_STRUCTURE_FILE = "csa_2_1_structure.json"
REQUEST_DELAY = 0.3  # polite pause between write operations (seconds)


class DSpaceClient:
    def __init__(self, base_url):
        self.base = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers["Accept"] = "application/json"

    # ----- CSRF handling -------------------------------------------------

    def _update_csrf(self, response):
        """DSpace rotates the XSRF token; capture it from every response."""
        token = response.headers.get("DSPACE-XSRF-TOKEN")
        if token:
            self.session.headers["X-XSRF-TOKEN"] = token

    def _request(self, method, path, **kwargs):
        url = path if path.startswith("http") else f"{self.base}{path}"
        resp = self.session.request(method, url, **kwargs)
        self._update_csrf(resp)
        return resp

    # ----- Authentication -------------------------------------------------

    def login(self, email, password):
        # 1. Initial GET to obtain the first CSRF token
        resp = self._request("GET", "/authn/status")
        resp.raise_for_status()

        # 2. POST credentials
        resp = self._request(
            "POST",
            "/authn/login",
            data={"user": email, "password": password},
        )
        if resp.status_code != 200:
            raise RuntimeError(
                f"Login failed (HTTP {resp.status_code}). "
                "Check your email/password and that the account has admin rights."
            )

        bearer = resp.headers.get("Authorization")
        if not bearer:
            raise RuntimeError("Login succeeded but no Authorization token was returned.")
        self.session.headers["Authorization"] = bearer

        # Confirm authenticated identity
        resp = self._request("GET", "/authn/status")
        info = resp.json()
        if not info.get("authenticated"):
            raise RuntimeError("Authentication did not persist. Aborting.")
        print(f"  Authenticated successfully against {self.base}")

    # ----- Lookups (for idempotency) ---------------------------------------

    def find_top_community_by_name(self, name):
        resp = self._request(
            "GET", "/core/communities/search/top", params={"size": 100}
        )
        if resp.status_code != 200:
            return None
        for c in resp.json().get("_embedded", {}).get("communities", []):
            if c.get("name") == name:
                return c["uuid"]
        return None

    def find_subcommunity_by_name(self, parent_uuid, name):
        resp = self._request(
            "GET",
            f"/core/communities/{parent_uuid}/subcommunities",
            params={"size": 100},
        )
        if resp.status_code != 200:
            return None
        for c in resp.json().get("_embedded", {}).get("subcommunities", []):
            if c.get("name") == name:
                return c["uuid"]
        return None

    def find_collection_by_name(self, parent_uuid, name):
        resp = self._request(
            "GET",
            f"/core/communities/{parent_uuid}/collections",
            params={"size": 100},
        )
        if resp.status_code != 200:
            return None
        for c in resp.json().get("_embedded", {}).get("collections", []):
            if c.get("name") == name:
                return c["uuid"]
        return None

    # ----- Creation ---------------------------------------------------------

    @staticmethod
    def _dso_payload(name, dso_type):
        return {
            "name": name,
            "type": dso_type,
            "metadata": {
                "dc.title": [{"value": name, "language": None, "authority": None, "confidence": -1}]
            },
        }

    def create_community(self, name, parent_uuid=None):
        params = {"parent": parent_uuid} if parent_uuid else None
        resp = self._request(
            "POST",
            "/core/communities",
            params=params,
            json=self._dso_payload(name, "community"),
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Failed to create community '{name}' (HTTP {resp.status_code}): {resp.text[:300]}"
            )
        body = resp.json()
        return body["uuid"], body.get("handle", "")

    def create_collection(self, name, parent_uuid):
        resp = self._request(
            "POST",
            "/core/collections",
            params={"parent": parent_uuid},
            json=self._dso_payload(name, "collection"),
        )
        if resp.status_code not in (200, 201):
            raise RuntimeError(
                f"Failed to create collection '{name}' (HTTP {resp.status_code}): {resp.text[:300]}"
            )
        body = resp.json()
        return body["uuid"], body.get("handle", "")


def process_structure(client, structure, dry_run=False):
    created = {"communities": 0, "collections": 0}
    skipped = 0

    for domain in structure["communities"]:
        dname = domain["name"]
        existing = None if dry_run else client.find_top_community_by_name(dname)
        if existing:
            print(f"[skip]   Community exists: {dname}")
            domain_uuid = existing
            skipped += 1
        else:
            if dry_run:
                print(f"[dry]    Would create community: {dname}")
                domain_uuid = None
            else:
                domain_uuid, handle = client.create_community(dname)
                created["communities"] += 1
                print(f"[create] Community: {dname}  ({handle})")
                time.sleep(REQUEST_DELAY)

        # Sub-communities and their collections
        for sub in domain.get("sub_communities", []):
            sname = sub["name"]
            sub_uuid = None
            if not dry_run and domain_uuid:
                sub_uuid = client.find_subcommunity_by_name(domain_uuid, sname)
            if sub_uuid:
                print(f"[skip]     Sub-community exists: {sname}")
                skipped += 1
            elif dry_run or not domain_uuid:
                print(f"[dry]      Would create sub-community: {sname}")
            else:
                sub_uuid, handle = client.create_community(sname, parent_uuid=domain_uuid)
                created["communities"] += 1
                print(f"[create]   Sub-community: {sname}  ({handle})")
                time.sleep(REQUEST_DELAY)

            for coll in sub.get("collections", []):
                cname = coll["name"]
                if dry_run or not sub_uuid:
                    print(f"[dry]        Would create collection: {cname}")
                    continue
                if client.find_collection_by_name(sub_uuid, cname):
                    print(f"[skip]       Collection exists: {cname}")
                    skipped += 1
                    continue
                _, handle = client.create_collection(cname, sub_uuid)
                created["collections"] += 1
                print(f"[create]     Collection: {cname}  ({handle})")
                time.sleep(REQUEST_DELAY)

        # Collections directly under the domain community
        for coll in domain.get("collections", []):
            cname = coll["name"]
            if dry_run or not domain_uuid:
                print(f"[dry]      Would create collection: {cname}")
                continue
            if client.find_collection_by_name(domain_uuid, cname):
                print(f"[skip]     Collection exists: {cname}")
                skipped += 1
                continue
            _, handle = client.create_collection(cname, domain_uuid)
            created["collections"] += 1
            print(f"[create]   Collection: {cname}  ({handle})")
            time.sleep(REQUEST_DELAY)

    print("\n=========== Summary ===========")
    print(f"Communities/sub-communities created: {created['communities']}")
    print(f"Collections created:                 {created['collections']}")
    print(f"Objects skipped (already existed):   {skipped}")


def main():
    parser = argparse.ArgumentParser(description="Create CSA 2.1 hierarchy on a DSpace repository.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL,
                        help=f"DSpace REST API base URL (default: {DEFAULT_BASE_URL})")
    parser.add_argument("--structure", default=DEFAULT_STRUCTURE_FILE,
                        help=f"Path to the structure JSON file (default: {DEFAULT_STRUCTURE_FILE})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print what would be created without making any changes")
    args = parser.parse_args()

    try:
        with open(args.structure, "r", encoding="utf-8") as f:
            structure = json.load(f)
    except FileNotFoundError:
        sys.exit(f"Structure file not found: {args.structure}")
    except json.JSONDecodeError as e:
        sys.exit(f"Invalid JSON in {args.structure}: {e}")

    client = DSpaceClient(args.base_url)

    if args.dry_run:
        print("DRY RUN - no changes will be made.\n")
        process_structure(client, structure, dry_run=True)
        return

    print(f"Target repository: {args.base_url}")
    email = input("DSpace admin email: ").strip()
    password = getpass.getpass("DSpace password (input hidden): ")

    try:
        client.login(email, password)
    except (RuntimeError, requests.RequestException) as e:
        sys.exit(f"Authentication error: {e}")

    try:
        process_structure(client, structure, dry_run=False)
    except (RuntimeError, requests.RequestException) as e:
        sys.exit(f"\nStopped due to error: {e}\n"
                 "The script is safe to re-run; existing objects will be skipped.")


if __name__ == "__main__":
    main()
