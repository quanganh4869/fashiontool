import logging
from urllib.parse import urlparse

from app.integrations.product_extractor.base import (
    BaseProductExtractorAdapter,
    RawExtractedMetadata,
)
from app.integrations.product_extractor.html_parser import (
    HtmlFallbackProductExtractorAdapter,
)
from app.integrations.product_extractor.json_ld import (
    JsonLdProductExtractorAdapter,
)
from app.integrations.product_extractor.open_graph import (
    OpenGraphProductExtractorAdapter,
)

logger = logging.getLogger(__name__)


class ProductExtractorRegistry:
    """
    Coordinates multi-tiered metadata and image extraction across JSON-LD,
    OpenGraph, and HTML semantic parsers.
    """

    def __init__(self) -> None:
        self.adapters: list[BaseProductExtractorAdapter] = [
            JsonLdProductExtractorAdapter(),
            OpenGraphProductExtractorAdapter(),
            HtmlFallbackProductExtractorAdapter(),
        ]

    def extract_all(self, url: str, html: str) -> RawExtractedMetadata:
        parsed_domain = urlparse(url).netloc.lower()

        # Run each adapter that can handle this page
        results: list[RawExtractedMetadata] = []
        for adapter in self.adapters:
            try:
                if adapter.can_handle(url, html):
                    res = adapter.extract(url, html)
                    results.append(res)
            except Exception as e:
                logger.warning(
                    f"Adapter '{adapter.__class__.__name__}' encountered error while parsing {url}: {e}"
                )

        # Merge results prioritizing fidelity: JSON-LD > OpenGraph > HTML
        merged_title = None
        merged_description = None
        merged_brand = None
        merged_category = None
        merged_price = None
        merged_currency = None
        merged_sku = None
        merged_canonical = None
        merged_images: list[str] = []
        seen_images: set[str] = set()

        for res in results:
            if not merged_title and res.title:
                merged_title = res.title
            if not merged_description and res.description:
                merged_description = res.description
            if not merged_brand and res.brand:
                merged_brand = res.brand
            if not merged_category and res.category:
                merged_category = res.category
            if merged_price is None and res.price is not None:
                merged_price = res.price
            if not merged_currency and res.currency:
                merged_currency = res.currency
            if not merged_sku and res.sku:
                merged_sku = res.sku
            if not merged_canonical and res.canonical_url:
                merged_canonical = res.canonical_url

            # Collect images preserving first-seen order
            for img_url in res.image_urls:
                clean_img = img_url.strip()
                if clean_img and clean_img not in seen_images:
                    seen_images.add(clean_img)
                    merged_images.append(clean_img)

        # Fallback title if none was found
        if not merged_title:
            merged_title = f"Sản phẩm từ {parsed_domain}"

        return RawExtractedMetadata(
            title=merged_title,
            description=merged_description,
            brand=merged_brand,
            category=merged_category,
            price=merged_price,
            currency=merged_currency,
            sku=merged_sku,
            canonical_url=merged_canonical,
            image_urls=merged_images,
            adapter_name="multi_tier_pipeline",
        )


product_extractor_registry = ProductExtractorRegistry()
