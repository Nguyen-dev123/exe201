const openDialog = ({ title = "HOCA", message, input = false, defaultValue = "", type = "text", confirmText = "Xác nhận", cancelText = "Hủy", destructive = false, alertOnly = false }) => new Promise((resolve) => {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm";
  overlay.setAttribute("role", "presentation");
  const panel = document.createElement("div");
  panel.className = "w-full max-w-md rounded-2xl border border-white/10 bg-[#171b2e] p-6 text-white shadow-2xl";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");

  const heading = document.createElement("h2");
  heading.className = "text-xl font-bold";
  heading.textContent = title;
  const description = document.createElement("p");
  description.className = "mt-2 whitespace-pre-wrap text-sm leading-6 text-white/60";
  description.textContent = String(message || "");
  panel.append(heading, description);

  let field = null;
  let secondaryField = null;
  let tertiaryField = null;
  let readValue = () => field?.value ?? "";
  if (input) {
    if (type === "datetime-local") {
      const [initialDate = "", initialTime = ""] = String(defaultValue || "").split("T");
      const grid = document.createElement("div");
      grid.className = "mt-4 grid grid-cols-[1.35fr_0.85fr] gap-3";
      const makePicker = (pickerType, labelText, value, emptyText) => {
        const label = document.createElement("div");
        label.className = "block text-xs font-medium text-white/55";
        label.append(document.createTextNode(labelText));
        const shell = document.createElement("span");
        shell.className = "relative mt-1.5 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-[#252837] px-4 text-sm transition hover:border-primary/60 hover:bg-[#2b2e3e] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
        shell.tabIndex = 0;
        shell.setAttribute("role", "button");
        const iconBox = document.createElement("span");
        iconBox.className = "shrink-0 text-primary";
        iconBox.innerHTML = pickerType === "date"
          ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 2v4M16 2v4M3 10h18"/><rect x="3" y="4" width="18" height="18" rx="2"/></svg>'
          : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
        const display = document.createElement("span");
        const format = (next) => pickerType === "date" && next ? next.split("-").reverse().join("/") : next;
        display.textContent = format(value) || emptyText;
        display.className = value ? "font-medium text-white" : "text-white/35";
        const picker = document.createElement("input");
        picker.type = pickerType;
        picker.value = value;
        picker.className = "pointer-events-none absolute h-px w-px opacity-0";
        picker.addEventListener("input", () => {
          display.textContent = format(picker.value) || emptyText;
          display.className = picker.value ? "font-medium text-white" : "text-white/35";
        });
        const openPicker = () => {
          try { if (typeof picker.showPicker === "function") picker.showPicker(); else picker.click(); }
          catch { picker.focus(); }
        };
        shell.addEventListener("click", openPicker);
        shell.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openPicker(); } });
        shell.append(iconBox, display);
        label.append(shell, picker);
        return { label, picker };
      };
      const datePicker = makePicker("date", "Ngày", initialDate, "Chọn ngày");
      const timeLabel = document.createElement("div");
      timeLabel.className = "block text-xs font-medium text-white/55";
      timeLabel.append(document.createTextNode("Giờ"));
      const timeShell = document.createElement("div");
      timeShell.className = "mt-1.5 flex min-h-12 items-center gap-1 rounded-xl border border-white/10 bg-[#252837] px-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20";
      const timeIcon = document.createElement("span");
      timeIcon.className = "shrink-0 text-primary";
      timeIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
      const makeSelect = (ariaLabel, max, selected, placeholder) => {
        const select = document.createElement("select");
        select.setAttribute("aria-label", ariaLabel);
        select.className = "min-w-0 flex-1 cursor-pointer bg-transparent py-3 text-center text-sm font-semibold text-white outline-none [color-scheme:dark]";
        const empty = document.createElement("option"); empty.value = ""; empty.disabled = true; empty.textContent = placeholder; select.append(empty);
        for (let index = 0; index <= max; index += 1) {
          const option = document.createElement("option"); option.value = String(index).padStart(2, "0"); option.textContent = option.value; select.append(option);
        }
        select.value = selected || "";
        return select;
      };
      const [initialHour = "", initialMinute = ""] = initialTime.split(":");
      const hourSelect = makeSelect("Giờ theo định dạng 24 giờ", 23, initialHour, "Giờ");
      const minuteSelect = makeSelect("Phút", 59, initialMinute, "Phút");
      const separator = document.createElement("span"); separator.className = "font-bold text-white/35"; separator.textContent = ":";
      timeShell.append(timeIcon, hourSelect, separator, minuteSelect);
      timeLabel.append(timeShell);
      field = datePicker.picker;
      secondaryField = hourSelect;
      tertiaryField = minuteSelect;
      readValue = () => field.value ? `${field.value}T${secondaryField.value || "08"}:${tertiaryField.value || "00"}` : "";
      grid.append(datePicker.label, timeLabel);
      panel.append(grid);
    } else {
      field = document.createElement("input");
      field.type = type;
      field.value = defaultValue ?? "";
      field.className = "app-input mt-4";
      field.autocomplete = type === "password" ? "current-password" : "off";
      panel.append(field);
    }
  }

  const actions = document.createElement("div");
  actions.className = "mt-6 flex justify-end gap-3";
  const close = (value) => {
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    resolve(value);
  };
  const onKeyDown = (event) => {
    if (event.key === "Escape") close(input ? null : false);
    if (event.key === "Enter" && (!input || document.activeElement === field || document.activeElement === secondaryField || document.activeElement === tertiaryField)) close(input ? readValue() : true);
  };
  if (!alertOnly) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "btn-secondary";
    cancel.textContent = cancelText;
    cancel.addEventListener("click", () => close(input ? null : false));
    actions.append(cancel);
  }
  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className = destructive ? "rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-400" : "btn-primary";
  confirm.textContent = confirmText;
  confirm.addEventListener("click", () => close(input ? readValue() : true));
  actions.append(confirm);
  panel.append(actions);
  overlay.append(panel);
  overlay.addEventListener("mousedown", (event) => { if (event.target === overlay) close(input ? null : false); });
  document.addEventListener("keydown", onKeyDown);
  document.body.append(overlay);
  window.requestAnimationFrame(() => (field || confirm).focus());
});

export const confirmDialog = (message, options = {}) => openDialog({ title: "Xác nhận thao tác", message, ...options });
export const promptDialog = (message, defaultValue = "", options = {}) => openDialog({ title: "Nhập thông tin", message, input: true, defaultValue, ...options });
export const alertDialog = (message, options = {}) => openDialog({ title: "Thông báo từ HOCA", message, alertOnly: true, confirmText: "Đã hiểu", ...options });
