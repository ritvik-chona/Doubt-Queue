// Fires 5 simultaneous claims on one doubt from 2 TAs against a running server
// and checks that exactly one succeeds. Usage: npm run race (server must be up).
// API_URL defaults to http://localhost:4000/api.

const API = process.env.API_URL ?? 'http://localhost:4000/api';
const stamp = Date.now();

async function call(path, { cookie, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body && JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json();
  return { status: res.status, data, cookie: res.headers.getSetCookie()[0]?.split(';')[0] };
}

async function register(name, role) {
  const res = await call('/auth/register', {
    body: { name, email: `${name.toLowerCase()}-${stamp}@race.test`, password: 'secret123', role },
  });
  if (res.status !== 201) throw new Error(`register ${name} failed: ${JSON.stringify(res.data)}`);
  return res.cookie;
}

const owner = await register('Owner', 'ta');
const coTa = await register('CoTA', 'ta');
const student = await register('Student', 'student');

const { data: created } = await call('/courses', {
  cookie: owner,
  body: { name: 'Race Course', code: 'RACE1' },
});
const { _id: courseId, joinCode } = created.course;
await call('/courses/join', { cookie: coTa, body: { joinCode } });
await call('/courses/join', { cookie: student, body: { joinCode } });

const { data: posted } = await call(`/courses/${courseId}/doubts`, {
  cookie: student,
  body: { title: 'Race condition test doubt', body: 'Which TA gets to claim this one?' },
});
const doubtId = posted.doubt._id;

const claimers = [
  ['Owner', owner],
  ['CoTA', coTa],
  ['Owner', owner],
  ['CoTA', coTa],
  ['Owner', owner],
];
const results = await Promise.all(
  claimers.map(([name, cookie]) =>
    call(`/doubts/${doubtId}/claim`, { cookie, body: {} }).then((r) => ({ name, ...r }))
  )
);

for (const { name, status, data } of results) {
  const detail = status === 200 ? `claimed by ${data.doubt.claimedBy.name}` : data.error.message;
  console.log(`${name.padEnd(6)} ${status}  ${detail}`);
}

const wins = results.filter((r) => r.status === 200).length;
const conflicts = results.filter((r) => r.status === 409).length;
const passed = wins === 1 && conflicts === claimers.length - 1;
console.log(`\n${wins} succeeded, ${conflicts} got 409: ${passed ? 'PASS' : 'FAIL'}`);
process.exit(passed ? 0 : 1);
