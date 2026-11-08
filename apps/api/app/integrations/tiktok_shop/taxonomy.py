from app.schemas.product_research import FashionCategory, FashionSubcategory

FASHION_TAXONOMY: list[FashionCategory] = [
    FashionCategory(
        id="WOMEN_FASHION",
        name="Thời trang Nữ",
        subcategories=[
            FashionSubcategory(id="shirts_blouses", name="Áo sơ mi & Áo kiểu", source_category_ids=["60113401", "60113402"]),
            FashionSubcategory(id="t_shirts_tops", name="Áo thun & Croptop", source_category_ids=["60113403", "60113404"]),
            FashionSubcategory(id="cardigans_knitwear", name="Áo Cardigan & Len dệt kim", source_category_ids=["60113405"]),
            FashionSubcategory(id="dresses", name="Váy đầm", source_category_ids=["60113406"]),
            FashionSubcategory(id="skirts", name="Chân váy", source_category_ids=["60113407"]),
            FashionSubcategory(id="pants_jeans", name="Quần jeans & Quần âu", source_category_ids=["60113408", "60113409"]),
            FashionSubcategory(id="outerwear_jackets", name="Áo khoác & Blazer", source_category_ids=["60113410", "60113411"]),
        ],
    ),
    FashionCategory(
        id="MEN_FASHION",
        name="Thời trang Nam",
        subcategories=[
            FashionSubcategory(id="shirts", name="Áo sơ mi nam", source_category_ids=["60113501"]),
            FashionSubcategory(id="t_shirts_polos", name="Áo thun & Polo nam", source_category_ids=["60113502", "60113503"]),
            FashionSubcategory(id="pants_jeans", name="Quần dài & Jeans nam", source_category_ids=["60113504", "60113505"]),
            FashionSubcategory(id="outerwear_jackets", name="Áo khoác & Bomber nam", source_category_ids=["60113506"]),
            FashionSubcategory(id="sportswear", name="Đồ thể thao nam", source_category_ids=["60113507"]),
        ],
    ),
    FashionCategory(
        id="ACCESSORIES",
        name="Phụ kiện Thời trang",
        subcategories=[
            FashionSubcategory(id="bags", name="Túi xách & Balo", source_category_ids=["60113601"]),
            FashionSubcategory(id="hats_belts", name="Mũ nón & Thắt lưng", source_category_ids=["60113602"]),
            FashionSubcategory(id="jewelry", name="Trang sức & Đồng hồ", source_category_ids=["60113603"]),
        ],
    ),
    FashionCategory(
        id="SHOES",
        name="Giày dép",
        subcategories=[
            FashionSubcategory(id="sneakers", name="Giày thể thao & Sneakers", source_category_ids=["60113701"]),
            FashionSubcategory(id="heels_sandals", name="Giày cao gót & Sandals", source_category_ids=["60113702"]),
            FashionSubcategory(id="boots", name="Boots & Giày da", source_category_ids=["60113703"]),
        ],
    ),
]


def map_source_category(
    source_cat_id: str | None,
    source_cat_name: str | None = None,
    title: str = "",
) -> tuple[str, str | None]:
    """
    Deterministically maps a TikTok Shop source category ID or name to TrendMotion internal taxonomy.
    Preserves source category and assigns INTERNAL_CATEGORY_UNMAPPED if not confident.
    """
    if not source_cat_id and not source_cat_name and not title:
        return "INTERNAL_CATEGORY_UNMAPPED", None

    src_id = (source_cat_id or "").strip()
    src_name = (source_cat_name or "").lower().strip()
    title_lower = title.lower()

    # 1. Exact ID mapping across subcategories
    for cat in FASHION_TAXONOMY:
        for sub in cat.subcategories:
            if src_id in sub.source_category_ids:
                return cat.id, sub.id

    # 2. Textual mapping from verified category names
    combined_text = f"{src_name} {title_lower}"

    if "women" in src_name or "nữ" in src_name or "đầm" in src_name or "váy" in src_name:
        if "sơ mi" in combined_text or "shirt" in combined_text:
            return "WOMEN_FASHION", "shirts_blouses"
        if "cardigan" in combined_text or "len" in combined_text:
            return "WOMEN_FASHION", "cardigans_knitwear"
        if "đầm" in combined_text or "dress" in combined_text:
            return "WOMEN_FASHION", "dresses"
        if "chân váy" in combined_text or "skirt" in combined_text:
            return "WOMEN_FASHION", "skirts"
        if "jean" in combined_text or "quần" in combined_text or "pants" in combined_text:
            return "WOMEN_FASHION", "pants_jeans"
        if "khoác" in combined_text or "jacket" in combined_text or "blazer" in combined_text:
            return "WOMEN_FASHION", "outerwear_jackets"
        return "WOMEN_FASHION", None

    if "men" in src_name or "nam" in src_name:
        if "sơ mi" in combined_text or "shirt" in combined_text:
            return "MEN_FASHION", "shirts"
        if "thun" in combined_text or "polo" in combined_text or "t-shirt" in combined_text:
            return "MEN_FASHION", "t_shirts_polos"
        if "quần" in combined_text or "jeans" in combined_text or "pants" in combined_text:
            return "MEN_FASHION", "pants_jeans"
        if "khoác" in combined_text or "jacket" in combined_text:
            return "MEN_FASHION", "outerwear_jackets"
        return "MEN_FASHION", None

    if "phụ kiện" in src_name or "accessory" in src_name or "túi" in src_name:
        return "ACCESSORIES", None

    if "giày" in src_name or "dép" in src_name or "shoe" in src_name or "sneaker" in src_name:
        return "SHOES", None

    # Fallback to title keywords if source_name is generic
    if "áo sơ mi nữ" in title_lower or "sơ mi nữ" in title_lower:
        return "WOMEN_FASHION", "shirts_blouses"
    if "cardigan" in title_lower:
        return "WOMEN_FASHION", "cardigans_knitwear"
    if "váy" in title_lower or "đầm" in title_lower:
        return "WOMEN_FASHION", "dresses"
    if "sơ mi nam" in title_lower:
        return "MEN_FASHION", "shirts"

    return "INTERNAL_CATEGORY_UNMAPPED", None
