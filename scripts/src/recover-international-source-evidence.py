from __future__ import annotations

import concurrent.futures
import csv
import fcntl
import hashlib
import ipaddress
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
import unicodedata
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import pycountry
from protego import Protego

ROOT = Path(__file__).resolve().parents[2]
BUNDLE = ROOT / "data/founder-imports/2026-09-06-international-address-recovery"
SOURCE = BUNDLE / "source-businesses.csv"
GENERATIONS = BUNDLE / "source-page-evidence-generations"
CURRENT_GENERATION = BUNDLE / "source-page-evidence-current.json"
CACHE = Path("/home/ubuntu/international-address-recovery-cache")
EXPECTED_SOURCE_SHA256 = "22f113322153e73512ebf235c7be5ca80732d99c921b6cc2da4ef4bef565579b"
EXPECTED_BUSINESSES = 1_316
EXPECTED_SOURCE_URLS = 146
USER_AGENT_TOKEN = "MappingWithMelanin-AddressEvidence"
USER_AGENT = f"{USER_AGENT_TOKEN}/1.0 (+non-production directory research)"
MAX_BYTES = 5_000_000
HOST_DELAY_SECONDS = 0.75
WORKERS = 4
TOTAL_URL_DEADLINE_SECONDS = 60.0
MAX_REDIRECTS = 5
DNS_TIMEOUT_SECONDS = 5.0
CONNECT_TIMEOUT_SECONDS = 8.0
ROBOTS_CACHE_MAX_AGE_SECONDS = 6 * 60 * 60

HOST_LOCKS: dict[str, threading.Lock] = defaultdict(threading.Lock)
HOST_LAST_REQUEST: dict[str, float] = defaultdict(float)
CACHE_LOCKS: dict[str, threading.Lock] = defaultdict(threading.Lock)
COUNTRY_ALIASES = {
    "uk": "GB", "u k": "GB", "great britain": "GB", "england": "GB", "scotland": "GB", "wales": "GB",
    "south korea": "KR", "republic of korea": "KR", "russia": "RU", "viet nam": "VN", "czech republic": "CZ",
    "bolivia": "BO", "tanzania": "TZ", "ivory coast": "CI", "cote d ivoire": "CI", "cape verde": "CV",
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def atomic_write(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(descriptor, "wb") as handle:
            handle.write(payload)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary_name, path)
        directory_descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(directory_descriptor)
        finally:
            os.close(directory_descriptor)
    except Exception:
        try:
            os.unlink(temporary_name)
        except FileNotFoundError:
            pass
        raise


def fsync_directory(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY)
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def publish_generation(results_payload: bytes, summary: dict[str, Any]) -> dict[str, Any]:
    results_sha256 = sha256_bytes(results_payload)
    summary_seed = (json.dumps(summary, sort_keys=True, separators=(",", ":")) + "\n").encode()
    generation_name = sha256_bytes(results_payload + b"\0" + summary_seed)[:20]
    GENERATIONS.mkdir(parents=True, exist_ok=True)
    generation_directory = GENERATIONS / generation_name
    fsync_directory(GENERATIONS)
    results_path = generation_directory / "results.jsonl"
    summary_path = generation_directory / "summary.json"
    manifest_path = generation_directory / "manifest.json"
    published_summary = {
        **summary,
        "generation": generation_name,
        "results": str(results_path.relative_to(BUNDLE)),
        "resultsSha256": results_sha256,
    }
    summary_payload = (json.dumps(published_summary, indent=2, sort_keys=True) + "\n").encode()
    manifest = {
        "generation": generation_name,
        "results": {"path": str(results_path.relative_to(BUNDLE)), "sha256": results_sha256},
        "summary": {"path": str(summary_path.relative_to(BUNDLE)), "sha256": sha256_bytes(summary_payload)},
    }
    manifest_payload = (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode()
    if generation_directory.exists():
        if (
            not results_path.exists() or not summary_path.exists() or not manifest_path.exists()
            or results_path.read_bytes() != results_payload
            or summary_path.read_bytes() != summary_payload
            or manifest_path.read_bytes() != manifest_payload
        ):
            raise RuntimeError("IMMUTABLE_GENERATION_CONFLICT")
    else:
        temporary_directory = Path(tempfile.mkdtemp(prefix=f".{generation_name}.", dir=GENERATIONS))
        try:
            atomic_write(temporary_directory / "results.jsonl", results_payload)
            atomic_write(temporary_directory / "summary.json", summary_payload)
            atomic_write(temporary_directory / "manifest.json", manifest_payload)
            fsync_directory(temporary_directory)
            os.rename(temporary_directory, generation_directory)
            fsync_directory(GENERATIONS)
        except Exception:
            shutil.rmtree(temporary_directory, ignore_errors=True)
            raise
    pointer = {
        "generation": generation_name,
        "manifest": str(manifest_path.relative_to(BUNDLE)),
        "manifestSha256": sha256_bytes(manifest_payload),
    }
    atomic_write(CURRENT_GENERATION, (json.dumps(pointer, indent=2, sort_keys=True) + "\n").encode())
    return published_summary


def normalized(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or ""))
    text = "".join(char for char in text if not unicodedata.combining(char))
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def exact_name_match(expected: str, observed: str) -> bool:
    return bool(normalized(expected)) and normalized(expected) == normalized(observed)


def country_code(value: Any) -> str | None:
    text = normalized(value)
    if not text:
        return None
    if text in COUNTRY_ALIASES:
        return COUNTRY_ALIASES[text]
    if len(text) == 2:
        match = pycountry.countries.get(alpha_2=text.upper())
        return match.alpha_2 if match else None
    try:
        return pycountry.countries.lookup(str(value).strip()).alpha_2
    except LookupError:
        return None


def city_matches(expected: str, observed: Any) -> bool:
    observed_normalized = normalized(observed)
    choices = [normalized(piece) for piece in re.split(r"[/;]", expected) if normalized(piece)]
    return bool(observed_normalized) and any(choice == observed_normalized for choice in choices)


def valid_coordinate(latitude: Any, longitude: Any) -> dict[str, float] | None:
    try:
        lat, lng = float(latitude), float(longitude)
    except (TypeError, ValueError):
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180) or (lat == 0 and lng == 0):
        return None
    return {"latitude": lat, "longitude": lng}


def validate_url(value: str) -> tuple[str, str, int, str]:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise RuntimeError("unsafe_url")
    host = parsed.hostname.lower().rstrip(".")
    if host == "localhost" or host.endswith(".local"):
        raise RuntimeError("unsafe_host")
    try:
        address = ipaddress.ip_address(host)
        if not address.is_global:
            raise RuntimeError("unsafe_ip_literal")
    except ValueError:
        pass
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    target = parsed.path or "/"
    if parsed.query:
        target += "?" + parsed.query
    return parsed.scheme, host, port, target


def remaining(deadline: float) -> float:
    value = deadline - time.monotonic()
    if value <= 0:
        raise TimeoutError("total_deadline_exceeded")
    return value


def resolve_global_addresses(host: str, port: int, deadline: float) -> list[str]:
    try:
        literal = ipaddress.ip_address(host)
        if not literal.is_global:
            raise RuntimeError("unsafe_ip_literal")
        return [str(literal)]
    except ValueError:
        pass
    timeout = min(DNS_TIMEOUT_SECONDS, remaining(deadline))
    process = subprocess.run(
        ["getent", "ahosts", host], capture_output=True, text=True, timeout=timeout, check=False,
        env={"PATH": "/usr/bin:/bin", "LANG": "C.UTF-8"},
    )
    if process.returncode != 0:
        raise RuntimeError("dns_resolution_failed")
    addresses = sorted({line.split()[0] for line in process.stdout.splitlines() if line.split()})
    if not addresses:
        raise RuntimeError("dns_no_addresses")
    if any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise RuntimeError("dns_contains_non_global_address")
    return list(addresses)


def wait_for_host(host: str, deadline: float) -> None:
    with HOST_LOCKS[host]:
        delay = HOST_DELAY_SECONDS - (time.monotonic() - HOST_LAST_REQUEST[host])
        if delay > 0:
            time.sleep(min(delay, remaining(deadline)))
        HOST_LAST_REQUEST[host] = time.monotonic()


def request_once(url: str, deadline: float, max_bytes: int) -> tuple[int, dict[str, str], bytes]:
    scheme, host, port, target = validate_url(url)
    addresses = resolve_global_addresses(host, port, deadline)
    ip = addresses[0]
    wait_for_host(host, deadline)
    total_timeout = remaining(deadline)
    connect_timeout = min(CONNECT_TIMEOUT_SECONDS, total_timeout)
    pinned = f"{host}:{port}:{'[' + ip + ']' if ':' in ip else ip}"
    with tempfile.TemporaryDirectory(prefix="mwm-source-request-") as directory:
        header_path = Path(directory) / "headers"
        body_path = Path(directory) / "body"
        command = [
            "curl", "--silent", "--show-error", "--noproxy", "*",
            "--proto", "=http,https", "--max-redirs", "0",
            "--connect-timeout", f"{connect_timeout:.3f}",
            "--max-time", f"{total_timeout:.3f}",
            "--max-filesize", str(max_bytes),
            "--resolve", pinned,
            "--user-agent", USER_AGENT,
            "--header", "Accept: text/html,application/xhtml+xml,text/plain;q=0.5,*/*;q=0.1",
            "--header", "Accept-Encoding: identity",
            "--header", "Connection: close",
            "--dump-header", str(header_path),
            "--output", str(body_path),
            "--write-out", "%{http_code}\n%{remote_ip}\n",
            f"{scheme}://{host}{'' if port in {80, 443} else ':' + str(port)}{target}",
        ]
        environment = {"PATH": "/usr/bin:/bin", "LANG": "C.UTF-8", "HOME": "/nonexistent"}
        try:
            process_timeout = remaining(deadline)
            process = subprocess.run(
                command, capture_output=True, text=True, timeout=process_timeout,
                check=False, env=environment,
            )
        except subprocess.TimeoutExpired as error:
            raise TimeoutError("total_deadline_exceeded") from error
        if process.returncode != 0:
            if process.returncode == 63:
                raise RuntimeError("response_too_large")
            if process.returncode == 28:
                raise TimeoutError("total_deadline_exceeded")
            raise RuntimeError(f"curl_error_{process.returncode}")
        output = process.stdout.strip().splitlines()
        if len(output) < 2 or not output[-2].isdigit():
            raise RuntimeError("curl_metadata_invalid")
        remote_ip = ipaddress.ip_address(output[-1].strip())
        if not remote_ip.is_global or remote_ip != ipaddress.ip_address(ip):
            raise RuntimeError("connected_peer_not_approved")
        payload = body_path.read_bytes() if body_path.exists() else b""
        if len(payload) > max_bytes:
            raise RuntimeError("response_too_large")
        headers: dict[str, str] = {}
        if header_path.exists():
            for raw_line in header_path.read_text(encoding="iso-8859-1").splitlines():
                if ":" in raw_line:
                    key, value = raw_line.split(":", 1)
                    headers[key.strip().lower()] = value.strip()
        return int(output[-2]), headers, payload


def read_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def robots_allows(url: str, deadline: float) -> tuple[bool, str]:
    parsed = urlparse(url)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    key = sha256_bytes(origin.encode())
    metadata_path = CACHE / "robots" / f"{key}.json"
    rules_path = CACHE / "robots" / f"{key}.txt"

    def evaluate(metadata: dict[str, Any]) -> tuple[bool, str]:
        status = str(metadata["status"])
        if status == "absent":
            return True, status
        if status != "rules" or not rules_path.exists() or sha256_file(rules_path) != metadata.get("responseSha256"):
            return False, status if status in {"forbidden", "unavailable"} else "unavailable"
        parser = Protego.parse(rules_path.read_text(encoding="utf-8", errors="replace"))
        return bool(parser.can_fetch(url, USER_AGENT_TOKEN)), "rules"

    with CACHE_LOCKS[f"robots:{key}"]:
        cached = read_json(metadata_path)
        fetched_at = cached.get("fetchedAtUnix") if cached else None
        cache_age = time.time() - fetched_at if isinstance(fetched_at, (int, float)) else None
        if (
            cached and cached.get("origin") == origin
            and cached.get("status") in {"rules", "absent", "forbidden", "unavailable"}
            and cache_age is not None and 0 <= cache_age <= ROBOTS_CACHE_MAX_AGE_SECONDS
        ):
            return evaluate(cached)
        try:
            robots_url = origin + "/robots.txt"
            status, headers, payload = request_once(robots_url, deadline, max_bytes=1_000_000)
            if status in {301, 302, 303, 307, 308} or headers.get("location"):
                raise RuntimeError("robots_redirect_rejected")
            if status in {404, 410}:
                outcome = "absent"
            elif status in {401, 403}:
                outcome = "forbidden"
            elif status != 200:
                outcome = "unavailable"
            else:
                outcome = "rules"
                atomic_write(rules_path, payload)
            metadata = {"origin": origin, "robotsUrl": robots_url, "httpStatus": status, "status": outcome, "responseSha256": sha256_bytes(payload), "fetchedAtUnix": time.time()}
        except Exception as error:
            outcome = "unavailable"
            metadata = {"origin": origin, "status": outcome, "reason": str(error) if isinstance(error, RuntimeError) else type(error).__name__, "fetchedAtUnix": time.time()}
        atomic_write(metadata_path, (json.dumps(metadata, sort_keys=True) + "\n").encode())
        return evaluate(metadata)


def fetch_resource(url: str, deadline: float, max_bytes: int, check_robots: bool) -> tuple[int, dict[str, str], bytes, str]:
    current = url
    for redirect_count in range(MAX_REDIRECTS + 1):
        validate_url(current)
        if check_robots:
            allowed, outcome = robots_allows(current, deadline)
            if not allowed:
                raise RuntimeError(f"robots_{outcome}")
        status, headers, payload = request_once(current, deadline, max_bytes)
        if status in {301, 302, 303, 307, 308}:
            location = headers.get("location")
            if not location or redirect_count == MAX_REDIRECTS:
                raise RuntimeError("redirect_limit_or_missing_location")
            current = urljoin(current, location)
            validate_url(current)
            continue
        return status, headers, payload, current
    raise RuntimeError("redirect_limit")


class EvidenceParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_jsonld = False
        self.current_script: list[str] = []
        self.jsonld: list[str] = []
        self.links: list[dict[str, str]] = []
        self.address_tag_count = 0
        self.current_link: dict[str, str] | None = None
        self.visible_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {key.lower(): value or "" for key, value in attrs}
        if tag.lower() == "script" and "ld+json" in attributes.get("type", "").lower():
            self.in_jsonld = True
            self.current_script = []
        elif tag.lower() == "a" and attributes.get("href"):
            self.current_link = {"href": attributes["href"], "text": "", "label": attributes.get("aria-label") or attributes.get("title") or ""}
        elif tag.lower() == "address":
            self.address_tag_count += 1

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() == "script" and self.in_jsonld:
            self.in_jsonld = False
            value = "".join(self.current_script).strip()
            if value:
                self.jsonld.append(value)
        elif tag.lower() == "a" and self.current_link is not None:
            self.current_link["text"] = re.sub(r"\s+", " ", self.current_link["text"]).strip()
            self.links.append(self.current_link)
            self.current_link = None

    def handle_data(self, data: str) -> None:
        if self.in_jsonld:
            self.current_script.append(data)
            return
        text = re.sub(r"\s+", " ", data).strip()
        if not text:
            return
        if len(self.visible_parts) < 20_000:
            self.visible_parts.append(text)
        if self.current_link is not None:
            self.current_link["text"] += " " + text


def fetch_page(url: str) -> dict[str, Any]:
    key = sha256_bytes(url.encode())
    metadata_path = CACHE / "pages" / f"{key}.json"
    html_path = CACHE / "pages" / f"{key}.html"
    lock_path = CACHE / "locks" / f"{key}.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with CACHE_LOCKS[f"page:{key}"], lock_path.open("a+") as lock_file:
        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX)
        cached = read_json(metadata_path)
        if cached and cached.get("url") == url:
            if cached.get("ok") and html_path.exists() and sha256_file(html_path) == cached.get("responseSha256"):
                return {**cached, "html": html_path.read_text(encoding="utf-8", errors="replace")}
            if not cached.get("ok"):
                return cached
        deadline = time.monotonic() + TOTAL_URL_DEADLINE_SECONDS
        try:
            status, headers, payload, final_url = fetch_resource(url, deadline, max_bytes=MAX_BYTES, check_robots=True)
            content_type = headers.get("content-type", "").split(";", 1)[0].strip().lower()
            if status != 200:
                metadata = {"ok": False, "url": url, "status": status, "finalUrl": final_url, "reason": "http_status"}
            elif content_type not in {"text/html", "application/xhtml+xml"}:
                metadata = {"ok": False, "url": url, "status": status, "finalUrl": final_url, "reason": "non_html", "contentType": content_type}
            else:
                response_hash = sha256_bytes(payload)
                atomic_write(html_path, payload)
                metadata = {"ok": True, "url": url, "status": status, "finalUrl": final_url, "contentType": content_type, "responseSha256": response_hash}
        except Exception as error:
            metadata = {"ok": False, "url": url, "reason": str(error) if isinstance(error, RuntimeError) else type(error).__name__}
        atomic_write(metadata_path, (json.dumps(metadata, sort_keys=True) + "\n").encode())
        if metadata.get("ok"):
            return {**metadata, "html": html_path.read_text(encoding="utf-8", errors="replace")}
        return metadata


def walk_objects(value: Any):
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from walk_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_objects(child)


def address_candidate(value: Any, expected_city: str, expected_country: str) -> dict[str, Any] | None:
    expected_code = country_code(expected_country)
    if not expected_code:
        return None
    if not isinstance(value, dict):
        return None
    locality = value.get("addressLocality")
    observed_country = value.get("addressCountry")
    if isinstance(observed_country, dict):
        observed_country = observed_country.get("addressCountry") or observed_country.get("name")
    if not city_matches(expected_city, locality) or country_code(observed_country) != expected_code:
        return None
    result = {
        "streetAddress": value.get("streetAddress"), "addressLocality": locality,
        "addressRegion": value.get("addressRegion"), "postalCode": value.get("postalCode"),
        "addressCountry": observed_country,
    }
    result = {key: str(item).strip() for key, item in result.items() if item is not None and str(item).strip()}
    return result if result.get("streetAddress") else None


def same_record_candidates(row: dict[str, str], parser: EvidenceParser) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    for raw in parser.jsonld:
        try:
            parsed = json.loads(raw)
        except Exception:
            continue
        for item in walk_objects(parsed):
            observed_name = item.get("name")
            if not exact_name_match(row["name"], str(observed_name or "")):
                continue
            location = item.get("location") if isinstance(item.get("location"), dict) else {}
            address = address_candidate(item.get("address") or location.get("address"), row["city"], row["country"])
            if not address:
                continue
            geo_value = item.get("geo") or location.get("geo") or {}
            geo = valid_coordinate(geo_value.get("latitude"), geo_value.get("longitude")) if isinstance(geo_value, dict) else None
            candidates.append({
                "verificationStatus": "candidate_unverified",
                "evidenceKind": "jsonld_same_record_exact_name_city_country",
                "matchedName": str(observed_name),
                "schemaType": item.get("@type"),
                "address": address,
                "embeddedCoordinates": geo,
                "recordUrl": item.get("url"),
            })
    deduplicated: dict[str, dict[str, Any]] = {}
    for candidate in candidates:
        identity = json.dumps({"address": candidate["address"], "geo": candidate["embeddedCoordinates"]}, sort_keys=True)
        deduplicated[identity] = candidate
    return list(deduplicated.values())


def detail_links(row: dict[str, str], parser: EvidenceParser, base_url: str) -> list[dict[str, Any]]:
    values: dict[str, dict[str, Any]] = {}
    for link in parser.links:
        if not (exact_name_match(row["name"], link.get("text", "")) or exact_name_match(row["name"], link.get("label", ""))):
            continue
        resolved = urljoin(base_url, link["href"])
        try:
            validate_url(resolved)
        except Exception:
            continue
        values[resolved] = {"verificationStatus": "candidate_unverified", "url": resolved, "anchorText": link.get("text") or link.get("label")}
    return list(values.values())[:3]


def extract_for_business(row: dict[str, str], page: dict[str, Any]) -> dict[str, Any]:
    base = {"id": row["id"], "name": row["name"], "city": row["city"], "country": row["country"], "sourceUrl": row["source_url"]}
    if not page.get("ok"):
        return {**base, "status": "source_unavailable", "verificationStatus": "candidate_unverified", "reason": page.get("reason"), "httpStatus": page.get("status")}
    html = page["html"]
    parser = EvidenceParser()
    try:
        parser.feed(html)
    except Exception:
        pass
    candidates = same_record_candidates(row, parser)
    links = detail_links(row, parser, page["finalUrl"])
    if len(candidates) == 1:
        status = "structured_address_candidate"
    elif len(candidates) > 1:
        status = "ambiguous_structured_address_candidates"
    elif links:
        status = "detail_link_candidate"
    elif normalized(row["name"]) in normalized(" ".join(parser.visible_parts)):
        status = "name_found_no_associated_address"
    else:
        status = "name_not_found"
    return {
        **base,
        "status": status,
        "verificationStatus": "candidate_unverified",
        "sourceFinalUrl": page.get("finalUrl"),
        "sourceResponseSha256": page.get("responseSha256"),
        "addressCandidates": candidates,
        "detailLinkCandidates": links,
        "unassociatedAddressTagCount": parser.address_tag_count,
    }


def main() -> None:
    if sha256_file(SOURCE) != EXPECTED_SOURCE_SHA256:
        raise RuntimeError("INTERNATIONAL_RECOVERY_SOURCE_CHECKSUM_MISMATCH")
    with SOURCE.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    if len(rows) != EXPECTED_BUSINESSES or len({row["id"] for row in rows}) != EXPECTED_BUSINESSES:
        raise RuntimeError("INTERNATIONAL_RECOVERY_COHORT_MISMATCH")
    grouped: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        validate_url(row["source_url"])
        grouped[row["source_url"]].append(row)
    if len(grouped) != EXPECTED_SOURCE_URLS:
        raise RuntimeError("INTERNATIONAL_RECOVERY_SOURCE_URL_COUNT_MISMATCH")
    CACHE.mkdir(parents=True, exist_ok=True)
    run_lock_path = CACHE / "run.lock"
    with run_lock_path.open("a+") as run_lock:
        fcntl.flock(run_lock.fileno(), fcntl.LOCK_EX)
        pages: dict[str, dict[str, Any]] = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = {executor.submit(fetch_page, url): url for url in sorted(grouped)}
            for index, future in enumerate(concurrent.futures.as_completed(futures), start=1):
                url = futures[future]
                try:
                    pages[url] = future.result()
                except Exception as error:
                    pages[url] = {"ok": False, "url": url, "reason": type(error).__name__}
                if index % 20 == 0 or index == len(futures):
                    print(f"fetched {index}/{len(futures)} source pages", flush=True)
        evidence = [extract_for_business(row, pages[row["source_url"]]) for row in rows]
        results_payload = "".join(json.dumps(result, ensure_ascii=False, sort_keys=True) + "\n" for result in evidence).encode()
        status_counts = Counter(item["status"] for item in evidence)
        page_reasons = Counter(page.get("reason", "ok") if not page.get("ok") else "ok" for page in pages.values())
        summary = {
            "sourceBusinesses": len(rows), "uniqueSourceUrls": len(grouped),
            "pageOutcomes": dict(sorted(page_reasons.items())),
            "businessEvidenceOutcomes": dict(sorted(status_counts.items())),
            "structuredAddressCandidates": sum(item["status"] == "structured_address_candidate" for item in evidence),
            "ambiguousStructuredCandidates": sum(item["status"] == "ambiguous_structured_address_candidates" for item in evidence),
            "embeddedCoordinateCandidates": sum(1 for item in evidence if item["status"] == "structured_address_candidate" and item["addressCandidates"][0].get("embeddedCoordinates")),
            "detailLinkCandidates": sum(1 for item in evidence if item.get("detailLinkCandidates")),
            "verificationStatus": "candidate_unverified", "databaseWrites": 0, "mapPinWrites": 0,
        }
        print(json.dumps(publish_generation(results_payload, summary), indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
