"use client";

import { Toaster } from "sonner";

export function ToasterVertrex() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "hsl(0 0% 4%)",
          border: "1px solid hsl(0 0% 12%)",
          color: "hsl(0 0% 98%)",
          borderRadius: "0.75rem",
        },
      }}
    />
  );
}
