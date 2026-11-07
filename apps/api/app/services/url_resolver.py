import ipaddress
import logging
import socket
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx

logger = logging.getLogger(__name__)

# Blocked IP networks for SSRF prevention
BLOCKED_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("224.0.0.0/4"),
    ipaddress.ip_network("240.0.0.0/4"),
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("::/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
    ipaddress.ip_network("ff00::/8"),
]

CLOUD_METADATA_IPS = {
    "169.254.169.254",
    "100.100.100.200",  # Alibaba Cloud
    "metadata.google.internal",
}

ALLOWED_PORTS = {80, 443, 8080}
MAX_HTML_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB
DEFAULT_TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
MAX_REDIRECTS = 5


class SSRFValidationError(ValueError):
    """Raised when a URL violates SSRF security boundaries."""

    pass


class SafeUrlResolver:
    """
    Validates, sanitizes, and safely resolves HTTP/HTTPS requests with comprehensive
    SSRF protection, loopback/private/metadata IP rejection, and redirect re-validation.
    """

    @staticmethod
    def is_ip_blocked(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
        # Check IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            ip = ip.ipv4_mapped

        # Check cloud metadata IPs
        if str(ip) in CLOUD_METADATA_IPS:
            return True

        for network in BLOCKED_NETWORKS:
            if ip in network:
                return True

        if ip.is_loopback or ip.is_private or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return True

        return False

    @classmethod
    def validate_url(cls, raw_url: str) -> tuple[str, str, int]:
        """
        Validates URL syntax, scheme, credentials, port, and resolves hostname to ensure
        it does not target any local or restricted network address.
        Returns (sanitized_url, hostname, port).
        """
        if not raw_url or not isinstance(raw_url, str):
            raise SSRFValidationError("Đường dẫn URL không được để trống.")

        clean_url = raw_url.strip()
        parsed = urlparse(clean_url)

        if parsed.scheme.lower() not in ("http", "https"):
            raise SSRFValidationError(
                f"Giao thức '{parsed.scheme}' không được hỗ trợ. Chỉ chấp nhận HTTP hoặc HTTPS."
            )

        if parsed.username or parsed.password:
            raise SSRFValidationError("Không được đính kèm thông tin xác thực trong URL.")

        hostname = parsed.hostname
        if not hostname:
            raise SSRFValidationError("Đường dẫn không chứa tên miền hợp lệ.")

        hostname = hostname.lower().strip()
        if hostname in CLOUD_METADATA_IPS:
            raise SSRFValidationError("Đường dẫn trỏ đến dịch vụ metadata không được phép.")

        port = parsed.port or (443 if parsed.scheme.lower() == "https" else 80)
        if port not in ALLOWED_PORTS:
            raise SSRFValidationError(f"Cổng '{port}' không được phép truy cập.")

        # Check if hostname itself is an IP literal
        try:
            ip_obj = ipaddress.ip_address(hostname)
            if cls.is_ip_blocked(ip_obj):
                raise SSRFValidationError(f"Địa chỉ IP '{hostname}' thuộc vùng mạng nội bộ bị chặn.")
            return clean_url, hostname, port
        except ValueError:
            # Not an IP literal, proceed to DNS resolution
            pass

        # Resolve DNS
        try:
            addr_info = socket.getaddrinfo(hostname, port, type=socket.SOCK_STREAM)
        except socket.gaierror as e:
            raise SSRFValidationError(f"Không thể phân giải tên miền '{hostname}': {e}") from e

        if not addr_info:
            raise SSRFValidationError(f"Không tìm thấy địa chỉ IP cho tên miền '{hostname}'.")

        for entry in addr_info:
            ip_str = entry[4][0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
                if cls.is_ip_blocked(ip_obj):
                    raise SSRFValidationError(
                        f"Tên miền '{hostname}' phân giải về địa chỉ nội bộ không hợp lệ ({ip_str})."
                    )
            except ValueError:
                raise SSRFValidationError(f"Địa chỉ IP không hợp lệ ({ip_str}).")

        return clean_url, hostname, port

    @classmethod
    async def fetch_html(cls, url: str) -> tuple[str, str, dict[str, str]]:
        """
        Safely fetches an HTML page, re-validating every redirect target.
        Returns (final_url, html_text, headers).
        """
        current_url, _, _ = cls.validate_url(url)
        redirect_count = 0

        async with httpx.AsyncClient(
            timeout=DEFAULT_TIMEOUT,
            verify=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TrendMotion/1.0"
                ),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
            },
            follow_redirects=False,
        ) as client:
            while redirect_count <= MAX_REDIRECTS:
                try:
                    response = await client.get(current_url)
                except httpx.TimeoutException as e:
                    raise ValueError(f"Hết thời gian chờ phản hồi từ website ({current_url}).") from e
                except httpx.RequestError as e:
                    raise ValueError(f"Không thể kết nối đến website ({current_url}): {e}") from e

                # Handle redirect manually to re-verify destination
                if response.is_redirect:
                    redirect_count += 1
                    if redirect_count > MAX_REDIRECTS:
                        raise SSRFValidationError(f"Vượt quá số lần chuyển hướng cho phép ({MAX_REDIRECTS}).")

                    location = response.headers.get("location")
                    if not location:
                        raise ValueError("Phản hồi chuyển hướng nhưng không có Location header.")

                    # Build absolute redirect target
                    target_url = urljoin(current_url, location)
                    current_url, _, _ = cls.validate_url(target_url)
                    continue

                if response.status_code >= 400:
                    raise ValueError(
                        f"Website trả về mã lỗi HTTP {response.status_code} ({response.reason_phrase})."
                    )

                # Check Content-Type & Size
                content_length = len(response.content)
                if content_length > MAX_HTML_BYTES:
                    raise ValueError(
                        f"Kích thước trang web vượt quá giới hạn cho phép ({content_length} bytes > {MAX_HTML_BYTES} bytes)."
                    )

                return str(response.url), response.text, dict(response.headers)

        raise ValueError("Không thể hoàn tất truy xuất trang web.")

    @classmethod
    async def fetch_image(cls, image_url: str) -> tuple[bytes, str]:
        """
        Safely downloads an image with SSRF checks on every redirect.
        Returns (raw_bytes, content_type).
        """
        current_url, _, _ = cls.validate_url(image_url)
        redirect_count = 0

        async with httpx.AsyncClient(
            timeout=DEFAULT_TIMEOUT,
            verify=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TrendMotion/1.0"
                ),
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            },
            follow_redirects=False,
        ) as client:
            while redirect_count <= MAX_REDIRECTS:
                try:
                    response = await client.get(current_url)
                except httpx.TimeoutException as e:
                    raise ValueError(f"Hết thời gian tải ảnh ({current_url}).") from e
                except httpx.RequestError as e:
                    raise ValueError(f"Lỗi kết nối khi tải ảnh ({current_url}): {e}") from e

                if response.is_redirect:
                    redirect_count += 1
                    if redirect_count > MAX_REDIRECTS:
                        raise SSRFValidationError("Vượt quá số lần chuyển hướng khi tải ảnh.")

                    location = response.headers.get("location")
                    if not location:
                        raise ValueError("Redirect header không hợp lệ khi tải ảnh.")

                    target_url = urljoin(current_url, location)
                    current_url, _, _ = cls.validate_url(target_url)
                    continue

                if response.status_code >= 400:
                    raise ValueError(f"Không thể tải ảnh: HTTP {response.status_code}.")

                content = response.content
                if len(content) > MAX_IMAGE_BYTES:
                    raise ValueError(
                        f"Dung lượng ảnh vượt quá giới hạn cho phép ({len(content)} > {MAX_IMAGE_BYTES})."
                    )

                content_type = response.headers.get("content-type", "application/octet-stream")
                return content, content_type

        raise ValueError("Không thể tải ảnh thành công.")
