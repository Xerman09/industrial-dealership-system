import { useState, useEffect, useCallback } from "react";
import { CustomerHistoryData } from "../types";

export function useCustomerHistory(customerId?: string) {
  const [data, setData] = useState<CustomerHistoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/crm/customer-history", window.location.origin);
      if (customerId) {
        url.searchParams.append("customer_id", customerId);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error("Failed to fetch customer history");
      }
      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    data,
    loading,
    error,
    refetch: fetchHistory,
  };
}
