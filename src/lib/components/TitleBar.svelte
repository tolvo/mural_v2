<script>
  import { getCurrentWindow, PhysicalPosition } from '@tauri-apps/api/window';
  import { onMount } from 'svelte';
  import { Minus, Square, X } from '@lucide/svelte';

  const appWindow = getCurrentWindow();

  let isDragging = false;
  let initialMousePos = { x: 0, y: 0 };
  let initialWindowPos = { x: 0, y: 0 };
  /**
   * @type {number | null | undefined}
   */
  let updateTimeout = null;
  // Use manual dragging in dev for easier debugging; in production prefer native startDragging
  const FORCE_MANUAL_DRAG = import.meta.env.DEV;
  /**
   * @type {{ x: any; y: any; } | null}
   */
  let latestMousePos = null;
  let rafId = null;
  let onMoveHandler = null;
  let decorated = false;

  async function minimize() {
    try {
      await appWindow.minimize();
    } catch (error) {
      console.error('Erro ao minimizar:', error);
    }
  }

  // Toggle native decorations at runtime. Useful on Wayland where programmatic
  // setPosition is restricted — enabling native decorations hands movement to compositor.
  async function toggleDecorations() {
    try {
      decorated = !decorated;
      if (appWindow.setDecorations) {
        await appWindow.setDecorations(decorated);
      } else {
        console.warn('setDecorations API not available');
      }
    } catch (e) {
      console.error('Erro ao alternar decorações:', e);
    }
  }

  async function toggleMaximize() {
    try {
      await appWindow.toggleMaximize();
    } catch (error) {
      console.error('Erro ao maximizar:', error);
    }
  }

  async function close() {
    try {
      await appWindow.close();
    } catch (error) {
      console.error('Erro ao fechar:', error);
    }
  }

  /**
   * @param {MouseEvent} event
   */
  async function startDrag(event) {
    // don't start drag when clicking on a control button
    if (event.target && 'tagName' in event.target && event.target.tagName === 'BUTTON') return;

    // Optionally force manual smooth drag for visible animation path
    if (!FORCE_MANUAL_DRAG) {
      // Prefer native OS dragging which is smooth and managed by WM
      try {
        await appWindow.startDragging();
        console.log('TitleBar: using native startDragging');
        return;
      } catch (err) {
        // If native dragging isn't available or allowed, fallback to manual drag
        console.warn('TitleBar: startDragging failed, falling back to manual drag', err);
      }
    }

    // Manual eased drag using requestAnimationFrame + lerp
    isDragging = true;
    initialMousePos = { x: event.clientX, y: event.clientY };
    initialWindowPos = await appWindow.innerPosition();
    latestMousePos = { x: event.clientX, y: event.clientY };

    /**
     * @param {{ clientX: any; clientY: any; }} e
     */
    onMoveHandler = function onMove(e) {
      latestMousePos = { x: e.clientX, y: e.clientY };
    };

    document.addEventListener('mousemove', onMoveHandler);
    document.addEventListener('mouseup', stopDrag);

    // eased animation parameters
    const EASING = 0.5; // 0 < EASING <= 1, smaller = smoother/slower
    let currentPos = { x: initialWindowPos.x, y: initialWindowPos.y };

    function animate() {
      if (!isDragging) return;
      if (!latestMousePos) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      const targetX = initialWindowPos.x + (latestMousePos.x - initialMousePos.x);
      const targetY = initialWindowPos.y + (latestMousePos.y - initialMousePos.y);

      // linear interpolation (lerp)
      currentPos.x += (targetX - currentPos.x) * EASING;
      currentPos.y += (targetY - currentPos.y) * EASING;

      try {
        appWindow.setPosition(new PhysicalPosition(Math.round(currentPos.x), Math.round(currentPos.y)));
      } catch (e) {
        // ignore permission errors
      }

  rafId = requestAnimationFrame(animate);
    }

  rafId = requestAnimationFrame(animate);
  }

  /**
   * Manual drag fallback (debounced)
   * @param {MouseEvent} event
   */
  function drag(event) {
    if (!isDragging) return;

    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      const deltaX = event.clientX - initialMousePos.x;
      const deltaY = event.clientY - initialMousePos.y;

      const newX = initialWindowPos.x + deltaX;
      const newY = initialWindowPos.y + deltaY;

      // best-effort move
      try {
        appWindow.setPosition(new PhysicalPosition(newX, newY));
      } catch (e) {
        // ignore errors — permissions may block this in some environments
      }

      updateTimeout = null;
    }, 16); // ~60fps
  }

  function stopDrag() {
    isDragging = false;

    if (updateTimeout) {
      clearTimeout(updateTimeout);
      updateTimeout = null;
    }
    if (onMoveHandler) {
      document.removeEventListener('mousemove', onMoveHandler);
      onMoveHandler = null;
    }
    document.removeEventListener('mouseup', stopDrag);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }
</script>

<header 
  class="flex items-center justify-between bg-white border-b border-black px-4 py-2 select-none cursor-move"
  on:mousedown={startDrag}
>
  <h1 class="text-lg font-bold text-black">mural</h1>

  <div class="flex items-center gap-1">
    <button
      class="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded"
      on:click={minimize}
      title="Minimizar"
    >
      <Minus size={16} />
    </button>

    <button
      class="flex items-center justify-center w-8 h-8 hover:bg-gray-100 rounded"
      on:click={toggleMaximize}
      title="Maximizar"
    >
      <Square size={14} />
    </button>

    <button
      class="flex items-center justify-center w-8 h-8 hover:bg-red-100 hover:text-red-600 rounded"
      on:click={close}
      title="Fechar"
    >
      <X size={16} />
    </button>
  </div>
</header>
