/*
 * Acceso a datos.
 *
 * Arranco como algo temporal para la demo interna de 2023 y quedo. Todo lo que
 * hay que reemplazar el dia que entre un Postgres de verdad es este archivo.
 * Los carritos y las ordenes viven en memoria: se pierden en cada reinicio.
 * -- EB
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data', 'store.json');

let db = null;

// carritos activos, por id. TODO: persistir esto antes de salir a produccion.
const carts = new Map();
const orders = [];

export function readStore() {
  if (db) return db;
  db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return db;
}

export function getSettings() {
  return readStore().settings;
}

export function listProducts() {
  return readStore().products;
}

export function findProduct(id) {
  return readStore().products.find((p) => p.id === id) || null;
}

export function getCart(cartId) {
  if (!cartId) return null;
  return carts.get(cartId) || null;
}

export function createCart(cartId) {
  const cart = { id: cartId, items: [], createdAt: new Date().toISOString() };
  carts.set(cartId, cart);
  return cart;
}

export function saveCart(cart) {
  cart.updatedAt = new Date().toISOString();
  carts.set(cart.id, cart);
  return cart;
}

export function clearCart(cartId) {
  const cart = carts.get(cartId);
  if (cart) {
    cart.items = [];
    cart.updatedAt = new Date().toISOString();
  }
  return cart;
}

export function pushOrder(order) {
  orders.push(order);
  return order;
}

export function listOrders() {
  return orders;
}
