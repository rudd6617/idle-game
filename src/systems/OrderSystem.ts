import type { GameState, Order, OrderRequirement } from '../entities/types';
import { CROP_DEFS, CROP_TYPES } from '../entities/cropDefs';
import {
  MAX_ORDERS, ORDER_DURATION, ORDER_REFRESH_INTERVAL,
  ORDER_BONUS_MIN, ORDER_BONUS_MAX,
  ORDER_MIN_TYPES, ORDER_MAX_TYPES,
  ORDER_MIN_AMOUNT, ORDER_MAX_AMOUNT,
} from '../entities/constants';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateOrder(state: GameState): Order {
  const numTypes = randInt(ORDER_MIN_TYPES, Math.min(ORDER_MAX_TYPES, CROP_TYPES.length));
  const shuffled = [...CROP_TYPES].sort(() => Math.random() - 0.5);
  const chosen = shuffled.slice(0, numTypes);

  const requirements: OrderRequirement[] = chosen.map(crop => ({
    crop,
    amount: randInt(ORDER_MIN_AMOUNT, ORDER_MAX_AMOUNT),
  }));

  const baseValue = requirements.reduce(
    (sum, req) => sum + req.amount * CROP_DEFS[req.crop].sellPrice,
    0,
  );
  const reward = Math.floor(baseValue * randFloat(ORDER_BONUS_MIN, ORDER_BONUS_MAX));

  return {
    id: state.nextOrderId++,
    requirements,
    reward,
    timeRemaining: ORDER_DURATION,
  };
}

export function updateOrders(state: GameState, dt: number): void {
  // Tick order timers, remove expired
  for (let i = state.orders.length - 1; i >= 0; i--) {
    state.orders[i]!.timeRemaining -= dt;
    if (state.orders[i]!.timeRemaining <= 0) {
      state.orders.splice(i, 1);
    }
  }

  // Refill empty slots on timer
  if (state.orders.length < MAX_ORDERS) {
    state.orderRefreshTimer -= dt;
    if (state.orderRefreshTimer <= 0) {
      while (state.orders.length < MAX_ORDERS) {
        state.orders.push(generateOrder(state));
      }
      state.orderRefreshTimer = ORDER_REFRESH_INTERVAL;
    }
  } else {
    state.orderRefreshTimer = ORDER_REFRESH_INTERVAL;
  }
}

export function canFulfillOrder(state: GameState, order: Order): boolean {
  return order.requirements.every(
    req => (state.resources.items[req.crop] ?? 0) >= req.amount,
  );
}

export function fulfillOrder(state: GameState, order: Order): boolean {
  if (!canFulfillOrder(state, order)) return false;

  for (const req of order.requirements) {
    state.resources.items[req.crop] = (state.resources.items[req.crop] ?? 0) - req.amount;
  }
  state.resources.money += order.reward;

  const idx = state.orders.indexOf(order);
  if (idx !== -1) state.orders.splice(idx, 1);
  return true;
}
