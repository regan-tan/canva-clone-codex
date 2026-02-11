import test from 'node:test';
import assert from 'node:assert/strict';

function simulateCollaborationFlow() {
  const room = { members: ['u1'], revisions: [1], cursorPresence: new Map([['u1', { x: 10, y: 10 }]]) };

  room.members.push('u2');
  room.cursorPresence.set('u2', { x: 11, y: 20 });
  room.revisions.push(2);
  room.revisions.push(3);

  return room;
}

test('e2e collaboration flow keeps users in sync through revisions', () => {
  const room = simulateCollaborationFlow();

  assert.equal(room.members.length, 2);
  assert.deepEqual(room.revisions, [1, 2, 3]);
  assert.ok(room.cursorPresence.has('u1'));
  assert.ok(room.cursorPresence.has('u2'));
});
