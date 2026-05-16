interface OrderItemWithCostCenter {
  itemId: number;
  totalPrice: number;
  costCenterId: number | null;
}

export interface CostCenterSplit {
  costCenterId: number;
  itemTotal: number;
  deliveryFeeShare: number;
  total: number;
}

export function calculateOrderCostCenterSplit(
  items: OrderItemWithCostCenter[],
  deliveryFee: number,
  fallbackCostCenterId: number
): CostCenterSplit[] {
  const resolvedItems = items.map((item) => ({
    ...item,
    costCenterId: item.costCenterId ?? fallbackCostCenterId,
  }));

  const byCenter = new Map<number, number>();
  for (const item of resolvedItems) {
    const current = byCenter.get(item.costCenterId) || 0;
    byCenter.set(item.costCenterId, current + item.totalPrice);
  }

  const orderSubtotal = Array.from(byCenter.values()).reduce((a, b) => a + b, 0);

  return Array.from(byCenter.entries()).map(([ccId, itemTotal]) => {
    const ratio = orderSubtotal > 0 ? itemTotal / orderSubtotal : 0;
    return {
      costCenterId: ccId,
      itemTotal,
      deliveryFeeShare: parseFloat(deliveryFee.toString()) * ratio,
      total: itemTotal + parseFloat(deliveryFee.toString()) * ratio,
    };
  });
}
