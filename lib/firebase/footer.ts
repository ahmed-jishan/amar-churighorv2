import { db } from './config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FooterSection } from '@/types';

/**
 * Footer sections are stored as a single document in the `settings` collection
 * (e.g., `settings/footer_sections`), exactly like `hero_config` and `store_config`.
 *
 * This avoids requiring new Firestore rules or indexes to be deployed —
 * the `settings` collection already has working rules on the free tier.
 */

const FOOTER_DOC_ID = 'footer_sections';
const DEFAULT_SECTIONS: FooterSection[] = [];

/** Default empty state */
const DEFAULT_DATA = {
  sections: [] as FooterSection[],
  updatedAt: new Date().toISOString(),
};

/**
 * Fetch all footer sections (public — only returns visible ones).
 * Used by the public-facing Footer component.
 */
export async function getPublicFooterSections(): Promise<FooterSection[]> {
  try {
    const snap = await getDoc(doc(db, 'settings', FOOTER_DOC_ID));
    if (snap.exists()) {
      const data = snap.data();
      const sections: FooterSection[] = data.sections ?? [];
      return sections
        .filter((s: FooterSection) => s.is_visible)
        .sort((a: FooterSection, b: FooterSection) => a.sort_order - b.sort_order);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch all footer sections (admin — unfiltered).
 * Used by the admin panel.
 */
export async function getAllFooterSections(): Promise<FooterSection[]> {
  try {
    const snap = await getDoc(doc(db, 'settings', FOOTER_DOC_ID));
    if (snap.exists()) {
      const data = snap.data();
      const sections: FooterSection[] = data.sections ?? [];
      return sections.sort((a: FooterSection, b: FooterSection) => a.sort_order - b.sort_order);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save all footer sections at once (replaces the entire array).
 * We use a single document approach so no collection query/index is needed.
 */
async function saveAllSections(sections: FooterSection[]): Promise<void> {
  const sanitized = {
    sections: sections.map(s => ({
      id: s.id,
      title: s.title,
      links: (s.links || []).map(l => ({
        label: l.label,
        url: l.url,
        open_in_new_tab: l.open_in_new_tab ?? false,
      })),
      is_visible: s.is_visible ?? true,
      sort_order: s.sort_order ?? 0,
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'settings', FOOTER_DOC_ID), sanitized);
}

/** Generate a short unique ID for new sections */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

/**
 * Create a new footer section
 */
export async function createFooterSection(
  data: Omit<FooterSection, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const sections = await getAllFooterSections();
  const now = new Date().toISOString();
  const newSection: FooterSection = {
    id: generateId(),
    title: data.title,
    links: (data.links || []).map(l => ({
      label: l.label,
      url: l.url,
      open_in_new_tab: l.open_in_new_tab ?? false,
    })),
    is_visible: data.is_visible ?? true,
    sort_order: data.sort_order ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  sections.push(newSection);
  await saveAllSections(sections);
  return newSection.id;
}

/**
 * Update an existing footer section by ID
 */
export async function updateFooterSection(
  id: string,
  data: Partial<Omit<FooterSection, 'id' | 'createdAt'>>,
): Promise<void> {
  const sections = await getAllFooterSections();
  const index = sections.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Footer section not found');

  sections[index] = {
    ...sections[index],
    ...data,
    links: data.links
      ? data.links.map(l => ({
          label: l.label,
          url: l.url,
          open_in_new_tab: l.open_in_new_tab ?? false,
        }))
      : sections[index].links,
    updatedAt: new Date().toISOString(),
  };
  await saveAllSections(sections);
}

/**
 * Delete a footer section by ID
 */
export async function deleteFooterSection(id: string): Promise<void> {
  const sections = await getAllFooterSections();
  const filtered = sections.filter(s => s.id !== id);
  await saveAllSections(filtered);
}

/**
 * Reorder footer sections (batch update sort_order based on array position)
 */
export async function reorderFooterSections(ids: string[]): Promise<void> {
  const sections = await getAllFooterSections();
  const reordered = ids.map((id, index) => {
    const section = sections.find(s => s.id === id);
    if (!section) return null;
    return { ...section, sort_order: index, updatedAt: new Date().toISOString() };
  }).filter(Boolean) as FooterSection[];
  await saveAllSections(reordered);
}