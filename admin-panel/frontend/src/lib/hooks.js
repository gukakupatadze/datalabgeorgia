import { useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api";

export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useTickets(filters) {
  return useQuery({
    queryKey: ["tickets", filters],
    queryFn: () => ticketsApi.list(filters),
    staleTime: 0,
  });
}

export function useCounts() {
  return useQuery({
    queryKey: ["counts"],
    queryFn: ticketsApi.counts,
    refetchInterval: 60_000,
  });
}

export function useTicket(id) {
  return useQuery({
    queryKey: ["ticket", id],
    queryFn: () => ticketsApi.get(id),
    enabled: !!id,
  });
}

export function useActivities(id) {
  return useQuery({
    queryKey: ["activities", id],
    queryFn: () => ticketsApi.activities(id),
    enabled: !!id,
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: ticketsApi.companies,
  });
}

export function useCustomers(enabled = true) {
  return useQuery({
    queryKey: ["customers"],
    queryFn: ticketsApi.customers,
    enabled,
  });
}

export function useTicketMutations() {
  const qc = useQueryClient();
  const invalidateAll = async (id) => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["tickets"], refetchType: "all" }),
      qc.invalidateQueries({ queryKey: ["counts"], refetchType: "all" }),
      qc.invalidateQueries({ queryKey: ["companies"], refetchType: "all" }),
      qc.invalidateQueries({ queryKey: ["customers"], refetchType: "all" }),
      id
        ? qc.invalidateQueries({ queryKey: ["ticket", id], refetchType: "all" })
        : Promise.resolve(),
      id
        ? qc.invalidateQueries({
            queryKey: ["activities", id],
            refetchType: "all",
          })
        : Promise.resolve(),
    ]);
  };

  const create = useMutation({
    mutationFn: (payload) => ticketsApi.create(payload),
    onSuccess: () => invalidateAll(),
  });

  const update = useMutation({
    mutationFn: ({ id, payload }) => ticketsApi.update(id, payload),
    onSuccess: (data) => invalidateAll(data?.id),
  });

  const remove = useMutation({
    mutationFn: (id) => ticketsApi.remove(id),
    onSuccess: () => invalidateAll(),
  });

  const addItem = useMutation({
    mutationFn: ({ id, payload }) => ticketsApi.addItem(id, payload),
    onSuccess: (data) => invalidateAll(data?.id),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, itemId, payload }) =>
      ticketsApi.updateItem(id, itemId, payload),
    onSuccess: (data) => invalidateAll(data?.id),
  });

  const removeItem = useMutation({
    mutationFn: ({ id, itemId }) => ticketsApi.removeItem(id, itemId),
    onSuccess: (data) => invalidateAll(data?.id),
  });

  const addNote = useMutation({
    mutationFn: ({ id, message, itemId }) =>
      ticketsApi.addNote(id, message, itemId),
    onSuccess: (data, vars) => invalidateAll(vars.id),
  });

  return { create, update, remove, addItem, updateItem, removeItem, addNote };
}
