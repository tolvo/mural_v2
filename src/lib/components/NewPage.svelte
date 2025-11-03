<script>
    export let show = false;
    export let onConfirm = () => {};
    export let onCancel = () => {};
    export let value = "";
</script>

{#if show}
  <div class="fixed inset-0 flex items-center justify-center z-50">
    <div class="bg-white border-2 border-black p-6 rounded-none flex flex-col gap-4 w-80">
      <h2 class="text-lg font-bold text-black">Nome da nova página</h2>
      <input
        class="border border-black p-2 text-black bg-white rounded-none"
        type="text"
        bind:value={value}
        placeholder="Digite o nome..."
        on:keydown={(e) => e.key === 'Enter' && onConfirm()}
      />
      <div class="flex flex-row gap-2 justify-end">
        <button class="border border-black bg-white text-black px-4 py-2 rounded-none hover:bg-gray-100" on:click={onCancel}>Cancelar</button>
        <button class="border border-black bg-black text-white px-4 py-2 rounded-none hover:bg-gray-900" on:click={() => { console.log('Confirm clicked'); onConfirm(); }}>Confirmar</button>
      </div>
    </div>
  </div>
{/if}