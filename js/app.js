document.documentElement.classList.add("js");

// Add a client-approved endpoint or inbox before accepting live enquiries.
// This demo intentionally stores no personal data.
const ENQUIRY_ENDPOINT = "";
const ENQUIRY_EMAIL = "";

const menuButton = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector("#primary-nav");

if (menuButton && primaryNav) {
  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
    primaryNav.classList.remove("is-open");
  };

  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.setAttribute("aria-label", open ? "Open navigation" : "Close navigation");
    primaryNav.classList.toggle("is-open", !open);
  });

  primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

const planner = document.querySelector("#solar-planner");
const plannerTitle = document.querySelector("#planner-result-title");
const plannerCopy = document.querySelector("#planner-result-copy");
const plannerButton = document.querySelector("#planner-to-enquiry");
const enquiryForm = document.querySelector("#enquiry-form");
const interestField = document.querySelector("#interest");
const messageField = document.querySelector("#message");
const fullNameField = document.querySelector("#full-name");
const formError = document.querySelector("#form-error");
const formStatus = document.querySelector("#form-status");

const propertyDetails = {
  home: {
    label: "Home",
    lead: "Start with your roof and energy use.",
    note: "We’ll talk through roof direction, shade and when you use electricity—then explain the options in plain language."
  },
  business: {
    label: "Business",
    lead: "Start with your site and operating rhythm.",
    note: "Share the site, working hours and the energy needs you want to plan around. We’ll help frame useful questions."
  },
  remote: {
    label: "Remote site",
    lead: "Start with the power your site depends on.",
    note: "Begin with energy needs, site conditions and storage questions before discussing possible next steps."
  }
};

const priorityDetails = {
  panels: { label: "solar panels", copy: "Explore how rooftop solar may fit." },
  battery: { label: "solar and a battery", copy: "Compare solar generation with storage options." },
  unsure: { label: "the right starting point", copy: "Get a plain-language conversation before deciding." }
};

function currentPlan() {
  const property = planner?.querySelector('input[name="property"]:checked')?.value || "home";
  const priority = planner?.querySelector('input[name="priority"]:checked')?.value || "panels";
  const place = propertyDetails[property] || propertyDetails.home;
  const goal = priorityDetails[priority] || priorityDetails.panels;
  const title = property === "home"
    ? (priority === "battery" ? "Explore storage for your home." : priority === "unsure" ? "Start with a conversation." : place.lead)
    : property === "business"
      ? (priority === "battery" ? "Compare options for your business." : priority === "unsure" ? "Start with your operating needs." : place.lead)
      : (priority === "unsure" ? "Map the energy your site needs." : place.lead);
  return { property, priority, place, goal, title, message: `${place.label}: ${goal.label}. ${place.note} ${goal.copy}` };
}

function updatePlanner() {
  if (!planner || !plannerTitle || !plannerCopy) return;
  const plan = currentPlan();
  plannerTitle.textContent = plan.title;
  plannerCopy.textContent = `${plan.place.note} ${plan.goal.copy} This is a conversation starter, not a quote.`;
  planner.dataset.selectedProperty = plan.property;
  planner.dataset.selectedPriority = plan.priority;
}

if (planner) {
  planner.querySelectorAll('input[name="property"], input[name="priority"]').forEach((input) => {
    input.addEventListener("change", updatePlanner);
  });
  updatePlanner();
}

document.querySelectorAll("[data-property]").forEach((link) => {
  link.addEventListener("click", () => {
    const propertyInput = planner?.querySelector(`input[name="property"][value="${link.dataset.property}"]`);
    if (!propertyInput) return;
    propertyInput.checked = true;
    updatePlanner();
  });
});

function interestForPlan(plan) {
  if (plan.property === "remote") return "Off-grid systems";
  if (plan.property === "business") return "Business solar";
  if (plan.priority === "battery") return "Solar and a battery";
  if (plan.priority === "panels") return "Solar panels";
  return "I'm still exploring";
}

if (plannerButton && enquiryForm && interestField && messageField) {
  plannerButton.addEventListener("click", () => {
    const plan = currentPlan();
    interestField.value = interestForPlan(plan);
    messageField.value = plan.message;
    if (formError) formError.textContent = "";
    if (formStatus) formStatus.textContent = "Your planner choices have been added. Complete the form to continue.";
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => fullNameField?.focus({ preventScroll: true }), 450);
  });
}

document.querySelectorAll("[data-interest]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!interestField) return;
    interestField.value = link.dataset.interest || "";
    if (formStatus) formStatus.textContent = `Selected: ${interestField.value}. Complete the form to continue.`;
  });
});

function validateForm() {
  if (!enquiryForm || !formError) return false;
  formError.textContent = "";
  delete formError.dataset.field;
  const requiredFields = [...enquiryForm.querySelectorAll("[required]")];
  requiredFields.forEach((field) => field.removeAttribute("aria-invalid"));
  const invalidField = requiredFields.find((field) => !field.checkValidity());
  if (!invalidField) return true;

  invalidField.setAttribute("aria-invalid", "true");
  formError.dataset.field = invalidField.id;
  formError.textContent = invalidField.validity.valueMissing
    ? "Please complete this field so we know where to start."
    : invalidField.validity.typeMismatch
      ? "Please enter a valid email address."
      : "Please check this field and try again.";
  invalidField.focus();
  return false;
}

function setFormStatus(message, success = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("is-success", success);
}

if (enquiryForm && formError && formStatus) {
  enquiryForm.querySelectorAll("[required]").forEach((field) => {
    const clearFieldError = () => {
      field.removeAttribute("aria-invalid");
      if (formError.dataset.field === field.id) {
        formError.textContent = "";
        delete formError.dataset.field;
      }
    };
    field.addEventListener("input", clearFieldError);
    field.addEventListener("change", clearFieldError);
  });

  enquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setFormStatus("");
    if (!validateForm()) return;

    const submitButton = enquiryForm.querySelector('[type="submit"]');
    const payload = new FormData(enquiryForm);

    if (ENQUIRY_ENDPOINT.trim()) {
      if (submitButton) submitButton.disabled = true;
      enquiryForm.setAttribute("aria-busy", "true");
      setFormStatus("Sending your enquiry…");
      try {
        const response = await fetch(ENQUIRY_ENDPOINT, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" }
        });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        enquiryForm.reset();
        setFormStatus("Thank you. Your enquiry has been sent.", true);
      } catch (error) {
        setFormStatus("We couldn’t send the enquiry just now. Please try again or contact the business directly.");
        console.error("Enquiry submission failed.", error);
      } finally {
        if (submitButton) submitButton.disabled = false;
        enquiryForm.removeAttribute("aria-busy");
      }
      return;
    }

    if (ENQUIRY_EMAIL.trim()) {
      const values = Object.fromEntries(payload.entries());
      const subject = `Solar enquiry — ${values.interest || "general question"}`;
      const body = [
        `Name: ${values.name || ""}`,
        `Email: ${values.email || ""}`,
        `Phone: ${values.phone || "Not supplied"}`,
        `Area / postcode: ${values.location || "Not supplied"}`,
        `Interest: ${values.interest || "Not supplied"}`,
        "",
        "Message:",
        values.message || "Not supplied"
      ].join("\n");
      window.location.href = `mailto:${ENQUIRY_EMAIL.trim()}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setFormStatus("A prepared enquiry has been opened in your email app. Review it and press Send to deliver it.", true);
      return;
    }

    setFormStatus("Your details are valid, but no business inbox or form endpoint is connected in this preview. Add one near the top of public/js/app.js before launch.");
  });
}

const year = document.querySelector("#year");
if (year) year.textContent = String(new Date().getFullYear());

const monthlyBillField = document.querySelector("#monthly-bill");
const billAreaField = document.querySelector("#bill-area");
const useTimingField = document.querySelector("#use-timing");
const batteryInterestField = document.querySelector("#battery-interest");
const annualSpendOutput = document.querySelector("#annual-spend");
const calculatorInsight = document.querySelector("#calculator-insight");
const addBillToEnquiryButton = document.querySelector("#add-bill-to-enquiry");
const billEnergyFlow = document.querySelector("#bill-energy-flow");
const flowSolarStatus = document.querySelector("#flow-solar-status");
const flowUseStatus = document.querySelector("#flow-use-status");
const flowStorageStatus = document.querySelector("#flow-storage-status");

const timingLabels = {
  daytime: "Most use: daylight",
  evening: "Most use: evening",
  mixed: "Use varies"
};

function updateEnergyFlowCue() {
  if (!billEnergyFlow) return;
  const timing = useTimingField?.value || "mixed";
  const storageSelected = Boolean(batteryInterestField?.checked);
  billEnergyFlow.dataset.timing = timing;
  billEnergyFlow.dataset.storage = storageSelected ? "on" : "off";
  if (flowSolarStatus) flowSolarStatus.textContent = "Generated in daylight";
  if (flowUseStatus) flowUseStatus.textContent = timingLabels[timing] || timingLabels.mixed;
  if (flowStorageStatus) flowStorageStatus.textContent = storageSelected ? "Selected to compare" : "Optional · off";
}

const timingNotes = {
  daytime: "If most power is used in daylight, ask how panel generation could align with your routine.",
  evening: "If more power is used later, compare storage options against the tariffs available to you.",
  mixed: "Map when power is used before comparing panels-only with storage options."
};

function billSnapshot() {
  const raw = monthlyBillField?.value.trim() || "";
  const monthly = Number(raw);
  if (!raw || !Number.isFinite(monthly) || monthly <= 0) return null;
  const annual = monthly * 12;
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
  return { monthly: formatter.format(monthly), annual: formatter.format(annual) };
}

function updateBillPlanner() {
  updateEnergyFlowCue();
  if (!annualSpendOutput || !calculatorInsight) return;
  const snapshot = billSnapshot();
  if (!snapshot) {
    annualSpendOutput.textContent = "Enter a monthly bill to begin.";
    calculatorInsight.textContent = "No tariff, system price or savings assumption is built in.";
    return;
  }
  annualSpendOutput.textContent = `${snapshot.annual} per year`;
  const batteryNote = batteryInterestField?.checked
    ? " Include a separate battery conversation if storage interests you."
    : "";
  calculatorInsight.textContent = `${timingNotes[useTimingField?.value] || timingNotes.mixed}${batteryNote} This is bill arithmetic only—not solar savings or payback.`;
}

[monthlyBillField, billAreaField, useTimingField, batteryInterestField].filter(Boolean).forEach((field) => {
  field.addEventListener("input", updateBillPlanner);
  field.addEventListener("change", updateBillPlanner);
});
updateBillPlanner();
if (addBillToEnquiryButton && enquiryForm && interestField && messageField) {
  addBillToEnquiryButton.addEventListener("click", () => {
    const snapshot = billSnapshot();
    if (!snapshot) {
      if (calculatorInsight) calculatorInsight.textContent = "Enter a monthly amount greater than zero first. No solar savings estimate is available in this planner.";
      monthlyBillField?.focus();
      return;
    }
    const timingLabel = useTimingField?.selectedOptions?.[0]?.textContent || "It varies through the day";
    const area = billAreaField?.value.trim() || "Not supplied";
    const battery = Boolean(batteryInterestField?.checked);
    const details = [
      "Bill planner snapshot (not a savings forecast)",
      `Monthly bill: ${snapshot.monthly} in the currency entered`,
      `Annual bill: ${snapshot.annual} in the same currency (monthly amount × 12 only)`,
      `Area / postcode: ${area}`,
      `Usual electricity timing: ${timingLabel}`,
      `Battery options: ${battery ? "Please include them" : "Not selected"}`
    ].join("\n");
    interestField.value = battery ? "Solar and a battery" : "Solar panels";
    messageField.value = messageField.value.trim() ? `${messageField.value.trim()}\n\n${details}` : details;
    if (formError) formError.textContent = "";
    setFormStatus("Your bill-planner details have been added. Complete the form to continue.");
    document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => fullNameField?.focus({ preventScroll: true }), 450);
  });
}

const dayCycle = document.querySelector("[data-day-cycle]");
const dayCycleStages = [
  { id: "morning", label: "Morning", summary: "Sunrise · generation begins", solar: "Building", use: "Morning use", storage: "May be available later", levels: [22, 24, 8] },
  { id: "daylight", label: "Daytime", summary: "Brighter sun · generation may be stronger", solar: "Available in daylight", use: "Changes with routine", storage: "Optional to explore", levels: [88, 55, 68] },
  { id: "evening", label: "Evening", summary: "Warm light · generation eases", solar: "Tapering off", use: "May rise later", storage: "May support later use", levels: [28, 76, 56] },
  { id: "night", label: "Night", summary: "Subtle light · storage may support later use", solar: "No daylight generation", use: "Routine-dependent", storage: "Stored power may be used", levels: [0, 54, 38] }
];

if (dayCycle) {
  const reduceDayMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cycleLabel = dayCycle.querySelector("[data-cycle-label]");
  const cycleSummary = dayCycle.querySelector("[data-cycle-summary]");
  const cycleSteps = [...dayCycle.querySelectorAll("[data-cycle-step]")];
  const cycleToggle = dayCycle.querySelector("[data-cycle-toggle]");
  const cycleToggleLabel = cycleToggle?.querySelector("[data-cycle-toggle-label]");
  const cycleToggleIcon = cycleToggle?.querySelector("[data-cycle-toggle-icon]");
  let activeStage = 0;
  let cycleTimer = null;
  let userStartedCycle = false;
  let manuallyPausedCycle = false;
  let cycleVisible = !("IntersectionObserver" in window);

  const showDayStage = (index) => {
    const stage = dayCycleStages[index];
    activeStage = index;
    dayCycle.dataset.stage = stage.id;
    dayCycle.querySelector(".day-scene")?.setAttribute("data-stage", stage.id);
    if (cycleLabel) cycleLabel.textContent = stage.label;
    if (cycleSummary) cycleSummary.textContent = stage.summary;
    cycleSteps.forEach((step) => step.classList.toggle("is-current", step.dataset.cycleStep === stage.id));
    ["solar", "use", "storage"].forEach((name, offset) => {
      const value = dayCycle.querySelector(`[data-cycle-value="${name}"]`);
      const bar = dayCycle.querySelector(`[data-cycle-bar="${name}"]`);
      if (value) value.textContent = stage[name];
      if (bar) bar.style.width = `${stage.levels[offset]}%`;
    });
  };

  const stopDayCycle = () => {
    if (cycleTimer !== null) window.clearInterval(cycleTimer);
    cycleTimer = null;
    syncCycleToggle();
  };

  const syncCycleToggle = () => {
    if (!cycleToggle) return;
    const isPlaying = cycleTimer !== null;
    const label = isPlaying ? "Pause day cycle" : userStartedCycle ? "Resume day cycle" : "Start day cycle";
    cycleToggle.setAttribute("aria-pressed", String(isPlaying));
    cycleToggle.setAttribute("aria-label", `${label} animation`);
    if (cycleToggleLabel) cycleToggleLabel.textContent = label;
    if (cycleToggleIcon) cycleToggleIcon.textContent = isPlaying ? "Ⅱ" : "▶";
  };

  const startDayCycle = () => {
    if (!userStartedCycle || manuallyPausedCycle || cycleTimer !== null || document.hidden || !cycleVisible) return;
    cycleTimer = window.setInterval(() => showDayStage((activeStage + 1) % dayCycleStages.length), 5200);
    syncCycleToggle();
  };

  showDayStage(0);
  syncCycleToggle();
  cycleToggle?.addEventListener("click", () => {
    if (cycleTimer !== null) {
      manuallyPausedCycle = true;
      stopDayCycle();
      return;
    }
    userStartedCycle = true;
    manuallyPausedCycle = false;
    showDayStage((activeStage + 1) % dayCycleStages.length);
    startDayCycle();
    syncCycleToggle();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(([entry]) => {
      cycleVisible = entry.isIntersecting;
      if (cycleVisible) startDayCycle();
      else stopDayCycle();
    }, { threshold: 0.25 });
    observer.observe(dayCycle);
  }

  document.addEventListener("visibilitychange", () => document.hidden ? stopDayCycle() : startDayCycle());
  reduceDayMotion.addEventListener?.("change", (event) => {
    if (event.matches && cycleTimer !== null) {
      manuallyPausedCycle = true;
      stopDayCycle();
    }
  });
}


// Progressive reveals stay visible without IntersectionObserver or when motion is reduced.
// The observer never changes DOM order or layout.
const revealQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
const revealSelector = ".section-heading, .service-card, .product-card, .application-card, .flow-step, .roof-card, .day-timeline, .bill-section__copy, .faq-intro, .faq-item";
const revealTargets = [...document.querySelectorAll(revealSelector)];
const revealRoot = document.documentElement;
const revealGroups = document.querySelectorAll(".service-grid, .product-grid, .application-grid, .flow-steps, .roof-card-list, .faq-list");
const staggerItemSelector = ".service-card, .product-card, .application-card, .flow-step, .roof-card, .faq-item";

revealTargets.forEach((target) => target.classList.add("scroll-reveal"));
revealGroups.forEach((group) => {
  let itemIndex = 0;
  [...group.children].forEach((child) => {
    if (child.matches(staggerItemSelector)) {
      child.style.setProperty("--reveal-delay", `${Math.min(itemIndex++, 5) * 70}ms`);
    }
  });
});

let revealObserver = null;
const startScrollReveals = () => {
  if (!revealQuery || revealQuery.matches || !("IntersectionObserver" in window)) {
    revealRoot.classList.remove("has-scroll-reveal");
    revealTargets.forEach((target) => target.classList.add("is-revealed"));
    return;
  }

  revealRoot.classList.add("has-scroll-reveal");
  revealObserver?.disconnect();
  revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-revealed");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });

  revealTargets.forEach((target) => {
    if (!target.classList.contains("is-revealed")) revealObserver.observe(target);
  });
};

startScrollReveals();
revealQuery?.addEventListener?.("change", (event) => {
  revealObserver?.disconnect();
  if (event.matches) {
    revealRoot.classList.remove("has-scroll-reveal");
    revealTargets.forEach((target) => target.classList.add("is-revealed"));
    return;
  }
  revealTargets.forEach((target) => target.classList.remove("is-revealed"));
  startScrollReveals();
});
