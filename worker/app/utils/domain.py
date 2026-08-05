import re

_DOMAIN_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))+$"
)


def normalize_domain(raw: str) -> str:
    value = raw.strip().lower()
    value = value.removeprefix("https://").removeprefix("http://")
    value = value.split("/")[0].split("?")[0].split("#")[0]
    value = value.rstrip(".")
    if value.startswith("*."):
        value = value[2:]
    return value


def validate_domain(domain: str) -> str:
    normalized = normalize_domain(domain)
    if not normalized or normalized.replace(".", "").isdigit():
        raise ValueError("Invalid domain format")
    if not _DOMAIN_RE.match(normalized):
        raise ValueError("Invalid domain format")
    return normalized
