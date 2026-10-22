import assert from 'node:assert/strict';
import test from 'node:test';

import { matchAnswer } from '../src/data/chatbotKnowledge';
import { PERSONAL_INFO, PROJECTS } from '../src/data/portfolio';

test('The Ninth Tide is available as the fifteenth interactive project', () => {
  const project = PROJECTS.find(({ id }) => id === 'the-ninth-tide');

  assert.ok(project);
  assert.equal(PROJECTS.length, 15);
  assert.equal(PROJECTS.at(-1), project);
  assert.equal(
    PROJECTS.filter(({ category }) => category === 'interactive').length,
    4,
  );
  assert.equal(PERSONAL_INFO.stats.deployedProjects, 15);
  assert.equal(project.category, 'interactive');
  assert.equal(project.sysId, 'SYS.015');
  assert.equal(project.githubUrl, 'https://github.com/roco007/TheNinthTide');
  assert.equal(project.liveUrl, 'https://theninthtide.vercel.app');
  assert.equal(project.image, 'images/TheNinthTide_preview.webp');
  assert.deepEqual(project.technologies, [
    'TypeScript',
    'Phaser 3',
    'Vite',
    'Web Audio API',
    'LocalStorage',
  ]);
});

test('the chatbot answers specific questions about The Ninth Tide', () => {
  const answer = matchAnswer('Tell me about The Ninth Tide');

  assert.equal(answer.matched, true);
  assert.equal(answer.section, 'projects');
  assert.match(answer.reply, /The Ninth Tide/);
  assert.match(answer.reply, /Phaser 3/);
  assert.match(answer.reply, /https:\/\/theninthtide\.vercel\.app/);
});
