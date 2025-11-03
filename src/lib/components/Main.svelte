    <script>
  import { addNote, toggleMinimizeNote, toggleMaximizeNote, deleteNote } from "$lib/utils/utils.js";
  import { Plus } from "@lucide/svelte";
  import NewNote from "./NewNote.svelte";
  import { marked } from "marked";
  import { show } from "@tauri-apps/api/app";

  /** @type {any[]} */
  export let pages = [];
  /** @type {string | null} */
  export let currentPageId = null;
  export let showSidebar = true;

  let isAddingNote = false;

  let showNewNoteModal = false;
  let newNoteTitle = "";
  let newNoteContent = "";

  let showAddNoteIcon = true;

  /** @type {string | null} */
  let editingNoteId = null;
  /** @type {string | null} */
  let editingField = null; // 'title' or 'content'
  let editValue = "";

  /**
   * @param {string} noteId
   */
  async function handleToggleMinimize(noteId) {
    if (currentPageId) {
      pages = await toggleMinimizeNote(pages, currentPageId, noteId);
    }
  }

  /**
   * @param {string} noteId
   */
  async function handleToggleMaximize(noteId) {
    if (currentPageId) {
      pages = await toggleMaximizeNote(pages, currentPageId, noteId);
    }
  }

  /**
   * @param {string} noteId
   */
  async function handleDeleteNote(noteId) {
    if (currentPageId) {
      pages = await deleteNote(pages, currentPageId, noteId);
    }
  }

  async function onAddNote() {
    if (isAddingNote) return;
    isAddingNote = true;
    showNewNoteModal = true;
    showAddNoteIcon = false;
    newNoteTitle = "";
    newNoteContent = "";
    setTimeout(() => isAddingNote = false, 200);
  }

  /**
   * @param {string} title
   * @param {string} content
   */
  async function onConfirmNewNote(title, content) {
    if (!currentPageId || !title.trim()) return;

    try {
      pages = await addNote(pages, currentPageId, title.trim(), content.trim() || 'Conteúdo da nota...');
      showNewNoteModal = false;
    } catch (error) {
      console.error('Error adding note:', error);
    }
    showAddNoteIcon = true;
  }

  function onCancelNewNote() {
    showNewNoteModal = false;
    showAddNoteIcon = true;
  }

  /**
   * @param {string} noteId
   * @param {string} field
   */
  function startEditing(noteId, field) {
    editingNoteId = noteId;
    editingField = field;
    const note = notes.find((/** @type {any} */ n) => n.id === noteId);
    if (note) {
      editValue = note[field];
    }
  }

  function stopEditing() {
    editingNoteId = null;
    editingField = null;
    editValue = "";
  }

  /**
   * @param {HTMLInputElement | HTMLTextAreaElement} node
   */
  function focusInput(node) {
    node.focus();
    node.select();
  }

  /**
   * @param {string} noteId
   * @param {string} field
   * @param {string} value
   */
  async function saveEdit(noteId, field, value) {
    if (!currentPageId) return;

    try {
      // Atualizar a nota localmente
      const updatedPages = pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            notes: page.notes.map((/** @type {any} */ note) => {
              if (note.id === noteId) {
                return { ...note, [field]: value.trim() };
              }
              return note;
            })
          };
        }
        return page;
      });

      // Salvar no arquivo
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const { homeDir } = await import("@tauri-apps/api/path");
      await writeTextFile(await homeDir() + "/.mural_data.json", JSON.stringify(updatedPages, null, 2));

      pages = updatedPages;
      stopEditing();
    } catch (error) {
      console.error('Error saving edit:', error);
    }
  }

  /**
   * @param {string} noteId
   * @param {any} position
   * @param {number} width
   * @param {number} height
   */
  async function saveNotePosition(noteId, position, width, height) {
    if (!currentPageId) return;

    try {
      // Atualizar a nota localmente
      const updatedPages = pages.map(page => {
        if (page.id === currentPageId) {
          return {
            ...page,
            notes: page.notes.map((/** @type {any} */ note) => {
              if (note.id === noteId) {
                return { 
                  ...note, 
                  position: { ...position },
                  width,
                  height
                };
              }
              return note;
            })
          };
        }
        return page;
      });

      // Salvar no arquivo
      const { writeTextFile } = await import("@tauri-apps/plugin-fs");
      const { homeDir } = await import("@tauri-apps/api/path");
      await writeTextFile(await homeDir() + "/.mural_data.json", JSON.stringify(updatedPages, null, 2));

      pages = updatedPages;
    } catch (error) {
      console.error('Error saving note position:', error);
    }
  }

  $: currentPage = pages.find(page => page.id === currentPageId);
  $: notes = currentPage ? currentPage.notes : [];

  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  /** @type {any} */
  let draggedNote = null;
  let maxZIndex = 10; // Z-index inicial para novas notas

  let isResizing = false;
  let resizeDirection = '';
  let resizeStart = { x: 0, y: 0 };
  let resizeStartSize = { width: 0, height: 0 };
  let resizeStartPos = { x: 0, y: 0 };
  /** @type {any} */
  let resizedNote = null;

  /**
   * @param {MouseEvent} event
   * @param {any} note
   */
  function startDrag(event, note) {
    event.preventDefault();
    event.stopPropagation();
    isDragging = true;
    draggedNote = note;
    // Calcular offset correto: diferença entre posição do mouse e posição da nota
    dragOffset.x = event.clientX - note.position.x;
    dragOffset.y = event.clientY - note.position.y;
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
  }

  /**
   * @param {MouseEvent} event
   */
  function drag(event) {
    if (!isDragging || !draggedNote) return;
    const newX = event.clientX - dragOffset.x;
    const newY = event.clientY - dragOffset.y;
    
    // Limitar movimento para manter pelo menos 50px da nota visíveis
    const minVisible = 50;
    const maxX = window.innerWidth - minVisible;
    const maxY = window.innerHeight - minVisible;
    
    draggedNote.position.x = Math.max(-draggedNote.width + minVisible, Math.min(maxX, newX));
    draggedNote.position.y = Math.max(-draggedNote.height + minVisible, Math.min(maxY, newY));
    
    // Forçar re-render
    pages = [...pages];
  }

  function stopDrag() {
    if (draggedNote) {
      // Salvar a nova posição da nota
      saveNotePosition(draggedNote.id, draggedNote.position, draggedNote.width, draggedNote.height);
    }
    isDragging = false;
    draggedNote = null;
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
  }

  /**
   * @param {MouseEvent} event
   * @param {any} note
   * @param {string} direction
   */
  function startResize(event, note, direction) {
    event.stopPropagation();
    isResizing = true;
    resizeDirection = direction;
    resizedNote = note;
    resizeStart.x = event.clientX;
    resizeStart.y = event.clientY;
    resizeStartSize.width = note.width;
    resizeStartSize.height = note.height;
    resizeStartPos.x = note.position.x;
    resizeStartPos.y = note.position.y;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  }

  /**
   * @param {MouseEvent} event
   */
  function resize(event) {
    if (!isResizing || !resizedNote) return;
    const deltaX = event.clientX - resizeStart.x;
    const deltaY = event.clientY - resizeStart.y;

    if (resizeDirection.includes('e')) {
      const maxWidth = window.innerWidth - resizedNote.position.x - 50; // Manter pelo menos 50px visível
      resizedNote.width = Math.max(100, Math.min(maxWidth, resizeStartSize.width + deltaX));
    }
    if (resizeDirection.includes('s')) {
      const maxHeight = window.innerHeight - resizedNote.position.y - 50; // Manter pelo menos 50px visível
      resizedNote.height = Math.max(50, Math.min(maxHeight, resizeStartSize.height + deltaY));
    }
    if (resizeDirection.includes('w')) {
      const newWidth = Math.max(100, resizeStartSize.width - deltaX);
      const widthDiff = resizeStartSize.width - newWidth;
      const newX = resizeStartPos.x + widthDiff;
      const minX = 0;
      const maxX = window.innerWidth - 100; // Garantir que pelo menos 100px de largura fiquem visíveis
      resizedNote.position.x = Math.max(minX, Math.min(maxX, newX));
      resizedNote.width = Math.max(100, resizeStartSize.width - deltaX);
    }
    if (resizeDirection.includes('n')) {
      const newHeight = Math.max(50, resizeStartSize.height - deltaY);
      const heightDiff = resizeStartSize.height - newHeight;
      const newY = resizeStartPos.y + heightDiff;
      const minY = 0;
      const maxY = window.innerHeight - 50; // Garantir que pelo menos 50px de altura fiquem visíveis
      resizedNote.position.y = Math.max(minY, Math.min(maxY, newY));
      resizedNote.height = Math.max(50, resizeStartSize.height - deltaY);
    }
    // Forçar re-render
    pages = [...pages];
  }

  function stopResize() {
    if (resizedNote) {
      // Salvar a nova posição e tamanho da nota
      saveNotePosition(resizedNote.id, resizedNote.position, resizedNote.width, resizedNote.height);
    }
    isResizing = false;
    resizeDirection = '';
    resizedNote = null;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
</script>

<main class="flex-1 space-y-4 bg-white p-4 overflow-auto relative">
  {#if currentPage && showSidebar}
    <div class="mb-4">
      <h1 class="text-2xl font-bold text-black">{currentPage.title}</h1>
    </div>
  {/if}

  {#if currentPage}
    <!-- Renderizar notas -->
    {#each notes as note (note.id)}
      <div
        class="group absolute border-2 border-black bg-white p-3 {note.maximized ? 'cursor-default' : 'cursor-move'}"
        class:minimized={note.minimized}
        style="left: {note.maximized ? '10%' : note.position.x + 'px'}; top: {note.maximized ? '10%' : note.position.y + 'px'}; width: {note.maximized ? '80%' : note.width + 'px'}; height: {note.maximized ? '80%' : (note.minimized ? 'auto' : note.height + 'px')}; z-index: {note.maximized ? 1000 : (note.zIndex || 1)};"
        role="button"
        tabindex="0"
        aria-label="Move note"
        onmousedown={(event) => {
          // Trazer nota para frente sempre que clicada
          maxZIndex++;
          note.zIndex = maxZIndex;
          pages = [...pages]; // Forçar re-render
          if (!note.maximized) startDrag(event, note);
        }}
      >
                <div class="flex justify-between items-center border-b-2 border-gray-300 pb-2 mb-3 bg-gray-50 rounded-t-lg -m-3 px-3 pt-2">
          {#if editingNoteId === note.id && editingField === 'title'}
            <input
              class="font-semibold text-black bg-transparent border-none outline-none flex-1 text-lg"
              bind:value={editValue}
              onkeydown={(/** @type {KeyboardEvent} */ e) => {
                if (e.key === 'Enter') saveEdit(note.id, 'title', editValue);
                if (e.key === 'Escape') stopEditing();
              }}
              onblur={() => saveEdit(note.id, 'title', editValue)}
              use:focusInput
            />
          {:else}
            <span
              role="button"
              tabindex="0"
              aria-label="Edit note title"
              ondblclick={() => startEditing(note.id, 'title')}
              class="font-semibold text-black cursor-text select-none text-lg hover:text-gray-700"
            >
              {note.title}
            </span>
          {/if}
          <div class="flex gap-1">
            <button 
              class="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              onclick={() => handleToggleMinimize(note.id)}
              aria-label="Minimize note"
            >_</button>
            <button 
              class="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
              onclick={() => handleToggleMaximize(note.id)}
              aria-label="Maximize note"
            >□</button>
            <button 
              class="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              onclick={() => handleDeleteNote(note.id)}
              aria-label="Delete note"
            >×</button>
          </div>
        </div>

        {#if !note.minimized}
          {#if editingNoteId === note.id && editingField === 'content'}
            <textarea
              class="text-black bg-transparent border-none outline-none resize-none w-full h-full px-1 py-1 text-base leading-relaxed"
              bind:value={editValue}
              onkeydown={(/** @type {KeyboardEvent} */ e) => {
                if (e.key === 'Enter' && e.ctrlKey) saveEdit(note.id, 'content', editValue);
                if (e.key === 'Escape') stopEditing();
              }}
              onblur={() => saveEdit(note.id, 'content', editValue)}
              use:focusInput
            ></textarea>
          {:else}
            <div
              class="text-black overflow-auto h-full cursor-text select-none note-content prose prose-sm max-w-none px-1 py-1 text-base leading-relaxed"
              role="button"
              tabindex="0"
              aria-label="Edit note content"
              ondblclick={() => startEditing(note.id, 'content')}
            >
              {@html marked(note.content || '')}
            </div>
          {/if}
        {/if}

          <div class="absolute -top-1 -left-1 w-1 h-1 bg-gray-400 cursor-nw-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize northwest"
            onmousedown={(event) => startResize(event, note, 'nw')}></div>
          <div class="absolute -top-1 -right-1 w-1 h-1 bg-gray-400 cursor-ne-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize northeast"
            onmousedown={(event) => startResize(event, note, 'ne')}></div>
          <div class="absolute -bottom-1 -left-1 w-1 h-1 bg-gray-400 cursor-sw-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize southwest"
            onmousedown={(event) => startResize(event, note, 'sw')}></div>
          <div class="absolute -bottom-1 -right-1 w-1 h-1 bg-gray-400 cursor-se-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize southeast"
            onmousedown={(event) => startResize(event, note, 'se')}></div>

          <!-- Edges -->
          <div class="absolute top-0 left-4 right-4 h-0.5 bg-gray-400 cursor-n-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize north"
            onmousedown={(event) => startResize(event, note, 'n')}></div>
          <div class="absolute bottom-0 left-4 right-4 h-0.5 bg-gray-400 cursor-s-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize south"
            onmousedown={(event) => startResize(event, note, 's')}></div>
          <div class="absolute top-4 bottom-4 left-0 w-0.5 bg-gray-400 cursor-w-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize west"
            onmousedown={(event) => startResize(event, note, 'w')}></div>
          <div class="absolute top-4 bottom-4 right-0 w-0.5 bg-gray-400 cursor-e-resize opacity-0 group-hover:opacity-100"
            role="button"
            tabindex="0"
            aria-label="Resize east"
            onmousedown={(event) => startResize(event, note, 'e')}></div>
    </div>
    {/each}
{/if}

    <!-- Botão de adicionar nota no canto inferior direito -->
  {#if currentPage && showAddNoteIcon}
    <button
      class="hover:cursor-pointer fixed bottom-4 right-4 z-9999 flex items-center justify-center rounded-full w-14 h-14 bg-white hover:border-2 border-black text-black hover:bg-gray-50 transition-all duration-300"
      onclick={onAddNote}
    >
      <Plus size={28} />
    </button>
  {/if}

  <!-- Modal para nova nota -->
  <NewNote
    show={showNewNoteModal}
    title={newNoteTitle}
    content={newNoteContent}
    onConfirm={onConfirmNewNote}
    onCancel={onCancelNewNote}
  />
</main>