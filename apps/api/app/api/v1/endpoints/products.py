from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.products import (
    CreateExtractionRequest,
    ExtractionJobResponse,
    ProductAssetResponse,
    ProductAssetSummaryResponse,
    SaveProductAssetRequest,
    UpdateProductAssetRequest,
)
from app.services.product_extraction import product_extraction_service

router = APIRouter(prefix="/projects/{project_id}/products", tags=["Product Assets"])

CURRENT_USER_ID = "default_user"


@router.post(
    "/extractions",
    response_model=ExtractionJobResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_extraction_job(project_id: str, body: CreateExtractionRequest):
    """
    Submits a product URL for SSRF validation, metadata scraping,
    and original image collection.
    """
    try:
        return product_extraction_service.create_extraction_job(
            project_id=project_id,
            user_id=CURRENT_USER_ID,
            request=body,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/extractions/{job_id}", response_model=ExtractionJobResponse)
async def get_extraction_status(project_id: str, job_id: str):
    """
    Retrieves current extraction progress, steps, and extracted product preview.
    """
    try:
        return product_extraction_service.get_extraction_job(
            project_id=project_id,
            job_id=job_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/extractions/{job_id}/cancel", response_model=ExtractionJobResponse)
async def cancel_extraction_job(project_id: str, job_id: str):
    """
    Cancels an ongoing extraction job.
    """
    try:
        return product_extraction_service.cancel_extraction_job(
            project_id=project_id,
            job_id=job_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post(
    "",
    response_model=ProductAssetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def save_product_asset(project_id: str, body: SaveProductAssetRequest):
    """
    Saves extracted product data and verified images as a permanent ProductAsset within the project.
    """
    try:
        return product_extraction_service.save_product_asset(
            project_id=project_id,
            user_id=CURRENT_USER_ID,
            request=body,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("", response_model=list[ProductAssetSummaryResponse])
async def list_project_products(
    project_id: str,
    search: str | None = Query(None, description="Tìm theo tên hoặc domain"),
    include_archived: bool = Query(False, description="Bao gồm sản phẩm đã lưu trữ"),
):
    """
    Lists all saved Product Assets inside the project.
    """
    try:
        return product_extraction_service.list_products(
            project_id=project_id,
            user_id=CURRENT_USER_ID,
            search=search,
            include_archived=include_archived,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/{product_id}", response_model=ProductAssetResponse)
async def get_product_asset_detail(project_id: str, product_id: str):
    """
    Retrieves full details of a saved Product Asset, including all high-resolution images.
    """
    try:
        return product_extraction_service.get_product(
            project_id=project_id,
            product_id=product_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.patch("/{product_id}", response_model=ProductAssetResponse)
async def update_product_asset(
    project_id: str, product_id: str, body: UpdateProductAssetRequest
):
    """
    Updates custom title, description, or changes primary image of a saved Product Asset.
    """
    try:
        return product_extraction_service.update_product(
            project_id=project_id,
            product_id=product_id,
            user_id=CURRENT_USER_ID,
            request=body,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_asset(project_id: str, product_id: str):
    """
    Soft-deletes / archives a Product Asset from the project.
    """
    try:
        product_extraction_service.delete_product(
            project_id=project_id,
            product_id=product_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
