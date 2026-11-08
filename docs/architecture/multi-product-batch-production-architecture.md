# Multi-Product Batch Production & Final Video Library Architecture

## 1. System Overview

The Multi-Product Batch Production and Final Video Library system coordinates the automated creation of multiple `Final Product Video` MP4 assets within a project, using a single verified `Personalized Base Video` as an immutable source asset and multiple distinct `Product Asset` entities as clothing replacement inputs.

All processing is executed **100% locally** on the Backend server via PyTorch, ONNX Runtime, OpenCV, and FFmpeg. **Zero external cloud AI video/image APIs are used.**

```
+-----------------------------------------------------------------------------------+
|                            TrendMotion Studio Project                             |
|                                                                                   |
|  +------------------------------+     +----------------------------------------+  |
|  |   Personalized Base Video    |     |             Product Assets             |  |
|  | (Model Profile + Video Tmpl) |     | (Shirts, Cardigans, Jackets, Dresses)  |  |
|  +--------------+---------------+     +-------------------+--------------------+  |
+-----------------|-----------------------------------------|-----------------------+
                  |                                         |
                  v                                         v
+-----------------------------------------------------------------------------------+
|                             Batch Production Workspace                            |
|  1. Multi-product selection with eligibility validation                           |
|  2. Batch Pre-flight Check (garment slot compatibility, view angles, Truth Sheet) |
|  3. Batch Review & Confirmation with Idempotency Key                              |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                     Batch Production Orchestrator (Backend)                       |
|                                                                                   |
|  +-----------------------+     +---------------------+     +-------------------+  |
|  | Batch Group Entity    |     | GPU Resource Queue  |     | State Persistence |  |
|  | (Group ID, Counters)  |     | (Concurrency = 1)   |     | (JSON DB Storage) |  |
|  +-----------+-----------+     +----------+----------+     +-------------------+  |
+--------------|----------------------------|---------------------------------------+
               |                            |
               | (Dispatches Child Jobs)    | (Sequential Execution)
               v                            v
+-----------------------------------------------------------------------------------+
|               Prompt 09 Garment Replacement Engine (Local Execution)              |
|                                                                                   |
|  [Frame Extraction] -> [Skin/Garment Masking] -> [Tracking & Occlusion Re-layer]  |
|  -> [Structure Anchors (6 buttons, collar, pocket)] -> [Temporal Smoothing EMA]   |
|  -> [Rendering H.264 MP4 + Contact Sheet 8 Frames + Side-by-Side Video]           |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                      Final Video Library (Project Scoped)                         |
|                                                                                   |
|  - Grid & Table views with real poster frames and metadata                        |
|  - Search, Filter (Batch, Quality Status), Sort, Pagination                       |
|  - Synchronized Video Comparison Player (Base Video vs Final Product Video)       |
|  - Single MP4 Download (Sanitized Filenames) & Batch ZIP Export with Manifest     |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Architectural Guarantees

1. **Input Immutability:**
   - The `Personalized Base Video` is treated as read-only.
   - Intermediate frames and final outputs of different child jobs are strictly isolated in unique job storage directories (`data/storage/users/{user_id}/projects/{project_id}/replacements/{job_id}/`).
2. **Context Isolation:**
   - When switching from Product A to Product B, the worker completely purges intermediate masks, reference textures, and cached structures. Product A features never leak into Product B.
3. **Hardware-Aware Queue Policy:**
   - Video generation and compositing require significant CPU/GPU memory. The default execution concurrency is set to `1` (sequential queue), preventing VRAM crashes while guaranteeing system stability.
4. **Fault Tolerance & Partial Completion:**
   - If Job 1 succeeds and Job 2 fails (e.g., unsupported garment slot or missing back view photo), Job 3 still runs.
   - The batch transitions to `PARTIALLY_COMPLETED` rather than failing entirely.
   - Individual failed jobs can be retried without re-running completed jobs.
5. **State Recovery:**
   - Both `BatchProductionGroup` and `ReplacementJob` states are persisted immediately to disk (`batch_production_groups.json` and `replacement_jobs.json`), enabling instant recovery if the server or worker restarts.
