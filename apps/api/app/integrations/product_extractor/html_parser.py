import logging
import re
from urllib.parse import urljoin
from bs4 import BeautifulSoup

from app.integrations.product_extractor.base import (
    BaseProductExtractorAdapter,
    RawExtractedMetadata,
)

logger = logging.getLogger(__name__)

EXCLUDED_IMAGE_KEYWORDS = [
    "logo",
    "favicon",
    "avatar",
    "badge",
    "icon",
    "spinner",
    "loading",
    "payment",
    "banner",
    "track",
    "pixel",
    "star",
    "rating",
    "1x1",
]


class HtmlFallbackProductExtractorAdapter(BaseProductExtractorAdapter):
    """
    Extracts product info and gallery images directly from semantic HTML structures.
    """

    def can_handle(self, url: str, html: str) -> bool:
        return True  # Fallback adapter handles any valid HTML

    def extract(self, url: str, html: str) -> RawExtractedMetadata:
        soup = BeautifulSoup(html, "html.parser")

        # 1. Title: try h1 with product class or first h1, then title tag
        title = None
        h1_tags = soup.find_all("h1")
        for h1 in h1_tags:
            text = h1.get_text(strip=True)
            if len(text) > 3:
                title = text
                break

        if not title:
            title_tag = soup.find("title")
            if title_tag:
                raw_title = title_tag.get_text(strip=True)
                # Remove common shop suffixes like " - ShopName" or " | Brand"
                parts = re.split(r"\s*[-|–—]\s*", raw_title)
                if parts and len(parts[0]) > 3:
                    title = parts[0]
                else:
                    title = raw_title

        # 2. Description: meta description or p.product-description
        description = None
        desc_el = soup.find(
            class_=lambda c: c
            and any(k in str(c).lower() for k in ["product-desc", "product__desc", "description"])
        )
        if desc_el:
            description = desc_el.get_text(separator=" ", strip=True)

        # 3. Gallery Images: search inside gallery containers first, then general images
        image_urls: list[str] = []

        # Find gallery containers
        gallery_containers = soup.find_all(
            ["div", "ul", "section"],
            class_=lambda c: c
            and any(
                k in str(c).lower()
                for k in ["gallery", "product-media", "product__media", "product-images", "slides"]
            ),
        )

        candidates: list[str] = []
        if gallery_containers:
            for container in gallery_containers:
                for img in container.find_all("img"):
                    for attr in ["data-zoom-image", "data-original", "data-src", "src"]:
                        val = img.get(attr)
                        if val and isinstance(val, str) and val.strip():
                            candidates.append(val.strip())
                            break

        # Fallback to all images if gallery containers yielded nothing
        if not candidates:
            for img in soup.find_all("img"):
                # Check if img or parent seems related to product
                parent_classes = " ".join(img.find_parent().get("class", [])) if img.find_parent() else ""
                img_classes = " ".join(img.get("class", []))
                combined = f"{parent_classes} {img_classes} {img.get('alt', '')}".lower()

                for attr in ["data-zoom-image", "data-original", "data-src", "src"]:
                    val = img.get(attr)
                    if val and isinstance(val, str) and val.strip():
                        # Only take if looks like product or reasonable size
                        candidates.append(val.strip())
                        break

        # Filter & clean candidate URLs
        for cand in candidates:
            if cand.startswith("data:image"):
                continue  # Skip inline base64 images

            full_url = urljoin(url, cand)
            url_lower = full_url.lower()

            # Skip SVG icons and known tracking/banner keywords
            if url_lower.endswith(".svg"):
                continue
            if any(k in url_lower for k in EXCLUDED_IMAGE_KEYWORDS):
                continue

            if full_url not in image_urls:
                image_urls.append(full_url)

        return RawExtractedMetadata(
            title=title,
            description=description,
            image_urls=image_urls,
            adapter_name="html_parser",
        )
