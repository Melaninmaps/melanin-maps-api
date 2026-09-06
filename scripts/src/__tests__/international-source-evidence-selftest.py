from __future__ import annotations

import importlib.util
import json
import subprocess
import tempfile
import time
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "recover-international-source-evidence.py"
spec = importlib.util.spec_from_file_location("international_recovery", MODULE_PATH)
assert spec and spec.loader
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def expect_error(value: str) -> None:
    try:
        module.validate_url(value)
    except RuntimeError:
        return
    raise AssertionError(f"expected URL rejection: {value}")


def main() -> None:
    for value in [
        "file:///etc/passwd", "http://localhost/a", "http://127.0.0.1/a",
        "http://169.254.169.254/latest/meta-data", "http://[::1]/a",
        "https://user:password@example.com/a", "https://example.com/a#fragment",
    ]:
        expect_error(value)

    assert module.exact_name_match("Café Déjà Vu", "Cafe Deja Vu")
    assert not module.exact_name_match("Cafe Deja Vu", "Cafe Deja Vu London")
    assert not module.exact_name_match("Natural Nation", "Natural Nations")

    assert module.country_code("United Kingdom") == "GB"
    assert module.country_code("England") == "GB"
    assert module.country_code("Côte d’Ivoire") == "CI"
    assert module.country_code("not a country") is None

    row = {
        "streetAddress": "10 Example Road", "addressLocality": "Cape Town",
        "addressRegion": "Western Cape", "postalCode": "8001", "addressCountry": "ZA",
    }
    assert module.address_candidate(row, "Cape Town", "South Africa")
    assert module.address_candidate(row, "Johannesburg", "South Africa") is None
    assert module.address_candidate(row, "Cape Town", "Ghana") is None
    assert module.address_candidate({**row, "streetAddress": ""}, "Cape Town", "South Africa") is None
    assert module.address_candidate({**row, "addressLocality": "New York"}, "York", "South Africa") is None
    assert module.address_candidate("10 Example Road, Cape Town, South Africa", "Cape Town", "South Africa") is None

    assert module.valid_coordinate(-33.9249, 18.4241)
    assert module.valid_coordinate(0, 12)
    assert module.valid_coordinate(0, 0) is None
    assert module.valid_coordinate(91, 18) is None

    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "atomic.json"
        module.atomic_write(path, b'{"complete":true}\n')
        assert json.loads(path.read_text()) == {"complete": True}
        assert not list(path.parent.glob(".atomic.json.*"))

    original_cache = module.CACHE
    original_request_once = module.request_once
    try:
        with tempfile.TemporaryDirectory() as directory:
            module.CACHE = Path(directory)
            origin = "https://example.com"
            key = module.sha256_bytes(origin.encode())
            cache_path = module.CACHE / "robots" / f"{key}.json"
            rules_path = module.CACHE / "robots" / f"{key}.txt"
            cache_path.parent.mkdir(parents=True)
            rules_path.write_text("User-agent: *\nAllow: /\n")
            cache_path.write_text(json.dumps({
                "origin": origin, "status": "rules", "responseSha256": module.sha256_file(rules_path),
                "fetchedAtUnix": time.time() - module.ROBOTS_CACHE_MAX_AGE_SECONDS - 1,
            }))
            calls = []

            def disallow_request(url, deadline, max_bytes):
                calls.append(url)
                return 200, {}, b"User-agent: *\nDisallow: /\n"

            module.request_once = disallow_request
            allowed, status = module.robots_allows(origin + "/businesses", time.monotonic() + 5)
            assert not allowed and status == "rules" and len(calls) == 1

            rules_path.write_text("User-agent: *\nAllow: /\n")
            cache_path.write_text(json.dumps({
                "origin": origin, "status": "rules", "responseSha256": module.sha256_file(rules_path),
                "fetchedAtUnix": time.time(),
            }))

            def must_not_fetch(url, deadline, max_bytes):
                raise AssertionError("fresh robots cache should be reused")

            module.request_once = must_not_fetch
            allowed, status = module.robots_allows(origin + "/businesses", time.monotonic() + 5)
            assert allowed and status == "rules"

            rules_path.write_text("User-agent: *\nAllow: /directory\nDisallow: /private\n")
            cache_path.write_text(json.dumps({
                "origin": origin, "status": "rules", "responseSha256": module.sha256_file(rules_path),
                "fetchedAtUnix": time.time(),
            }))
            assert module.robots_allows(origin + "/directory", time.monotonic() + 5)[0]
            assert not module.robots_allows(origin + "/private", time.monotonic() + 5)[0]

        with tempfile.TemporaryDirectory() as directory:
            module.CACHE = Path(directory)

            def redirect_request(url, deadline, max_bytes):
                return 302, {"location": "https://other.example/robots.txt"}, b""

            module.request_once = redirect_request
            allowed, status = module.robots_allows("https://example.com/businesses", time.monotonic() + 5)
            assert not allowed and status == "unavailable"
    finally:
        module.CACHE = original_cache
        module.request_once = original_request_once

    original_resolver = module.resolve_global_addresses
    original_wait = module.wait_for_host
    original_subprocess_run = module.subprocess.run
    try:
        observed_command = []
        module.resolve_global_addresses = lambda host, port, deadline: ["93.184.216.34"]
        module.wait_for_host = lambda host, deadline: None
        deadline = time.monotonic() + 0.05

        def timeout_run(command, **kwargs):
            observed_command.extend(command)
            assert kwargs["timeout"] <= max(0, deadline - time.monotonic()) + 0.005
            raise subprocess.TimeoutExpired(command, kwargs["timeout"])

        module.subprocess.run = timeout_run
        try:
            module.request_once("https://example.com/path", deadline, 1024)
            raise AssertionError("hard deadline must abort the request subprocess")
        except TimeoutError:
            pass
        assert "--noproxy" in observed_command and "--resolve" in observed_command and "--max-time" in observed_command
    finally:
        module.resolve_global_addresses = original_resolver
        module.wait_for_host = original_wait
        module.subprocess.run = original_subprocess_run

    original_bundle = module.BUNDLE
    original_generations = module.GENERATIONS
    original_pointer = module.CURRENT_GENERATION
    try:
        with tempfile.TemporaryDirectory() as directory:
            module.BUNDLE = Path(directory)
            module.GENERATIONS = module.BUNDLE / "generations"
            module.CURRENT_GENERATION = module.BUNDLE / "current.json"
            first = module.publish_generation(b'{"row":1}\n', {"databaseWrites": 0, "mapPinWrites": 0})
            first_summary_path = module.GENERATIONS / first["generation"] / "summary.json"
            first_summary_bytes = first_summary_path.read_bytes()
            pointer = json.loads(module.CURRENT_GENERATION.read_text())
            manifest_path = module.BUNDLE / pointer["manifest"]
            assert module.sha256_file(manifest_path) == pointer["manifestSha256"]
            manifest = json.loads(manifest_path.read_text())
            assert module.sha256_file(module.BUNDLE / manifest["results"]["path"]) == first["resultsSha256"]
            unreachable = module.GENERATIONS / "incomplete"
            unreachable.mkdir(parents=True)
            (unreachable / "results.jsonl").write_text("partial")
            assert json.loads(module.CURRENT_GENERATION.read_text())["generation"] == first["generation"]
            second = module.publish_generation(b'{"row":2}\n', {"databaseWrites": 0, "mapPinWrites": 0})
            assert second["generation"] != first["generation"]
            assert json.loads(module.CURRENT_GENERATION.read_text())["generation"] == second["generation"]
            changed_summary = module.publish_generation(b'{"row":1}\n', {"databaseWrites": 0, "mapPinWrites": 0, "changed": True})
            assert changed_summary["generation"] not in {first["generation"], second["generation"]}
            assert first_summary_path.read_bytes() == first_summary_bytes
    finally:
        module.BUNDLE = original_bundle
        module.GENERATIONS = original_generations
        module.CURRENT_GENERATION = original_pointer

    print("international source evidence self-test passed")


if __name__ == "__main__":
    main()
