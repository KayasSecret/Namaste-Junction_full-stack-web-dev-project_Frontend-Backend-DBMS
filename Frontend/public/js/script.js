(() => {
    "use strict";
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll(".needs-validation");
  
    // Loop over them and prevent submission
    Array.from(forms).forEach((form) => {
        form.addEventListener(
            "submit",
            (event) => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    // Show loading state on auth submit button when form is valid
                    const submitBtn = form.querySelector(".btn-auth-submit");
                    if (submitBtn) {
                        const loadingText = submitBtn.getAttribute("data-loading-text") || "Please wait...";
                        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>${loadingText}</span>`;
                        setTimeout(() => {
                            submitBtn.disabled = true;
                        }, 10);
                    }
                }

                form.classList.add("was-validated");
            },
            false
        );
    });

    // Password Show / Hide Toggle Functionality
    const pwToggles = document.querySelectorAll(".auth-pw-toggle");
    pwToggles.forEach((toggleBtn) => {
        toggleBtn.addEventListener("click", () => {
            const targetId = toggleBtn.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);
            const icon = toggleBtn.querySelector("i");
            if (!passwordInput) return;

            const isPassword = passwordInput.getAttribute("type") === "password";
            passwordInput.setAttribute("type", isPassword ? "text" : "password");
            toggleBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
            toggleBtn.setAttribute("aria-pressed", isPassword ? "true" : "false");

            if (icon) {
                icon.classList.toggle("fa-eye", !isPassword);
                icon.classList.toggle("fa-eye-slash", isPassword);
            }
        });
    });

    // Password Strength Meter on Signup Page
    const signupPasswordInput = document.querySelector("#password[data-strength-meter='true']");
    const strengthBars = document.querySelectorAll(".pw-bar");
    const strengthLabel = document.getElementById("pwStrengthLabel");

    if (signupPasswordInput && strengthBars.length === 4 && strengthLabel) {
        signupPasswordInput.addEventListener("input", () => {
            const val = signupPasswordInput.value;
            let score = 0;

            if (val.length >= 6) score++;
            if (val.length >= 10) score++;
            if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
            if (/\d/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

            const levels = [
                { text: "Enter at least 6 characters", cls: "", color: "#64748b" },
                { text: "Weak — add numbers or symbols", cls: "active-weak", color: "#ef4444" },
                { text: "Fair — mix uppercase & lowercase", cls: "active-fair", color: "#f59e0b" },
                { text: "Good — strong travel key!", cls: "active-good", color: "#3b82f6" },
                { text: "Strong — ready for takeoff!", cls: "active-strong", color: "#10b981" }
            ];

            const currentLevel = val.length === 0 ? levels[0] : levels[Math.max(1, score)];

            strengthBars.forEach((bar, idx) => {
                bar.className = "pw-bar";
                if (val.length > 0 && idx < Math.max(1, score)) {
                    bar.classList.add(currentLevel.cls);
                }
            });

            strengthLabel.textContent = currentLevel.text;
            strengthLabel.style.color = currentLevel.color;
        });
    }

    // Sticky Navbar Scroll Elevation & Active Link Highlighting
    const mainNavbar = document.getElementById("njMainNavbar");
    if (mainNavbar) {
        const handleScroll = () => {
            if (window.scrollY > 12) {
                mainNavbar.classList.add("nj-navbar-scrolled");
            } else {
                mainNavbar.classList.remove("nj-navbar-scrolled");
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();

        // Highlight active navigation item based on current pathname
        const currentPath = window.location.pathname;
        const navItems = mainNavbar.querySelectorAll("[data-nav-path]");
        navItems.forEach((item) => {
            if (item.getAttribute("data-nav-path") === currentPath) {
                item.classList.add("active-nav");
            }
        });
    }

    // Interactive Destination Search, Category Filter Tabs & Tax Toggle on /listings
    const searchInput = document.getElementById("njDestinationSearch");
    const searchForm = document.getElementById("njSearchForm");
    const listingLinks = document.querySelectorAll(".listing-link");
    const filterButtons = document.querySelectorAll("#filters .filter[data-filter-query]");
    const emptyState = document.getElementById("njEmptySearchState");
    const resetFiltersBtn = document.getElementById("njResetFiltersBtn");
    const visibleCountEl = document.getElementById("njVisibleCount");
    const taxSwitch = document.getElementById("flexSwitchCheckDefault");

    if (taxSwitch) {
        taxSwitch.addEventListener("change", () => {
            const taxInfos = document.getElementsByClassName("tax-info");
            for (const info of taxInfos) {
                info.style.display = taxSwitch.checked ? "inline-block" : "none";
            }
        });
    }

    const filterListingCards = (query) => {
        if (!listingLinks.length) return;
        const normalized = (query || "").trim().toLowerCase();
        let visibleCount = 0;

        listingLinks.forEach((link) => {
            const searchable = (link.getAttribute("data-search-text") || link.textContent || "").toLowerCase();
            const isMatch = !normalized || searchable.includes(normalized);
            const colWrapper = link.closest(".nj-listing-col") || link;
            colWrapper.style.display = isMatch ? "" : "none";
            if (isMatch) visibleCount++;
        });

        if (visibleCountEl) {
            visibleCountEl.textContent = String(visibleCount);
        }
        if (emptyState) {
            emptyState.hidden = visibleCount > 0;
        }
    };

    if (filterButtons.length > 0) {
        filterButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                filterButtons.forEach((b) => {
                    b.classList.remove("active");
                    b.setAttribute("aria-selected", "false");
                });
                btn.classList.add("active");
                btn.setAttribute("aria-selected", "true");

                const categoryQuery = btn.getAttribute("data-filter-query") || "";
                if (searchInput) {
                    searchInput.value = categoryQuery;
                }
                filterListingCards(categoryQuery);
            });
        });
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            filterButtons.forEach((b, idx) => {
                const isFirst = idx === 0;
                b.classList.toggle("active", isFirst);
                b.setAttribute("aria-selected", isFirst ? "true" : "false");
            });
            filterListingCards("");
        });
    }

    if (searchInput) {
        const params = new URLSearchParams(window.location.search);
        const initialQuery = params.get("q");
        if (initialQuery) {
            searchInput.value = initialQuery;
            filterListingCards(initialQuery);
        }

        if (listingLinks.length > 0) {
            searchInput.addEventListener("input", (e) => {
                filterListingCards(e.target.value);
            });

            if (searchForm) {
                searchForm.addEventListener("submit", (e) => {
                    if (window.location.pathname === "/listings") {
                        e.preventDefault();
                        filterListingCards(searchInput.value);
                    }
                });
            }
        }
    }

    // =========================================================================
    // 6. Live Star Rating Label Feedback (Listing Show Page)
    // =========================================================================
    const ratingLiveText = document.getElementById("njRatingLiveText");
    const ratingInputs = document.querySelectorAll('.starability-slot input[name="review[rating]"]');
    const ratingLabels = {
        "1": "1 Star — Poor",
        "2": "2 Stars — Fair",
        "3": "3 Stars — Good",
        "4": "4 Stars — Very Good",
        "5": "5 Stars — Exceptional"
    };

    if (ratingLiveText && ratingInputs.length > 0) {
        ratingInputs.forEach((input) => {
            input.addEventListener("change", () => {
                if (input.checked && ratingLabels[input.value]) {
                    ratingLiveText.textContent = ratingLabels[input.value];
                    ratingLiveText.classList.add("is-selected");
                }
            });
        });
    }

    // =========================================================================
    // 7. Property Photo Gallery, Slideshow & Fullscreen Lightbox
    // =========================================================================
    const showPageEl = document.querySelector(".nj-show-page[data-gallery-images]");
    if (showPageEl) {
        let galleryImages = [];
        try {
            galleryImages = JSON.parse(showPageEl.getAttribute("data-gallery-images") || "[]");
        } catch (err) {
            galleryImages = [];
        }

        const totalPhotos = galleryImages.length;
        let currentSlideIndex = 0;

        // Main Stage Elements
        const mainStageImg = document.getElementById("njMainStageImg");
        const mainStageCounterText = document.getElementById("njMainStageCounterText");
        const mainStageCaption = document.getElementById("njMainStageCaption");
        const stagePrevBtn = document.getElementById("njStagePrevBtn");
        const stageNextBtn = document.getElementById("njStageNextBtn");
        const stageExpandBtn = document.getElementById("njStageExpandBtn");
        const stageThumbButtons = Array.from(document.querySelectorAll("#njStageThumbsList .nj-thumb-btn"));
        const stageThumbWraps = Array.from(document.querySelectorAll("#njStageThumbsList .nj-thumb-card-wrap"));

        // Lightbox Elements
        const lightboxModal = document.getElementById("njLightboxModal");
        const lightboxBackdrop = document.getElementById("njLightboxBackdrop");
        const lightboxCloseBtn = document.getElementById("njLightboxCloseBtn");
        const lightboxPrevBtn = document.getElementById("njLightboxPrevBtn");
        const lightboxNextBtn = document.getElementById("njLightboxNextBtn");
        const lightboxImg = document.getElementById("njLightboxImg");
        const lightboxCounter = document.getElementById("njLightboxCounter");
        const lightboxCaption = document.getElementById("njLightboxCaption");
        const lightboxThumbButtons = Array.from(document.querySelectorAll("#njLightboxThumbsList .nj-lightbox-thumb-btn"));

        // Lightbox Trigger Buttons
        const openLightboxBtn = document.getElementById("njOpenLightboxBtn");
        const headerOpenLightboxBtn = document.getElementById("njHeaderOpenLightboxBtn");
        const stripOpenLightboxBtn = document.getElementById("njStripOpenLightboxBtn");

        const normalizeIndex = (idx) => {
            if (totalPhotos <= 0) return 0;
            return ((idx % totalPhotos) + totalPhotos) % totalPhotos;
        };

        const updateSlideUI = (targetIndex, animateStage = true, animateLightbox = true) => {
            if (totalPhotos === 0) return;
            currentSlideIndex = normalizeIndex(targetIndex);
            const activePhoto = galleryImages[currentSlideIndex];
            const counterLabel = `${currentSlideIndex + 1} / ${totalPhotos}`;

            // Update Main Stage
            if (mainStageImg && activePhoto) {
                if (animateStage && mainStageImg.src !== activePhoto.url) {
                    mainStageImg.classList.add("is-transitioning");
                    setTimeout(() => {
                        mainStageImg.src = activePhoto.url;
                        mainStageImg.alt = activePhoto.caption || "Property photo";
                        mainStageImg.classList.remove("is-transitioning");
                    }, 120);
                } else {
                    mainStageImg.src = activePhoto.url;
                    mainStageImg.alt = activePhoto.caption || "Property photo";
                }
            }

            if (mainStageCounterText) {
                mainStageCounterText.textContent = counterLabel;
            }
            if (mainStageCaption && activePhoto && activePhoto.caption) {
                mainStageCaption.textContent = activePhoto.caption;
            }

            stageThumbButtons.forEach((btn, idx) => {
                const isActive = idx === currentSlideIndex;
                btn.classList.toggle("is-active", isActive);
                btn.setAttribute("aria-current", isActive ? "true" : "false");
            });
            stageThumbWraps.forEach((wrap, idx) => {
                wrap.classList.toggle("is-active", idx === currentSlideIndex);
            });

            // Update Lightbox
            if (lightboxImg && activePhoto) {
                if (animateLightbox && !lightboxModal?.hidden) {
                    lightboxImg.classList.add("is-transitioning");
                    setTimeout(() => {
                        lightboxImg.src = activePhoto.url;
                        lightboxImg.alt = activePhoto.caption || "Property photo";
                        lightboxImg.classList.remove("is-transitioning");
                    }, 120);
                } else {
                    lightboxImg.src = activePhoto.url;
                    lightboxImg.alt = activePhoto.caption || "Property photo";
                }
            }

            if (lightboxCounter) {
                lightboxCounter.textContent = counterLabel;
            }
            if (lightboxCaption && activePhoto) {
                lightboxCaption.textContent = activePhoto.caption || "";
            }

            lightboxThumbButtons.forEach((btn, idx) => {
                const isActive = idx === currentSlideIndex;
                btn.classList.toggle("is-active", isActive);
                if (isActive && !lightboxModal?.hidden) {
                    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                }
            });
        };

        const openLightbox = (startIndex = currentSlideIndex) => {
            if (!lightboxModal || totalPhotos === 0) return;
            updateSlideUI(startIndex, false, false);
            lightboxModal.hidden = false;
            document.body.style.overflow = "hidden";
            if (lightboxCloseBtn) {
                lightboxCloseBtn.focus();
            }
        };

        const closeLightbox = () => {
            if (!lightboxModal || lightboxModal.hidden) return;
            lightboxModal.hidden = true;
            document.body.style.overflow = "";
        };

        // Main stage click & keyboard Enter/Space opens fullscreen lightbox
        if (mainStageImg) {
            mainStageImg.addEventListener("click", () => openLightbox(currentSlideIndex));
            mainStageImg.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openLightbox(currentSlideIndex);
                }
            });
        }

        [stageExpandBtn, openLightboxBtn, headerOpenLightboxBtn, stripOpenLightboxBtn].forEach((btn) => {
            if (btn) {
                btn.addEventListener("click", () => openLightbox(currentSlideIndex));
            }
        });

        // Main Stage Prev / Next Controls
        if (stagePrevBtn) {
            stagePrevBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                updateSlideUI(currentSlideIndex - 1, true, false);
            });
        }
        if (stageNextBtn) {
            stageNextBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                updateSlideUI(currentSlideIndex + 1, true, false);
            });
        }

        // Main Stage Thumbnail Clicks
        stageThumbButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-slide-index") || "0", 10);
                updateSlideUI(idx, true, false);
            });
            btn.addEventListener("dblclick", () => {
                const idx = parseInt(btn.getAttribute("data-slide-index") || "0", 10);
                openLightbox(idx);
            });
        });

        // Lightbox Controls
        if (lightboxPrevBtn) {
            lightboxPrevBtn.addEventListener("click", () => {
                updateSlideUI(currentSlideIndex - 1, true, true);
            });
        }
        if (lightboxNextBtn) {
            lightboxNextBtn.addEventListener("click", () => {
                updateSlideUI(currentSlideIndex + 1, true, true);
            });
        }
        if (lightboxCloseBtn) {
            lightboxCloseBtn.addEventListener("click", closeLightbox);
        }
        if (lightboxBackdrop) {
            lightboxBackdrop.addEventListener("click", closeLightbox);
        }

        lightboxThumbButtons.forEach((btn) => {
            btn.addEventListener("click", () => {
                const idx = parseInt(btn.getAttribute("data-slide-index") || "0", 10);
                updateSlideUI(idx, true, true);
            });
        });

        // Keyboard Navigation in Lightbox (ArrowLeft, ArrowRight, Escape)
        document.addEventListener("keydown", (e) => {
            if (!lightboxModal || lightboxModal.hidden) return;
            if (e.key === "Escape") {
                e.preventDefault();
                closeLightbox();
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                updateSlideUI(currentSlideIndex + 1, true, true);
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                updateSlideUI(currentSlideIndex - 1, true, true);
            }
        });

        // =====================================================================
        // 8. Owner-Only Multi-Photo Upload Drawer, Previews & Client Validation
        // =====================================================================
        const toggleUploadDrawerBtn = document.getElementById("njToggleUploadDrawerBtn");
        const closeUploadDrawerBtn = document.getElementById("njCloseUploadDrawerBtn");
        const cancelUploadBtn = document.getElementById("njCancelUploadBtn");
        const uploadDrawer = document.getElementById("njOwnerUploadDrawer");
        const uploadForm = document.getElementById("njGalleryUploadForm");
        const filesInput = document.getElementById("njGalleryFilesInput");
        const dropzone = document.getElementById("njUploadDropzone");
        const validationAlert = document.getElementById("njUploadValidationAlert");
        const previewContainer = document.getElementById("njUploadPreviewContainer");
        const previewGrid = document.getElementById("njUploadPreviewGrid");
        const selectedCountText = document.getElementById("njSelectedFilesCount");
        const clearFilesBtn = document.getElementById("njClearFilesBtn");
        const submitPhotosBtn = document.getElementById("njSubmitPhotosBtn");

        const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        const MAX_FILES = 10;

        const showUploadError = (msg) => {
            if (!validationAlert) return;
            validationAlert.textContent = msg;
            validationAlert.hidden = false;
        };

        const hideUploadError = () => {
            if (!validationAlert) return;
            validationAlert.textContent = "";
            validationAlert.hidden = true;
        };

        const clearFileSelection = () => {
            if (filesInput) filesInput.value = "";
            if (previewGrid) previewGrid.innerHTML = "";
            if (previewContainer) previewContainer.hidden = true;
            hideUploadError();
        };

        const toggleUploadDrawer = (forceOpen) => {
            if (!uploadDrawer || !toggleUploadDrawerBtn) return;
            const willOpen = typeof forceOpen === "boolean" ? forceOpen : uploadDrawer.hidden;
            uploadDrawer.hidden = !willOpen;
            toggleUploadDrawerBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
            if (!willOpen) {
                clearFileSelection();
            }
        };

        if (toggleUploadDrawerBtn) {
            toggleUploadDrawerBtn.addEventListener("click", () => toggleUploadDrawer());
        }
        if (closeUploadDrawerBtn) {
            closeUploadDrawerBtn.addEventListener("click", () => toggleUploadDrawer(false));
        }
        if (cancelUploadBtn) {
            cancelUploadBtn.addEventListener("click", () => toggleUploadDrawer(false));
        }
        if (clearFilesBtn) {
            clearFilesBtn.addEventListener("click", clearFileSelection);
        }

        const formatBytes = (bytes) => {
            if (bytes < 1024) return `${bytes} B`;
            const kb = bytes / 1024;
            if (kb < 1024) return `${kb.toFixed(1)} KB`;
            return `${(kb / 1024).toFixed(2)} MB`;
        };

        const handleSelectedFiles = (fileList) => {
            hideUploadError();
            if (!fileList || fileList.length === 0) {
                if (previewContainer) previewContainer.hidden = true;
                if (previewGrid) previewGrid.innerHTML = "";
                return false;
            }

            const files = Array.from(fileList);
            if (files.length > MAX_FILES) {
                showUploadError(`You can upload up to ${MAX_FILES} photos at once. (${files.length} selected)`);
                return false;
            }

            for (const file of files) {
                if (!ALLOWED_TYPES.includes((file.type || "").toLowerCase())) {
                    showUploadError(`Invalid file type "${file.name}". Only JPG, PNG, and WEBP images are allowed.`);
                    return false;
                }
                if (file.size > MAX_FILE_SIZE) {
                    showUploadError(`"${file.name}" (${formatBytes(file.size)}) exceeds the 5 MB maximum file size.`);
                    return false;
                }
            }

            if (previewGrid && previewContainer && selectedCountText) {
                previewGrid.innerHTML = "";
                selectedCountText.textContent = `${files.length} ${files.length === 1 ? "photo" : "photos"} ready to upload`;
                previewContainer.hidden = false;

                files.forEach((file) => {
                    const item = document.createElement("div");
                    item.className = "nj-upload-preview-item";

                    const img = document.createElement("img");
                    img.alt = file.name;
                    img.src = URL.createObjectURL(file);
                    img.onload = () => URL.revokeObjectURL(img.src);

                    const meta = document.createElement("div");
                    meta.className = "nj-upload-preview-meta";
                    meta.textContent = `${formatBytes(file.size)} • ${file.name}`;

                    item.appendChild(img);
                    item.appendChild(meta);
                    previewGrid.appendChild(item);
                });
            }

            return true;
        };

        if (filesInput) {
            filesInput.addEventListener("change", () => {
                handleSelectedFiles(filesInput.files);
            });
        }

        if (dropzone) {
            ["dragenter", "dragover"].forEach((evtName) => {
                dropzone.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    dropzone.classList.add("is-dragover");
                });
            });
            ["dragleave", "drop"].forEach((evtName) => {
                dropzone.addEventListener(evtName, () => {
                    dropzone.classList.remove("is-dragover");
                });
            });
        }

        if (uploadForm) {
            uploadForm.addEventListener("submit", (e) => {
                if (!filesInput || !filesInput.files || filesInput.files.length === 0) {
                    e.preventDefault();
                    showUploadError("Please select at least one photo before uploading.");
                    return;
                }
                const isValid = handleSelectedFiles(filesInput.files);
                if (!isValid) {
                    e.preventDefault();
                    return;
                }
                if (submitPhotosBtn) {
                    submitPhotosBtn.disabled = true;
                    submitPhotosBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> <span>Uploading Photos...</span>';
                }
            });
        }
    }

    // =========================================================================
    // 9. Interactive Hotel-Style Booking Panel & Custom Calendar UI
    // =========================================================================
    const bookingPanel = document.getElementById("njBookingPanel");
    if (bookingPanel) {
        const listingId = bookingPanel.getAttribute("data-listing-id");
        const serverTodayISO = bookingPanel.getAttribute("data-today-iso") || "";
        let reservedRanges = [];
        try {
            reservedRanges = JSON.parse(bookingPanel.getAttribute("data-reserved-ranges") || "[]");
        } catch (e) {
            reservedRanges = [];
        }

        let roomTypes = [];
        try {
            roomTypes = JSON.parse(bookingPanel.getAttribute("data-room-types") || "[]");
        } catch (e) {
            roomTypes = [];
        }

        const bookingForm = document.getElementById("njHotelBookingForm") || document.getElementById("njBookingForm");
        const checkInInput = document.getElementById("njCheckInInput");
        const checkOutInput = document.getElementById("njCheckOutInput");
        const roomTypeCodeInput = document.getElementById("njRoomTypeCodeInput");

        // Custom Calendar Trigger & Widget Elements
        const checkInTrigger = document.getElementById("njCheckInTrigger");
        const checkOutTrigger = document.getElementById("njCheckOutTrigger");
        const checkInDisplayText = document.getElementById("njCheckInDisplayText");
        const checkInSubText = document.getElementById("njCheckInSubText");
        const checkOutDisplayText = document.getElementById("njCheckOutDisplayText");
        const checkOutSubText = document.getElementById("njCheckOutSubText");
        const headerNightsBadge = document.getElementById("njHeaderNightsBadge");

        const calendarWidget = document.getElementById("njCalendarWidget");
        const calModeHint = document.getElementById("njCalModeHint");
        const calCloseTopBtn = document.getElementById("njCalCloseTopBtn");
        const calPrevBtn = document.getElementById("njCalPrevBtn");
        const calNextBtn = document.getElementById("njCalNextBtn");
        const calMonthYearLabel = document.getElementById("njCalMonthYearLabel");
        const calDaysGrid = document.getElementById("njCalDaysGrid");
        const calResetBtn = document.getElementById("njCalResetBtn");
        const calDoneBtn = document.getElementById("njCalDoneBtn");

        // Dynamic Guests & Room Type Elements
        const guestsSelect = document.getElementById("njGuestsSelect");
        const roomTypeSelect = document.getElementById("njRoomTypeSelect");
        const rateEyebrow = document.getElementById("njRateEyebrow");
        const nightlyPriceDisplay = document.getElementById("njNightlyPriceDisplay");
        const roomCapTag = document.getElementById("njRoomCapTag");
        const guestsAllocatedPill = document.getElementById("njGuestsAllocatedPill");
        const roomPreviewName = document.getElementById("njRoomPreviewName");
        const roomPreviewBed = document.getElementById("njRoomPreviewBed");
        const roomPreviewRate = document.getElementById("njRoomPreviewRate");
        const roomPreviewCapacity = document.getElementById("njRoomPreviewCapacity");
        const roomPreviewSize = document.getElementById("njRoomPreviewSize");
        const roomPreviewAmenities = document.getElementById("njRoomPreviewAmenities");
        const roomOccupancyAlert = document.getElementById("njRoomOccupancyAlert");
        const roomOccupancyText = document.getElementById("njRoomOccupancyText");

        // Status & Itemized Breakdown Elements
        const availabilityBanner = document.getElementById("njAvailabilityBanner");
        const availabilityText = document.getElementById("njAvailabilityText");
        const nightsCountText = document.getElementById("njNightsCountText");
        const breakdownRoomName = document.getElementById("njBreakdownRoomName");
        const breakdownRoomRate = document.getElementById("njBreakdownRoomRate");
        const breakdownRoomsBadge = document.getElementById("njBreakdownRoomsBadge");
        const breakdownBaseAmount = document.getElementById("njBreakdownBaseAmount");
        const extraGuestBreakdownRow = document.getElementById("njExtraGuestBreakdownRow");
        const breakdownExtraGuestLabel = document.getElementById("njBreakdownExtraGuestLabel");
        const breakdownExtraGuestAmount = document.getElementById("njBreakdownExtraGuestAmount");
        const breakdownGstLabel = document.getElementById("njBreakdownGstLabel");
        const breakdownTaxAmount = document.getElementById("njBreakdownTaxAmount");
        const breakdownTotalAmount = document.getElementById("njBreakdownTotalAmount");
        const reserveNowBtn = document.getElementById("njReserveNowBtn");
        const reserveBtnIcon = document.getElementById("njReserveBtnIcon");
        const reserveBtnLabel = document.getElementById("njReserveBtnLabel");

        const parseISO = (str) => {
            if (!str || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
            const [y, m, d] = str.split("-").map(Number);
            return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
        };

        const toISO = (dateObj) => dateObj.toISOString().slice(0, 10);

        const formatReadableDate = (dateObj) => {
            if (!dateObj) return "Select date";
            return dateObj.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "UTC",
            });
        };

        const formatINR = (num) => `\u20B9${Math.round(num).toLocaleString("en-IN")}`;

        // Official Indian Hotel Accommodation GST Slabs
        const getIndianHotelGSTRate = (dailyTariffPerRoom) => {
            const val = Math.max(0, Number(dailyTariffPerRoom) || 0);
            if (val > 7500) {
                return { rate: 0.18, label: "GST (18%)" };
            }
            if (val > 1000) {
                return { rate: 0.12, label: "GST (12%)" };
            }
            return { rate: 0.00, label: "GST (Exempt)" };
        };

        const now = new Date();
        const todayUTC = parseISO(serverTodayISO) || new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

        // Initial default values for Reset
        const initialCheckInISO = checkInInput ? checkInInput.value : toISO(new Date(todayUTC.getTime() + 86400000));
        const initialCheckOutISO = checkOutInput ? checkOutInput.value : toISO(new Date(todayUTC.getTime() + 3 * 86400000));

        let selectedCheckIn = parseISO(initialCheckInISO);
        let selectedCheckOut = parseISO(initialCheckOutISO);
        let activePickerMode = "checkin"; // "checkin" | "checkout"
        let hoverDate = null;
        let viewYear = selectedCheckIn ? selectedCheckIn.getUTCFullYear() : todayUTC.getUTCFullYear();
        let viewMonth = selectedCheckIn ? selectedCheckIn.getUTCMonth() : todayUTC.getUTCMonth();

        // Helper to get active selected room object
        const getActiveRoom = () => {
            const selectedCode = (roomTypeSelect ? roomTypeSelect.value : "") ||
                                 (roomTypeCodeInput ? roomTypeCodeInput.value : "") ||
                                 "deluxe";
            let matched = roomTypes.find((r) => r.code === selectedCode);
            if (!matched && roomTypes.length > 0) {
                matched = roomTypes[0];
            }
            return matched || {
                code: "deluxe",
                name: "Deluxe Room",
                price: 5000,
                baseOccupancy: 2,
                maxOccupancy: 3,
                extraGuestRate: 600,
                bedConfig: "1 King Bed",
                roomSize: "350 sq.ft",
                amenities: ["Free Wi-Fi", "Balcony View"],
            };
        };

        // Client-side local pricing engine reflecting official Indian GST and room allocation
        const calculateClientPrice = (room, guests, nights) => {
            const validNights = Math.max(1, Math.min(60, Number(nights) || 1));
            const validGuests = Math.max(1, Math.min(12, Number(guests) || 2));
            const baseOcc = Math.max(1, Number(room.baseOccupancy) || 2);
            const maxOcc = Math.max(baseOcc, Number(room.maxOccupancy) || 3);
            const extraRate = Math.max(0, Number(room.extraGuestRate) || 0);
            const roomRate = Math.max(0, Number(room.price) || 0);

            let roomsRequired = 1;
            let occupancyWarning = null;
            if (validGuests > maxOcc) {
                roomsRequired = Math.ceil(validGuests / maxOcc);
                occupancyWarning = `${validGuests} guests allocated across ${roomsRequired} rooms (max ${maxOcc} guests per ${room.name}).`;
            }

            const totalBaseCapacity = baseOcc * roomsRequired;
            let extraGuestsCount = 0;
            if (validGuests > totalBaseCapacity) {
                extraGuestsCount = validGuests - totalBaseCapacity;
            }

            const roomBaseCharge = roomRate * roomsRequired * validNights;
            const extraGuestCharge = extraGuestsCount * extraRate * validNights;
            const subtotal = roomBaseCharge + extraGuestCharge;

            const dailyTariffPerRoom = (roomRate * roomsRequired + (extraGuestsCount * extraRate)) / roomsRequired;
            const gst = getIndianHotelGSTRate(dailyTariffPerRoom);
            const taxAmount = Math.round(subtotal * gst.rate);
            const totalPrice = subtotal + taxAmount;

            return {
                room,
                nights: validNights,
                guests: validGuests,
                roomsRequired,
                extraGuestsCount,
                roomBaseCharge,
                extraGuestCharge,
                subtotal,
                gstRate: gst.rate,
                gstLabel: gst.label,
                taxAmount,
                totalPrice,
                occupancyWarning,
            };
        };

        // Check if a night [d, d + 1 day) is inside any confirmed reservation [rIn, rOut)
        const isNightBooked = (dateObj) => {
            const ms = dateObj.getTime();
            return reservedRanges.some((rng) => {
                const rIn = parseISO(rng.checkIn);
                const rOut = parseISO(rng.checkOut);
                return rIn && rOut && ms >= rIn.getTime() && ms < rOut.getTime();
            });
        };

        // Find earliest booked check-in strictly after a given check-in date
        const getFirstBookedCheckInAfter = (checkInDateObj) => {
            if (!checkInDateObj) return null;
            const inMs = checkInDateObj.getTime();
            let earliest = null;
            for (const rng of reservedRanges) {
                const rIn = parseISO(rng.checkIn);
                if (rIn && rIn.getTime() > inMs) {
                    if (!earliest || rIn.getTime() < earliest.getTime()) {
                        earliest = rIn;
                    }
                }
            }
            return earliest;
        };

        const setReserveButtonState = (isAvailable, customUnavailableText) => {
            if (!reserveNowBtn) return;
            reserveNowBtn.disabled = !isAvailable;
            reserveNowBtn.classList.toggle("is-unavailable-btn", !isAvailable);
            if (reserveBtnIcon) {
                reserveBtnIcon.className = isAvailable
                    ? "fa-solid fa-calendar-check"
                    : "fa-solid fa-calendar-xmark";
            }
            if (reserveBtnLabel) {
                reserveBtnLabel.textContent = isAvailable
                    ? "Reserve Now"
                    : (customUnavailableText || "Dates Unavailable");
            }
        };

        const setBannerState = (type, message) => {
            if (!availabilityBanner || !availabilityText) return;
            availabilityBanner.classList.remove("is-available", "is-unavailable", "is-checking");
            const icon = availabilityBanner.querySelector("i");
            if (type === "available") {
                availabilityBanner.classList.add("is-available");
                if (icon) icon.className = "fa-solid fa-circle-check";
            } else if (type === "unavailable") {
                availabilityBanner.classList.add("is-unavailable");
                if (icon) icon.className = "fa-solid fa-circle-exclamation";
            } else {
                availabilityBanner.classList.add("is-checking");
                if (icon) icon.className = "fa-solid fa-spinner fa-spin";
            }
            availabilityText.textContent = message;
        };

        // Synchronize room card preview, guest count pills, and itemized breakdown
        const updatePriceAndRoomUI = (nightsOverride) => {
            const activeRoom = getActiveRoom();
            const guests = guestsSelect ? (parseInt(guestsSelect.value, 10) || 2) : 2;

            // Sync hidden form input
            if (roomTypeCodeInput) {
                roomTypeCodeInput.value = activeRoom.code;
            }

            // Sync header rate
            if (rateEyebrow) {
                rateEyebrow.textContent = `${activeRoom.name} Rate`;
            }
            if (nightlyPriceDisplay) {
                nightlyPriceDisplay.textContent = formatINR(activeRoom.price);
            }
            if (roomCapTag) {
                roomCapTag.innerHTML = `<i class="fa-solid fa-users" aria-hidden="true"></i> Max ${activeRoom.maxOccupancy} Guests`;
            }

            // Sync room preview card details
            if (roomPreviewName) roomPreviewName.textContent = activeRoom.name;
            if (roomPreviewBed) roomPreviewBed.innerHTML = `<i class="fa-solid fa-hotel" aria-hidden="true"></i> ${activeRoom.bedConfig || "1 King Bed"}`;
            if (roomPreviewRate) roomPreviewRate.innerHTML = `${formatINR(activeRoom.price)} <small>/ night</small>`;
            if (roomPreviewCapacity) {
                roomPreviewCapacity.innerHTML = `<i class="fa-solid fa-user-check" aria-hidden="true"></i> Base: ${activeRoom.baseOccupancy} &bull; Max: ${activeRoom.maxOccupancy} guests/room`;
            }
            if (roomPreviewSize) {
                roomPreviewSize.innerHTML = activeRoom.roomSize ? `<i class="fa-solid fa-expand" aria-hidden="true"></i> ${activeRoom.roomSize}` : "";
            }
            if (roomPreviewAmenities && Array.isArray(activeRoom.amenities)) {
                roomPreviewAmenities.innerHTML = activeRoom.amenities
                    .slice(0, 4)
                    .map((am) => `<span class="nj-room-amenity-chip">${am}</span>`)
                    .join("");
            }

            // Determine stay nights
            let nights = 2;
            if (typeof nightsOverride === "number") {
                nights = nightsOverride;
            } else if (selectedCheckIn && selectedCheckOut && selectedCheckOut > selectedCheckIn) {
                nights = Math.round((selectedCheckOut - selectedCheckIn) / 86400000);
            }
            nights = Math.max(1, Math.min(60, nights));

            const calc = calculateClientPrice(activeRoom, guests, nights);

            // Dynamic room allocation badge and occupancy warning notice
            if (guestsAllocatedPill) {
                guestsAllocatedPill.textContent = `${calc.roomsRequired} ${calc.roomsRequired === 1 ? "Room" : "Rooms"}`;
            }

            if (roomOccupancyAlert && roomOccupancyText) {
                if (calc.occupancyWarning) {
                    roomOccupancyAlert.hidden = false;
                    roomOccupancyText.textContent = calc.occupancyWarning;
                } else if (calc.extraGuestsCount > 0) {
                    roomOccupancyAlert.hidden = false;
                    roomOccupancyText.textContent = `${calc.extraGuestsCount} extra guest charge applied (${formatINR(activeRoom.extraGuestRate)}/night).`;
                } else {
                    roomOccupancyAlert.hidden = true;
                    roomOccupancyText.textContent = "";
                }
            }

            // Sync header nights badge
            if (headerNightsBadge) {
                headerNightsBadge.textContent = `${nights} ${nights === 1 ? "Night" : "Nights"}`;
            }
            if (nightsCountText) {
                nightsCountText.textContent = `${nights} ${nights === 1 ? "night" : "nights"}`;
            }

            // Itemized breakdown: Room charges
            if (breakdownRoomName) {
                breakdownRoomName.textContent = activeRoom.name;
            }
            if (breakdownRoomRate) {
                breakdownRoomRate.textContent = formatINR(activeRoom.price);
            }
            if (breakdownRoomsBadge) {
                if (calc.roomsRequired > 1) {
                    breakdownRoomsBadge.hidden = false;
                    breakdownRoomsBadge.textContent = `${calc.roomsRequired} Rooms`;
                } else {
                    breakdownRoomsBadge.hidden = true;
                }
            }
            if (breakdownBaseAmount) {
                breakdownBaseAmount.textContent = formatINR(calc.roomBaseCharge);
            }

            // Itemized breakdown: Extra guest charges row
            if (extraGuestBreakdownRow && breakdownExtraGuestLabel && breakdownExtraGuestAmount) {
                if (calc.extraGuestCharge > 0) {
                    extraGuestBreakdownRow.hidden = false;
                    breakdownExtraGuestLabel.textContent = `${calc.extraGuestsCount} Extra ${calc.extraGuestsCount === 1 ? "Guest" : "Guests"} (${formatINR(activeRoom.extraGuestRate)}/nt \u00D7 ${nights} nts)`;
                    breakdownExtraGuestAmount.textContent = formatINR(calc.extraGuestCharge);
                } else {
                    extraGuestBreakdownRow.hidden = true;
                    breakdownExtraGuestAmount.textContent = formatINR(0);
                }
            }

            // Itemized breakdown: Taxes & Statutory GST
            if (breakdownGstLabel) {
                breakdownGstLabel.textContent = `Taxes & ${calc.gstLabel}`;
            }
            if (breakdownTaxAmount) {
                breakdownTaxAmount.textContent = formatINR(calc.taxAmount);
            }

            // Final Total
            if (breakdownTotalAmount) {
                breakdownTotalAmount.textContent = formatINR(calc.totalPrice);
            }

            return calc;
        };

        const syncTriggerDisplays = () => {
            if (checkInDisplayText) {
                checkInDisplayText.textContent = selectedCheckIn ? formatReadableDate(selectedCheckIn) : "Add date";
            }
            if (checkInSubText) {
                checkInSubText.textContent = selectedCheckIn ? toISO(selectedCheckIn) : "Select check-in";
            }
            if (checkOutDisplayText) {
                checkOutDisplayText.textContent = selectedCheckOut ? formatReadableDate(selectedCheckOut) : "Add date";
            }
            if (checkOutSubText) {
                checkOutSubText.textContent = selectedCheckOut ? toISO(selectedCheckOut) : "Select check-out";
            }

            const isCalendarOpen = calendarWidget && !calendarWidget.hidden;
            if (checkInTrigger) {
                const isCheckInActive = isCalendarOpen && activePickerMode === "checkin";
                checkInTrigger.classList.toggle("is-active", isCheckInActive);
                checkInTrigger.setAttribute("aria-expanded", isCalendarOpen ? "true" : "false");
            }
            if (checkOutTrigger) {
                const isCheckOutActive = isCalendarOpen && activePickerMode === "checkout";
                checkOutTrigger.classList.toggle("is-active", isCheckOutActive);
                checkOutTrigger.setAttribute("aria-expanded", isCalendarOpen ? "true" : "false");
            }
            if (calModeHint) {
                calModeHint.innerHTML =
                    activePickerMode === "checkin"
                        ? '<i class="fa-solid fa-plane-arrival" aria-hidden="true"></i> Select your <strong>Check-In</strong> date'
                        : '<i class="fa-solid fa-plane-departure" aria-hidden="true"></i> Select your <strong>Check-Out</strong> date';
            }
        };

        const renderCalendar = () => {
            if (!calDaysGrid || !calMonthYearLabel) return;

            const monthDate = new Date(Date.UTC(viewYear, viewMonth, 1));
            calMonthYearLabel.textContent = monthDate.toLocaleDateString("en-IN", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
            });

            if (calPrevBtn) {
                const isCurrentOrPastMonth =
                    viewYear < todayUTC.getUTCFullYear() ||
                    (viewYear === todayUTC.getUTCFullYear() && viewMonth <= todayUTC.getUTCMonth());
                calPrevBtn.disabled = isCurrentOrPastMonth;
            }

            const firstWeekday = monthDate.getUTCDay();
            const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

            calDaysGrid.innerHTML = "";

            for (let i = 0; i < firstWeekday; i++) {
                const emptyCell = document.createElement("span");
                emptyCell.className = "nj-cal-day is-empty";
                emptyCell.setAttribute("aria-hidden", "true");
                calDaysGrid.appendChild(emptyCell);
            }

            const firstConflictAfterCheckIn =
                activePickerMode === "checkout" && selectedCheckIn
                    ? getFirstBookedCheckInAfter(selectedCheckIn)
                    : null;

            for (let day = 1; day <= daysInMonth; day++) {
                const cellDate = new Date(Date.UTC(viewYear, viewMonth, day, 0, 0, 0, 0));
                const cellMs = cellDate.getTime();
                const cellISO = toISO(cellDate);

                const btn = document.createElement("button");
                btn.type = "button";
                btn.className = "nj-cal-day";
                btn.textContent = String(day);
                btn.setAttribute("data-date-iso", cellISO);
                btn.setAttribute("aria-label", formatReadableDate(cellDate));

                const isPast = cellMs < todayUTC.getTime();
                const nightBooked = isNightBooked(cellDate);
                const isToday = cellMs === todayUTC.getTime();

                if (isToday) {
                    btn.classList.add("is-today");
                }

                let isDisabled = false;
                if (isPast) {
                    isDisabled = true;
                    btn.classList.add("is-past");
                } else if (activePickerMode === "checkin") {
                    if (nightBooked) {
                        isDisabled = true;
                        btn.classList.add("is-booked");
                        btn.title = "Reserved";
                    }
                } else if (activePickerMode === "checkout" && selectedCheckIn) {
                    const inMs = selectedCheckIn.getTime();
                    if (firstConflictAfterCheckIn && cellMs > firstConflictAfterCheckIn.getTime()) {
                        isDisabled = true;
                        btn.classList.add("is-booked");
                        btn.title = "Unavailable (overlaps an existing reservation)";
                    } else if (cellMs <= inMs && nightBooked) {
                        isDisabled = true;
                        btn.classList.add("is-booked");
                        btn.title = "Reserved";
                    } else if (cellMs === firstConflictAfterCheckIn?.getTime()) {
                        btn.classList.add("is-checkout-only");
                        btn.title = "Available for check-out";
                    } else if (nightBooked) {
                        isDisabled = true;
                        btn.classList.add("is-booked");
                        btn.title = "Reserved";
                    }
                }

                btn.disabled = isDisabled;

                const inMs = selectedCheckIn ? selectedCheckIn.getTime() : null;
                const outMs = selectedCheckOut ? selectedCheckOut.getTime() : null;
                const hoverMs = hoverDate ? hoverDate.getTime() : null;

                if (inMs && cellMs === inMs) {
                    btn.classList.add("is-range-start");
                    btn.setAttribute("aria-selected", "true");
                }
                if (outMs && cellMs === outMs) {
                    btn.classList.add("is-range-end");
                    btn.setAttribute("aria-selected", "true");
                }
                if (inMs && outMs && cellMs > inMs && cellMs < outMs) {
                    btn.classList.add("is-in-range");
                } else if (
                    activePickerMode === "checkout" &&
                    inMs &&
                    !outMs &&
                    hoverMs &&
                    hoverMs > inMs &&
                    cellMs > inMs &&
                    cellMs <= hoverMs &&
                    !isDisabled
                ) {
                    btn.classList.add(cellMs === hoverMs ? "is-hover-end" : "is-hover-range");
                }

                if (!isDisabled) {
                    btn.addEventListener("mouseenter", () => {
                        if (activePickerMode === "checkout" && selectedCheckIn && !selectedCheckOut) {
                            hoverDate = cellDate;
                            renderCalendar();
                        }
                    });

                    btn.addEventListener("click", () => {
                        handleDateCellClick(cellDate);
                    });
                }

                calDaysGrid.appendChild(btn);
            }
        };

        const openCalendar = (mode = "checkin") => {
            if (!calendarWidget) return;
            activePickerMode = mode;
            const targetFocusDate = mode === "checkout" && selectedCheckOut ? selectedCheckOut : (selectedCheckIn || todayUTC);
            viewYear = targetFocusDate.getUTCFullYear();
            viewMonth = targetFocusDate.getUTCMonth();
            calendarWidget.hidden = false;
            syncTriggerDisplays();
            renderCalendar();
        };

        const closeCalendar = () => {
            if (!calendarWidget || calendarWidget.hidden) return;
            if (selectedCheckIn && (!selectedCheckOut || selectedCheckOut <= selectedCheckIn)) {
                const nextDay = new Date(selectedCheckIn.getTime() + 86400000);
                selectedCheckOut = nextDay;
                if (checkOutInput) checkOutInput.value = toISO(nextDay);
                evaluateDatesAndAvailability("calendar");
            }
            calendarWidget.hidden = true;
            hoverDate = null;
            syncTriggerDisplays();
        };

        const handleDateCellClick = (clickedDate) => {
            const clickedMs = clickedDate.getTime();

            if (activePickerMode === "checkin") {
                selectedCheckIn = clickedDate;
                if (checkInInput) checkInInput.value = toISO(clickedDate);

                const firstConflict = getFirstBookedCheckInAfter(selectedCheckIn);
                const isExistingOutValid =
                    selectedCheckOut &&
                    selectedCheckOut.getTime() > clickedMs &&
                    (!firstConflict || selectedCheckOut.getTime() <= firstConflict.getTime());

                if (!isExistingOutValid) {
                    selectedCheckOut = null;
                    if (checkOutInput) checkOutInput.value = "";
                    setBannerState("checking", "Now select your check-out date on the calendar.");
                    setReserveButtonState(false, "Select Check-Out Date");
                } else {
                    evaluateDatesAndAvailability("calendar");
                }

                activePickerMode = "checkout";
                hoverDate = null;
                syncTriggerDisplays();
                renderCalendar();
            } else {
                if (!selectedCheckIn || clickedMs <= selectedCheckIn.getTime()) {
                    if (isNightBooked(clickedDate)) return;
                    selectedCheckIn = clickedDate;
                    selectedCheckOut = null;
                    if (checkInInput) checkInInput.value = toISO(clickedDate);
                    if (checkOutInput) checkOutInput.value = "";
                    activePickerMode = "checkout";
                    setBannerState("checking", "Now select your check-out date on the calendar.");
                    setReserveButtonState(false, "Select Check-Out Date");
                    syncTriggerDisplays();
                    renderCalendar();
                    return;
                }

                selectedCheckOut = clickedDate;
                if (checkOutInput) checkOutInput.value = toISO(clickedDate);
                hoverDate = null;
                syncTriggerDisplays();
                renderCalendar();
                evaluateDatesAndAvailability("calendar");

                setTimeout(() => {
                    closeCalendar();
                }, 180);
            }
        };

        let activeAbortController = null;

        const evaluateDatesAndAvailability = async (triggerSource) => {
            if (!checkInInput || !checkOutInput) return;

            const inDate = parseISO(checkInInput.value);
            let outDate = parseISO(checkOutInput.value);

            if (inDate && triggerSource === "checkin" && (!outDate || outDate <= inDate)) {
                outDate = new Date(inDate.getTime() + 86400000);
                checkOutInput.value = toISO(outDate);
            }

            selectedCheckIn = inDate;
            selectedCheckOut = outDate;
            syncTriggerDisplays();
            if (calendarWidget && !calendarWidget.hidden) {
                renderCalendar();
            }

            if (!inDate || !outDate) {
                setBannerState("unavailable", "Please select both check-in and check-out dates.");
                setReserveButtonState(false, "Select Stay Dates");
                updatePriceAndRoomUI(1);
                return;
            }

            if (inDate < todayUTC) {
                setBannerState("unavailable", "Check-in date cannot be in the past.");
                setReserveButtonState(false, "Invalid Check-In Date");
                return;
            }

            if (outDate <= inDate) {
                setBannerState("unavailable", "Check-out date must be at least 1 night after check-in.");
                setReserveButtonState(false, "Invalid Stay Range");
                return;
            }

            const nights = Math.round((outDate - inDate) / 86400000);
            if (nights > 60) {
                setBannerState("unavailable", "Maximum stay duration is 60 nights.");
                setReserveButtonState(false, "Max 60 Nights Exceeded");
                return;
            }

            // Immediately update UI with local dynamic pricing calculations
            const localPricing = updatePriceAndRoomUI(nights);

            // Fast client-side overlap pre-check
            const localConflict = reservedRanges.find((r) => {
                const rIn = parseISO(r.checkIn);
                const rOut = parseISO(r.checkOut);
                return rIn && rOut && rIn < outDate && rOut > inDate;
            });

            if (localConflict) {
                setBannerState(
                    "unavailable",
                    `Unavailable: Already reserved from ${localConflict.checkIn} to ${localConflict.checkOut}.`
                );
                setReserveButtonState(false, "Dates Unavailable");
                return;
            }

            setReserveButtonState(true);

            if (!listingId) {
                const msg = localPricing.occupancyWarning
                    ? `Available: ${localPricing.occupancyWarning}`
                    : "Dates and room are available for instant reservation!";
                setBannerState("available", msg);
                return;
            }

            if (activeAbortController) {
                activeAbortController.abort();
            }
            activeAbortController = new AbortController();

            setBannerState("checking", "Verifying room availability & real-time pricing...");
            try {
                const guests = guestsSelect ? (parseInt(guestsSelect.value, 10) || 2) : 2;
                const activeRoom = getActiveRoom();
                const url = `/listings/${encodeURIComponent(listingId)}/availability?checkIn=${encodeURIComponent(checkInInput.value)}&checkOut=${encodeURIComponent(checkOutInput.value)}&guestsCount=${encodeURIComponent(guests)}&roomTypeCode=${encodeURIComponent(activeRoom.code)}`;

                const res = await fetch(url, {
                    headers: { Accept: "application/json" },
                    signal: activeAbortController.signal,
                });
                const data = await res.json();

                if (Array.isArray(data.reservedRanges)) {
                    reservedRanges = data.reservedRanges;
                    if (calendarWidget && !calendarWidget.hidden) {
                        renderCalendar();
                    }
                }

                if (data.priceBreakdown && typeof data.priceBreakdown.nights === "number") {
                    updatePriceAndRoomUI(data.priceBreakdown.nights);
                }

                if (res.ok && data.available) {
                    setBannerState("available", data.message || "Dates and room are available for instant reservation!");
                    setReserveButtonState(true);
                } else {
                    setBannerState("unavailable", data.message || "Selected dates are unavailable.");
                    setReserveButtonState(false, "Dates Unavailable");
                }
            } catch (err) {
                if (err && err.name === "AbortError") return;
                setBannerState("available", "Dates selected — click Reserve Now to confirm.");
                setReserveButtonState(true);
            }
        };

        // Bind Custom Calendar Triggers & Navigation
        if (checkInTrigger) {
            checkInTrigger.addEventListener("click", () => {
                if (calendarWidget && !calendarWidget.hidden && activePickerMode === "checkin") {
                    closeCalendar();
                } else {
                    openCalendar("checkin");
                }
            });
        }
        if (checkOutTrigger) {
            checkOutTrigger.addEventListener("click", () => {
                if (calendarWidget && !calendarWidget.hidden && activePickerMode === "checkout") {
                    closeCalendar();
                } else {
                    openCalendar("checkout");
                }
            });
        }
        if (calPrevBtn) {
            calPrevBtn.addEventListener("click", () => {
                viewMonth--;
                if (viewMonth < 0) {
                    viewMonth = 11;
                    viewYear--;
                }
                renderCalendar();
            });
        }
        if (calNextBtn) {
            calNextBtn.addEventListener("click", () => {
                viewMonth++;
                if (viewMonth > 11) {
                    viewMonth = 0;
                    viewYear++;
                }
                renderCalendar();
            });
        }
        if (calResetBtn) {
            calResetBtn.addEventListener("click", () => {
                if (checkInInput) checkInInput.value = initialCheckInISO;
                if (checkOutInput) checkOutInput.value = initialCheckOutISO;
                if (guestsSelect) guestsSelect.value = "2";
                if (roomTypeSelect && roomTypes.length > 0) {
                    const deluxe = roomTypes.find((r) => r.code === "deluxe") || roomTypes[0];
                    roomTypeSelect.value = deluxe.code;
                }
                selectedCheckIn = parseISO(initialCheckInISO);
                selectedCheckOut = parseISO(initialCheckOutISO);
                activePickerMode = "checkin";
                if (selectedCheckIn) {
                    viewYear = selectedCheckIn.getUTCFullYear();
                    viewMonth = selectedCheckIn.getUTCMonth();
                }
                syncTriggerDisplays();
                renderCalendar();
                evaluateDatesAndAvailability("reset");
            });
        }
        if (calDoneBtn) {
            calDoneBtn.addEventListener("click", closeCalendar);
        }
        if (calCloseTopBtn) {
            calCloseTopBtn.addEventListener("click", closeCalendar);
        }

        // Close calendar when clicking outside or pressing Escape
        document.addEventListener("click", (e) => {
            if (!calendarWidget || calendarWidget.hidden) return;
            const dateSection = document.getElementById("njDatePickerSection");
            if (dateSection && !dateSection.contains(e.target)) {
                closeCalendar();
            }
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && calendarWidget && !calendarWidget.hidden) {
                closeCalendar();
            }
        });

        // Event listeners for Guests & Room Type changes
        if (guestsSelect) {
            guestsSelect.addEventListener("change", () => {
                evaluateDatesAndAvailability("guests");
            });
        }

        if (roomTypeSelect) {
            roomTypeSelect.addEventListener("change", () => {
                evaluateDatesAndAvailability("roomType");
            });
        }

        // Support programmatic change events on checkIn / checkOut
        if (checkInInput) {
            checkInInput.addEventListener("change", () => evaluateDatesAndAvailability("checkin"));
        }
        if (checkOutInput) {
            checkOutInput.addEventListener("change", () => evaluateDatesAndAvailability("checkout"));
        }

        if (bookingForm) {
            bookingForm.addEventListener("submit", (e) => {
                if (reserveNowBtn && reserveNowBtn.disabled) {
                    e.preventDefault();
                    return;
                }
                if (reserveNowBtn) {
                    reserveNowBtn.disabled = true;
                    reserveNowBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> <span>Confirming Reservation...</span>';
                }
            });
        }

        // Initialize UI on page load
        syncTriggerDisplays();
        renderCalendar();
        evaluateDatesAndAvailability("init");
    }

    // =========================================================================
    // 10. Premium Flash Alert Notification Auto-Dismissal & Smooth Exit
    // =========================================================================
    const flashAlerts = document.querySelectorAll(".nj-flash-alert");
    flashAlerts.forEach((alert) => {
        const dismissDelay = parseInt(alert.getAttribute("data-auto-dismiss") || "4500", 10);
        let remainingTime = dismissDelay;
        let startTime = Date.now();
        let timeoutId = null;

        const dismissAlert = () => {
            if (alert.classList.contains("nj-flash-dismissing")) return;
            alert.classList.add("nj-flash-dismissing");

            const cleanup = () => {
                const wrapper = alert.closest(".nj-flash-wrapper");
                alert.remove();
                if (wrapper && wrapper.children.length === 0) {
                    wrapper.remove();
                }
            };

            alert.addEventListener("animationend", cleanup, { once: true });
            // Fallback timeout in case animationend does not fire
            setTimeout(cleanup, 400);
        };

        const startTimer = () => {
            startTime = Date.now();
            timeoutId = setTimeout(dismissAlert, remainingTime);
        };

        const pauseTimer = () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
                timeoutId = null;
                const elapsed = Date.now() - startTime;
                remainingTime = Math.max(800, remainingTime - elapsed);
            }
        };

        // Pause on user hover so they can comfortably read, resume on leave
        alert.addEventListener("mouseenter", pauseTimer);
        alert.addEventListener("mouseleave", () => {
            if (!alert.classList.contains("nj-flash-dismissing")) {
                startTimer();
            }
        });

        // Intercept close button click for smooth custom exit animation
        const closeBtn = alert.querySelector(".nj-flash-close-btn");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (timeoutId) clearTimeout(timeoutId);
                dismissAlert();
            });
        }

        // Start initial auto-dismiss timer
        startTimer();
    });

    // =========================================================================
    // 11. Create New Listing Interactive Form, Drag-and-Drop & Live Preview
    // =========================================================================
    const createForm = document.getElementById("njCreateListingForm");
    if (createForm) {
        const titleInput = document.getElementById("listingTitle");
        const descInput = document.getElementById("listingDescription");
        const priceInput = document.getElementById("listingPrice");
        const locInput = document.getElementById("listingLocation");
        const countryInput = document.getElementById("listingCountry");

        const dropzone = document.getElementById("njPhotoDropzone");
        const imageInput = document.getElementById("listingImageInput");
        const previewWrap = document.getElementById("njImagePreviewWrap");
        const previewImg = document.getElementById("njPreviewImg");
        const previewFilename = document.getElementById("njPreviewFilename");
        const previewFilesize = document.getElementById("njPreviewFilesize");
        const removePhotoBtn = document.getElementById("njRemovePhotoBtn");

        // Mock Card Elements
        const mockTitle = document.getElementById("njMockTitle");
        const mockDesc = document.getElementById("njMockDesc");
        const mockPrice = document.getElementById("njMockPrice");
        const mockLocation = document.getElementById("njMockLocation");
        const mockImg = document.getElementById("njMockCardImg");

        // Live text update handlers
        if (titleInput && mockTitle) {
            titleInput.addEventListener("input", () => {
                mockTitle.textContent = titleInput.value.trim() || "Your Property Title";
            });
        }

        if (descInput && mockDesc) {
            descInput.addEventListener("input", () => {
                mockDesc.textContent = descInput.value.trim() || "Your property description will appear here on the Explore dashboard...";
            });
        }

        const updateLocationPreview = () => {
            if (!mockLocation) return;
            const locVal = locInput ? locInput.value.trim() : "";
            const countryVal = countryInput ? countryInput.value.trim() : "";
            const parts = [locVal, countryVal].filter(Boolean);
            mockLocation.textContent = parts.length > 0 ? parts.join(", ") : "Featured Destination";
        };

        if (locInput) locInput.addEventListener("input", updateLocationPreview);
        if (countryInput) countryInput.addEventListener("input", updateLocationPreview);

        if (priceInput && mockPrice) {
            priceInput.addEventListener("input", () => {
                const numeric = Number(priceInput.value);
                mockPrice.textContent = !isNaN(numeric) && numeric >= 0
                    ? numeric.toLocaleString("en-IN")
                    : "0";
            });
        }

        // Image Selection & Drag-and-Drop Handler
        const formatBytes = (bytes) => {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
        };

        const handleFileSelected = (file) => {
            if (!file || !file.type.startsWith("image/")) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                if (previewImg) previewImg.src = dataUrl;
                if (mockImg) mockImg.src = dataUrl;
                if (previewFilename) previewFilename.textContent = file.name;
                if (previewFilesize) previewFilesize.textContent = formatBytes(file.size);

                if (previewWrap) previewWrap.hidden = false;
                if (dropzone) dropzone.style.display = "none";
            };
            reader.readAsDataURL(file);
        };

        if (imageInput) {
            imageInput.addEventListener("change", () => {
                if (imageInput.files && imageInput.files[0]) {
                    handleFileSelected(imageInput.files[0]);
                }
            });
        }

        if (dropzone) {
            ["dragenter", "dragover"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.add("is-dragover");
                });
            });

            ["dragleave", "drop"].forEach((eventName) => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropzone.classList.remove("is-dragover");
                });
            });

            dropzone.addEventListener("drop", (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files.length > 0) {
                    const file = dt.files[0];
                    if (file && file.type.startsWith("image/")) {
                        try {
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            imageInput.files = dataTransfer.files;
                        } catch (err) {
                            // Fallback for older browsers
                        }
                        handleFileSelected(file);
                    }
                }
            });
        }

        if (removePhotoBtn) {
            removePhotoBtn.addEventListener("click", () => {
                if (imageInput) imageInput.value = "";
                if (previewWrap) previewWrap.hidden = true;
                if (dropzone) dropzone.style.display = "";
                if (mockImg) {
                    mockImg.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";
                }
            });
        }

        // Form Submit Loading Feedback
        const submitBtn = document.getElementById("njSubmitListingBtn");
        createForm.addEventListener("submit", () => {
            if (createForm.checkValidity()) {
                if (submitBtn) {
                    const loadingText = submitBtn.getAttribute("data-loading-text") || "Publishing...";
                    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>${loadingText}</span>`;
                    setTimeout(() => {
                        submitBtn.disabled = true;
                    }, 10);
                }
            }
        });
    }
})();