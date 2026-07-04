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

const auditDate = document.getElementById("auditDate");
const auditTime = document.getElementById("auditTime");

auditDate.valueAsDate = new Date();
const now = new Date();
auditTime.value = now.toTimeString().slice(0, 5);

document.getElementById("startAudit").addEventListener("click", () => {
  const auditor = document.getElementById("auditor").value.trim();
  const outlet = document.getElementById("outlet").value.trim();

  if (!auditor || !outlet) {
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
      <div class="options audit-only-field">
        <button type="button" class="yes" onclick="selectAnswer(${number}, 'yes', this)">✓ Yes</button>
        <button type="button" class="no" onclick="selectAnswer(${number}, 'no', this)">✗ No</button>
        <button type="button" class="na" onclick="selectAnswer(${number}, 'na', this)">N/A</button>
      </div>
      <div class="action-box" id="action-${number}">
        <textarea class="audit-only-input" id="comment-${number}" placeholder="Finding / Comment"></textarea>
        <label class="photoLabel audit-only-field">📷 Evidence Photo</label>
        <input class="audit-only-input" type="file" id="photo-${number}" accept="image/*" capture="environment" onchange="previewPhoto(${number}, this)">
        <img id="preview-${number}" class="previewImage" style="display:none;">
        <textarea class="action-input" id="actionText-${number}" placeholder="Action to be taken"></textarea>
        <input class="action-input" type="text" id="responsible-${number}" placeholder="Responsible Person">
        <input class="action-input" type="date" id="deadline-${number}">
        <input class="action-input" type="text" id="verification-${number}" placeholder="Verification / Closure Notes">
      </div>
    `;

    checklist.appendChild(div);
  });
}

function selectAnswer(number, value, button) {
  answers[number] = value;
  const buttons = button.parentElement.querySelectorAll("button");
  buttons.forEach(btn => btn.classList.remove("selected"));
  button.classList.add("selected", value);

  const actionBox = document.getElementById(`action-${number}`);
  actionBox.style.display = value === "no" ? "block" : "none";
  calculateScore();
}

document.getElementById("calculateScore").addEventListener("click", calculateScore);
document.getElementById("generatePdf").addEventListener("click", generatePdf);
document.getElementById("emailReport").addEventListener("click", emailReport);

function calculateScore() {
  let yes = 0;
  let no = 0;
  let na = 0;

  Object.values(answers).forEach(answer => {
    if (answer === "yes") yes++;
    if (answer === "no") no++;
    if (answer === "na") na++;
  });

  const totalApplicable = yes + no;
  const score = totalApplicable > 0 ? ((yes / totalApplicable) * 100).toFixed(2) : "0.00";

  document.getElementById("yesCount").textContent = yes;
  document.getElementById("noCount").textContent = no;
  document.getElementById("naCount").textContent = na;
  document.getElementById("score").textContent = `${score}%`;
  document.getElementById("score").style.color = Number(score) >= 90 ? "#16a34a" : "#dc2626";
}

function generatePdf() {
  calculateScore();
  window.print();
}

function emailReport() {
  calculateScore();
  const subject = encodeURIComponent("Food Safety Checklist & Action Form");
  const body = encodeURIComponent(
    "Dear Team,\n\nPlease find the Food Safety Checklist & Action Form PDF attached. " +
    "Action owners should complete only the 'Action to be taken' section, responsible person, deadline, and verification/closure notes.\n\n" +
    `Audit Date: ${auditDate.value}\nOutlet / Unit: ${document.getElementById("outlet").value}\n\n` +
    "If needed, open the checklist in action-only mode by adding ?mode=action to the app URL.\n\n" +
    "Doc ID: SSP-FSMS-FM-083; Vs 0.0; Issue Date : 10.08.2024"
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function applyActionOnlyMode() {
  if (!actionOnlyMode) return;

  document.body.classList.add("action-only-mode");
  document.querySelectorAll("#auditor, #outlet, #auditDate, #auditTime, .audit-only-input")
    .forEach(field => { field.disabled = true; });
  document.querySelectorAll(".audit-only-field button")
    .forEach(button => { button.disabled = true; });
  document.querySelectorAll(".action-box")
    .forEach(box => { box.style.display = "block"; });
  document.getElementById("modeNotice").style.display = "block";
}

if (actionOnlyMode) {
  document.getElementById("auditSection").style.display = "block";
  renderChecklist();
  applyActionOnlyMode();
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

function previewPhoto(number, input) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = document.getElementById(`preview-${number}`);
    img.src = e.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
}
