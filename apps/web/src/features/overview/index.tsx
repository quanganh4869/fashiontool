import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/useToast';
import { overviewService } from '@/services/api/overview.service';
import { overviewDevFixture } from './fixtures/overview.fixture';
import {
  TimeRange,
  OverviewSummary,
  RecentProject,
  ActiveJob,
  CompletedVideo,
  SavedProduct,
} from '@/types/overview';

import { OverviewHeader } from './components/OverviewHeader';
import { OverviewSummaryStrip } from './components/OverviewSummaryStrip';
import { RecentProjectsSection } from './components/RecentProjectsSection';
import { ActiveJobsSection } from './components/ActiveJobsSection';
import { CompletedVideosSection } from './components/CompletedVideosSection';
import { SavedProductsSection } from './components/SavedProductsSection';

export const OverviewPage: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected time range
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Development fixture mode (can be toggled in header or via ?preview=fixture)
  const [useFixture, setUseFixture] = useState<boolean>(() => {
    return searchParams.get('preview') === 'fixture';
  });

  // Independent state slices
  const [summary, setSummary] = useState<OverviewSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [projects, setProjects] = useState<RecentProject[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  const [completedVideos, setCompletedVideos] = useState<CompletedVideo[]>([]);
  const [isVideosLoading, setIsVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);

  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Ref to track component mount status for polling
  const isMountedRef = useRef(true);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Fetch Summary
  const fetchSummary = useCallback(async (range: TimeRange, fixtureMode: boolean) => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      if (fixtureMode) {
        // Return appropriate fixture for time range
        const data =
          range === '30d'
            ? overviewDevFixture.summary30d
            : range === '90d'
              ? overviewDevFixture.summary90d
              : overviewDevFixture.summary7d;
        setSummary(data);
      } else {
        const data = await overviewService.getSummary(range);
        setSummary(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setSummaryError(msg);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  // 2. Fetch Recent Projects
  const fetchProjects = useCallback(async (fixtureMode: boolean) => {
    setIsProjectsLoading(true);
    setProjectsError(null);
    try {
      if (fixtureMode) {
        setProjects(overviewDevFixture.recentProjects);
      } else {
        const data = await overviewService.getRecentProjects(5);
        setProjects(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setProjectsError(msg);
    } finally {
      setIsProjectsLoading(false);
    }
  }, []);

  // 3. Fetch Active Jobs
  const fetchActiveJobs = useCallback(async (fixtureMode: boolean, silent = false) => {
    if (!silent) setIsJobsLoading(true);
    setJobsError(null);
    try {
      if (fixtureMode) {
        setActiveJobs(overviewDevFixture.activeJobs);
      } else {
        const data = await overviewService.getActiveJobs();
        setActiveJobs(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setJobsError(msg);
    } finally {
      if (!silent) setIsJobsLoading(false);
    }
  }, []);

  // 4. Fetch Completed Videos
  const fetchCompletedVideos = useCallback(async (fixtureMode: boolean) => {
    setIsVideosLoading(true);
    setVideosError(null);
    try {
      if (fixtureMode) {
        setCompletedVideos(overviewDevFixture.completedVideos);
      } else {
        const data = await overviewService.getCompletedVideos(3);
        setCompletedVideos(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setVideosError(msg);
    } finally {
      setIsVideosLoading(false);
    }
  }, []);

  // 5. Fetch Saved Products
  const fetchSavedProducts = useCallback(async (fixtureMode: boolean) => {
    setIsProductsLoading(true);
    setProductsError(null);
    try {
      if (fixtureMode) {
        setSavedProducts(overviewDevFixture.savedProducts);
      } else {
        const data = await overviewService.getSavedProducts(4);
        setSavedProducts(data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setProductsError(msg);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Load all sections on mount or when fixture mode changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchSummary(timeRange, useFixture);
    fetchProjects(useFixture);
    fetchActiveJobs(useFixture);
    fetchCompletedVideos(useFixture);
    fetchSavedProducts(useFixture);

    return () => {
      isMountedRef.current = false;
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [timeRange, useFixture, fetchSummary, fetchProjects, fetchActiveJobs, fetchCompletedVideos, fetchSavedProducts]);

  // Polling for active jobs (stop when unmounted or no active jobs)
  useEffect(() => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }

    if (activeJobs.length > 0 && !useFixture) {
      pollingTimerRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchActiveJobs(false, true);
        }
      }, 8000);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [activeJobs.length, useFixture, fetchActiveJobs]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const results = await Promise.allSettled([
        fetchSummary(timeRange, useFixture),
        fetchProjects(useFixture),
        fetchActiveJobs(useFixture),
        fetchCompletedVideos(useFixture),
        fetchSavedProducts(useFixture),
      ]);

      const anySuccess = results.some((r) => r.status === 'fulfilled');
      if (anySuccess) {
        showToast('Đã cập nhật dữ liệu', 'success');
      } else {
        showToast('Không thể cập nhật một số dữ liệu', 'error');
      }
    } catch {
      showToast('Lỗi khi làm mới dữ liệu', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle fixture mode handler
  const handleToggleFixture = () => {
    const nextVal = !useFixture;
    setUseFixture(nextVal);
    if (nextVal) {
      searchParams.set('preview', 'fixture');
    } else {
      searchParams.delete('preview');
    }
    setSearchParams(searchParams, { replace: true });
  };

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* 1. Page Header */}
      <OverviewHeader
        timeRange={timeRange}
        onTimeRangeChange={(newRange) => {
          setTimeRange(newRange);
        }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        isFixtureActive={useFixture}
        onToggleFixture={handleToggleFixture}
      />

      {/* 2. Summary Metric Strip (4 metrics) */}
      <OverviewSummaryStrip
        summary={summary}
        isLoading={isSummaryLoading}
        error={summaryError}
        onRetry={() => fetchSummary(timeRange, useFixture)}
      />

      {/* 3. Primary Grid: Recent Projects (8 cols) & Active Jobs (4 cols) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-8">
          <RecentProjectsSection
            projects={projects}
            isLoading={isProjectsLoading}
            error={projectsError}
            onRetry={() => fetchProjects(useFixture)}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <ActiveJobsSection
            jobs={activeJobs}
            isLoading={isJobsLoading}
            error={jobsError}
            onRetry={() => fetchActiveJobs(useFixture)}
          />
        </div>
      </div>

      {/* 4. Secondary Grid: Completed Videos & Saved Products */}
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-7">
          <CompletedVideosSection
            videos={completedVideos}
            isLoading={isVideosLoading}
            error={videosError}
            onRetry={() => fetchCompletedVideos(useFixture)}
          />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <SavedProductsSection
            products={savedProducts}
            isLoading={isProductsLoading}
            error={productsError}
            onRetry={() => fetchSavedProducts(useFixture)}
          />
        </div>
      </div>
    </div>
  );
};
