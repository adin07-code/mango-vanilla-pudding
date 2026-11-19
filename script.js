/* ==========================================================================
   MANGO VANILLA PUDDING — SCROLL ANIMATIONS & INTERACTIVE COOKING LOGIC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------------
     1. TOAST HELPER
     ------------------------------------------------------------------------ */
  const toastEl = document.getElementById("toast");
  let toastTimeout = null;

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove("show");
    }, 2800);
  }

  /* ------------------------------------------------------------------------
     2. MOBILE MENU
     ------------------------------------------------------------------------ */
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  if (menuToggle && mobileMenu) {
    function closeMobileMenu() {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.hidden = true;
    }

    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      mobileMenu.hidden = isOpen;
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });

    document.addEventListener("click", (e) => {
      if (!mobileMenu.hidden && !mobileMenu.contains(e.target) && !menuToggle.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }

  /* ------------------------------------------------------------------------
     3. SCROLL REVEAL CHOREOGRAPHY (IntersectionObserver)
     ------------------------------------------------------------------------ */
  // Apply automatic stagger delays to children of [data-stagger]
  document.querySelectorAll("[data-stagger]").forEach((group) => {
    const children = group.querySelectorAll(".reveal");
    children.forEach((child, idx) => {
      child.style.setProperty("--reveal-delay", `${idx * 110}ms`);
    });
  });

  const revealEls = document.querySelectorAll(".reveal");

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.14,
        rootMargin: "0px 0px -45px 0px",
      }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ------------------------------------------------------------------------
     4. SCROLL-DRIVEN EFFECTS:
        - Top Reading Progress Bar
        - Sticky Navbar Glass Effect
        - Hero Parallax
        - Timeline Rail Fill & Active Step Highlight
        - Nav ScrollSpy
     ------------------------------------------------------------------------ */
  const progressBar = document.getElementById("scrollProgressBar");
  const navbar = document.getElementById("navbar");
  const parallaxEls = document.querySelectorAll("[data-parallax]");
  const timeline = document.getElementById("stepsTimeline");
  const timelineFill = document.getElementById("timelineFill");
  const stepCards = Array.from(document.querySelectorAll(".step-card"));
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const mobileBottomLinks = Array.from(document.querySelectorAll(".mbn-item"));
  const spySectionIds = ["#beranda", "#anatomi", "#bahan", "#langkah", "#tips", "#infografis", "#tentang"];
  const sections = spySectionIds
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  let ticking = false;

  function updateOnScroll() {
    const scrollY = window.scrollY;
    const isMobileViewport = window.innerWidth <= 768;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollRatio = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;

    // 1. Progress bar
    if (progressBar) {
      progressBar.style.width = `${(scrollRatio * 100).toFixed(2)}%`;
    }

    // 2. Navbar scrolled state
    if (navbar) {
      navbar.classList.toggle("scrolled", scrollY > 24);
    }

    // 3. Subtle Hero Parallax (desktop/tablet only for 60fps jitter-free mobile scroll)
    if (!prefersReducedMotion && !isMobileViewport && scrollY < window.innerHeight * 1.4) {
      parallaxEls.forEach((el) => {
        const speed = parseFloat(el.dataset.parallax || "0");
        const offset = scrollY * speed;
        el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
    } else if (isMobileViewport) {
      parallaxEls.forEach((el) => {
        if (el.style.transform) el.style.transform = "";
      });
    }

    // 4. Vertical Step Timeline Scroll Fill & Active Card
    if (timeline && timelineFill && stepCards.length > 0) {
      const rect = timeline.getBoundingClientRect();
      const focusLine = window.innerHeight * 0.56;
      const totalDist = rect.height;
      const progressed = focusLine - rect.top;
      const fillPct = Math.min(Math.max((progressed / totalDist) * 100, 0), 100);
      timelineFill.style.height = `${fillPct.toFixed(1)}%`;

      let activeCard = null;
      let closestDist = Infinity;

      stepCards.forEach((card) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height * 0.35;
        const dist = Math.abs(cardCenter - focusLine);

        if (cardRect.top < window.innerHeight * 0.78 && cardRect.bottom > 90 && dist < closestDist) {
          closestDist = dist;
          activeCard = card;
        }
      });

      stepCards.forEach((card) => {
        card.classList.toggle("is-active", card === activeCard);
      });
    }

    // 5. ScrollSpy for Desktop Navbar & Mobile Bottom Navigation
    let currentSectionId = "#beranda";
    const spyOffset = 150;
    sections.forEach((sec) => {
      if (scrollY >= sec.offsetTop - spyOffset) {
        currentSectionId = `#${sec.id}`;
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === currentSectionId);
    });

    const mobileMappedId = currentSectionId === "#tips" ? "#langkah" : currentSectionId;
    mobileBottomLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === mobileMappedId);
    });

    ticking = false;
  }

  window.addEventListener("resize", updateOnScroll, { passive: true });

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );

  // Initial sync
  updateOnScroll();

  /* ------------------------------------------------------------------------
     5. INTERACTIVE ANATOMY CUP HIGHLIGHTER
     ------------------------------------------------------------------------ */
  const cupSculpture = document.getElementById("cupSculpture");
  const anatomyCards = document.querySelectorAll(".anatomy-card");

  if (cupSculpture && anatomyCards.length > 0) {
    let lockedLayer = null;

    function setCupFocus(layerName) {
      if (layerName) {
        cupSculpture.setAttribute("data-focus", layerName);
      } else {
        cupSculpture.removeAttribute("data-focus");
      }
      anatomyCards.forEach((c) => {
        c.classList.toggle("is-highlighted", c.dataset.targetLayer === layerName);
      });
    }

    anatomyCards.forEach((card) => {
      const layer = card.dataset.targetLayer;

      card.addEventListener("mouseenter", () => {
        if (!lockedLayer) setCupFocus(layer);
      });

      card.addEventListener("mouseleave", () => {
        if (!lockedLayer) setCupFocus(null);
      });

      card.addEventListener("click", () => {
        lockedLayer = lockedLayer === layer ? null : layer;
        setCupFocus(lockedLayer);
      });

      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          lockedLayer = lockedLayer === layer ? null : layer;
          setCupFocus(lockedLayer);
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     6. PORTION SCALER & INGREDIENT CHECKLIST
     ------------------------------------------------------------------------ */
  const scalerBtns = document.querySelectorAll(".scaler-btn");
  const qtyEls = document.querySelectorAll(".ing-qty");
  const checkboxes = document.querySelectorAll(".ing-checkbox");
  const prepCounter = document.getElementById("prepCounter");
  const prepFill = document.getElementById("prepFill");
  const resetChecklistBtn = document.getElementById("resetChecklistBtn");
  const copyIngredientsBtn = document.getElementById("copyIngredientsBtn");

  let currentScale = 1;
  let currentCupsLabel = "11";

  function formatAmount(val) {
    if (Math.abs(val - 0.5) < 0.001) return "½";
    if (Math.abs(val - 1.5) < 0.001) return "1½";
    if (Number.isInteger(val)) return String(val);
    return val.toFixed(1).replace(".", ",");
  }

  function applyScale(scale, cupsLabel) {
    currentScale = scale;
    currentCupsLabel = cupsLabel;

    qtyEls.forEach((el) => {
      const base = parseFloat(el.dataset.base || "1");
      const unit = el.dataset.unit || "";
      const scaled = base * scale;
      el.textContent = `${formatAmount(scaled)} ${unit}`;

      el.classList.remove("pop");
      void el.offsetWidth; // trigger reflow for pop animation
      el.classList.add("pop");
    });
  }

  scalerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      scalerBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const scale = parseFloat(btn.dataset.scale || "1");
      const cups = btn.dataset.cups || "11";
      applyScale(scale, cups);
      showToast(`Takaran disesuaikan untuk ${cups} cup`);
    });
  });

  function updatePrepProgress() {
    const total = checkboxes.length;
    const checked = Array.from(checkboxes).filter((cb) => cb.checked).length;

    if (prepCounter) {
      prepCounter.textContent = `${checked} / ${total} bahan siap`;
    }
    if (prepFill) {
      prepFill.style.width = `${total > 0 ? (checked / total) * 100 : 0}%`;
    }

    if (checked === total && total > 0) {
      showToast("Semua bahan sudah siap! Yuk mulai memasak 🥭");
    }
  }

  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      const item = cb.closest(".check-item");
      if (item) item.classList.toggle("checked", cb.checked);
      updatePrepProgress();
    });
  });

  if (resetChecklistBtn) {
    resetChecklistBtn.addEventListener("click", () => {
      checkboxes.forEach((cb) => {
        cb.checked = false;
        const item = cb.closest(".check-item");
        if (item) item.classList.remove("checked");
      });
      updatePrepProgress();
      showToast("Checklist bahan telah direset");
    });
  }

  if (copyIngredientsBtn) {
    copyIngredientsBtn.addEventListener("click", async () => {
      const collectList = (selector) =>
        Array.from(document.querySelectorAll(`${selector} .check-item`)).map((item) => {
          const name = item.querySelector(".ing-name")?.textContent.trim() || "";
          const qty = item.querySelector(".ing-qty")?.textContent.trim() || "";
          return `- ${qty} ${name}`;
        });

      const text = [
        `Daftar Bahan Mango Vanilla Pudding (${currentCupsLabel} Cup)`,
        "",
        "Layer 1 (Puding Mangga):",
        ...collectList("#listLayer1"),
        "",
        "Layer 2 (Puding Vanila):",
        ...collectList("#listLayer2"),
        "",
        "Opsional: Potongan dadu mangga segar & daun mint.",
      ].join("\n");

      try {
        await navigator.clipboard.writeText(text);
        showToast("Daftar belanja berhasil disalin!");
      } catch {
        showToast("Gagal menyalin otomatis. Silakan salin manual.");
      }
    });
  }

  /* ------------------------------------------------------------------------
     7. STEP COMPLETION & BUILT-IN COOKING TIMER
     ------------------------------------------------------------------------ */
  const stepProgressText = document.getElementById("stepProgressText");

  function updateStepProgress() {
    const doneCount = document.querySelectorAll(".step-card.is-done").length;
    if (stepProgressText) {
      stepProgressText.textContent = `${doneCount} dari ${stepCards.length} langkah selesai`;
    }
    if (doneCount === stepCards.length && stepCards.length > 0) {
      showToast("Selamat! Mango Vanilla Pudding siap dinikmati 🍮✨");
    }
  }

  stepCards.forEach((card) => {
    const btn = card.querySelector(".step-done-btn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const isDone = card.classList.toggle("is-done");
      btn.setAttribute("aria-pressed", String(isDone));
      const label = btn.querySelector(".btn-label");
      if (label) {
        label.textContent = isDone ? "Selesai" : "Tandai Selesai";
      }
      updateStepProgress();
    });
  });

  // Floating Timer Logic
  const floatingTimer = document.getElementById("floatingTimer");
  const ftLabel = document.getElementById("ftLabel");
  const ftTime = document.getElementById("ftTime");
  const ftToggleBtn = document.getElementById("ftToggleBtn");
  const ftCloseBtn = document.getElementById("ftCloseBtn");

  let timerInterval = null;
  let remainingSeconds = 0;
  let isPaused = false;

  function formatTimer(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function playGentleChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + idx * 0.16 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.16 + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.16);
        osc.stop(ctx.currentTime + idx * 0.16 + 0.6);
      });
    } catch {
      // Ignore audio errors if autoplay blocked
    }
  }

  function startTimer(seconds, label) {
    clearInterval(timerInterval);
    remainingSeconds = seconds;
    isPaused = false;

    if (ftLabel) ftLabel.textContent = label;
    if (ftTime) ftTime.textContent = formatTimer(remainingSeconds);
    if (ftToggleBtn) ftToggleBtn.textContent = "Jeda";
    if (floatingTimer) floatingTimer.hidden = false;

    showToast(`Timer dimulai: ${label}`);

    timerInterval = setInterval(() => {
      if (isPaused) return;
      remainingSeconds -= 1;
      if (ftTime) ftTime.textContent = formatTimer(Math.max(remainingSeconds, 0));

      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        if (ftToggleBtn) ftToggleBtn.textContent = "Selesai";
        playGentleChime();
        showToast(`⏰ Waktu habis: ${label}!`);
      }
    }, 1000);
  }

  document.querySelectorAll(".timer-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const secs = parseInt(btn.dataset.seconds || "600", 10);
      const label = btn.dataset.label || "Timer Memasak";
      startTimer(secs, label);
    });
  });

  if (ftToggleBtn) {
    ftToggleBtn.addEventListener("click", () => {
      if (remainingSeconds <= 0) return;
      isPaused = !isPaused;
      ftToggleBtn.textContent = isPaused ? "Lanjut" : "Jeda";
    });
  }

  if (ftCloseBtn) {
    ftCloseBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      if (floatingTimer) floatingTimer.hidden = true;
    });
  }

  /* ------------------------------------------------------------------------
     8. INTERACTIVE PRO-TIP SWITCHER
     ------------------------------------------------------------------------ */
  const tipTabs = document.querySelectorAll(".tip-tab");
  const tipsDemo = document.getElementById("tipsDemo");
  const demoCaption = document.getElementById("demoCaption");

  const tipCaptions = {
    ideal:
      "<strong>Teknik Ideal (Setengah Set):</strong> Permukaan mangga sudah membentuk selaput tipis sehingga adonan vanila tidak bercampur, namun masih cukup hangat &amp; lengket untuk menyatu erat.",
    hardened:
      "<strong>Solusi Sudah Mengeras (Tusuk Garpu):</strong> Tusuk-tusuk permukaan layer mangga secara merata dengan garpu. Lubang-lubang halus ini akan menjadi 'jangkar' bagi cairan vanila hangat agar menempel kuat!",
  };

  tipTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.mode || "ideal";
      tipTabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", String(active));
      });
      if (tipsDemo) tipsDemo.setAttribute("data-mode", mode);
      if (demoCaption && tipCaptions[mode]) {
        demoCaption.innerHTML = tipCaptions[mode];
      }
    });
  });

  /* ------------------------------------------------------------------------
     9. INFOGRAPHIC LIGHTBOX & PRINT BUTTON
     ------------------------------------------------------------------------ */
  const lightbox = document.getElementById("lightbox");
  const lightboxBackdrop = document.getElementById("lightboxBackdrop");
  const lightboxClose = document.getElementById("lightboxClose");
  const openLightboxBtn = document.getElementById("openLightboxBtn");
  const infographicCardTrigger = document.getElementById("infographicCardTrigger");
  const printRecipeBtn = document.getElementById("printRecipeBtn");

  function openLightbox() {
    if (!lightbox) return;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  openLightboxBtn?.addEventListener("click", openLightbox);
  infographicCardTrigger?.addEventListener("click", openLightbox);
  lightboxBackdrop?.addEventListener("click", closeLightbox);
  lightboxClose?.addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox && !lightbox.hidden) {
      closeLightbox();
    }
  });

  printRecipeBtn?.addEventListener("click", () => {
    window.print();
  });
});

