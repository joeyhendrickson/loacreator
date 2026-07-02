export const MAX_CONTEXT_DOCUMENTS = 30;

export const ACCEPTED_TEMPLATE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const ACCEPTED_CONTEXT_TYPES = [
  ...ACCEPTED_TEMPLATE_TYPES,
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const ACCEPTED_EXTENSIONS =
  ".pdf,.doc,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,.xls,.xlsx";
