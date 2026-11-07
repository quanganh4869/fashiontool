import json
import logging
import re
from typing import Any
from urllib.parse import urljoin
from bs4 import BeautifulSoup

from app.integrations.product_extractor.base import (
    BaseProductExtractorAdapter,
    RawExtractedMetadata,
)

logger = logging.getLogger(__name__)


class JsonLdProductExtractorAdapter(BaseProductExtractorAdapter):
    """
    Extracts product metadata and candidate image URLs from Schema.org Product JSON-LD markup.
    """

    def can_handle(self, url: str, html: str) -> bool:
        return 'type="application/ld+json"' in html.lower() or "application/ld+json" in html.lower()

    def extract(self, url: str, html: str) -> RawExtractedMetadata:
        soup = BeautifulSoup(html, "html.parser")
        scripts = soup.find_all("script", type=lambda t: t and "application/ld+json" in t.lower())

        title = None
        description = None
        brand = None
        category = None
        price = None
        currency = None
        sku = None
        image_urls: list[str] = []
        variants: list[dict[str, Any]] = []

        for script in scripts:
            if not script.string:
                continue
            try:
                data = json.loads(script.string.strip())
            except Exception:
                continue

            # Traverse objects: data could be dict, list, or contain @graph
            items = []
            if isinstance(data, dict):
                if "@graph" in data and isinstance(data["@graph"], list):
                    items.extend(data["@graph"])
                else:
                    items.append(data)
            elif isinstance(data, list):
                items.extend(data)

            for item in items:
                if not isinstance(item, dict):
                    continue

                item_type = item.get("@type")
                is_product = False
                if isinstance(item_type, str) and item_type.lower() == "product":
                    is_product = True
                elif isinstance(item_type, list) and any(
                    isinstance(t, str) and t.lower() == "product" for t in item_type
                ):
                    is_product = True

                if not is_product:
                    continue

                # Title
                if not title and item.get("name"):
                    title = str(item["name"]).strip()

                # Description
                if not description and item.get("description"):
                    raw_desc = str(item["description"]).strip()
                    # Strip any HTML tags if present in description
                    description = re.sub(r"<[^>]+>", " ", raw_desc).strip()

                # Brand
                if not brand and item.get("brand"):
                    b_val = item["brand"]
                    if isinstance(b_val, dict) and b_val.get("name"):
                        brand = str(b_val["name"]).strip()
                    elif isinstance(b_val, str):
                        brand = b_val.strip()

                # Category
                if not category and item.get("category"):
                    category = str(item["category"]).strip()

                # SKU
                if not sku:
                    if item.get("sku"):
                        sku = str(item["sku"]).strip()
                    elif item.get("mpn"):
                        sku = str(item["mpn"]).strip()

                # Offers / Price
                if price is None and item.get("offers"):
                    offers = item["offers"]
                    offer_list = offers if isinstance(offers, list) else [offers]
                    for off in offer_list:
                        if isinstance(off, dict):
                            p_val = off.get("price")
                            if p_val is not None:
                                try:
                                    price = float(str(p_val).replace(",", "").strip())
                                except ValueError:
                                    pass
                            if not currency and off.get("priceCurrency"):
                                currency = str(off["priceCurrency"]).strip()
                            if price is not None:
                                break

                # Images
                img_data = item.get("image")
                if img_data:
                    raw_imgs = img_data if isinstance(img_data, list) else [img_data]
                    for r_img in raw_imgs:
                        if isinstance(r_img, str) and r_img.strip():
                            full_url = urljoin(url, r_img.strip())
                            if full_url not in image_urls:
                                image_urls.append(full_url)
                        elif isinstance(r_img, dict):
                            i_url = r_img.get("url") or r_img.get("contentUrl")
                            if i_url and isinstance(i_url, str):
                                full_url = urljoin(url, i_url.strip())
                                if full_url not in image_urls:
                                    image_urls.append(full_url)

        return RawExtractedMetadata(
            title=title,
            description=description,
            brand=brand,
            category=category,
            price=price,
            currency=currency,
            sku=sku,
            image_urls=image_urls,
            variants=variants,
            adapter_name="json_ld",
        )
