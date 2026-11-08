import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductResearchPage } from './index';
import { researchService } from './services/research.service';
import { studioService } from '@/features/studio/services/studio.service';
import {
  MarketplaceProductItem,
  TikTokShopConnectionPublic,
  FashionCategory,
  SearchHistoryItem,
} from './types/research.types';
import { ProjectSummary } from '@/features/studio/types/studio.types';

// Mock Services
vi.mock('./services/research.service');
vi.mock('@/features/studio/services/studio.service');

const mockConnection: TikTokShopConnectionPublic = {
  status: 'CONNECTED',
  account_id: 'tts-creator-888',
  account_name: 'Fashion Creator Store VN',
  market_region: 'VN',
  connected_at: '2026-11-01T00:00:00Z',
  token_expires_at: '2026-12-01T00:00:00Z',
  scopes: ['affiliate.product.read', 'creator.affiliate.manage'],
  setup_guidance: null,
};

const mockCategories: FashionCategory[] = [
  {
    category_id: 'WOMEN_FASHION',
    name: 'Thời trang nữ',
    description: 'Trang phục và phong cách nữ',
    icon_name: 'Shirt',
    subcategories: [
      {
        subcategory_id: 'dresses',
        name: 'Váy & Đầm thời trang',
        category_id: 'WOMEN_FASHION',
        keywords: ['đầm', 'váy', 'dress'],
      },
      {
        subcategory_id: 'shirts_blouses',
        name: 'Áo sơ mi & Blouse',
        category_id: 'WOMEN_FASHION',
        keywords: ['áo sơ mi', 'blouse'],
      },
    ],
  },
];

const mockProductItem: MarketplaceProductItem = {
  product_id: 'prod-dress-101',
  source: 'TIKTOK_SHOP',
  source_product_id: '172948291029',
  source_shop_id: 'shop-linh-boutique',
  shop_name: 'Linh Boutique Studio',
  title: 'Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng',
  description: 'Đầm lụa sang trọng chất liệu lụa satin cao cấp',
  primary_image_url: 'https://example.com/dress.jpg',
  image_gallery: ['https://example.com/dress.jpg', 'https://example.com/dress-detail.jpg'],
  product_url: 'https://shop.tiktok.com/view/product/172948291029',
  region: 'VN',
  internal_category: 'WOMEN_FASHION',
  internal_subcategory: 'dresses',
  pricing: {
    original_price: 450000,
    current_price: 320000,
    currency: 'VND',
    discount_percentage: 29,
    display_price: '320.000 ₫',
  },
  commission: {
    rate_percent: 15.0,
    estimated_amount: 48000,
    currency: 'VND',
    is_estimated: true,
    commission_type: 'PERCENTAGE',
    calculation_basis: 'Giá bán 320.000 ₫ × 15.0%',
    has_commission_data: true,
  },
  sales: {
    units_sold_30d: 420,
    gmv_30d: 134400000,
    is_available: true,
  },
  content_performance: {
    video_count: 35,
    impressions: 125000,
    ctr_percent: 4.8,
    is_available: true,
  },
  collaboration_status: 'OPEN_COLLABORATION',
  opportunity_score: {
    score: 83,
    grade: 'A',
    status: 'CALCULATED',
    breakdown: {
      commission_score: 26.3,
      sales_score: 25.2,
      price_accessibility_score: 16.1,
      collaboration_score: 15.0,
    },
    missing_fields: [],
    explanation: 'Điểm = 26.3 (Hoa hồng) + 25.2 (Tốc độ bán) + 16.1 (Mức giá phù hợp) + 15.0 (Hợp tác mở)',
  },
  variants: [],
  updated_at: '2026-11-08T10:00:00Z',
  is_cached: false,
};

const mockProductItem2: MarketplaceProductItem = {
  product_id: 'prod-blouse-202',
  source: 'TIKTOK_SHOP',
  source_product_id: '172948291030',
  source_shop_id: 'shop-linh-boutique',
  shop_name: 'Linh Boutique Studio',
  title: 'Áo sơ mi lụa công sở cao cấp tôn dáng',
  description: 'Áo sơ mi thiết kế tinh tế thanh lịch',
  primary_image_url: 'https://example.com/blouse.jpg',
  image_gallery: ['https://example.com/blouse.jpg'],
  product_url: 'https://shop.tiktok.com/view/product/172948291030',
  region: 'VN',
  internal_category: 'WOMEN_FASHION',
  internal_subcategory: 'shirts_blouses',
  pricing: {
    original_price: 300000,
    current_price: 250000,
    currency: 'VND',
    discount_percentage: 17,
    display_price: '250.000 ₫',
  },
  commission: {
    rate_percent: 12.0,
    estimated_amount: 30000,
    currency: 'VND',
    is_estimated: true,
    commission_type: 'PERCENTAGE',
    calculation_basis: 'Giá bán 250.000 ₫ × 12.0%',
    has_commission_data: true,
  },
  sales: {
    units_sold_30d: 180,
    gmv_30d: 45000000,
    is_available: true,
  },
  content_performance: {
    video_count: 12,
    impressions: 45000,
    ctr_percent: 3.2,
    is_available: true,
  },
  collaboration_status: 'OPEN_COLLABORATION',
  opportunity_score: {
    score: 68,
    grade: 'B',
    status: 'CALCULATED',
    breakdown: {
      commission_score: 21.0,
      sales_score: 10.8,
      price_accessibility_score: 18.2,
      collaboration_score: 15.0,
    },
    missing_fields: [],
    explanation: 'Điểm = 21.0 + 10.8 + 18.2 + 15.0',
  },
  variants: [],
  updated_at: '2026-11-08T10:00:00Z',
  is_cached: false,
};

const mockProjects: ProjectSummary[] = [
  {
    projectId: 'proj-001',
    name: 'Chiến dịch Thu Đông Phương Linh',
    modelId: 'mod-linh-001',
    modelName: 'Phương Linh AI Lookbook',
    templateId: 'vtp-001',
    templateTitle: 'Năng động dạo phố hè',
    currentGenerationId: 'gen-001',
    currentGenerationStatus: 'COMPLETED',
    outputVideoUrl: '/media/personalized/video_001.mp4',
    totalGenerations: 1,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-05T00:00:00Z',
  },
];

const mockHistory: SearchHistoryItem[] = [
  {
    id: 'hist-1',
    query: 'đầm lụa dự tiệc',
    result_count: 14,
    created_at: '2026-11-08T09:00:00Z',
  },
];

describe('ProductResearch Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(researchService.getTikTokShopStatus).mockResolvedValue(mockConnection);
    vi.mocked(researchService.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(researchService.getSearchHistory).mockResolvedValue(mockHistory);
    vi.mocked(researchService.searchProducts).mockResolvedValue({
      items: [mockProductItem, mockProductItem2],
      total: 2,
      page: 1,
      page_size: 20,
      total_pages: 1,
      connection_status: 'CONNECTED',
    });
    vi.mocked(researchService.getProductDetail).mockResolvedValue(mockProductItem);
    vi.mocked(researchService.handoffToStudio).mockResolvedValue({
      status: 'SUCCESS',
      product_id: mockProductItem.product_id,
      product_url: mockProductItem.product_url,
      project_id: 'proj-001',
      redirect_url: '/studio/proj-001/replacement',
      action_required: 'EXTRACT_PRODUCT_ASSET',
      notes: 'Chuyển thành công sang Studio',
    });
    vi.mocked(studioService.listProjects).mockResolvedValue(mockProjects);
  });

  it('renders page header, connection banner, and search bar correctly', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    // Page title
    expect(screen.getByText('Nghiên cứu sản phẩm TikTok Shop')).toBeInTheDocument();

    // Connection Banner
    await waitFor(() => {
      expect(screen.getByText(/Đã kết nối: Fashion Creator Store VN/i)).toBeInTheDocument();
    });

    // Search bar
    expect(
      screen.getByPlaceholderText(/Tìm kiếm sản phẩm theo tên, danh mục, từ khóa/i)
    ).toBeInTheDocument();
  });

  it('displays products in grid view with opportunity score, price, and commission', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng')).toBeInTheDocument();
      expect(screen.getByText('Áo sơ mi lụa công sở cao cấp tôn dáng')).toBeInTheDocument();
    });

    // Check price and commission display
    expect(screen.getByText(/320\.000/i)).toBeInTheDocument();
    expect(screen.getAllByText(/15%/i)[0]).toBeInTheDocument();

    // Opportunity score badges
    expect(screen.getByText(/83đ \(Hạng A\)/i)).toBeInTheDocument();
    expect(screen.getByText(/68đ \(Hạng B\)/i)).toBeInTheDocument();
  });

  it('switches between grid view and table view', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng')).toBeInTheDocument();
    });

    // Switch to table view
    const tableButton = screen.getByTitle('Dạng bảng chi tiết');
    fireEvent.click(tableButton);

    // Check table headers
    expect(screen.getByText('Sản phẩm & Cửa hàng')).toBeInTheDocument();
    expect(screen.getByText('Hoa hồng')).toBeInTheDocument();
    expect(screen.getByText('Điểm cơ hội')).toBeInTheDocument();

    // Switch back to grid view
    const gridButton = screen.getByTitle('Dạng lưới thẻ ảnh');
    fireEvent.click(gridButton);
  });

  it('opens product detail modal and displays explainable opportunity score breakdown', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng')).toBeInTheDocument();
    });

    // Click "Chi tiết" button on the first product card
    const detailButtons = screen.getAllByTitle('Xem chi tiết sản phẩm');
    fireEvent.click(detailButtons[0]);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Chi tiết nghiên cứu sản phẩm TikTok Shop/i)).toBeInTheDocument();
    });

    // Check opportunity score breakdown and explainable formula
    expect(screen.getByText(/Đánh giá tiềm năng \(Opportunity Score\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Điểm = 26.3 \(Hoa hồng\) \+ 25.2 \(Tốc độ bán\) \+ 16.1 \(Mức giá phù hợp\) \+ 15.0 \(Hợp tác mở\)/i
      )
    ).toBeInTheDocument();
  });

  it('allows comparing products and opening comparison modal', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng')).toBeInTheDocument();
    });

    // Toggle compare for both products
    const compareButtons = screen.getAllByTitle('Chọn để so sánh');
    fireEvent.click(compareButtons[0]);
    fireEvent.click(compareButtons[1]);

    // Comparison count button in header
    const compareActionButton = screen.getByRole('button', { name: /Đối chiếu \(2\/4\)/i });
    expect(compareActionButton).toBeInTheDocument();
    fireEvent.click(compareActionButton);

    // Modal appears
    await waitFor(() => {
      expect(screen.getByText(/Đối chiếu so sánh 2 sản phẩm thời trang/i)).toBeInTheDocument();
    });

    // Both products appear in comparison table
    expect(screen.getByText(/Chỉ số đối chiếu/i)).toBeInTheDocument();
  });

  it('opens Studio Handoff modal and respects AGENTS.md base video check', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Đầm lụa dự tiệc cổ chữ V xẻ tà sang trọng')).toBeInTheDocument();
    });

    // Click "Vào Studio" button
    const handoffButtons = screen.getAllByRole('button', { name: /Vào Studio/i });
    fireEvent.click(handoffButtons[0]);

    // Handoff modal opens
    await waitFor(() => {
      expect(screen.getByText(/Đưa sản phẩm vào Fashion Studio/i)).toBeInTheDocument();
      expect(screen.getByText('Chiến dịch Thu Đông Phương Linh')).toBeInTheDocument();
      expect(screen.getByText(/Base Video Sẵn sàng/i)).toBeInTheDocument();
    });

    // Submit handoff
    const submitHandoffButton = screen.getByRole('button', { name: /Tiếp tục vào Studio/i });
    fireEvent.click(submitHandoffButton);

    await waitFor(() => {
      expect(researchService.handoffToStudio).toHaveBeenCalledWith(
        mockProductItem.product_id,
        'proj-001'
      );
    });
  });

  it('opens search history drawer and displays past queries', async () => {
    render(
      <MemoryRouter>
        <ProductResearchPage />
      </MemoryRouter>
    );

    const historyButton = screen.getByTitle('Xem lịch sử tìm kiếm');
    fireEvent.click(historyButton);

    await waitFor(() => {
      expect(screen.getByText('đầm lụa dự tiệc')).toBeInTheDocument();
      expect(screen.getByText(/14 kết quả/i)).toBeInTheDocument();
    });
  });
});
