/**
 * RETINAGUARD AI — APPLICATION CLIENT LOGIC
 * Modular, production-grade frontend integration for Diabetic Retinopathy Screening.
 * Connects directly to Flask backend (/analyze, /health) without hardcoded results.
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================================
    // 1. STATE & DOM ELEMENT CACHE
    // =========================================================================
    const state = {
        currentFile: null,
        currentImageUrl: null,
        lastResultData: null,
        isScanning: false,
        scanStepInterval: null
    };

    // DOM Elements
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const systemStatusPill = document.getElementById('systemStatusPill');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadView = document.getElementById('uploadView');
    const previewStage = document.getElementById('previewStage');
    const imagePreview = document.getElementById('imagePreview');
    const previewFilename = document.getElementById('previewFilename');
    const previewDimensions = document.getElementById('previewDimensions');
    const previewFilesize = document.getElementById('previewFilesize');
    const previewFormat = document.getElementById('previewFormat');
    const resetBtn = document.getElementById('resetBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // Samples
    const btnSampleNormal = document.getElementById('btnSampleNormal');
    const btnSampleDR = document.getElementById('btnSampleDR');

    // Loading State
    const loadingState = document.getElementById('loadingState');
    const scanningImage = document.getElementById('scanningImage');

    // Results Dashboard
    const resultsDashboard = document.getElementById('resultsDashboard');
    const predictedGrade = document.getElementById('predictedGrade');
    const gradeDescription = document.getElementById('gradeDescription');
    const confidencePercent = document.getElementById('confidencePercent');
    const gaugeCircleFill = document.getElementById('gaugeCircleFill');
    const resultTimestamp = document.getElementById('resultTimestamp');

    // Subpanels
    const probDistributionList = document.getElementById('probDistributionList');
    const qualityStatusChip = document.getElementById('qualityStatusChip');
    const qualityScoreText = document.getElementById('qualityScoreText');
    const qualityScoreBar = document.getElementById('qualityScoreBar');
    const metricBrightness = document.getElementById('metricBrightness');
    const barBrightness = document.getElementById('barBrightness');
    const metricContrast = document.getElementById('metricContrast');
    const barContrast = document.getElementById('barContrast');
    const metricFov = document.getElementById('metricFov');
    const barFov = document.getElementById('barFov');
    const metricBlackBg = document.getElementById('metricBlackBg');
    const barBlackBg = document.getElementById('barBlackBg');
    const qualityFlagsContainer = document.getElementById('qualityFlagsContainer');

    // Model & Grad-CAM
    const specModelName = document.getElementById('specModelName');
    const specArchitecture = document.getElementById('specArchitecture');
    const specInputSize = document.getElementById('specInputSize');
    const gradcamLayerBadge = document.getElementById('gradcamLayerBadge');
    const gradcamMethod = document.getElementById('gradcamMethod');
    const gradcamTargetLayer = document.getElementById('gradcamTargetLayer');
    const gradcamNote = document.getElementById('gradcamNote');

    // Retinal Inspector
    const inspectorImage = document.getElementById('inspectorImage');
    const inspectorReticle = document.getElementById('inspectorReticle');
    const btnToggleReticle = document.getElementById('btnToggleReticle');
    const filterButtons = document.querySelectorAll('.btn-filter[data-filter]');

    // Dashboard Toolbar Buttons
    const btnNewScreening = document.getElementById('btnNewScreening');
    const btnPrintReport = document.getElementById('btnPrintReport');
    const btnCopyJson = document.getElementById('btnCopyJson');

    // =========================================================================
    // 2. CLINICAL STAGE DESCRIPTIONS (ICDR ALIGNED)
    // =========================================================================
    const STAGE_METADATA = {
        'No DR': {
            cssClass: 'grade-no-dr',
            color: '#10b981',
            description: 'No apparent diabetic retinopathy detected. Retinal microvasculature, optic disc margin, and foveal reflex appear clinically unremarkable. Standard annual screening recommended.'
        },
        'Mild': {
            cssClass: 'grade-mild',
            color: '#eab308',
            description: 'Mild Non-Proliferative Diabetic Retinopathy (NPDR). Microaneurysms detected in capillary networks. Metabolic optimization and clinical ophthalmology re-evaluation within 6 to 12 months advised.'
        },
        'Moderate': {
            cssClass: 'grade-moderate',
            color: '#f97316',
            description: 'Moderate Non-Proliferative Diabetic Retinopathy (NPDR). More than microaneurysms detected, with probable dot/blot intraretinal hemorrhages and hard lipid exudates. Referral for formal ophthalmologic assessment recommended.'
        },
        'Severe': {
            cssClass: 'grade-severe',
            color: '#ef4444',
            description: 'Severe Non-Proliferative Diabetic Retinopathy (NPDR). Substantial intraretinal hemorrhages, venous beading, or microvascular abnormalities identified. Urgent referral to a retina specialist recommended to prevent visual impairment.'
        },
        'Proliferative': {
            cssClass: 'grade-proliferative',
            color: '#e11d48',
            description: 'Proliferative Diabetic Retinopathy (PDR). High-risk stage with hallmark neovascularization or vitreous/preretinal hemorrhage. Immediate ophthalmic intervention (e.g., panretinal photocoagulation or anti-VEGF therapy) required.'
        }
    };

    // =========================================================================
    // 3. TOAST NOTIFICATION UTILITY
    // =========================================================================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconSvg = '';
        if (type === 'error') {
            iconSvg = `<svg viewBox="0 0 20 20" fill="#f87171" width="18" height="18"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>`;
        } else if (type === 'success') {
            iconSvg = `<svg viewBox="0 0 20 20" fill="#34d399" width="18" height="18"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`;
        } else {
            iconSvg = `<svg viewBox="0 0 20 20" fill="#60a5fa" width="18" height="18"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // =========================================================================
    // 4. BACKEND HEALTH CHECK
    // =========================================================================
    async function checkBackendHealth() {
        try {
            const res = await fetch('/health', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'healthy') {
                    systemStatusPill.innerHTML = `
                        <span class="status-indicator online"></span>
                        <span class="status-text">${data.model || 'B0_CHAMPION'} ONLINE</span>
                    `;
                }
            }
        } catch (err) {
            console.warn('Backend health poll error:', err);
            systemStatusPill.innerHTML = `
                <span class="status-indicator" style="background:#f59e0b"></span>
                <span class="status-text" style="color:#fbbf24">CONNECTING...</span>
            `;
        }
    }
    checkBackendHealth();
    setInterval(checkBackendHealth, 45000);

    // =========================================================================
    // 5. DRAG & DROP AND FILE INTAKE
    // =========================================================================
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evtName => {
        dropZone.addEventListener(evtName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(evtName => {
        dropZone.addEventListener(evtName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(evtName => {
        dropZone.addEventListener(evtName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files.length > 0) {
            processSelectedFile(dt.files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
            processSelectedFile(this.files[0]);
        }
    });

    function processSelectedFile(file) {
        if (!file) return;

        // Validation
        const validExtensions = ['.jpg', '.jpeg', '.png'];
        const fileName = file.name.toLowerCase();
        const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
        const isValidMime = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);

        if (!hasValidExt && !isValidMime) {
            showToast('Unsupported file format. Please provide a PNG or JPEG retinal fundus image.', 'error');
            return;
        }

        const maxBytes = 10 * 1024 * 1024; // 10MB
        if (file.size > maxBytes) {
            showToast('File exceeds 10 MB limit. Please select a smaller fundus image.', 'error');
            return;
        }

        state.currentFile = file;

        // Generate data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            state.currentImageUrl = e.target.result;

            // Load into Preview
            imagePreview.src = state.currentImageUrl;
            scanningImage.src = state.currentImageUrl;
            inspectorImage.src = state.currentImageUrl;

            // Metadata Readout
            previewFilename.textContent = file.name;
            previewFilesize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
            previewFormat.textContent = file.type ? file.type.toUpperCase().replace('IMAGE/', '') + ' / RGB' : 'JPEG / RGB';

            const tempImg = new Image();
            tempImg.onload = () => {
                previewDimensions.textContent = `${tempImg.naturalWidth} × ${tempImg.naturalHeight} px`;
            };
            tempImg.src = state.currentImageUrl;

            // Display preview stage
            dropZone.classList.add('hidden');
            const sampleContainer = document.querySelector('.sample-selector-container');
            if (sampleContainer) sampleContainer.classList.add('hidden');
            previewStage.classList.remove('hidden');

            showToast(`Loaded ${file.name} successfully`, 'success');
        };
        reader.readAsDataURL(file);
    }

    // =========================================================================
    // 6. QUICK TEST SAMPLES (ONE-CLICK DEMO LOAD)
    // =========================================================================
    async function loadSampleImage(url, filename) {
        try {
            showToast(`Fetching ${filename}...`, 'info');
            const res = await fetch(url);
            if (!res.ok) throw new Error('Sample image could not be loaded');
            const blob = await res.blob();
            const file = new File([blob], filename, { type: 'image/jpeg' });
            processSelectedFile(file);
        } catch (err) {
            console.error(err);
            showToast('Failed to load sample retinal image', 'error');
        }
    }

    if (btnSampleNormal) {
        btnSampleNormal.addEventListener('click', (e) => {
            e.stopPropagation();
            loadSampleImage('/static/samples/sample_normal.jpg', 'sample_fundus_normal.jpg');
        });
    }

    if (btnSampleDR) {
        btnSampleDR.addEventListener('click', (e) => {
            e.stopPropagation();
            loadSampleImage('/static/samples/sample_dr.jpg', 'sample_fundus_retinopathy.jpg');
        });
    }

    // =========================================================================
    // 7. REMOVE / RESET ACTION
    // =========================================================================
    function resetUploadState() {
        state.currentFile = null;
        state.currentImageUrl = null;
        fileInput.value = '';

        previewStage.classList.add('hidden');
        dropZone.classList.remove('hidden');
        const sampleContainer = document.querySelector('.sample-selector-container');
        if (sampleContainer) sampleContainer.classList.remove('hidden');

        uploadView.classList.remove('hidden');
        loadingState.classList.add('hidden');
        resultsDashboard.classList.add('hidden');
    }

    resetBtn.addEventListener('click', resetUploadState);

    // =========================================================================
    // 8. SCANNING ANIMATION & EXECUTE ANALYSIS
    // =========================================================================
    analyzeBtn.addEventListener('click', async () => {
        if (!state.currentFile) {
            showToast('Please select or upload a retinal fundus photograph first.', 'error');
            return;
        }

        // Switch to Loading View
        uploadView.classList.add('hidden');
        resultsDashboard.classList.add('hidden');
        loadingState.classList.remove('hidden');

        // Reset and trigger step tracker animation
        startScanStepAnimation();

        const formData = new FormData();
        formData.append('image', state.currentFile);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Server returned an error during analysis.');
            }

            // Ensure scanning animation stays smooth for at least 800ms before showing result
            setTimeout(() => {
                stopScanStepAnimation();
                state.lastResultData = data;
                renderResults(data);
                showToast('Screening analysis completed successfully', 'success');
            }, 800);

        } catch (error) {
            stopScanStepAnimation();
            loadingState.classList.add('hidden');
            uploadView.classList.remove('hidden');
            showToast(`Analysis Error: ${error.message}`, 'error');
        }
    });

    function startScanStepAnimation() {
        const steps = [
            document.getElementById('scanStep1'),
            document.getElementById('scanStep2'),
            document.getElementById('scanStep3'),
            document.getElementById('scanStep4')
        ];

        steps.forEach(s => {
            s.classList.remove('active', 'done');
        });
        if (steps[0]) steps[0].classList.add('active');

        let currentIdx = 0;
        state.scanStepInterval = setInterval(() => {
            if (currentIdx < steps.length - 1) {
                steps[currentIdx].classList.remove('active');
                steps[currentIdx].classList.add('done');
                currentIdx++;
                steps[currentIdx].classList.add('active');
            }
        }, 500);
    }

    function stopScanStepAnimation() {
        if (state.scanStepInterval) {
            clearInterval(state.scanStepInterval);
            state.scanStepInterval = null;
        }
    }

    // =========================================================================
    // 9. RENDER RESULTS DASHBOARD (WITH REAL BACKEND DATA)
    // =========================================================================
    function renderResults(data) {
        loadingState.classList.add('hidden');
        resultsDashboard.classList.remove('hidden');

        const { prediction, quality, model, gradcam } = data;

        // -------------------------------------------------------------
        // A. Primary Verdict Banner
        // -------------------------------------------------------------
        const grade = prediction.grade || 'No DR';
        const conf = prediction.confidence || 0.0;
        const confPct = (conf * 100).toFixed(1);

        predictedGrade.textContent = grade;
        
        // Remove old grade classes
        predictedGrade.className = 'result-grade-title';
        const meta = STAGE_METADATA[grade] || STAGE_METADATA['No DR'];
        predictedGrade.classList.add(meta.cssClass);

        gradeDescription.textContent = meta.description;
        confidencePercent.textContent = `${confPct}%`;

        // Circular SVG gauge update
        // Circumference for r=52 is 2 * PI * 52 ≈ 326.7
        const totalLength = 326.7;
        const offset = totalLength - (conf * totalLength);
        gaugeCircleFill.style.strokeDashoffset = offset;
        gaugeCircleFill.style.stroke = meta.color;

        // Set Timestamp
        const now = new Date();
        resultTimestamp.textContent = `${now.toISOString().split('T')[0]} • ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

        // -------------------------------------------------------------
        // B. 5-Class Probability Distribution
        // -------------------------------------------------------------
        const classNames = (model && model.classes) ? model.classes : ['No DR', 'Mild', 'Moderate', 'Severe', 'Proliferative'];
        const probs = prediction.probabilities || [0, 0, 0, 0, 0];

        probDistributionList.innerHTML = '';
        probs.forEach((probVal, idx) => {
            const className = classNames[idx] || `Class ${idx}`;
            const pct = (probVal * 100).toFixed(1);
            const isPredicted = (idx === prediction.class_index);

            // Severity color progression
            const classColors = ['#10b981', '#eab308', '#f97316', '#ef4444', '#e11d48'];
            const barColor = classColors[idx] || '#ff3b5c';

            const row = document.createElement('div');
            row.className = `prob-row ${isPredicted ? 'predicted-class' : ''}`;
            row.innerHTML = `
                <div class="prob-meta-line">
                    <span class="prob-class-name">${className}</span>
                    <span class="prob-pct-val">${pct}%</span>
                </div>
                <div class="prob-track">
                    <div class="prob-fill" style="width: 0%; background: ${barColor}"></div>
                </div>
            `;
            probDistributionList.appendChild(row);

            // Animate bar fill
            setTimeout(() => {
                const fill = row.querySelector('.prob-fill');
                if (fill) fill.style.width = `${pct}%`;
            }, 60 * idx);
        });

        // -------------------------------------------------------------
        // C. Image Quality Assessment
        // -------------------------------------------------------------
        if (quality) {
            const status = (quality.status || 'acceptable').toLowerCase();
            qualityStatusChip.textContent = status.toUpperCase();
            qualityStatusChip.className = `status-chip ${status}`;

            const qScore = quality.score !== undefined ? quality.score : 1.0;
            const qScorePct = Math.round(qScore * 100);
            qualityScoreText.textContent = `${qScorePct}%`;
            qualityScoreBar.style.width = `${qScorePct}%`;

            // Numeric metrics
            metricBrightness.textContent = (quality.brightness !== undefined) ? quality.brightness.toFixed(2) : '0.00';
            barBrightness.style.width = `${Math.min((quality.brightness || 0) * 100, 100)}%`;

            metricContrast.textContent = (quality.contrast !== undefined) ? quality.contrast.toFixed(2) : '0.00';
            barContrast.style.width = `${Math.min((quality.contrast || 0) * 100, 100)}%`;

            metricFov.textContent = (quality.fov_fraction !== undefined) ? quality.fov_fraction.toFixed(2) : '0.00';
            barFov.style.width = `${Math.min((quality.fov_fraction || 0) * 100, 100)}%`;

            metricBlackBg.textContent = (quality.black_background_fraction !== undefined) ? quality.black_background_fraction.toFixed(2) : '0.00';
            barBlackBg.style.width = `${Math.min((quality.black_background_fraction || 0) * 100, 100)}%`;

            // Quality Flags
            qualityFlagsContainer.innerHTML = '';
            if (quality.flags && quality.flags.length > 0) {
                quality.flags.forEach(flag => {
                    const chip = document.createElement('span');
                    chip.className = 'flag-chip';
                    chip.textContent = flag.replace(/_/g, ' ').toUpperCase();
                    qualityFlagsContainer.appendChild(chip);
                });
            } else {
                const chip = document.createElement('span');
                chip.className = 'flag-chip clean';
                chip.textContent = 'OPTIMAL CAPTURE — NO FLAGS';
                qualityFlagsContainer.appendChild(chip);
            }
        }

        // -------------------------------------------------------------
        // D. Model Information Specs
        // -------------------------------------------------------------
        if (model) {
            specModelName.textContent = model.name || 'B0_CLASSWEIGHTED_FINETUNED_224';
            specArchitecture.textContent = model.architecture || 'EfficientNetB0';
            specInputSize.textContent = model.input_size ? `${model.input_size} px` : '224 × 224 px';
        }

        // -------------------------------------------------------------
        // E. AI Explainability Metadata & Retinal Inspector
        // -------------------------------------------------------------
        if (gradcam) {
            gradcamTargetLayer.textContent = gradcam.target_layer || 'top_conv';
            gradcamLayerBadge.textContent = `LAYER // ${(gradcam.target_layer || 'TOP_CONV').toUpperCase()}`;
            gradcamMethod.textContent = gradcam.method || 'Grad-CAM';
            if (gradcam.note) {
                gradcamNote.textContent = gradcam.note;
            }
        }

        // Ensure inspector viewport displays current analyzed image
        if (state.currentImageUrl) {
            inspectorImage.src = state.currentImageUrl;
        }

        // Smoothly scroll down so the results are in view
        resultsDashboard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // =========================================================================
    // 10. RETINAL INSPECTOR INTERACTIVE FILTERS
    // =========================================================================
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            filterButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;
            inspectorImage.className = 'inspector-img';
            if (filter === 'contrast') {
                inspectorImage.classList.add('filter-contrast');
            } else if (filter === 'redfree') {
                inspectorImage.classList.add('filter-redfree');
            }
        });
    });

    btnToggleReticle.addEventListener('click', () => {
        btnToggleReticle.classList.toggle('active');
        inspectorReticle.classList.toggle('active');
    });

    // =========================================================================
    // 11. DASHBOARD ACTIONS (NEW SCREENING, PRINT, COPY JSON)
    // =========================================================================
    btnNewScreening.addEventListener('click', () => {
        resetUploadState();
        document.getElementById('screening').scrollIntoView({ behavior: 'smooth' });
    });

    btnPrintReport.addEventListener('click', () => {
        window.print();
    });

    btnCopyJson.addEventListener('click', async () => {
        if (!state.lastResultData) {
            showToast('No telemetry data to copy', 'error');
            return;
        }
        try {
            const formatted = JSON.stringify(state.lastResultData, null, 2);
            await navigator.clipboard.writeText(formatted);
            showToast('Screening Telemetry JSON copied to clipboard', 'success');
        } catch (err) {
            showToast('Clipboard access denied', 'error');
        }
    });

    // =========================================================================
    // 12. NAVIGATION & SMOOTH SCROLLING
    // =========================================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.pageYOffset + 120;

        sections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
                current = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Mobile nav toggle
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
        });

        // Close on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
            });
        });
    }

});
