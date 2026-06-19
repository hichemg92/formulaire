// ─── Personnalisation ───────────────────────────────────────
// Ajoutez votre ID Formspree (gratuit sur formspree.io) pour recevoir les réponses par email
const CONFIG = {
  formspreeId: "xkoadzkn",
  coachName: "جلسات تدريب شخصية",
};

const TOTAL_STEPS = 6;
let currentStep = 1;

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
}

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

function validateStep(step) {
  const stepEl = document.querySelector(`.step[data-step="${step}"]`);
  clearErrors(stepEl);
  let valid = true;

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
  if (currentStep > 1) showStep(currentStep - 1);
});

nextBtn.addEventListener("click", () => {
  if (validateStep(currentStep) && currentStep < TOTAL_STEPS) {
    showStep(currentStep + 1);
  }
});

function collectFormData() {
  const data = {};
  const formData = new FormData(form);

  for (const [key, value] of formData.entries()) {
    if (key === "emotionalWounds") {
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
    document.querySelector(".progress-wrap").classList.add("hidden");
    successScreen.classList.remove("hidden");
  } catch {
    submitBtn.disabled = false;
    submitBtn.textContent = "إرسال الاستمارة ✦";
    alert("حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى أو التواصل معي مباشرة.");
  }
});

updateProgress();
