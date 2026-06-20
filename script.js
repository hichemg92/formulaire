// ─── Personnalisation ───────────────────────────────────────
// Ajoutez votre ID Formspree (gratuit sur formspree.io) pour recevoir les réponses par email
const CONFIG = {
  formspreeId: "xkoadzkn",
  coachName: "جلسات تدريب شخصية",
};

const TOTAL_STEPS = 8;
const DRAFT_KEY = "coachingFormDraft";
const MULTI_FIELDS = [
  "emotionalWounds",
  "positiveChanges",
  "coreMotivation",
  "passions",
  "strengthTraits",
  "weaknessTraits",
];

let currentStep = 1;
let autoSaveTimer = null;

const form = document.getElementById("coachingForm");
const steps = document.querySelectorAll(".step");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const progressFill = document.getElementById("progressFill");
const stepLabel = document.getElementById("stepLabel");
const progressPercent = document.getElementById("progressPercent");
const progressBar = document.querySelector(".progress-bar");
const successScreen = document.getElementById("successScreen");
const draftBanner = document.getElementById("draftBanner");
const draftBannerText = document.getElementById("draftBannerText");
const resumeDraftBtn = document.getElementById("resumeDraftBtn");
const discardDraftBtn = document.getElementById("discardDraftBtn");
const saveDraftBtn = document.getElementById("saveDraftBtn");
const draftStatus = document.getElementById("draftStatus");
const draftToast = document.getElementById("draftToast");

document.getElementById("year").textContent = new Date().getFullYear();

function updateProgress() {
  const percent = Math.round((currentStep / TOTAL_STEPS) * 100);
  progressFill.style.width = `${percent}%`;
  progressBar.setAttribute("aria-valuenow", percent);
  stepLabel.textContent = `الخطوة ${currentStep} من ${TOTAL_STEPS}`;
  progressPercent.textContent = `${percent}%`;

  prevBtn.disabled = currentStep === 1;
  nextBtn.classList.toggle("hidden", currentStep === TOTAL_STEPS);
  submitBtn.classList.toggle("hidden", currentStep !== TOTAL_STEPS);
}

function showStep(step) {
  steps.forEach((s) => s.classList.remove("active"));
  document.querySelector(`.step[data-step="${step}"]`).classList.add("active");
  currentStep = step;
  updateProgress();
  window.scrollTo({ top: 0, behavior: "smooth" });
  scheduleAutoSave();
}

function serializeDraft() {
  const data = { step: currentStep, savedAt: Date.now() };
  MULTI_FIELDS.forEach((name) => {
    data[name] = [];
  });

  form.querySelectorAll("input, textarea, select").forEach((field) => {
    const { name, type } = field;
    if (!name) return;

    if (type === "checkbox") {
      if (MULTI_FIELDS.includes(name)) {
        if (field.checked) data[name].push(field.value);
      } else if (field.id === "consent") {
        data.consent = field.checked;
      }
    } else if (type === "radio") {
      if (field.checked) data[name] = field.value;
    } else if (field.value.trim()) {
      data[name] = field.value;
    }
  });

  return data;
}

function hasDraftContent(draft) {
  return Object.keys(draft).some((key) => {
    if (key === "step" || key === "savedAt") return false;
    const value = draft[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value;
    return String(value).trim().length > 0;
  });
}

function saveDraft(showFeedback = false) {
  const draft = serializeDraft();
  if (!hasDraftContent(draft)) {
    if (showFeedback) showDraftToast("لا توجد إجابات للحفظ بعد");
    return false;
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  updateDraftStatus(draft.savedAt);

  if (showFeedback) {
    showDraftToast("تم الحفظ — يمكنك العودة لاحقاً وإكمال الاستمارة");
  }

  return true;
}

function loadDraftFromStorage() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function restoreDraft(draft) {
  form.reset();

  Object.entries(draft).forEach(([key, value]) => {
    if (key === "step" || key === "savedAt") return;

    if (Array.isArray(value)) {
      value.forEach((v) => {
        const input = form.querySelector(`input[name="${key}"][value="${CSS.escape(v)}"]`);
        if (input) input.checked = true;
      });
      return;
    }

    if (key === "consent") {
      const consent = document.getElementById("consent");
      if (consent) consent.checked = !!value;
      return;
    }

    const radio = form.querySelector(`input[name="${key}"][value="${CSS.escape(String(value))}"]`);
    if (radio && radio.type === "radio") {
      radio.checked = true;
      return;
    }

    const field = form.elements.namedItem(key);
    if (field && "value" in field && typeof field.value === "string") {
      field.value = value;
    }
  });

  const step = Math.min(Math.max(Number(draft.step) || 1, 1), TOTAL_STEPS);
  showStep(step);
  draftBanner.classList.add("hidden");
  updateDraftStatus(draft.savedAt);
  showDraftToast("تم استرجاع مسودتك — أكمل من حيث توقفت");
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  draftStatus.textContent = "";
}

function formatDraftTime(timestamp) {
  return new Date(timestamp).toLocaleString("ar", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateDraftStatus(savedAt) {
  if (!savedAt) return;
  draftStatus.textContent = `آخر حفظ: ${formatDraftTime(savedAt)}`;
}

function showDraftToast(message) {
  draftToast.textContent = message;
  draftToast.classList.remove("hidden");
  clearTimeout(showDraftToast.timer);
  showDraftToast.timer = setTimeout(() => {
    draftToast.classList.add("hidden");
  }, 3500);
}

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveDraft(false), 600);
}

function initDraftRestore() {
  const draft = loadDraftFromStorage();
  if (!draft || !hasDraftContent(draft)) return;

  draftBannerText.textContent = `لديك مسودة محفوظة (${formatDraftTime(draft.savedAt)}). هل تريد متابعة التعبئة من حيث توقفت؟`;
  draftBanner.classList.remove("hidden");
}

resumeDraftBtn.addEventListener("click", () => {
  const draft = loadDraftFromStorage();
  if (draft) restoreDraft(draft);
});

discardDraftBtn.addEventListener("click", () => {
  clearDraft();
  draftBanner.classList.add("hidden");
  showDraftToast("تم حذف المسودة — ابدأ من جديد");
});

saveDraftBtn.addEventListener("click", () => saveDraft(true));

form.addEventListener("input", scheduleAutoSave);
form.addEventListener("change", scheduleAutoSave);

function clearErrors(stepEl) {
  stepEl.querySelectorAll(".error").forEach((el) => el.classList.remove("error"));
  stepEl.querySelectorAll(".error-msg").forEach((el) => el.remove());
}

function markError(container, message) {
  container.classList.add("error");
  if (message && !container.querySelector(".error-msg")) {
    const msg = document.createElement("p");
    msg.className = "error-msg";
    msg.textContent = message;
    container.appendChild(msg);
  }
}

function validateCheckboxGroup(stepEl, name, blockId, message) {
  const checked = stepEl.querySelectorAll(`input[name="${name}"]:checked`).length;
  if (checked === 0) {
    const block = document.getElementById(blockId);
    if (block) markError(block, message);
    return false;
  }
  return true;
}

function validateStep(step) {
  const stepEl = document.querySelector(`.step[data-step="${step}"]`);
  clearErrors(stepEl);
  let valid = true;

  if (step === 2 && !validateCheckboxGroup(stepEl, "positiveChanges", "positiveChangesBlock", "يرجى اختيار خيار واحد على الأقل")) {
    valid = false;
  }

  if (step === 4 && !validateCheckboxGroup(stepEl, "coreMotivation", "coreMotivationBlock", "يرجى اختيار خيار واحد على الأقل")) {
    valid = false;
  }

  if (step === 6) {
    if (!validateCheckboxGroup(stepEl, "passions", "passionsBlock", "يرجى اختيار خيار واحد على الأقل")) valid = false;
    if (!validateCheckboxGroup(stepEl, "strengthTraits", "strengthTraitsBlock", "يرجى اختيار خيار واحد على الأقل")) valid = false;
    if (!validateCheckboxGroup(stepEl, "weaknessTraits", "weaknessTraitsBlock", "يرجى اختيار خيار واحد على الأقل")) valid = false;
  }

  stepEl.querySelectorAll("[required]").forEach((field) => {
    if (field.type === "radio") {
      const group = stepEl.querySelectorAll(`input[name="${field.name}"]`);
      const checked = [...group].some((r) => r.checked);
      if (!checked) {
        const block = field.closest(".question-block") || field.closest(".field") || field.closest(".scale-group")?.parentElement;
        if (block) markError(block, "يرجى اختيار إجابة");
        valid = false;
      }
    } else if (field.type === "checkbox" && field.id === "consent") {
      if (!field.checked) {
        markError(field.closest(".field"), "يرجى الموافقة للمتابعة");
        valid = false;
      }
    } else if (!field.value.trim()) {
      markError(field.closest(".field") || field.parentElement, "هذا الحقل مطلوب");
      valid = false;
    }
  });

  return valid;
}

prevBtn.addEventListener("click", () => {
  if (currentStep > 1) {
    saveDraft(false);
    showStep(currentStep - 1);
  }
});

nextBtn.addEventListener("click", () => {
  if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
    saveDraft(false);
    showStep(currentStep + 1);
  }
});

function collectFormData() {
  const data = {};
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (key === "emotionalWounds" || key === "positiveChanges" || key === "coreMotivation" || key === "passions" || key === "strengthTraits" || key === "weaknessTraits") {
      data[key] = data[key] || [];
      data[key].push(value);
    } else {
      data[key] = value;
    }
  }

  data.submittedAt = new Date().toISOString();
  return data;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!validateStep(currentStep)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "جاري الإرسال...";

  const data = collectFormData();

  const FORMSPREE_ID = CONFIG.formspreeId;

  try {
    if (FORMSPREE_ID) {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("send failed");
    } else {
      console.log("Réponses :", data);
      localStorage.setItem("coachingFormLastSubmission", JSON.stringify(data));
      await new Promise((r) => setTimeout(r, 800));
    }

    form.classList.add("hidden");
    document.querySelector(".form-nav").classList.add("hidden");
    document.querySelector(".draft-actions").classList.add("hidden");
    document.querySelector(".progress-wrap").classList.add("hidden");
    draftBanner.classList.add("hidden");
    clearDraft();
    successScreen.classList.remove("hidden");
  } catch {
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال الاستمارة ✦";
    alert("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى أو التواصل معي مباشرة.");
  }
});

updateProgress();
initDraftRestore();
