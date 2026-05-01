import { describe, it, expect } from "vitest";
import { saveDocumentPayloadSchema } from "./document-service";

const validDraft = {
  code: "DOC-001",
  title: "Propuesta Comercial",
  date: "2026-04-30",
  city: "Bogotá",
  subject: "Desarrollo Web",
  intro: "Introducción del documento",
  summary: "Resumen ejecutivo",
  closing: "Cierre y términos",
  client: {
    name: "Acme Corp",
    nit: "900123456",
    address: "Calle 123",
    phone: "3001234567",
    email: "acme@example.com",
  },
  scope: ["Diseño UI", "Desarrollo Frontend"],
  requirements: ["Next.js", "Tailwind CSS"],
  lineItems: [
    { label: "Diseño", description: "Diseño de interfaces", amount: "$5,000,000" },
  ],
  signatory: {
    name: "Juan Pérez",
    role: "CEO",
    documentId: "12345678",
    phone: "3001234567",
  },
};

describe("document-service schema validation", () => {
  it("should validate a correct payload", () => {
    const payload = {
      templateId: "propuesta-comercial",
      clientId: null,
      source: "generator" as const,
      draft: validDraft,
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject missing templateId", () => {
    const payload = {
      clientId: null,
      source: "generator" as const,
      draft: validDraft,
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject invalid source", () => {
    const payload = {
      templateId: "test",
      source: "invalid",
      draft: validDraft,
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should accept optional documentId as UUID", () => {
    const payload = {
      documentId: "550e8400-e29b-41d4-a716-446655440000",
      templateId: "test",
      draft: validDraft,
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject non-UUID documentId", () => {
    const payload = {
      documentId: "not-a-uuid",
      templateId: "test",
      draft: validDraft,
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject draft missing required fields", () => {
    const payload = {
      templateId: "test",
      draft: {
        code: "DOC-001",
        // missing other required fields
      },
    };

    const result = saveDocumentPayloadSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
