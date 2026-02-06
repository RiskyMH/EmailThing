"use client";

import type { EmailListType } from "@/utils/data/queries/email-list";
import { DBEmail } from "@/utils/data/types";
import { createContext, useCallback, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { useLocation } from "react-router-dom";

export interface SelectionFilter {
  mailboxId: string;
  type: EmailListType;
  categoryId?: string;
  search?: string;
  subFilter?: 'read' | 'unread' | 'starred' | 'unstarred';
}

type SelectionMode =
  | { type: "none" }
  | { type: "some"; ids: Set<string> }
  | { type: "all"; filter: SelectionFilter; excludedIds: Set<string> };

interface SelectionContextValue {
  selectionMode: SelectionMode;
  isSelected: (email: DBEmail) => boolean;
  toggleSelection: (id: string) => void;
  toggleSelectionWithState: (id: string, emailMatchesFilter: boolean) => void;
  selectAll: (filter: SelectionFilter) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  getSelectedIds: () => Set<string> | "all";
  getExcludedIds: () => Set<string>;
  getFilter: () => SelectionFilter | null;
}

const SelectionContext = createContext<SelectionContextValue | null>(null);

export function SelectionProvider({ children }: PropsWithChildren) {
  const [selectionMode, setSelectionMode] = useState<SelectionMode>({ type: "none" });

  const isSelected = useCallback((email: DBEmail): boolean => {
    if (selectionMode.type === "none") return false;
    if (selectionMode.type === "all") {
      // Selected if: (matches filter AND not excluded)
      const isSelected = !selectionMode.excludedIds.has(email.id);
      if (!isSelected) return false;

      if (selectionMode.filter.subFilter) {
        const subFilter = selectionMode.filter.subFilter;
        if (subFilter === "read" && !email.isRead) return false;
        if (subFilter === "unread" && email.isRead) return false;
        if (subFilter === "starred" && !email.isStarred) return false;
        if (subFilter === "unstarred" && email.isStarred) return false;
      }
      return true;
    }
    return selectionMode.ids.has(email.id);
  }, [selectionMode]);

  const toggleSelection = useCallback((id: string) => {
    setSelectionMode((prev) => {
      if (prev.type === "none") {
        return { type: "some", ids: new Set([id]) };
      }
      if (prev.type === "all") {
        // When in "all" mode, clicking toggles exclusion (assumes email matches filter)
        const newExcludedIds = new Set(prev.excludedIds);

        if (newExcludedIds.has(id)) {
          newExcludedIds.delete(id);
        } else {
          newExcludedIds.add(id);
        }

        return { type: "all", filter: prev.filter, excludedIds: newExcludedIds };
      }
      // type === "some"
      const newIds = new Set(prev.ids);
      if (newIds.has(id)) {
        newIds.delete(id);
        if (newIds.size === 0) {
          return { type: "none" };
        }
      } else {
        newIds.add(id);
      }
      return { type: "some", ids: newIds };
    });
  }, []);

  const toggleSelectionWithState = useCallback((id: string, emailMatchesFilter: boolean) => {
    setSelectionMode((prev) => {
      if (prev.type === "none") {
        return { type: "some", ids: new Set([id]) };
      }
      if (prev.type === "all") {
        const newExcludedIds = new Set(prev.excludedIds);

        if (emailMatchesFilter) {
          // Email matches filter - toggle exclusion
          if (newExcludedIds.has(id)) {
            newExcludedIds.delete(id);
          } else {
            newExcludedIds.add(id);
          }
        }

        return { type: "all", filter: prev.filter, excludedIds: newExcludedIds };
      }
      // type === "some"
      const newIds = new Set(prev.ids);
      if (newIds.has(id)) {
        newIds.delete(id);
        if (newIds.size === 0) {
          return { type: "none" };
        }
      } else {
        newIds.add(id);
      }
      return { type: "some", ids: newIds };
    });
  }, []);

  const selectAll = useCallback((filter: SelectionFilter) => {
    setSelectionMode({ type: "all", filter, excludedIds: new Set() });
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    if (ids.length === 0) {
      setSelectionMode({ type: "some", ids: new Set() });
    } else {
      setSelectionMode({ type: "some", ids: new Set(ids) });
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionMode({ type: "none" });
  }, []);

  const getSelectedIds = useCallback((): Set<string> | "all" => {
    if (selectionMode.type === "all") return "all";
    if (selectionMode.type === "some") return selectionMode.ids;
    return new Set();
  }, [selectionMode]);

  const getExcludedIds = useCallback((): Set<string> => {
    if (selectionMode.type === "all") return selectionMode.excludedIds;
    return new Set();
  }, [selectionMode]);

  const getFilter = useCallback((): SelectionFilter | null => {
    if (selectionMode.type === "all") return selectionMode.filter;
    return null;
  }, [selectionMode]);

  const navigate = useLocation();
  useEffect(clearSelection, [navigate.pathname, clearSelection]);

  return (
    <SelectionContext.Provider
      value={{
        selectionMode,
        isSelected,
        toggleSelection,
        toggleSelectionWithState,
        selectAll,
        selectMultiple,
        clearSelection,
        getSelectedIds,
        getExcludedIds,
        getFilter,
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
