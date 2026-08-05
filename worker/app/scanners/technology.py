"""Rule-based technology detection from headers and HTML (no external APIs)."""

from __future__ import annotations

import re

from bs4 import BeautifulSoup

from app.utils.logging_config import get_logger

logger = get_logger(__name__)

HEADER_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("Nginx", re.compile(r"nginx", re.I)),
    ("Apache", re.compile(r"apache", re.I)),
    ("IIS", re.compile(r"microsoft-iis|iis", re.I)),
    ("Cloudflare", re.compile(r"cloudflare", re.I)),
    ("Express", re.compile(r"express", re.I)),
    ("PHP", re.compile(r"php", re.I)),
    ("ASP.NET", re.compile(r"asp\.net|x-aspnet", re.I)),
]

HTML_RULES: list[tuple[str, re.Pattern[str]]] = [
    ("WordPress", re.compile(r"wp-content|wp-includes|wordpress", re.I)),
    ("Drupal", re.compile(r"drupal", re.I)),
    ("Joomla", re.compile(r"joomla", re.I)),
    ("Laravel", re.compile(r"laravel", re.I)),
    ("Django", re.compile(r"csrfmiddlewaretoken|django", re.I)),
    ("React", re.compile(r"data-reactroot|react\.production|__NEXT_DATA__", re.I)),
    ("Next.js", re.compile(r"__NEXT_DATA__|_next/static", re.I)),
    ("Vue", re.compile(r"data-v-[a-f0-9]{8}|vue\.runtime|__VUE__", re.I)),
    ("Angular", re.compile(r"ng-version|angular\.js|ng-app", re.I)),
    ("jQuery", re.compile(r"jquery", re.I)),
]


def detect_technologies(
    response_headers: dict[str, str] | None,
    html: str | None,
) -> list[str]:
    """Match HEADER_RULES / HTML_RULES — fingerprint only, not a vulnerability."""
    found: set[str] = set()
    headers_blob = " ".join(f"{k}:{v}" for k, v in (response_headers or {}).items())

    for name, pattern in HEADER_RULES:
        if pattern.search(headers_blob):
            found.add(name)

    server = (response_headers or {}).get("server") or (response_headers or {}).get("Server")
    powered = (response_headers or {}).get("x-powered-by") or (response_headers or {}).get("X-Powered-By")
    for value in (server, powered):
        if not value:
            continue
        for name, pattern in HEADER_RULES:
            if pattern.search(value):
                found.add(name)

    if html:
        soup = BeautifulSoup(html, "html.parser")
        generator = soup.find("meta", attrs={"name": re.compile(r"generator", re.I)})
        if generator and generator.get("content"):
            content = str(generator["content"])
            for name, pattern in HTML_RULES + HEADER_RULES:
                if pattern.search(content):
                    found.add(name)
            if re.search(r"wordpress", content, re.I):
                found.add("WordPress")

        body = html[:200_000]
        for name, pattern in HTML_RULES:
            if pattern.search(body):
                found.add(name)

        scripts = " ".join(str(tag.get("src", "")) for tag in soup.find_all("script"))
        for name, pattern in HTML_RULES:
            if pattern.search(scripts):
                found.add(name)

    technologies = sorted(found)
    logger.info("technologies_detected", technologies=technologies)
    return technologies
