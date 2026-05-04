"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  SalesOrderCustomerLite,
  SalesOrderSummary,
  WalkInTransaction,
} from "../types";
import {
  fetchRecentSalesOrders,
  fetchSalesOrderDetails,
} from "../providers/walkInTransactions";
import {
  formatItemSummary,
  getOrderAmount,
  getOrderTypeLabel,
  isWalkInOrder,
} from "../utils/walkIn";

interface UseWalkInTransactionsReturn {
  transactions: WalkInTransaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function mapCustomersByCode(
  customers: SalesOrderCustomerLite[],
): Map<string, SalesOrderCustomerLite> {
  const map = new Map<string, SalesOrderCustomerLite>();
  customers.forEach((customer) => {
    if (customer.customer_code) {
      map.set(String(customer.customer_code), customer);
    }
  });
  return map;
}

export function useWalkInTransactions(): UseWalkInTransactionsReturn {
  const [transactions, setTransactions] = useState<WalkInTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const report = await fetchRecentSalesOrders(1, 25);
      const customersByCode = mapCustomersByCode(report.customers || []);

      // DEBUG: Log data for troubleshooting
      console.log(
        "[DEBUG] Walk-in Transactions - Total Sales Orders:",
        report.salesOrders?.length || 0,
      );
      console.log(
        "[DEBUG] Walk-in Transactions - Total Customers:",
        report.customers?.length || 0,
      );
      console.log(
        "[DEBUG] Customer Classifications Found:",
        report.customers?.map((c) => ({
          code: c.customer_code,
          classification: c.classification,
        })) || [],
      );

      const walkInOrders = (report.salesOrders || []).filter((order) =>
        isWalkInOrder(order, customersByCode),
      );

      console.log("[DEBUG] Walk-in Orders Filtered:", walkInOrders.length);
      if (walkInOrders.length === 0 && report.salesOrders?.length) {
        console.log(
          "[DEBUG] Sample Order for Debugging:",
          report.salesOrders[0],
        );
      }

      const limitedOrders = walkInOrders.slice(0, 8);

      const detailEntries = await Promise.all(
        limitedOrders.map(async (order) => {
          try {
            const details = await fetchSalesOrderDetails(order.order_id);
            return [order.order_id, details] as const;
          } catch {
            return [order.order_id, [] as any[]] as const;
          }
        }),
      );

      const detailsMap = new Map<
        number,
        Awaited<ReturnType<typeof fetchSalesOrderDetails>>
      >();
      detailEntries.forEach(([orderId, details]) => {
        detailsMap.set(orderId, details);
      });

      const mapped = limitedOrders.map(
        (order: SalesOrderSummary): WalkInTransaction => {
          const customer = order.customer_code
            ? customersByCode.get(String(order.customer_code))
            : null;
          const details = detailsMap.get(order.order_id) || [];

          return {
            order_id: order.order_id,
            order_no: order.order_no,
            date: order.order_date || order.created_date || null,
            customer_name:
              customer?.customer_name ||
              customer?.store_name ||
              order.customer_code ||
              "Walk-in Customer",
            customer_code: order.customer_code,
            items_label: formatItemSummary(details),
            type_label: getOrderTypeLabel(order),
            amount: getOrderAmount(order),
          };
        },
      );

      setTransactions(mapped);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load walk-in transactions";
      setError(message);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchData,
  };
}
