from fastapi import APIRouter, HTTPException, status

from app.schemas.personalization import (
    CompatibilityCheckRequest,
    CompatibilityCheckResponse,
    CreateGenerationRequest,
    ModelTemplateGenerationResponse,
    ProjectDetailResponse,
    ProjectSummaryResponse,
)
from app.services.personalization import personalization_service

router = APIRouter(prefix="/personalization", tags=["Model Personalization"])

# For development, default user
CURRENT_USER_ID = "default_user"


@router.post("/compatibility", response_model=CompatibilityCheckResponse)
async def check_compatibility(body: CompatibilityCheckRequest):
    """
    Evaluates compatibility between a Model Profile and a Video Template.
    Categorizes assessment as SUPPORTED, LIMITED, UNSUPPORTED, or NOT_ASSESSED.
    """
    try:
        return personalization_service.check_compatibility(
            model_id=body.model_id,
            template_id=body.template_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/generations",
    response_model=ModelTemplateGenerationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_generation(body: CreateGenerationRequest):
    """
    Creates an independent ModelTemplateGeneration job to synthesize a Personalized Base Video.
    Stores input, intermediate, and output assets in Local Filesystem Storage.
    """
    try:
        return personalization_service.create_generation(
            user_id=CURRENT_USER_ID,
            request=body,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get(
    "/generations/{generation_id}",
    response_model=ModelTemplateGenerationResponse,
)
async def get_generation_status(generation_id: str):
    """
    Retrieves current progress, status, and Quality Review report of a generation job.
    """
    try:
        return personalization_service.get_generation(
            generation_id=generation_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post(
    "/generations/{generation_id}/cancel",
    response_model=ModelTemplateGenerationResponse,
)
async def cancel_generation(generation_id: str):
    """
    Cancels a queued or in-progress generation job.
    """
    try:
        return personalization_service.cancel_generation(
            generation_id=generation_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post(
    "/generations/{generation_id}/retry",
    response_model=ModelTemplateGenerationResponse,
)
async def retry_generation(generation_id: str):
    """
    Retries a failed generation job without duplicating artifacts.
    """
    try:
        return personalization_service.retry_generation(
            generation_id=generation_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.get("/projects", response_model=list[ProjectSummaryResponse])
async def list_projects():
    """
    Lists current user's video personalization projects.
    """
    return personalization_service.list_projects(user_id=CURRENT_USER_ID)


@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
async def get_project_detail(project_id: str):
    """
    Retrieves a project and its historical generations log.
    """
    try:
        return personalization_service.get_project_detail(
            project_id=project_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str):
    """
    Deletes a video personalization project.
    """
    try:
        personalization_service.delete_project(
            project_id=project_id,
            user_id=CURRENT_USER_ID,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
