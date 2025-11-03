<script>
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Main from "$lib/components/Main.svelte";
  import TitleBar from "$lib/components/TitleBar.svelte";
  import NewPage from '$lib/components/NewPage.svelte';
  import { writeTextFile, readTextFile } from "@tauri-apps/plugin-fs";
  import { onMount } from "svelte";
  import { homeDir } from "@tauri-apps/api/path";
  import { addPage, deletePage } from "$lib/utils/utils.js";


  /** @type {any[]} */
  let pages = [];

  let showSidebar = true;

  let showModal = false;
  let newPageTitle = "";

  /** @type {string | null} */
  let currentPageId = null;

  onMount(async () => {
    try {
      const data = await readTextFile(await homeDir() + '/.mural_data.json');
      pages = JSON.parse(data);
      console.log('Fetched pages:', pages);
    } catch {
      const examplePages = [
        {
          'id': '1234',
          'title': 'Example Page 1',
          'created_at': '2024-01-01T12:00:00Z',
          'updated_at': '2024-01-02T12:00:00Z',
          'notes': [
            {
              'id': 'note1',
              'title': 'Example Note 1',
              'content': 'This is an example note.',
              'position': { 'x': 100, 'y': 150 },
              'width': 200, 'height': 100,
              'created_at': '2024-01-01T12:00:00Z',
              'updated_at': '2024-01-02T12:00:00Z'
            }
          ]
        },
        {
          'id': '5678',
          'title': 'Example Page 2',
          'created_at': '2024-02-01T12:00:00Z',
          'updated_at': '2024-02-02T12:00:00Z',
          'notes': [
            {
              'id': 'note2',
              'title': 'Example Note 2',
              'content': 'This is another example note.',
              'position': { 'x': 200, 'y': 250 },
              'width': 250, 'height': 150,
              'created_at': '2024-02-01T12:00:00Z',
              'updated_at': '2024-02-02T12:00:00Z'
            }
          ]
        }
      ];
      pages = examplePages;
      console.log("example pages:", pages);
    }
  });

  async function hideSidebar() {
    showSidebar = false;
  }

  async function handleAddPage() {
    console.log('Opening modal');
    showModal = true;
  }

  /**
   * @param {string} pageId
   */
  async function handleDeletePage(pageId) {
    console.log('Deleting page:', pageId);
    try {
      pages = await deletePage(pages, pageId);
      console.log('Pages after delete:', pages);
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  }

  async function confirmAddPage() {
    if (newPageTitle.trim()) {
      console.log('Adding page:', newPageTitle);
      try {
        pages = await addPage(pages, newPageTitle);
        console.log('Pages after add:', pages);
        newPageTitle = "";
        showModal = false;
      } catch (error) {
        console.error('Error adding page:', error);
      }
    }
  }

  function cancelAddPage() {
    newPageTitle = "";
    showModal = false;
  }

  $: currentPage = pages.find(page => page.id === currentPageId);

</script>

<div class="flex flex-col h-screen">
  <TitleBar />
  <div class="flex flex-1 md:flex-row">
    <Sidebar {pages} bind:showSidebar {handleAddPage} {handleDeletePage} bind:currentPageId {currentPage} />
    <Main {pages} {currentPageId} {showSidebar} />
  </div>
</div>

<NewPage
  show={showModal}
  onConfirm={confirmAddPage}
  onCancel={cancelAddPage}
  bind:value={newPageTitle}
/>

