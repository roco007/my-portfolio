export interface StoryChapter {
  id: 'hero' | 'about' | 'skills' | 'projects' | 'experience' | 'contact';
  label: 'HEADING' | 'ARCHITECTURE' | 'TOOLBOX' | 'SYSTEMS' | 'TIMELINE' | 'UPLINK';
  /** A fully visible, interactive point within the chapter's scroll range. */
  target: number;
}

// These are intentionally inside each chapter's stable range, never inside a
// cross-fade. All navigation and idle scroll settlement uses this one source.
export const STORY_CHAPTERS: readonly StoryChapter[] = [
  { id: 'hero', label: 'HEADING', target: 0 },
  { id: 'about', label: 'ARCHITECTURE', target: 0.31 },
  { id: 'skills', label: 'TOOLBOX', target: 0.54 },
  { id: 'projects', label: 'SYSTEMS', target: 0.74 },
  { id: 'experience', label: 'TIMELINE', target: 0.87 },
  { id: 'contact', label: 'UPLINK', target: 0.99 },
];

export const getStoryChapterById = (id: string): StoryChapter | undefined =>
  STORY_CHAPTERS.find((chapter) => chapter.id === id);

export const getNearestStoryChapter = (progress: number): StoryChapter =>
  STORY_CHAPTERS.reduce((closest, chapter) => (
    Math.abs(chapter.target - progress) < Math.abs(closest.target - progress)
      ? chapter
      : closest
  ));
