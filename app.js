const checklistItems = [
  "No evidence of PEST activity",
  "PEST treatment done in the last month",
  "Chiller/freezer temperatures are correct",
  "Chiller/freezer temperatures are taken 3 times daily",
  "Maintenance Issues are being recorded and communicated",
  "Team knows how and where to dispose broken glass/crockery",
  "No threat which could result to trip, slip or fall",
  "Manual handling performed as per guidelines",
  "Waste disposal performed as per procedures",
  "Hands are being sanitized correctly",
  "Hand washing sink is in good working order and equipped with soap/sanitizer and paper towel",
  "Uniforms are clean and neatly worn",
  "Gloves or appropriate utensil is being used when handling food",
  "The updated shelf-life guide is available",
  "Areas are cleaned/sanitized",
  "Equipment is clean/sanitized",
  "Cleaning checklists are complete and correct",
  "MSDS files for all chemicals are available",
  "Chemicals are being correctly used",
  "Ice Machine is clean inside out",
  "Ice Machine cleaning record is complete",
  "Food is stored in the correct temperature range",
  "Fire Extinguishers are available and ready to use",
  "Fire Extinguisher checklist is complete monthly",
  "First Aid Box is available and complete",
  "The First aid inventory card is completed for the last month",
  "Products are day dotted according to the shelf-life guide",
  "FIFO is applicable",
  "No expired products found",
  "Correct color coding is applicable",
  "Food in hot & cold holding is in the proper temperature range",
  "Cold & Hot Holding temperature record is complete and correct",
  "Thermometers are being calibrated weekly",
  "Fruit & Veg Sanitation record is complete and correct",
  "Food in chiller is stored as per the chiller guide",
  "Foods are stored in the correct temperature",
  "Cooking/reheating records are complete and correct",
  "Foods are stored in closed food grade containers",
  "Cooling records are complete and correct",
  "Cold water thawing records are complete and correct",
  "Products thawed in the chiller are clearly marked and placed on the designated shelf",
  "Grease traps were cleaned in the last month",
  "Hoods/exhaust fans were cleaned in the last 3 months",
  "Knives handover and inventory logs are complete and correct",
  "Knives are safely used",
  "Quality Check is complete"
];

const answers = {};
const actionOnlyMode = new URLSearchParams(window.location.search).get("mode") === "action";

const auditDateInput = document.getElementById("auditDate");
const auditTimeInput = document.getElementById("auditTime");

auditDateInput.valueAsDate = new Date();

const now = new Date();
auditTimeInput.value = now.toTimeString().slice(0, 5);

document.getElementById("startAudit").addEventListener("click", () => {
  const auditor = document.getElementById("auditor").value.trim();
  const outlet = document.getElementById("outlet").value.trim();

  if (!actionOnlyMode && (!auditor || !outlet)) {
    alert("Please enter Auditor Name and Outlet / Unit.");
    return;
  }

  document.getElementById("auditSection").style.display = "block";
  renderChecklist();
  applyActionOnlyMode();
  window.scrollTo({ top: document.getElementById("auditSection").offsetTop, behavior: "smooth" });
});

function renderChecklist() {
  const checklist = document.getElementById("checklist");
  checklist.innerHTML = "";

  checklistItems.forEach((item, index) => {
    const number = index + 1;

    const div = document.createElement("div");
    div.className = "check-item";

    div.innerHTML = `
      <div class="check-title">${number}. ${item}</div>

      <div class="options">
        <button type="button" class="yes answer-button" onclick="selectAnswer(${number}, 'yes', this)">✓ Yes</button>
        <button type="button" class="no answer-button" onclick="selectAnswer(${number}, 'no', this)">✗ No</button>
        <button type="button" class="na answer-button" onclick="selectAnswer(${number}, 'na', this)">N/A</button>
      </div>

      <div class="action-box" id="action-${number}" aria-live="polite">
        <textarea id="comment-${number}" placeholder="Finding / Comment"></textarea>

        <label class="photoLabel" for="photo-${number}">📷 Evidence Photo <span class="required">Required for No answers</span></label>
        <input
          type="file"
          id="photo-${number}"
          accept="image/*"
          capture="environment"
          onchange="previewPhoto(${number}, this)"
        >
        <p class="photo-help" id="photo-help-${number}">Please attach photo proof before calculating the score.</p>

        <img
          id="preview-${number}"
          class="previewImage"
          alt="Evidence preview for checklist item ${number}"
          style="display:none;"
        >

        <textarea id="actionText-${number}" placeholder="Corrective Action"></textarea>
        <input type="text" id="responsible-${number}" placeholder="Responsible Person">
        <input type="date" id="deadline-${number}">
        <input type="text" id="verification-${number}" placeholder="Verification">
      </div>
    `;

    checklist.appendChild(div);
  });
}

function applyActionOnlyMode() {
  if (!actionOnlyMode) return;

  document.body.classList.add("action-only");
  const notice = document.getElementById("actionModeNotice");
  if (notice) notice.style.display = "block";

  document.querySelectorAll(".action-box").forEach(actionBox => {
    actionBox.style.display = "block";
  });

  document.querySelectorAll(".answer-button").forEach(button => {
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");
  });

  document.querySelectorAll("#auditor, #outlet, #auditDate, #auditTime").forEach(input => {
    input.readOnly = true;
  });
}

function selectAnswer(number, value, button) {
  if (actionOnlyMode) return;
  answers[number] = value;

  const parent = button.parentElement;
  const buttons = parent.querySelectorAll("button");

  buttons.forEach(btn => btn.classList.remove("selected"));

  button.classList.add("selected");

  const actionBox = document.getElementById(`action-${number}`);
  const photoInput = document.getElementById(`photo-${number}`);

  if (value === "no") {
    actionBox.style.display = "block";
    photoInput.required = true;
  } else {
    actionBox.style.display = "none";
    photoInput.required = false;
    photoInput.classList.remove("missing-photo");
  }

  calculateScore({ validatePhotos: false });
}

document.getElementById("calculateScore").addEventListener("click", () => {
  calculateScore({ validatePhotos: true });
});

document.getElementById("generatePdf").addEventListener("click", generatePdf);
document.getElementById("emailReport").addEventListener("click", emailReport);

function getMissingNoPhotoItems() {
  return Object.entries(answers)
    .filter(([, answer]) => answer === "no")
    .map(([number]) => Number(number))
    .filter(number => {
      const photoInput = document.getElementById(`photo-${number}`);
      return !photoInput || photoInput.files.length === 0;
    });
}

function calculateScore(options = {}) {
  const { validatePhotos = false } = options;
  const missingNoPhotoItems = getMissingNoPhotoItems();

  document.querySelectorAll(".missing-photo").forEach(input => {
    input.classList.remove("missing-photo");
  });

  if (validatePhotos && missingNoPhotoItems.length > 0) {
    missingNoPhotoItems.forEach(number => {
      const photoInput = document.getElementById(`photo-${number}`);
      photoInput.classList.add("missing-photo");
    });

    alert(`Photo proof is required for every No answer. Please add evidence photo(s) for item(s): ${missingNoPhotoItems.join(", ")}.`);
    document.getElementById(`photo-${missingNoPhotoItems[0]}`).focus();
    return false;
  }

  let yes = 0;
  let no = 0;
  let na = 0;

  Object.values(answers).forEach(answer => {
    if (answer === "yes") yes++;
    if (answer === "no") no++;
    if (answer === "na") na++;
  });

  const totalApplicable = yes + no;
  const score = totalApplicable > 0 ? ((yes / totalApplicable) * 100).toFixed(2) : 0;

  document.getElementById("yesCount").textContent = yes;
  document.getElementById("noCount").textContent = no;
  document.getElementById("naCount").textContent = na;
  document.getElementById("score").textContent = `${score}%`;

  const scoreBox = document.getElementById("score");

  if (score >= 90) {
    scoreBox.style.color = "#16a34a";
  } else {
    scoreBox.style.color = "#dc2626";
  }

  return true;
}

function previewPhoto(number, input) {
  const file = input.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const img = document.getElementById(`preview-${number}`);

    img.src = e.target.result;
    img.style.display = "block";
    input.classList.remove("missing-photo");
  };

  reader.readAsDataURL(file);
}

function getReportSummary() {
  const auditor = document.getElementById("auditor").value.trim() || "Not provided";
  const outlet = document.getElementById("outlet").value.trim() || "Not provided";
  const auditDate = document.getElementById("auditDate").value || "Not provided";
  const auditTime = document.getElementById("auditTime").value || "Not provided";
  const score = document.getElementById("score").textContent;

  const actionItems = Object.entries(answers)
    .filter(([, answer]) => answer === "no")
    .map(([number]) => {
      const itemNumber = Number(number);
      const comment = document.getElementById(`comment-${itemNumber}`).value.trim() || "No finding/comment entered";
      const actionText = document.getElementById(`actionText-${itemNumber}`).value.trim() || "No corrective action entered";
      const responsible = document.getElementById(`responsible-${itemNumber}`).value.trim() || "Unassigned";
      const deadline = document.getElementById(`deadline-${itemNumber}`).value || "No deadline";
      const verification = document.getElementById(`verification-${itemNumber}`).value.trim() || "No verification entered";

      return `${itemNumber}. ${checklistItems[itemNumber - 1]}\nFinding: ${comment}\nCorrective Action: ${actionText}\nResponsible: ${responsible}\nDeadline: ${deadline}\nVerification: ${verification}`;
    });

  return `Food Safety Checklist & Action Form\nAuditor: ${auditor}\nOutlet / Unit: ${outlet}\nAudit Date: ${auditDate}\nAudit Time: ${auditTime}\nScore: ${score}\n\nCorrective Actions\n${actionItems.length ? actionItems.join("\n\n") : "No corrective actions recorded."}\n\nDoc ID: SSP-FSMS-FM-083; Vs 0.0; Issue Date : 10.08.2024`;
}

function generatePdf() {
  if (!calculateScore({ validatePhotos: true })) return;
  window.print();
}

function emailReport() {
  if (!calculateScore({ validatePhotos: true })) return;

  const subject = encodeURIComponent("Food Safety Checklist & Action Form");
  const body = encodeURIComponent(`${getReportSummary()}\n\nAction-only link: ${window.location.origin}${window.location.pathname}?mode=action`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

if (actionOnlyMode) {
  document.getElementById("startAudit").textContent = "Open Action Form";
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}
