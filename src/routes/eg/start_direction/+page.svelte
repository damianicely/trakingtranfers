<script lang="ts">
    import { STAGES, getRemainingDays, type Direction } from '$lib/trail';
  
    let currentStop = $state<string>(""); 
    let direction = $state<Direction>(null);
  
    // Reactive calculation - only runs when both are set
    let daysLeft = $derived(getRemainingDays(currentStop, direction));
  </script>
  
  <div class="space-y-4 p-6 border rounded-xl shadow-sm bg-white max-w-md heading-drop">
    <div>
      <label for="location" class="block text-sm font-medium text-gray-700">Starting Point</label>
      <select id="location" bind:value={currentStop} class="mt-1 block w-full border rounded-md p-2">
        <option value="" disabled selected>Select a town...</option>
        {#each STAGES as stage}
          <option value={stage.id}>{stage.name}</option>
        {/each}
      </select>
    </div>
  
    <div>
      <label for="direction" class="block text-sm font-medium text-gray-700">Direction of Travel</label>
      <select id="direction" bind:value={direction} class="mt-1 block w-full border rounded-md p-2">
        <option value={null} disabled selected>Select direction...</option>
        <option value="NS">North to South (toward Lagos)</option>
        <option value="SN">South to North (toward S. Torpes)</option>
      </select>
    </div>
  
    <div class="mt-6">
      {#if daysLeft !== null}
        <div class="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
          <p class="text-center font-semibold">
            {daysLeft} days of walking remaining.
          </p>
        </div>
      {:else}
        <p class="text-sm text-gray-400 italic text-center">
          Select your location and direction to calculate your remaining trip.
        </p>
      {/if}
    </div>
  </div>

  <style>
    .heading-drop {
      max-width: 600px;
      margin: 7rem auto;
    }
  </style>