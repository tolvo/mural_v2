<script>
  import {
    ChevronLeft,
    ChevronRight,
    Trash2,
    Plus,
    Origami,
  } from "@lucide/svelte";
  import { slide } from "svelte/transition";

  export let pages;
  export let showSidebar = true;
  export let handleAddPage;
  /** @type {(pageId: string) => void} */
  export let handleDeletePage;
  /** @type {string | null} */
  export let currentPageId = null;
  /** @type {any} */
  export let currentPage = null;

  let selected = false;

  $: orderedPages = pages
    .slice()
    .sort(
      (
        /** @type {{ updated_at: string | number | Date; }} */ a,
        /** @type {{ updated_at: string | number | Date; }} */ b
      ) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
</script>

{#if showSidebar}
  <aside
    class="w-full md:w-64 bg-white border-r border-gray-950 p-4 shrink-0 flex flex-col items-center"
    transition:slide={{ duration: 300, axis: 'x' }}
  >
    <div class="flex flex-row gap-2 mb-4 justify-between w-full items-center">
      <Origami size={40} class="text-black" />
      <div class="flex flex-row gap-2">
        <button
          class="hover:cursor-pointer flex items-center justify-center rounded-full w-12 h-12 bg-white hover:border-2 hover:border-black text-black"
          onclick={handleAddPage}
        >
          <Plus size={24} />
        </button>
        <button
          class="hover:cursor-pointer flex items-center justify-center rounded-full w-12 h-12 bg-white hover:border-2 hover:border-black text-black"
          onclick={() => (showSidebar = false)}
        >
          <ChevronLeft size={24} />
        </button>
      </div>
    </div>
    <div class="flex flex-col h-full p-4 overflow-y-auto gap-2 w-full">
      {#each orderedPages as page}
        <div
          class="hover:border-2 flex items-center justify-between border border-black rounded-none bg-white px-2 py-2 hover:bg-gray-100 w-full {page.id ===
          currentPageId
            ? 'bg-gray-200'
            : ''}"
        >
          <button
            class="hover:cursor-pointer font-medium text-black flex-1 text-left"
            onclick={() => (currentPageId = page.id)}>{page.title}</button
          >
          <button
            class="border border-black rounded-none bg-white px-1 py-1 text-black hover:text-red-600 hover:border-red-600 hover:bg-red-100 hover:cursor-pointer"
            onclick={() => handleDeletePage(page.id)}
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      {/each}
    </div>
  </aside>
{:else}
  <div class="fixed top-4 left-4 z-50 flex items-center gap-4" transition:slide={{ duration: 600, axis: 'x' }}>
    <button
      class="hover:cursor-pointer flex items-center justify-center rounded-full w-12 h-12 bg-white hover:border-2 mt-12 hover:border-black text-black"
      onclick={() => (showSidebar = true)}
    >
      <ChevronRight size={24} />
    </button>
    {#if currentPage}
      <h1 class="text-2xl font-bold text-black mt-12">{currentPage.title}</h1>
    {/if}
  </div>
{/if}
