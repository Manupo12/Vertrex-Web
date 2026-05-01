"use client";

import { useSyncExternalStore } from "react";

export type TransactionType = "income" | "expense";
export type OverlayDetailState = { open: boolean; id: string | null };
export type UploadFileState = { open: boolean; context: string | null };
export type RegisterTransactionState = {
  open: boolean;
  type: TransactionType | null;
};
export type TemplateSelectorState = {
  open: boolean;
  onSelect: ((id: string) => void) | null;
};

export type UIState = {
  commandCenter: boolean;
  omniCreator: boolean;
  universalInbox: boolean;
  taskDetail: OverlayDetailState;
  clientDetail: OverlayDetailState;
  dealDetail: OverlayDetailState;
  eventDetail: OverlayDetailState;
  assetDetail: OverlayDetailState;
  vaultEntry: OverlayDetailState;
  invoiceDetail: OverlayDetailState;
  transactionDetail: OverlayDetailState;
  threadDetail: OverlayDetailState;
  contractDetail: OverlayDetailState;
  ticketDetail: OverlayDetailState;
  uploadFile: UploadFileState;
  importDocument: boolean;
  registerTransaction: RegisterTransactionState;
  connectCredential: boolean;
  createLink: boolean;
  createDeal: boolean;
  createEvent: boolean;
  createTicket: boolean;
  createAutomation: boolean;
  templateSelector: TemplateSelectorState;
};

const booleanOverlayKeys = [
  "commandCenter",
  "omniCreator",
  "universalInbox",
  "importDocument",
  "connectCredential",
  "createLink",
  "createDeal",
  "createEvent",
  "createTicket",
  "createAutomation",
] as const;

const detailOverlayKeys = [
  "taskDetail",
  "clientDetail",
  "dealDetail",
  "eventDetail",
  "assetDetail",
  "vaultEntry",
  "threadDetail",
  "contractDetail",
  "ticketDetail",
  "invoiceDetail",
  "transactionDetail",
] as const;

const toggleableObjectKeys = [
  "uploadFile",
  "registerTransaction",
  "templateSelector",
] as const;

export type BooleanOverlayKey = (typeof booleanOverlayKeys)[number];
export type DetailOverlayKey = (typeof detailOverlayKeys)[number];
export type ToggleableObjectKey = (typeof toggleableObjectKeys)[number];
export type UIOverlayKey = keyof UIState;
export type UIActionPayload =
  | string
  | {
      id?: string | null;
      context?: string | null;
      type?: TransactionType | null;
      onSelect?: ((id: string) => void) | null;
    };

export type UIStore = UIState & {
  open: (key: UIOverlayKey, payload?: UIActionPayload) => void;
  close: (key: UIOverlayKey) => void;
  toggle: (key: UIOverlayKey) => void;
  closeAll: () => void;
};

const createInitialState = (): UIState => ({
  commandCenter: false,
  omniCreator: false,
  universalInbox: false,
  taskDetail: { open: false, id: null },
  clientDetail: { open: false, id: null },
  dealDetail: { open: false, id: null },
  eventDetail: { open: false, id: null },
  assetDetail: { open: false, id: null },
  vaultEntry: { open: false, id: null },
  threadDetail: { open: false, id: null },
  contractDetail: { open: false, id: null },
  ticketDetail: { open: false, id: null },
  invoiceDetail: { open: false, id: null },
  transactionDetail: { open: false, id: null },
  uploadFile: { open: false, context: null },
  importDocument: false,
  registerTransaction: { open: false, type: null },
  connectCredential: false,
  createLink: false,
  createDeal: false,
  createEvent: false,
  createTicket: false,
  createAutomation: false,
  templateSelector: { open: false, onSelect: null },
});

const listeners = new Set<() => void>();
let state = createInitialState();

const isBooleanOverlayKey = (key: UIOverlayKey): key is BooleanOverlayKey =>
  booleanOverlayKeys.includes(key as BooleanOverlayKey);

const isDetailOverlayKey = (key: UIOverlayKey): key is DetailOverlayKey =>
  detailOverlayKeys.includes(key as DetailOverlayKey);

const isToggleableObjectKey = (key: UIOverlayKey): key is ToggleableObjectKey =>
  toggleableObjectKeys.includes(key as ToggleableObjectKey);

const getDetailId = (payload?: UIActionPayload) => {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object" && "id" in payload) {
    return payload.id ?? null;
  }

  return null;
};

const getContext = (payload?: UIActionPayload) => {
  if (payload && typeof payload === "object" && "context" in payload) {
    return payload.context ?? null;
  }

  return null;
};

const getTransactionType = (payload?: UIActionPayload) => {
  if (payload && typeof payload === "object" && "type" in payload) {
    return payload.type ?? null;
  }

  return null;
};

const getOnSelect = (payload?: UIActionPayload) => {
  if (payload && typeof payload === "object" && "onSelect" in payload) {
    return payload.onSelect ?? null;
  }

  return null;
};

const getResetState = <T extends UIOverlayKey>(key: T): UIState[T] => {
  const initialState = createInitialState();
  return initialState[key];
};

const emit = () => {
  snapshot = {
    ...state,
    open: openOverlay,
    close: closeOverlay,
    toggle: toggleOverlay,
    closeAll,
  };
  listeners.forEach((listener) => listener());
};

const setState = (updater: (current: UIState) => UIState) => {
  state = updater(state);
  emit();
};

function openOverlay(key: UIOverlayKey, payload?: UIActionPayload) {
  setState((current) => {
    if (isBooleanOverlayKey(key)) {
      return {
        ...current,
        [key]: true,
      };
    }

    if (isDetailOverlayKey(key)) {
      return {
        ...current,
        [key]: {
          open: true,
          id: getDetailId(payload),
        },
      };
    }

    if (key === "uploadFile") {
      return {
        ...current,
        uploadFile: {
          open: true,
          context: getContext(payload),
        },
      };
    }

    if (key === "registerTransaction") {
      return {
        ...current,
        registerTransaction: {
          open: true,
          type: getTransactionType(payload),
        },
      };
    }

    return {
      ...current,
      templateSelector: {
        open: true,
        onSelect: getOnSelect(payload),
      },
    };
  });
}

function closeOverlay(key: UIOverlayKey) {
  setState((current) => ({
    ...current,
    [key]: getResetState(key),
  }));
}

function toggleOverlay(key: UIOverlayKey) {
  setState((current) => {
    if (isBooleanOverlayKey(key)) {
      return {
        ...current,
        [key]: !current[key],
      };
    }

    if (isDetailOverlayKey(key)) {
      return {
        ...current,
        [key]: {
          ...current[key],
          open: !current[key].open,
        },
      };
    }

    if (isToggleableObjectKey(key)) {
      return {
        ...current,
        [key]: {
          ...current[key],
          open: !current[key].open,
        },
      };
    }

    return {
      ...current,
      [key]: !current[key],
    };
  });
}

function closeAll() {
  state = createInitialState();
  emit();
}

let snapshot: UIStore = {
  ...state,
  open: openOverlay,
  close: closeOverlay,
  toggle: toggleOverlay,
  closeAll,
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useUIStore<T>(selector: (store: UIStore) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(snapshot),
    () => selector(snapshot),
  );
}

export const uiStore = {
  getState: () => snapshot,
  subscribe,
  open: openOverlay,
  close: closeOverlay,
  toggle: toggleOverlay,
  closeAll,
};
