const emailPattern = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;
export function cleanStore(record) {
  return {
    id: record.id,
    name: String(record.name || "").trim(),
    code: String(record.code || "")
      .trim()
      .toUpperCase(),
    location: String(record.location || "").trim(),
    status: record.status,
  };
}
export function storeError(stores, record) {
  if (!record || typeof record.id !== "string" || !record.id)
    return "Invalid store.";
  if (!record.name || record.name.length > 100)
    return "Store name is required and must be 100 characters or fewer.";
  if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(record.code))
    return "Store code must be 2–30 letters, numbers, hyphens, or underscores.";
  if (record.location.length > 200)
    return "Location must be 200 characters or fewer.";
  if (!["Active", "Inactive"].includes(record.status))
    return "Choose an active or inactive status.";
  if (
    stores.some(
      (store) =>
        store.id !== record.id &&
        store.code.toLowerCase() === record.code.toLowerCase(),
    )
  )
    return "This store code is already in use.";
  return "";
}
export function cleanEmployee(record) {
  return {
    id: record.id,
    name: String(record.name || "").trim(),
    email: String(record.email || "")
      .trim()
      .toLowerCase(),
  };
}
export function employeeError(store, employee) {
  if (!store) return "This store no longer exists.";
  if (store.status !== "Active")
    return "Activate this store before adding or editing employees.";
  if (!employee || typeof employee.id !== "string" || !employee.id)
    return "Invalid employee.";
  if (!emailPattern.test(employee.email) || employee.email.length > 254)
    return "Enter a valid employee email address.";
  if (employee.name.length > 100)
    return "Employee name must be 100 characters or fewer.";
  if (
    store.employees.some(
      (item) =>
        item.id !== employee.id &&
        item.email.toLowerCase() === employee.email.toLowerCase(),
    )
  )
    return "This email address already belongs to this store.";
  return "";
}
export function employeeBatchError(store, employees) {
  if (!Array.isArray(employees) || !employees.length || employees.length > 200)
    return "Add between 1 and 200 email addresses at a time.";
  const seen = new Set(
    store?.employees.map((employee) => employee.email.toLowerCase()) || [],
  );
  const ids = new Set(store?.employees.map((employee) => employee.id) || []);
  for (const employee of employees) {
    const error = employeeError(store, employee);
    if (error) return `${employee.email || "Employee"}: ${error}`;
    if (seen.has(employee.email.toLowerCase()))
      return `Duplicate email address: ${employee.email}. No employees were added.`;
    if (ids.has(employee.id)) return "Duplicate employee identifier.";
    seen.add(employee.email.toLowerCase());
    ids.add(employee.id);
  }
  return "";
}
export function validStores(stores) {
  if (!Array.isArray(stores)) return false;
  const ids = new Set();
  const codes = new Set();
  return stores.every((store) => {
    if (
      !store ||
      ![
        "id",
        "name",
        "code",
        "location",
        "status",
        "createdAt",
        "updatedAt",
      ].every((key) => typeof store[key] === "string") ||
      storeError([], store) ||
      !Number.isFinite(Date.parse(store.createdAt)) ||
      !Number.isFinite(Date.parse(store.updatedAt)) ||
      ids.has(store.id) ||
      codes.has(store.code.toLowerCase()) ||
      !Array.isArray(store.employees)
    )
      return false;
    ids.add(store.id);
    codes.add(store.code.toLowerCase());
    const emails = new Set();
    const employeeIds = new Set();
    return store.employees.every((employee) => {
      if (
        !employee ||
        !["id", "name", "email"].every(
          (key) => typeof employee[key] === "string",
        ) ||
        employeeError(
          { ...store, status: "Active", employees: [] },
          employee,
        ) ||
        emails.has(employee.email.toLowerCase()) ||
        employeeIds.has(employee.id)
      )
        return false;
      emails.add(employee.email.toLowerCase());
      employeeIds.add(employee.id);
      return true;
    });
  });
}
