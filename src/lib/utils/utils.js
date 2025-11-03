import { writeTextFile } from "@tauri-apps/plugin-fs";
import { homeDir } from "@tauri-apps/api/path";

/**
 * @param {any[]} pages
 * @param {string} pageId
 * @param {string} title
 * @param {string} content
 */
export async function addNote(pages, pageId, title, content) {
  const newNote = {
    id: Date.now().toString(),
    title: title,
    content: content,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    position: { x: 100, y: 100 },
    width: 200,
    height: 150,
    minimized: false,
    maximized: false,
    zIndex: 1,
  };
  const updatedPages = pages.map(page => {
    if (page.id === pageId) {
      return { ...page, notes: [...page.notes, newNote] };
    }
    return page;
  });
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages;
}

/**
 * @param {string | any[]} pages
 * @param {string} title
 */
export async function addPage(pages, title) {
  const newPage = {
    id: Date.now().toString(),
    title: title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    notes: [],
  };
  const updatedPages = [newPage, ...pages];
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages; // Retornar o array atualizado
}

/**
 * @param {any[]} pages
 * @param {string} pageId
 */
export async function deletePage(pages, pageId) {
  const updatedPages = pages.filter((/** @type {{ id: string; }} */ page) => page.id !== pageId);
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages; // Retornar o array atualizado
}

/**
 * @param {any[]} pages
 * @param {string} pageId
 * @param {string} noteId
 */
export async function toggleMinimizeNote(pages, pageId, noteId) {
  const updatedPages = pages.map(page => {
    if (page.id === pageId) {
      return {
        ...page,
        notes: page.notes.map((/** @type {any} */ note) => {
          if (note.id === noteId) {
            return { ...note, minimized: !note.minimized };
          }
          return note;
        })
      };
    }
    return page;
  });
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages;
}

/**
 * @param {any[]} pages
 * @param {string} pageId
 * @param {string} noteId
 */
export async function toggleMaximizeNote(pages, pageId, noteId) {
  const updatedPages = pages.map(page => {
    if (page.id === pageId) {
      return {
        ...page,
        notes: page.notes.map((/** @type {any} */ note) => {
          if (note.id === noteId) {
            return { ...note, maximized: !note.maximized };
          }
          return note;
        })
      };
    }
    return page;
  });
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages;
}

/**
 * @param {any[]} pages
 * @param {string} pageId
 * @param {string} noteId
 */
export async function deleteNote(pages, pageId, noteId) {
  const updatedPages = pages.map(page => {
    if (page.id === pageId) {
      return {
        ...page,
        notes: page.notes.filter((/** @type {any} */ note) => note.id !== noteId)
      };
    }
    return page;
  });
  await writeTextFile(
    (await homeDir()) + "/.mural_data.json",
    JSON.stringify(updatedPages, null, 2)
  );
  return updatedPages;
}
