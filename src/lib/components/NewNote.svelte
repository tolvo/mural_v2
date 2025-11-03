<script>
    export let show = false;
    /** @type {(title: string, content: string) => void} */
    export let onConfirm;
    export let onCancel;
    export let title = "";
    export let content = "";
</script>

{#if show}
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="bg-white border-2 border-black p-6 rounded-none flex flex-col gap-4 w-96">
      <h2 class="text-lg font-bold text-black">New note</h2>

      <div class="flex flex-col gap-2">
        <label for="note-title" class="text-sm font-bold pt-2 pb-2 text-black">Title</label>
        <input
          id="note-title"
          class="border border-black p-4 text-black bg-white rounded-none"
          type="text"
          bind:value={title}
          placeholder="Enter note title..."
          on:keydown={(e) => e.key === 'Enter' && onConfirm(title, content)}
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="note-content" class="text-sm font-bold pt-2 pb-2 text-black">Content</label>
        <textarea
          id="note-content"
          class="border border-black p-2 text-black bg-white rounded-none resize-none"
          rows="4"
          bind:value={content}
          placeholder="Digite o conteúdo da nota..."
        ></textarea>
      </div>

      <div class="flex flex-row gap-2 justify-end">
        <button class="border border-black bg-white text-black px-4 py-2 rounded-none hover:bg-gray-100" on:click={onCancel}>Cancelar</button>
        <button class="border border-black bg-black text-white px-4 py-2 rounded-none hover:bg-gray-900" on:click={() => { onConfirm(title, content); }}>Criar Nota</button>
      </div>
    </div>
  </div>
{/if}
