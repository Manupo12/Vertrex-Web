export type SettingsCategory =
  | "general"
  | "billing"
  | "notifications"
  | "integrations"
  | "security"
  | "advanced";

export interface WorkspaceSetting {
  id: string;
  category: SettingsCategory;
  key: string;
  value: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Default settings structure
export const defaultSettings: Record<SettingsCategory, Record<string, unknown>> = {
  general: {
    workspaceName: "Vertrex Workspace",
    timezone: "America/Bogota",
    dateFormat: "DD/MM/YYYY",
    language: "es",
    currency: "COP",
  },
  billing: {
    companyName: "",
    taxId: "",
    address: "",
    email: "",
    phone: "",
    bankName: "",
    bankAccount: "",
    paymentTerms: 30,
  },
  notifications: {
    emailEnabled: true,
    browserEnabled: true,
    mobileEnabled: false,
    dailyDigest: true,
    weeklyReport: true,
    dealUpdates: true,
    taskAssignments: true,
    ticketMentions: true,
  },
  integrations: {
    googleCalendar: { connected: false, email: null },
    slack: { connected: false, workspace: null },
    stripe: { connected: false, accountId: null },
    sendgrid: { connected: false, fromEmail: null },
  },
  security: {
    twoFactorRequired: false,
    sessionTimeout: 3600,
    ipWhitelist: [],
    auditLogRetention: 90,
  },
  advanced: {
    apiKey: null,
    webhookUrl: null,
    customDomain: null,
    exportEnabled: true,
  },
};
