// Integration tests. Requires `npm install` (supertest + mongodb-memory-server). The first run
// downloads a MongoDB binary, so it needs internet access once.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123456';

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

let mongod, app, Food;
const alice = { name: 'Alice', email: 'alice@example.com', password: 'Passw0rdAlice', age: 30, gender: 'female', heightCm: 165, currentWeightKg: 65, activityLevel: 'moderate' };
const bob = { ...alice, name: 'Bob', email: 'bob@example.com', gender: 'male' };
const DATE = '2025-03-10';

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  ({ createApp: globalThis.__c } = await import('../src/app.js'));
  app = globalThis.__c();
  ({ Food } = await import('../src/models/Food.js'));
  const { foods } = await import('../src/seed/foods.js');
  await Food.insertMany(foods);
});
after(async () => { await mongoose.disconnect(); await mongod.stop(); });

const signup = async (u) => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send(u);
  assert.equal(res.status, 201);
  return agent;
};

test('register, me, logout, login flow; protected routes require auth', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/meals').query({ date: DATE })).status, 401);

  const agent = await signup(alice);
  const me = await agent.get('/api/auth/me');
  assert.equal(me.body.data.user.email, alice.email);
  assert.equal(me.body.data.user.passwordHash, undefined);
  assert.ok(me.body.data.user.goals.calories >= 1200);

  await agent.post('/api/auth/logout');
  assert.equal((await agent.get('/api/auth/me')).status, 401);
  assert.equal((await request(app).post('/api/auth/login').send({ email: alice.email, password: 'wrong-pass1' })).status, 401);
  assert.equal((await request(app).post('/api/auth/login').send({ email: alice.email, password: alice.password })).status, 200);
});

test('registration validation and duplicate email', async () => {
  const weak = await request(app).post('/api/auth/register').send({ ...alice, email: 'weak@example.com', password: 'short' });
  assert.equal(weak.status, 400);
  const dup = await request(app).post('/api/auth/register').send(alice);
  assert.equal(dup.status, 409);
});

test('meal CRUD with correct serving scaling and dashboard totals', async () => {
  const agent = await signup({ ...alice, email: 'crud@example.com' });
  const search = await agent.get('/api/foods').query({ search: 'idli' });
  assert.equal(search.body.data[0].name, 'Idli');
  const idli = search.body.data[0];

  const created = await agent.post('/api/meals').send({ date: DATE, mealType: 'breakfast', items: [{ foodId: idli._id, quantity: 3, unit: 'serving' }] });
  assert.equal(created.status, 201);
  const meal = created.body.data.meal;
  assert.equal(meal.items[0].grams, 120);
  assert.equal(meal.totals.calories, 170.4);

  const day = await agent.get('/api/analytics/daily').query({ date: DATE });
  const goal = day.body.data.goals.calories;
  assert.equal(day.body.data.consumed.calories, 170.4);
  assert.equal(day.body.data.remaining.calories, Math.round((goal - 170.4) * 10) / 10);
  assert.equal(day.body.data.mealsLogged, 1);

  const updated = await agent.put(`/api/meals/${meal._id}`).send({ items: [{ foodId: idli._id, quantity: 200, unit: 'g' }] });
  assert.equal(updated.body.data.meal.totals.calories, 284);

  assert.equal((await agent.delete(`/api/meals/${meal._id}`)).status, 200);
  assert.equal((await agent.get('/api/meals').query({ date: DATE })).body.data.meals.length, 0);
});

test('users cannot read, edit, or delete another user’s meals', async () => {
  const a = await signup({ ...alice, email: 'owner@example.com' });
  const b = await signup(bob);
  const food = (await a.get('/api/foods').query({ search: 'banana' })).body.data[0];
  const meal = (await a.post('/api/meals').send({ date: DATE, mealType: 'snack', items: [{ foodId: food._id, quantity: 1 }] })).body.data.meal;

  assert.equal((await b.put(`/api/meals/${meal._id}`).send({ mealType: 'lunch' })).status, 404);
  assert.equal((await b.delete(`/api/meals/${meal._id}`)).status, 404);
  assert.equal((await b.get('/api/meals').query({ date: DATE })).body.data.meals.length, 0);
  assert.equal((await a.get('/api/meals').query({ date: DATE })).body.data.meals.length, 1);
});

test('goals update flows into progress; water add/set', async () => {
  const agent = await signup({ ...alice, email: 'goals@example.com' });
  await agent.put('/api/users/goals').send({ calories: 2000, protein: 100, carbs: 250, fat: 60, waterMl: 2500 });
  const food = (await agent.get('/api/foods').query({ search: 'egg (boiled)' })).body.data[0];
  await agent.post('/api/meals').send({ date: DATE, mealType: 'breakfast', items: [{ foodId: food._id, quantity: 2 }] });
  const d = (await agent.get('/api/analytics/daily').query({ date: DATE })).body.data;
  assert.equal(d.goals.calories, 2000);
  assert.equal(d.progress.calories, round(d.consumed.calories / 2000 * 100));

  await agent.post('/api/water').send({ date: DATE, amountMl: 250 });
  const w = await agent.post('/api/water').send({ date: DATE, amountMl: 500 });
  assert.equal(w.body.data.amountMl, 750);
  assert.equal((await agent.put('/api/water').send({ date: DATE, amountMl: 0 })).body.data.amountMl, 0);

  const weekly = (await agent.get('/api/analytics/weekly').query({ end: DATE })).body.data;
  assert.equal(weekly.days.length, 7);
  assert.equal(weekly.days.at(-1).date, DATE);
});

function round(n) { return Math.round(n * 10) / 10; }
