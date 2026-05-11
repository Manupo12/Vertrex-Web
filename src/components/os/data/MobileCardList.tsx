"use client";

import React from "react";

interface MobileCardListProps<TData> {
  data: TData[];
  renderCard: (item: TData) => React.ReactNode;
}

export function MobileCardList<TData>({ data, renderCard }: MobileCardListProps<TData>) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Sin resultados.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:hidden">
      {data.map((item, i) => (
        <div key={i}>
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}
