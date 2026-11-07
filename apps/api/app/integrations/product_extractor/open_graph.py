import logging
from urllib.parse import urljoin
from bs4 import BeautifulSoup

from app.integrations.product_extractor.base import (
    BaseProductExtractorAdapter,
    RawExtractedMetadata,
)

logger = logging.getLogger(__name__)


class OpenGraphProductExtractorAdapter(BaseProductExtractorAdapter):
    """
    Extracts product metadata and images from Open Graph, Twitter Cards, and standard Meta tags.
    """

    def can_handle(self, url: str, html: str) -> bool:
        return "og:" in html.lower() or "twitter:" in html.lower() or "property=" in html.lower()

    def extract(self, url: str, html: str) -> RawExtractedMetadata:
        soup = BeautifulSoup(html, "html.parser")

        def get_meta(attr: str, val: str) -> str | None:
            tag = soup.find("meta", {attr: val})
            if tag and tag.get("content"):
                return tag["content"].strip()
            return None

        title = (
            get_meta("property", "og:title")
            or get_meta("name", "twitter:title")
            or get_meta("property", "product:title")
        )

        description = (
            get_meta("property", "og:description")
            or get_meta("name", "twitter:description")
            or get_meta("name", "description")
        )

        brand = (
            get_meta("property", "product:brand")
            or get_meta("property", "og:brand")
            or get_meta("name", "brand")
        )

        price = None
        raw_price = (
            get_meta("property", "product:price:amount")
            or get_meta("property", "og:price:amount")
        )
        if raw_price:
            try:
                price = float(raw_price.replace(",", "").strip())
            except ValueError:
                pass

        currency = (
            get_meta("property", "product:price:currency")
            or get_meta("property", "og:price:currency")
        )

        # Canonical URL
        canonical = None
        canonical_tag = soup.find("link", rel=lambda r: r and "canonical" in r.lower())
        if canonical_tag and canonical_tag.get("href"):
            canonical = urljoin(url, canonical_tag["href"].strip())

        # Image URLs
        image_urls: list[str] = []
        for meta_prop in ["og:image", "og:image:secure_url", "twitter:image", "product:image"]:
            for tag in soup.find_all("meta", property=meta_prop):
                if tag.get("content"):
                    full_url = urljoin(url, tag["content"].strip())
                    if full_url not in image_urls:
                        image_urls.append(full_url)
            for tag in soup.find_all("meta", {"name": meta_prop}):
                if tag.get("content"):
                    full_url = urljoin(url, tag["content"].strip())
                    if full_url not in image_urls:
                        image_urls.append(full_url)

        return RawExtractedMetadata(
            title=title,
            description=description,
            brand=brand,
            price=price,
            currency=currency,
            canonical_url=canonical,
            image_urls=image_urls,
            adapter_name="open_graph",
        )
