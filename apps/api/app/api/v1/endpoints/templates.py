import json
import logging
import shutil
import subprocess
import uuid
from dataclasses import asdict
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse

from app.core.config import settings
from app.schemas.templates import (
    AssessmentStatus,
    TemplateCategoryResponse,
    TemplateCompatibilityResponse,
    TemplateDetailResponse,
    TemplateGarmentSlotResponse,
    TemplateListResponse,
    TemplateSceneResponse,
    TemplateSortBy,
    TemplateStatus,
    TemplateSummaryResponse,
    ToggleFavoriteResponse,
)
from app.services.storage import storage_service
from app.services.video_engine import local_video_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/templates", tags=["Video Templates"])

# User favorites in-memory registry (default_user)
_USER_FAVORITES: set[str] = set()

# Pre-defined Category Catalog
_CATEGORIES = [
    {"id": "all", "name": "Tất cả"},
    {"id": "fashion_walk", "name": "Fashion Walk"},
    {"id": "mirror_outfit", "name": "Mirror Outfit"},
    {"id": "studio_pose", "name": "Studio Pose"},
    {"id": "runway", "name": "Runway"},
    {"id": "lifestyle", "name": "Lifestyle"},
    {"id": "closeup_product", "name": "Close-up Product"},
]

_CUSTOM_TEMPLATES_FILE = settings.storage_root_path.parent / "db" / "custom_templates.json"

# Published Video Templates Catalog
_TEMPLATES_CATALOG: dict[str, dict] = {
    "vtp-streetwear-001": {
        "template_id": "vtp-streetwear-001",
        "template_code": "VTP-000101",
        "title": "Fashion Walk Phong Cách Đường Phố",
        "description": "Người mẫu sải bước tự tin trên phố đi bộ, chuyển động nhịp nhàng, góc máy tracking theo từng bước chân.",
        "category_id": "fashion_walk",
        "category_name": "Fashion Walk",
        "tags": ["streetwear", "walking", "autumn", "urban"],
        "source_storage_path": "templates/vtp-streetwear-001/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-streetwear-001/stream",
        "duration_ms": 14200,
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "frame_rate": 30,
        "video_codec": "h264",
        "audio_codec": "aac",
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 42,
        "published_at": "2026-11-01T08:00:00Z",
        "updated_at": "2026-11-04T12:00:00Z",
        "scenes": [
            {
                "scene_id": "scn-01-01",
                "template_id": "vtp-streetwear-001",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 5200,
                "action_description": "Người mẫu bước vào khung hình từ xa, sải bước tự nhiên về phía ống kính.",
                "camera_movement": "Tracking shot lùi dần giữ khoảng cách trung bình",
                "framing": "full_body",
                "subject_visibility": "Toàn thân rõ nét, ánh sáng tự nhiên ban ngày",
            },
            {
                "scene_id": "scn-01-02",
                "template_id": "vtp-streetwear-001",
                "scene_order": 2,
                "start_time_ms": 5200,
                "end_time_ms": 10500,
                "action_description": "Người mẫu dừng bước, xoay nhẹ người 45 độ khoe dáng áo và túi quần.",
                "camera_movement": "Gimbal xoay chậm ngang tầm mắt",
                "framing": "medium_shot",
                "subject_visibility": "Thân trên và hông rõ nét",
            },
            {
                "scene_id": "scn-01-03",
                "template_id": "vtp-streetwear-001",
                "scene_order": 3,
                "start_time_ms": 10500,
                "end_time_ms": 14200,
                "action_description": "Người mẫu tiếp tục bước đi lướt qua camera, tạo hiệu ứng chuyển cảnh tự nhiên.",
                "camera_movement": "Cố định khi nhân vật đi qua",
                "framing": "close_up",
                "subject_visibility": "Chi tiết cổ áo và ngực áo",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-01-01",
                "template_id": "vtp-streetwear-001",
                "slot_type": "upper_body",
                "slot_name": "Áo thân trên",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Không bị vật cản che khuất",
                "notes": "Hỗ trợ áo sơ mi, áo phông, áo nỉ. Dễ dàng nhận diện vạt áo và nẹp áo.",
            },
            {
                "slot_id": "slot-01-02",
                "template_id": "vtp-streetwear-001",
                "slot_type": "lower_body",
                "slot_name": "Quần / Chân váy",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Rõ nét ở cảnh 1 và cảnh 2",
                "notes": "Hỗ trợ quần jean, quần ống rộng, quần túi hộp.",
            },
            {
                "slot_id": "slot-01-03",
                "template_id": "vtp-streetwear-001",
                "slot_type": "dress_full_body",
                "slot_name": "Đầm toàn thân",
                "assessment_status": AssessmentStatus.LIMITED.value,
                "visibility_level": "PARTIAL",
                "occlusion_status": "Cảnh 3 góc quay cận cắt mất phần gấu váy",
                "notes": "Chỉ khuyến nghị cho đầm ngắn hoặc đầm dáng suông.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-streetwear-001",
            "supported_aspect_ratios": ["9:16"],
            "supported_model_framings": ["full_body", "medium_shot"],
            "supported_subject_count": 1,
            "supported_motion_types": ["walking", "turn_around"],
            "face_visibility_requirement": "Khuôn mặt rõ nét, góc nhìn chính diện và nghiêng 45 độ.",
            "body_visibility_requirement": "Dáng người cân đối, tỷ lệ toàn thân đầy đủ từ đầu đến chân.",
            "occlusion_level": "LOW",
            "limitations": [
                "Không có góc quay lưng 180 độ, không phù hợp cho sản phẩm có điểm nhấn chính ở lưng.",
                "Bối cảnh ngoài trời có ánh nắng, cần ảnh người mẫu có ánh sáng tự nhiên tương đồng.",
            ],
        },
    },
    "vtp-mirror-002": {
        "template_id": "vtp-mirror-002",
        "template_code": "VTP-000102",
        "title": "Mirror Outfit Biến Hình Trước Gương",
        "description": "Quay góc nhìn thứ nhất trước gương phòng ngủ cao cấp, chuyển động vuốt áo nhẹ nhàng tạo dáng năng động.",
        "category_id": "mirror_outfit",
        "category_name": "Mirror Outfit",
        "tags": ["mirror", "casual", "genz", "indoor"],
        "source_storage_path": "templates/vtp-mirror-002/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-mirror-002/stream",
        "duration_ms": 18500,
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "frame_rate": 30,
        "video_codec": "h264",
        "audio_codec": "aac",
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 68,
        "published_at": "2026-11-02T10:00:00Z",
        "updated_at": "2026-11-05T01:00:00Z",
        "scenes": [
            {
                "scene_id": "scn-02-01",
                "template_id": "vtp-mirror-002",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 9000,
                "action_description": "Người mẫu đứng trước gương chỉnh sửa cổ áo và vuốt tay áo.",
                "camera_movement": "Góc cố định ngang ngực",
                "framing": "medium_shot",
                "subject_visibility": "Thân trên và mặt qua gương rất rõ",
            },
            {
                "scene_id": "scn-02-02",
                "template_id": "vtp-mirror-002",
                "scene_order": 2,
                "start_time_ms": 9000,
                "end_time_ms": 18500,
                "action_description": "Lùi lại 2 bước để lộ toàn bộ trang phục quần và giày.",
                "camera_movement": "Hạ góc máy nhẹ",
                "framing": "full_body",
                "subject_visibility": "Toàn thân trong gương",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-02-01",
                "template_id": "vtp-mirror-002",
                "slot_type": "upper_body",
                "slot_name": "Áo thân trên",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Bàn tay chạm nhẹ cổ áo ở giây 2",
                "notes": "Rất phù hợp cho áo thun, sweater, sơ mi oversize.",
            },
            {
                "slot_id": "slot-02-02",
                "template_id": "vtp-mirror-002",
                "slot_type": "lower_body",
                "slot_name": "Quần / Váy ngắn",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Xuất hiện đầy đủ từ giây thứ 9",
                "notes": "Rõ nét ống quần và gấu quần.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-mirror-002",
            "supported_aspect_ratios": ["9:16"],
            "supported_model_framings": ["medium_shot", "full_body"],
            "supported_subject_count": 1,
            "supported_motion_types": ["mirror_movement", "standing_pose"],
            "face_visibility_requirement": "Khuôn mặt có góc nhìn phản chiếu qua gương.",
            "body_visibility_requirement": "Thân hình cân đối, tỷ lệ bán thân và toàn thân.",
            "occlusion_level": "LOW",
            "limitations": [
                "Bối cảnh phòng ngủ hiện đại có gương viền LED.",
            ],
        },
    },
    "vtp-studio-003": {
        "template_id": "vtp-studio-003",
        "template_code": "VTP-000103",
        "title": "Studio Turn Xoay 360 Độ Thanh Lịch",
        "description": "Phông nền studio xám tối giản, người mẫu xoay trọn vẹn một vòng khoe cấu trúc trước và sau của trang phục.",
        "category_id": "studio_pose",
        "category_name": "Studio Pose",
        "tags": ["studio", "360turn", "elegant", "lookbook"],
        "source_storage_path": "templates/vtp-studio-003/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-studio-003/stream",
        "duration_ms": 11000,
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "frame_rate": 30,
        "video_codec": "h264",
        "audio_codec": None,
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 89,
        "published_at": "2026-11-03T09:00:00Z",
        "updated_at": "2026-11-05T01:30:00Z",
        "scenes": [
            {
                "scene_id": "scn-03-01",
                "template_id": "vtp-studio-003",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 11000,
                "action_description": "Xoay người 360 độ chậm rãi trên đĩa xoay studio chuyên nghiệp.",
                "camera_movement": "Camera chân máy cố định chuẩn lookbook",
                "framing": "full_body",
                "subject_visibility": "360 độ từ mặt trước, sườn đến mặt sau",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-03-01",
                "template_id": "vtp-studio-003",
                "slot_type": "dress_full_body",
                "slot_name": "Đầm dạ hội / Váy liền",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Không che khuất, quan sát được cả mặt sau",
                "notes": "Cực kỳ lý tưởng cho sản phẩm có chi tiết lưng hoặc nơ thắt eo.",
            },
            {
                "slot_id": "slot-03-02",
                "template_id": "vtp-studio-003",
                "slot_type": "jacket_outerwear",
                "slot_name": "Áo khoác dạ / Blazer",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Không che khuất",
                "notes": "Hỗ trợ xuất sắc cho áo khoác phom đứng.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-studio-003",
            "supported_aspect_ratios": ["9:16"],
            "supported_model_framings": ["full_body"],
            "supported_subject_count": 1,
            "supported_motion_types": ["turn_around", "standing_pose"],
            "face_visibility_requirement": "Cần ảnh người mẫu ở cả góc nhìn nghiêng.",
            "body_visibility_requirement": "Ảnh toàn thân chuẩn studio.",
            "occlusion_level": "LOW",
            "limitations": [
                "Bắt buộc sản phẩm phải có ảnh mặt sau trong Product Truth Sheet.",
            ],
        },
    },
    "vtp-runway-004": {
        "template_id": "vtp-runway-004",
        "template_code": "VTP-000104",
        "title": "Runway Ánh Sáng Sân Khấu Chuyên Nghiệp",
        "description": "Sàn catwalk phong cách thời trang cao cấp, nhịp bước dứt khoát, ánh đèn spotlight tập trung vào trang phục.",
        "category_id": "runway",
        "category_name": "Runway",
        "tags": ["runway", "catwalk", "highfashion", "spotlight"],
        "source_storage_path": "templates/vtp-runway-004/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-runway-004/stream",
        "duration_ms": 22000,
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "frame_rate": 60,
        "video_codec": "h264",
        "audio_codec": "aac",
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 35,
        "published_at": "2026-11-04T07:30:00Z",
        "updated_at": "2026-11-04T07:30:00Z",
        "scenes": [
            {
                "scene_id": "scn-04-01",
                "template_id": "vtp-runway-004",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 12000,
                "action_description": "Catwalk từ cuối sàn diễn lên vị trí pose đầu sàn.",
                "camera_movement": "Dolly zoom theo trục dọc",
                "framing": "full_body",
                "subject_visibility": "Toàn cảnh sân khấu",
            },
            {
                "scene_id": "scn-04-02",
                "template_id": "vtp-runway-004",
                "scene_order": 2,
                "start_time_ms": 12000,
                "end_time_ms": 22000,
                "action_description": "Dừng lại tạo dáng 3 giây, xoay ngoắt quay lưng đi vào hậu trường.",
                "camera_movement": "Quay cận chân dung rồi lia theo lưng",
                "framing": "medium_shot",
                "subject_visibility": "Rõ nét mặt trước và mặt sau",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-04-01",
                "template_id": "vtp-runway-004",
                "slot_type": "dress_full_body",
                "slot_name": "Đầm dạ hội / Set đồ Runway",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Không che khuất",
                "notes": "Yêu cầu vải có độ rủ hoặc bay tà.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-runway-004",
            "supported_aspect_ratios": ["9:16"],
            "supported_model_framings": ["full_body", "medium_shot"],
            "supported_subject_count": 1,
            "supported_motion_types": ["walking", "turn_around"],
            "face_visibility_requirement": "Thần thái sắc lạnh, chuyên nghiệp.",
            "body_visibility_requirement": "Chiều cao tỷ lệ chuẩn mẫu sàn diễn.",
            "occlusion_level": "LOW",
            "limitations": [
                "Độ tương phản ánh sáng spotlight mạnh.",
            ],
        },
    },
    "vtp-lifestyle-005": {
        "template_id": "vtp-lifestyle-005",
        "template_code": "VTP-000105",
        "title": "Coffee Walk Dạo Phố Thu Đông",
        "description": "Bối cảnh quán cà phê phong cách Hàn Quốc, vừa cầm ly cà phê vừa dạo bước nhẹ nhàng, phù hợp thời trang thường ngày.",
        "category_id": "lifestyle",
        "category_name": "Lifestyle",
        "tags": ["coffee", "korean", "autumn", "dailywear"],
        "source_storage_path": "templates/vtp-lifestyle-005/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-lifestyle-005/stream",
        "duration_ms": 16000,
        "width": 1080,
        "height": 1920,
        "aspect_ratio": "9:16",
        "frame_rate": 30,
        "video_codec": "h264",
        "audio_codec": "aac",
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 52,
        "published_at": "2026-11-04T11:00:00Z",
        "updated_at": "2026-11-04T11:00:00Z",
        "scenes": [
            {
                "scene_id": "scn-05-01",
                "template_id": "vtp-lifestyle-005",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 8000,
                "action_description": "Bước ra từ cửa quán cà phê, tay cầm ly giấy mỉm cười nhẹ.",
                "camera_movement": "Tracking shot ngang hông",
                "framing": "medium_shot",
                "subject_visibility": "Nửa thân trên rõ nét",
            },
            {
                "scene_id": "scn-05-02",
                "template_id": "vtp-lifestyle-005",
                "scene_order": 2,
                "start_time_ms": 8000,
                "end_time_ms": 16000,
                "action_description": "Đi dọc con phố lá vàng, xoay người nhìn lại camera.",
                "camera_movement": "Tracking shot lùi xa dần",
                "framing": "full_body",
                "subject_visibility": "Toàn cảnh trang phục và bối cảnh",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-05-01",
                "template_id": "vtp-lifestyle-005",
                "slot_type": "jacket_outerwear",
                "slot_name": "Áo khoác / Cardigan",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Ly cà phê che một phần nhỏ ngực áo ở cảnh 1",
                "notes": "Rất hợp áo len, trench coat hoặc măng tô.",
            },
            {
                "slot_id": "slot-05-02",
                "template_id": "vtp-lifestyle-005",
                "slot_type": "lower_body",
                "slot_name": "Quần tây / Váy dạ",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Rõ nét ở cảnh 2",
                "notes": "Hỗ trợ trang phục mùa đông dài.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-lifestyle-005",
            "supported_aspect_ratios": ["9:16"],
            "supported_model_framings": ["medium_shot", "full_body"],
            "supported_subject_count": 1,
            "supported_motion_types": ["walking", "turn_around"],
            "face_visibility_requirement": "Biểu cảm tươi tắn, tự nhiên.",
            "body_visibility_requirement": "Ảnh người mẫu phong cách đời thường.",
            "occlusion_level": "MEDIUM",
            "limitations": [
                "Có đạo cụ ly cà phê trên tay.",
            ],
        },
    },
    "vtp-closeup-006": {
        "template_id": "vtp-closeup-006",
        "template_code": "VTP-000106",
        "title": "Close-up Chi Tiết Cổ Áo & Nẹp Cúc",
        "description": "Quay cận cảnh chi tiết chất liệu vải, đường may cổ áo, nẹp cúc và túi áo thời trang cao cấp.",
        "category_id": "closeup_product",
        "category_name": "Close-up Product",
        "tags": ["closeup", "details", "buttons", "fabric"],
        "source_storage_path": "templates/vtp-closeup-006/versions/v1/source/source.mp4",
        "poster_url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80",
        "preview_url": "/api/v1/templates/vtp-closeup-006/stream",
        "duration_ms": 9500,
        "width": 1080,
        "height": 1080,
        "aspect_ratio": "1:1",
        "frame_rate": 30,
        "video_codec": "h264",
        "audio_codec": None,
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 27,
        "published_at": "2026-11-04T15:00:00Z",
        "updated_at": "2026-11-04T15:00:00Z",
        "scenes": [
            {
                "scene_id": "scn-06-01",
                "template_id": "vtp-closeup-006",
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": 9500,
                "action_description": "Ngón tay lướt nhẹ qua hàng cúc áo và đường chỉ thêu ngực áo.",
                "camera_movement": "Macro focus trượt dọc theo nẹp áo",
                "framing": "close_up",
                "subject_visibility": "Vùng ngực áo và cổ áo cực kỳ chi tiết",
            },
        ],
        "garment_slots": [
            {
                "slot_id": "slot-06-01",
                "template_id": "vtp-closeup-006",
                "slot_type": "upper_body",
                "slot_name": "Cổ áo & Nẹp cúc",
                "assessment_status": AssessmentStatus.SUPPORTED.value,
                "visibility_level": "FULL",
                "occlusion_status": "Ngón tay chạm nhẹ cúc thứ 2",
                "notes": "Chuyên dùng làm video giới thiệu chất liệu và tay nghề may.",
            },
            {
                "slot_id": "slot-06-02",
                "template_id": "vtp-closeup-006",
                "slot_type": "lower_body",
                "slot_name": "Quần / Chân váy",
                "assessment_status": AssessmentStatus.UNSUPPORTED.value,
                "visibility_level": "MINIMAL",
                "occlusion_status": "Không xuất hiện trong khung hình macro",
                "notes": "Không hỗ trợ trang phục nửa dưới.",
            },
        ],
        "compatibility": {
            "template_id": "vtp-closeup-006",
            "supported_aspect_ratios": ["1:1"],
            "supported_model_framings": ["close_up"],
            "supported_subject_count": 1,
            "supported_motion_types": ["standing_pose"],
            "face_visibility_requirement": "Chỉ nhìn thấy phần cằm và cổ, không thấy toàn bộ mặt.",
            "body_visibility_requirement": "Chỉ lấy vùng ngực áo.",
            "occlusion_level": "LOW",
            "limitations": [
                "Tỷ lệ khung hình vuông 1:1.",
                "Không hiển thị quần hoặc giày.",
            ],
        },
    },
}


def _build_summary(t: dict) -> TemplateSummaryResponse:
    tid = t["template_id"]
    is_fav = tid in _USER_FAVORITES
    garment_types = [
        s["slot_type"]
        for s in t.get("garment_slots", [])
        if s["assessment_status"] in ("SUPPORTED", "LIMITED")
    ]

    return TemplateSummaryResponse(
        template_id=tid,
        template_code=t["template_code"],
        title=t["title"],
        description=t["description"],
        category_id=t["category_id"],
        category_name=t["category_name"],
        tags=t.get("tags", []),
        poster_url=t["poster_url"],
        preview_url=t.get("preview_url"),
        duration_ms=t["duration_ms"],
        width=t["width"],
        height=t["height"],
        aspect_ratio=t["aspect_ratio"],
        frame_rate=t["frame_rate"],
        status=t["status"],
        is_favorite=is_fav,
        usage_count=t.get("usage_count", 0),
        garment_slots_summary=garment_types,
        published_at=t["published_at"],
        updated_at=t["updated_at"],
    )


def _build_detail(t: dict) -> TemplateDetailResponse:
    tid = t["template_id"]
    is_fav = tid in _USER_FAVORITES

    built_scenes: list[TemplateSceneResponse] = []
    for idx, s in enumerate(t.get("scenes", [])):
        built_scenes.append(
            TemplateSceneResponse(
                scene_id=s.get("scene_id", f"{tid}_sc_{idx+1}"),
                template_id=s.get("template_id", tid),
                scene_order=s.get("scene_order", idx + 1),
                start_time_ms=s.get("start_time_ms", 0),
                end_time_ms=s.get("end_time_ms", t.get("duration_ms", 10000)),
                action_description=s.get("action_description", "Chuyển động người mẫu thời trang"),
                camera_movement=s.get("camera_movement", "tracking"),
                framing=s.get("framing", "full_body"),
                subject_visibility=s.get("subject_visibility", "FULL"),
            )
        )
    if not built_scenes:
        built_scenes.append(
            TemplateSceneResponse(
                scene_id=f"{tid}_sc_1",
                template_id=tid,
                scene_order=1,
                start_time_ms=0,
                end_time_ms=t.get("duration_ms", 10000),
                action_description="Chuyển động người mẫu thời trang",
                camera_movement="tracking",
                framing="full_body",
                subject_visibility="FULL",
            )
        )

    built_slots: list[TemplateGarmentSlotResponse] = []
    for idx, g in enumerate(t.get("garment_slots", [])):
        raw_status = str(g.get("assessment_status", "SUPPORTED")).upper()
        clean_status = (
            AssessmentStatus(raw_status)
            if raw_status in AssessmentStatus._value2member_map_
            else AssessmentStatus.SUPPORTED
        )
        built_slots.append(
            TemplateGarmentSlotResponse(
                slot_id=g.get("slot_id", f"{tid}_slot_{idx+1}"),
                template_id=g.get("template_id", tid),
                slot_type=g.get("slot_type", "upper_body"),
                slot_name=g.get("slot_name", "Trang phục nhận diện"),
                assessment_status=clean_status,
                visibility_level=g.get("visibility_level", "CLEAR"),
                occlusion_status=g.get("occlusion_status", "Không có vật cản lớn"),
                notes=g.get("notes"),
            )
        )
    if not built_slots:
        built_slots.append(
            TemplateGarmentSlotResponse(
                slot_id=f"{tid}_slot_upper",
                template_id=tid,
                slot_type="upper_body",
                slot_name="Áo / Trang phục thân trên",
                assessment_status=AssessmentStatus.SUPPORTED,
                visibility_level="CLEAR",
                occlusion_status="Không có vật cản lớn",
                notes="Nhận diện tự động từ video mẫu.",
            )
        )

    compat_raw = t.get("compatibility", {})
    built_compat = TemplateCompatibilityResponse(
        template_id=compat_raw.get("template_id", tid),
        supported_aspect_ratios=compat_raw.get("supported_aspect_ratios", [t.get("aspect_ratio", "9:16")]),
        supported_model_framings=compat_raw.get("supported_model_framings", ["full_body", "medium_shot"]),
        supported_subject_count=compat_raw.get("supported_subject_count", 1),
        supported_motion_types=compat_raw.get("supported_motion_types", ["walking", "posing"]),
        face_visibility_requirement=compat_raw.get(
            "face_visibility_requirement",
            "Khuôn mặt rõ nét, góc nhìn chính diện hoặc nghiêng.",
        ),
        body_visibility_requirement=compat_raw.get(
            "body_visibility_requirement",
            "Dáng người rõ ràng trong khung hình.",
        ),
        occlusion_level=compat_raw.get("occlusion_level", "LOW"),
        limitations=compat_raw.get("limitations", []),
    )

    return TemplateDetailResponse(
        template_id=tid,
        template_code=t["template_code"],
        title=t["title"],
        description=t["description"],
        category_id=t["category_id"],
        category_name=t["category_name"],
        tags=t.get("tags", []),
        stream_url=f"/api/v1/templates/{tid}/stream",
        poster_url=t["poster_url"],
        preview_url=t.get("preview_url"),
        duration_ms=t["duration_ms"],
        width=t["width"],
        height=t["height"],
        aspect_ratio=t["aspect_ratio"],
        frame_rate=t["frame_rate"],
        video_codec=t["video_codec"],
        audio_codec=t.get("audio_codec"),
        template_version_id=t["template_version_id"],
        status=t["status"],
        is_favorite=is_fav,
        usage_count=t.get("usage_count", 0),
        published_at=t["published_at"],
        updated_at=t["updated_at"],
        scenes=built_scenes,
        garment_slots=built_slots,
        compatibility=built_compat,
    )


@router.get("/categories", response_model=list[TemplateCategoryResponse])
async def list_categories():
    """
    Returns available template categories with current item counts.
    """
    items = list(_TEMPLATES_CATALOG.values())
    cat_counts = {}
    for t in items:
        cid = t["category_id"]
        cat_counts[cid] = cat_counts.get(cid, 0) + 1

    result = []
    for cat in _CATEGORIES:
        count = len(items) if cat["id"] == "all" else cat_counts.get(cat["id"], 0)
        result.append(
            TemplateCategoryResponse(id=cat["id"], name=cat["name"], count=count)
        )
    return result


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    query: str | None = Query(
        None, description="Search by title, code, tag, or description"
    ),
    category: str | None = Query("all", description="Filter by category ID"),
    motion_type: str | None = Query(None, description="Filter by motion type"),
    duration_range: str | None = Query(
        None, description="under_10s, 10_20s, 20_30s, over_30s"
    ),
    aspect_ratio: str | None = Query(None, description="9:16, 16:9, 1:1"),
    garment_slot: str | None = Query(
        None, description="upper_body, lower_body, dress_full_body, etc."
    ),
    assessment_status: str | None = Query(
        None, description="SUPPORTED, LIMITED, UNSUPPORTED, NOT_ASSESSED"
    ),
    is_favorite: bool | None = Query(None, description="Filter only favorites"),
    sort_by: TemplateSortBy = Query(
        TemplateSortBy.UPDATED_AT_DESC, description="Sort order"
    ),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
):
    """
    List published Video Templates with multi-criteria filtering, search, and sorting.
    """
    items = [
        t
        for t in _TEMPLATES_CATALOG.values()
        if t["status"] == TemplateStatus.PUBLISHED.value
    ]

    # Category filter
    if category and category != "all":
        items = [t for t in items if t["category_id"] == category]

    # Search filter
    if query:
        q = query.strip().lower()
        items = [
            t
            for t in items
            if q in t["title"].lower()
            or q in t["template_code"].lower()
            or q in t["description"].lower()
            or any(q in tag.lower() for tag in t.get("tags", []))
            or q in t["category_name"].lower()
        ]

    # Motion type filter
    if motion_type:
        m = motion_type.strip().lower()
        items = [
            t
            for t in items
            if any(
                m in motion.lower()
                for motion in t.get("compatibility", {}).get(
                    "supported_motion_types", []
                )
            )
            or any(m in tag.lower() for tag in t.get("tags", []))
        ]

    # Duration range filter
    if duration_range:
        if duration_range == "under_10s":
            items = [t for t in items if t["duration_ms"] < 10000]
        elif duration_range == "10_20s":
            items = [t for t in items if 10000 <= t["duration_ms"] <= 20000]
        elif duration_range == "20_30s":
            items = [t for t in items if 20000 < t["duration_ms"] <= 30000]
        elif duration_range == "over_30s":
            items = [t for t in items if t["duration_ms"] > 30000]

    # Aspect ratio filter
    if aspect_ratio:
        items = [t for t in items if t["aspect_ratio"] == aspect_ratio]

    # Garment slot filter
    if garment_slot:
        items = [
            t
            for t in items
            if any(
                s["slot_type"] == garment_slot
                and s["assessment_status"] in ("SUPPORTED", "LIMITED")
                for s in t.get("garment_slots", [])
            )
        ]

    # Assessment status filter
    if assessment_status:
        items = [
            t
            for t in items
            if any(
                s["assessment_status"] == assessment_status
                for s in t.get("garment_slots", [])
            )
        ]

    # Favorite filter
    if is_favorite is True:
        items = [t for t in items if t["template_id"] in _USER_FAVORITES]

    # Sorting
    if sort_by == TemplateSortBy.DURATION_ASC:
        items.sort(key=lambda x: x["duration_ms"])
    elif sort_by == TemplateSortBy.DURATION_DESC:
        items.sort(key=lambda x: x["duration_ms"], reverse=True)
    elif sort_by == TemplateSortBy.NAME_ASC:
        items.sort(key=lambda x: x["title"].lower())
    elif sort_by == TemplateSortBy.USAGE_DESC:
        items.sort(key=lambda x: x.get("usage_count", 0), reverse=True)
    else:  # UPDATED_AT_DESC
        items.sort(key=lambda x: x["updated_at"], reverse=True)

    total = len(items)
    start = (page - 1) * limit
    end = start + limit
    paginated_items = items[start:end]
    total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1

    return TemplateListResponse(
        items=[_build_summary(t) for t in paginated_items],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{template_id}", response_model=TemplateDetailResponse)
async def get_template_detail(template_id: str):
    """
    Returns complete detail of a published Video Template.
    """
    t = _TEMPLATES_CATALOG.get(template_id)
    if not t or t["status"] != TemplateStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy video mẫu hoặc video mẫu không còn khả dụng.",
        )
    return _build_detail(t)


@router.post("/{template_id}/favorite", response_model=ToggleFavoriteResponse)
async def toggle_template_favorite(template_id: str):
    """
    Toggles bookmark favorite status for current user.
    """
    t = _TEMPLATES_CATALOG.get(template_id)
    if not t:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy video mẫu.",
        )

    if template_id in _USER_FAVORITES:
        _USER_FAVORITES.remove(template_id)
        is_fav = False
        msg = "Đã bỏ lưu video mẫu khỏi danh sách yêu thích."
    else:
        _USER_FAVORITES.add(template_id)
        is_fav = True
        msg = "Đã lưu video mẫu vào danh sách yêu thích."

    return ToggleFavoriteResponse(
        template_id=template_id,
        is_favorite=is_fav,
        message=msg,
    )


@router.get("/{template_id}/stream")
async def stream_template_video(template_id: str, request: Request):
    """
    Streams the source video from Local Filesystem with HTTP Range Requests (RFC 7233).
    Supports HTML5 seeking, pause/resume, and chunked streaming.
    """
    t = _TEMPLATES_CATALOG.get(template_id)
    if not t or t["status"] != TemplateStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy video mẫu.",
        )

    rel_path = t.get("source_storage_path")
    if not rel_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Đường dẫn video mẫu không hợp lệ.",
        )

    # Check physical file existence on disk
    try:
        safe_path = storage_service.resolve_safe_path(rel_path)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

    if not safe_path.is_file():
        # Auto-create sample placeholder video for local dev if file not yet copied
        safe_path.parent.mkdir(parents=True, exist_ok=True)
        # Minimal MP4 sample header so browsers don't fail decoding
        sample_bytes = (
            b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42" + b"\x00" * 4096
        )
        safe_path.write_bytes(sample_bytes)

    return storage_service.stream_file_with_range(
        relative_path=rel_path,
        request=request,
        media_type="video/mp4",
    )


def _load_custom_templates() -> None:
    if _CUSTOM_TEMPLATES_FILE.is_file():
        try:
            items = json.loads(_CUSTOM_TEMPLATES_FILE.read_text(encoding="utf-8"))
            for item in items:
                _TEMPLATES_CATALOG[item["template_id"]] = item
        except Exception as e:
            logger.warning("Could not load custom templates: %s", e)


def _save_custom_templates() -> None:
    _CUSTOM_TEMPLATES_FILE.parent.mkdir(parents=True, exist_ok=True)
    custom_items = [t for t in _TEMPLATES_CATALOG.values() if t.get("is_custom")]
    _CUSTOM_TEMPLATES_FILE.write_text(
        json.dumps(custom_items, ensure_ascii=False, indent=2), encoding="utf-8"
    )


# Load custom templates at module load
_load_custom_templates()


@router.post("/upload", response_model=TemplateDetailResponse, status_code=status.HTTP_201_CREATED)
async def upload_custom_template(
    file: UploadFile = File(...),
    title: str = Form(...),
    category_id: str = Form("fashion_walk"),
    description: str = Form(""),
):
    """
    Uploads a user-provided Video Template (MP4/MOV) and executes
    the complete local Video Analysis Engine:
    decoding -> frame extraction -> scene transition detection -> pose estimation -> garment slot mapping.
    """
    clean_title = title.strip()
    if not clean_title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tên video mẫu không được để trống.",
        )

    # Validate file format
    ext = Path(file.filename or "").suffix.lower()
    if ext not in (".mp4", ".mov", ".m4v", ".webm"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Chỉ hỗ trợ định dạng video MP4 hoặc MOV.",
        )

    template_id = f"vtp-custom-{uuid.uuid4().hex[:8]}"
    template_code = f"CUST-{uuid.uuid4().hex[:6].upper()}"

    # Target source storage path
    rel_source_path = f"templates/{template_id}/versions/v1/source/source{ext}"
    abs_source_path = storage_service.resolve_safe_path(rel_source_path)
    abs_source_path.parent.mkdir(parents=True, exist_ok=True)

    # Save uploaded bytes to local filesystem
    try:
        with open(abs_source_path, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)

        # Normalize video for HTML5 playback: convert any HE-AACv2 audio to AAC-LC and move moov atom to start
        norm_tmp = abs_source_path.with_name(f"{abs_source_path.stem}_norm.mp4")
        try:
            subprocess.run(
                [
                    settings.FFMPEG_PATH,
                    "-y",
                    "-i", str(abs_source_path),
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-movflags", "+faststart",
                    str(norm_tmp),
                ],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True,
                timeout=60,
            )
            if norm_tmp.is_file() and norm_tmp.stat().st_size > 0:
                norm_tmp.replace(abs_source_path)
        except Exception as norm_e:
            logger.warning("Template video faststart normalization skipped: %s", norm_e)
            if norm_tmp.is_file():
                norm_tmp.unlink(missing_ok=True)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lưu trữ file video: {e}",
        )

    # Run complete local Video Analysis Engine
    analysis_root = storage_service.resolve_safe_path(f"templates/{template_id}/analysis")
    try:
        artifacts = local_video_engine.analyze_template_video(
            template_id=template_id,
            video_path=abs_source_path,
            analysis_root_dir=analysis_root,
        )
    except Exception as e:
        logger.exception("Video analysis failed for uploaded template %s", template_id)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Không thể phân tích cấu trúc video mẫu: {e}",
        )

    category_name = next((c["name"] for c in _CATEGORIES if c["id"] == category_id), "Fashion Walk")
    now_iso = datetime.now(UTC).isoformat()

    template_record = {
        "template_id": template_id,
        "template_code": template_code,
        "title": clean_title,
        "description": description.strip() or f"Video mẫu do người dùng tải lên - {artifacts.total_frames} khung hình.",
        "category_id": category_id,
        "category_name": category_name,
        "tags": ["custom", "user-upload", artifacts.aspect_ratio],
        "source_storage_path": rel_source_path,
        "poster_url": f"/api/v1/templates/{template_id}/poster",
        "preview_url": f"/api/v1/templates/{template_id}/stream",
        "duration_ms": artifacts.duration_ms,
        "width": artifacts.width,
        "height": artifacts.height,
        "aspect_ratio": artifacts.aspect_ratio,
        "frame_rate": artifacts.frame_rate,
        "video_codec": artifacts.diagnostics.get("video_codec", "h264"),
        "audio_codec": "aac" if artifacts.diagnostics.get("has_audio") else None,
        "template_version_id": "v1.0.0",
        "status": TemplateStatus.PUBLISHED.value,
        "usage_count": 0,
        "is_custom": True,
        "published_at": now_iso,
        "updated_at": now_iso,
        "scenes": [
            {
                "scene_id": getattr(s, "scene_id", f"{template_id}_sc_{idx+1}"),
                "template_id": template_id,
                "scene_order": getattr(s, "scene_order", idx + 1),
                "start_time_ms": getattr(s, "start_time_ms", 0),
                "end_time_ms": getattr(s, "end_time_ms", artifacts.duration_ms),
                "action_description": getattr(s, "action_description", "Chuyển động người mẫu thời trang"),
                "camera_movement": getattr(s, "camera_movement", "tracking"),
                "framing": getattr(s, "framing", "full_body"),
                "subject_visibility": getattr(s, "subject_visibility", "FULL"),
            }
            for idx, s in enumerate(artifacts.scenes)
        ] or [
            {
                "scene_id": f"{template_id}_sc_1",
                "template_id": template_id,
                "scene_order": 1,
                "start_time_ms": 0,
                "end_time_ms": artifacts.duration_ms,
                "action_description": "Chuyển động người mẫu thời trang",
                "camera_movement": "tracking",
                "framing": "full_body",
                "subject_visibility": "FULL",
            }
        ],
        "garment_slots": [
            {
                "slot_id": getattr(g, "slot_id", f"{template_id}_slot_{idx+1}"),
                "template_id": template_id,
                "slot_type": getattr(g, "slot_type", "upper_body"),
                "slot_name": getattr(g, "slot_name", "Trang phục nhận diện"),
                "assessment_status": (
                    getattr(g, "assessment_status", "SUPPORTED")
                    if str(getattr(g, "assessment_status", "")).upper() in ["SUPPORTED", "LIMITED", "UNSUPPORTED", "NOT_ASSESSED"]
                    else "SUPPORTED"
                ),
                "visibility_level": "CLEAR",
                "occlusion_status": "Không có vật cản lớn",
                "notes": "Nhận diện tự động từ video tải lên.",
            }
            for idx, g in enumerate(artifacts.garment_slots)
        ] or [
            {
                "slot_id": f"{template_id}_slot_upper",
                "template_id": template_id,
                "slot_type": "upper_body",
                "slot_name": "Áo / Trang phục thân trên",
                "assessment_status": "SUPPORTED",
                "visibility_level": "CLEAR",
                "occlusion_status": "Không có vật cản lớn",
                "notes": "Nhận diện tự động từ video tải lên.",
            }
        ],
        "compatibility": {
            "template_id": template_id,
            "supported_aspect_ratios": [artifacts.aspect_ratio],
            "supported_model_framings": ["full_body", "medium_shot"],
            "supported_subject_count": 1,
            "supported_motion_types": ["walking", "posing"],
            "face_visibility_requirement": "Khuôn mặt rõ nét, góc nhìn chính diện hoặc nghiêng.",
            "body_visibility_requirement": "Dáng người rõ ràng trong khung hình.",
            "occlusion_level": "LOW",
            "limitations": [],
        },
    }

    _TEMPLATES_CATALOG[template_id] = template_record
    _save_custom_templates()

    return _build_detail(template_record)


@router.get("/{template_id}/poster")
async def get_template_poster(template_id: str):
    """
    Returns the poster frame extracted by the Video Analysis Engine.
    """
    rel_poster = f"templates/{template_id}/poster/poster.jpg"
    try:
        poster_path = storage_service.resolve_safe_path(rel_poster)
        if poster_path.is_file():
            return FileResponse(poster_path, media_type="image/jpeg")
    except ValueError:
        pass

    # Fallback to catalog poster_url if external
    t = _TEMPLATES_CATALOG.get(template_id)
    if t and t.get("poster_url", "").startswith("http"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(t["poster_url"])

    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy poster.")


@router.get("/{template_id}/analysis")
async def get_template_analysis(template_id: str):
    """
    Retrieves full persistent video analysis artifacts (scenes, pose sequence, garment slots).
    """
    analysis_dir = storage_service.resolve_safe_path(f"templates/{template_id}/analysis")
    if not analysis_dir.is_dir():
        # If pre-existing template without cached analysis, generate it on demand
        t = _TEMPLATES_CATALOG.get(template_id)
        if not t or not t.get("source_storage_path"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chưa có dữ liệu phân tích.")

        source_path = storage_service.resolve_safe_path(t["source_storage_path"])
        if source_path.is_file():
            local_video_engine.analyze_template_video(
                template_id=template_id,
                video_path=source_path,
                analysis_root_dir=analysis_dir,
            )
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chưa có file video nguồn để phân tích.")

    from app.services.video_engine.motion_data import MotionDataService
    motion_service = MotionDataService()
    return motion_service.load_artifacts(analysis_dir)


@router.delete("/{template_id}", status_code=status.HTTP_200_OK)
async def delete_template(template_id: str):
    """
    Deletes a user-uploaded custom template and its storage directory.
    """
    tmpl = _TEMPLATES_CATALOG.get(template_id)
    if not tmpl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy video mẫu.",
        )
    if not tmpl.get("is_custom"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa video mẫu mặc định của hệ thống.",
        )

    del _TEMPLATES_CATALOG[template_id]
    _save_custom_templates()

    try:
        tmpl_dir = settings.storage_root_path / "templates" / template_id
        if tmpl_dir.is_dir():
            shutil.rmtree(tmpl_dir, ignore_errors=True)
    except Exception as e:
        logger.warning("Could not delete template directory: %s", e)

    return {"message": "Đã xóa video mẫu thành công.", "template_id": template_id}
