from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str = Field(default="ok", description="Service health status")
    app: str = Field(description="Application name")
    version: str = Field(description="Application version")
    environment: str = Field(description="Current deployment environment")
