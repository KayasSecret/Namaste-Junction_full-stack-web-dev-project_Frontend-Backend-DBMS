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
                    if (submitBtn && !submitBtn.disabled) {
                        submitBtn.disabled = true;
                        const loadingText = submitBtn.getAttribute("data-loading-text") || "Please wait...";
                        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span><span>${loadingText}</span>`;
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

    // Interactive Destination Search (Live filter on /listings + query param support)
    const searchInput = document.getElementById("njDestinationSearch");
    const searchForm = document.getElementById("njSearchForm");
    const listingLinks = document.querySelectorAll(".listing-link");

    const filterListingCards = (query) => {
        if (!listingLinks.length) return;
        const normalized = query.trim().toLowerCase();
        listingLinks.forEach((link) => {
            const text = link.textContent.toLowerCase();
            link.style.display = !normalized || text.includes(normalized) ? "" : "none";
        });
    };

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
})();