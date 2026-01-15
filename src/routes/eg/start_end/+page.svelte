<script lang="ts">
    import { STAGES, generateRoute, formatDate } from '$lib/trail';
  
    let startPoint = $state<string>("");
    let endPoint = $state<string>("");
    let startDate = $state<string>("");
  
    // Generate the list of segments based on selections
    let route = $derived(generateRoute(startPoint, endPoint));

 // Get the names of the stages for the dropdowns
    const stageNames = Object.fromEntries(STAGES.map((s: Stage) => [s.id, s.name]));
  </script>
  
  <div class="max-w-2xl mx-auto p-6 space-y-6 heading-drop">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="flex flex-col">
        <label class="text-sm font-bold mb-1">Starting From</label>
        <select bind:value={startPoint} class="border p-2 rounded">
          <option value="" disabled selected>Select...</option>
          {#each STAGES as stage}
            <option value={stage.id}>{stage.name}</option>
          {/each}
        </select>
      </div>
  
      <div class="flex flex-col">
        <label class="text-sm font-bold mb-1">Destination</label>
        <select bind:value={endPoint} class="border p-2 rounded">
          <option value="" disabled selected>Select...</option>
          {#each STAGES as stage}
            <option value={stage.id}>{stage.name}</option>
          {/each}
        </select>
      </div>
  
      <div class="flex flex-col">
        <label class="text-sm font-bold mb-1">Start Date</label>
        <input type="date" bind:value={startDate} class="border p-2 rounded" />
      </div>
    </div>
  
    {#if route.length > 0 && startDate}
      <div class="mt-8 border rounded-lg overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-100">
            <tr>
              <th class="p-3 border-b">Day</th>
              <th class="p-3 border-b">Date</th>
              <th class="p-3 border-b">Segment</th>
            </tr>
          </thead>
          <tbody>
            {#each route as [from, to], i}
              <tr class="hover:bg-slate-50">
                <td class="p-3 border-b text-slate-500">Day {i + 1}</td>
                <td class="p-3 border-b">{formatDate(startDate, i)}</td>
                <td>{stageNames[from]} → {stageNames[to]}</td>
              </tr>
            {/each}
          </tbody>
        </table>
        <div class="p-4 bg-blue-50 text-blue-800 text-sm italic">
          Total duration: {route.length} days of walking.
        </div>
      </div>
    {:else if startPoint && endPoint && startPoint === endPoint}
      <p class="text-red-500 text-center">Start and destination cannot be the same town.</p>
    {:else}
      <div class="text-center py-12 border-2 border-dashed rounded-lg text-slate-400">
        Select your start point, destination, and date to generate your itinerary.
      </div>
    {/if}
  </div>
  
  <style>
    .heading-drop {
      max-width: 600px;
      margin: 7rem auto;
    }
  </style>