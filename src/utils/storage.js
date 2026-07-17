import AsyncStorage from '@react-native-async-storage/async-storage';

const COMPLETED_KEY = '@financeiq_completed';
const BOOKMARKS_KEY = '@financeiq_bookmarks';
const OPENAI_KEY = '@financeiq_openai_key';
const LLM_ENABLED_KEY = '@financeiq_llm_enabled';

export async function getOpenAIKey() {
  try { return await AsyncStorage.getItem(OPENAI_KEY) || ''; } catch { return ''; }
}
export async function setOpenAIKey(key) {
  try { await AsyncStorage.setItem(OPENAI_KEY, key.trim()); } catch {}
}
export async function getLLMEnabled() {
  try { const v = await AsyncStorage.getItem(LLM_ENABLED_KEY); return v !== 'false'; } catch { return true; }
}
export async function setLLMEnabled(val) {
  try { await AsyncStorage.setItem(LLM_ENABLED_KEY, String(val)); } catch {}
}

export async function getCompletedLessons() {
  try {
    const json = await AsyncStorage.getItem(COMPLETED_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function markLessonComplete(lessonId) {
  try {
    const completed = await getCompletedLessons();
    if (!completed.includes(lessonId)) {
      const updated = [...completed, lessonId];
      await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(updated));
      return updated;
    }
    return completed;
  } catch {
    return [];
  }
}

export async function getBookmarks() {
  try {
    const json = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function toggleBookmark(courseId) {
  try {
    const bookmarks = await getBookmarks();
    const updated = bookmarks.includes(courseId)
      ? bookmarks.filter((id) => id !== courseId)
      : [...bookmarks, courseId];
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function getCourseProgress(course, completedLessons) {
  const total = course.lessons.length;
  const done = course.lessons.filter((l) => completedLessons.includes(l.id)).length;
  return { done, total, pct: total > 0 ? (done / total) * 100 : 0 };
}

export function getTotalProgress(courses, completedLessons) {
  const allLessons = courses.flatMap((c) => c.lessons);
  const done = allLessons.filter((l) => completedLessons.includes(l.id)).length;
  return { done, total: allLessons.length, pct: allLessons.length > 0 ? (done / allLessons.length) * 100 : 0 };
}
