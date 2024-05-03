<script>
  import {onMount} from 'svelte';
  import {formatPace, formatSpeed, formatTime} from './utils.js';
  import {showWorldRecords, worldRecords, isLoadingRecords} from './worldRecordsStore.js';
  import {selectedMinPace, selectedMaxPace, selectedIncrement} from './paceTableStore.js';
  import {selectedAthletes} from './athletesStore.js';
  import WorldRecords from './WorldRecords.svelte';
  import AthleteSearch from './AthleteSearch.svelte';

  // State variables for storing pace data and table columns
  let paceData = [];
  let columns = [];
  let athletes = [];

  // Mapping of numeric distances to human-readable names
  const distanceDisplayNames = {
    '1609.34': 'Mile',
    '5000': '5km',
    '10000': '10km',
    '20000': '20km',
    '21097': 'Semi M.',
    '42195': 'Marathon',
  };

  // Predefined ranges for pacing and increments
  const paceRange = [90, 120, 180, 240, 300, 360, 420, 480, 540, 600].reverse();
  const incrementRange = [1, 2, 5, 10, 15, 20, 30];

  // Object to keep track of highlighted table cells
  const highlighted = {
    column: null,
    row: null,
  };

  /**
   * Prevents event propagation and updates highlighted state for table cells.
   * @param {Event} event - The DOM event object.
   * @param {string} column - The column identifier to highlight.
   * @param {Object} row - The row data object to highlight.
   */
  function handleHighlight(event, column, row) {
    event.stopPropagation();

    if (column !== null && column !== undefined) {
      highlighted.column = column === highlighted.column ? null : column;
    }

    if (row !== null && row !== undefined) {
      highlighted.row = row === highlighted.row ? null : row;
    }
  }

  /**
   * Fetches pace data from an API endpoint and updates local state.
   */
  async function fetchPaceData() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/generate_table`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          min_pace: $selectedMinPace,
          max_pace: $selectedMaxPace,
          increment: $selectedIncrement,
        }),
      });

      if (response.ok) {
        paceData = await response.json();
        if (paceData.length > 0) {
          columns = Object.keys(paceData[0]).filter((key) => key !== 'pace' && key != 'speed');
          columns.sort((a, b) => parseInt(a) - parseInt(b));
        }
      } else {
        console.error('Error fetching data from the API');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  /**
   * Checks if a given time for a distance is a men's world record.
   * @param {string} distance - The distance for which to check the record.
   * @param {number} time - The time achieved for the distance.
   * @return {boolean} - True if the time is a world record for men; otherwise, false.
   */
  function isMenWR(distance, time) {
    if ($isLoadingRecords) return false;
    const record = $worldRecords['men'][distance];
    return isWR(distance, time, record);
  }

  /**
   * Checks if a given time for a distance is a women's world record.
   * @param {string} distance - The distance for which to check the record.
   * @param {number} time - The time achieved for the distance.
   * @return {boolean} - True if the time is a world record for women; otherwise, false.
   */
  function isWomenWR(distance, time) {
    if ($isLoadingRecords) return false;
    const record = $worldRecords['women'][distance];
    return isWR(distance, time, record);
  }

  /**
   * General function to check if a time is a world record.
   * @param {string} distance - The distance for which to check the record.
   * @param {number} time - The time achieved.
   * @param {number} record - The current world record time for the distance.
   * @return {boolean} - True if the time is a world record; otherwise, false.
   */
  function isWR(distance, time, record) {
    if (!record) return false;
    const timeDiff = distance * $selectedIncrement / 1000;
    const prevTime = time + timeDiff;
    const nextTime = time - timeDiff;
    return Math.abs(time - record) < Math.abs(prevTime - record) &&
      Math.abs(time - record) < Math.abs(nextTime - record);
  }

  /**
    * Returns the color of the athlete record for a given cell in the table.
    * @param {string} distance - The distance for which to check the record.
    * @param {number} time - The time achieved for the distance.
    * @return {string} - The color of the athlete record, or an empty string if none.
    */
  function getAthleteRecordColor(distance, time) {
    const timeDiff = distance * $selectedIncrement / 1000;
    const prevTime = time + timeDiff;
    const nextTime = time - timeDiff;
    for (const athlete of athletes) {
      console.log(athlete.records, distance, time, prevTime, nextTime);
      const record = athlete.records[distance];
      if (Math.abs(time - record) < Math.abs(prevTime - record) &&
        Math.abs(time - record) <= Math.abs(nextTime - record)) {
        return 'color: #fff; background-color: ' + athlete.color;
      }
    }
  }

  // Fetch initial data when component mounts
  onMount(() => {
    const initMinPace = localStorage.getItem('selectedMinPace');
    selectedMinPace.set(initMinPace ? parseInt(initMinPace) : $selectedMinPace);

    const initMaxPace = localStorage.getItem('selectedMaxPace');
    selectedMaxPace.set(initMaxPace ? parseInt(initMaxPace) : $selectedMaxPace);

    const initIncrement = localStorage.getItem('selectedIncrement');
    selectedIncrement.set(initIncrement ? parseInt(initIncrement) : $selectedIncrement);

    const unsubscribeMinPace = selectedMinPace.subscribe((value) => {
      localStorage.setItem('selectedMinPace', value.toString());
    });

    const unsubscribeMaxPace = selectedMaxPace.subscribe((value) => {
      localStorage.setItem('selectedMaxPace', value.toString());
    });

    const unsubscribeIncrement = selectedIncrement.subscribe((value) => {
      localStorage.setItem('selectedIncrement', value.toString());
    });

    fetchPaceData();

    return () => {
      unsubscribeMinPace();
      unsubscribeMaxPace();
      unsubscribeIncrement();
    };
  });

  $: {
    if ($selectedAthletes) {
      athletes = $selectedAthletes.filter((a) => a.visible);
    }
    if (!$isLoadingRecords && paceData.length > 0) {
      paceData = paceData.map((row) => ({...row}));
    }
  }

</script>

<div class="top-container">

  <!-- Athlete search component -->
  <AthleteSearch />

  <!-- World records component -->
  <WorldRecords />

  <!-- Form to select pace range and increment -->
  <form on:submit|preventDefault={fetchPaceData}>
    <div>
      <label for="min-pace">Min.</label>
      <select id="min-pace" class="material-select" bind:value={$selectedMinPace} on:change={fetchPaceData}>
        {#each paceRange as pace}/km
          <option value={pace}>{formatPace(pace)} / km</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="max-pace">Max.</label>
      <select id="max-pace" class="material-select" bind:value={$selectedMaxPace} on:change={fetchPaceData}>
        {#each paceRange as pace}
          <option value={pace}>{formatPace(pace)} / km</option>
        {/each}
      </select>
    </div>
    <div>
      <label for="increment">Incrément.</label>
      <select id="increment" class="material-select" bind:value={$selectedIncrement} on:change={fetchPaceData}>
        {#each incrementRange as increment}
          <option value={increment}>{increment}"</option>
        {/each}
      </select>
    </div>
  </form>

</div>

<!-- Table markup to display pace data -->
<table>
  <!-- Table header -->
  <thead>
    <tr>
      <th>t/km</th>
      <th>km/h</th>
      {#each columns as column}
        <th on:click={() => handleHighlight(event, column, null)}>{distanceDisplayNames[column] || column}</th>
      {/each}
    </tr>
  </thead>
  <!-- Table body -->
  <tbody>
    {#each paceData as row, rowIndex}
      <tr on:click={(event) => handleHighlight(event, null, row)}>
        <td class:highlighted={highlighted.row === row} class="col-head">{formatPace(row.pace)}</td>
        <td class:highlighted={highlighted.row === row} class="col-head">{formatSpeed(row.speed)}</td>
        {#each columns as column, columnIndex}
          <td on:click={(event) => handleHighlight(event, column, row)}
              class:highlighted={highlighted.column === column || highlighted.row === row}
              class:men-record={$showWorldRecords && isMenWR(column, row[column])}
              class:women-record={$showWorldRecords && isWomenWR(column, row[column])}
              style="{getAthleteRecordColor(column, row[column])}">
              {formatTime(row[column], column < 800)}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
  form {
    margin-bottom: 10px;
  }

  label {
    display: inline-block;
    width: 100px;
    margin-bottom: 5px;
  }

  select {
    display: inline-block;
    width: 120px;
    margin-bottom: 5px;
  }

  table{
    border-collapse: collapse;
  }

  th {
    background-color: #03A9F4;
    color: #fff;
    cursor: pointer;
    padding: 3px;
  }

  td {
    text-align: center;
    margin: 0px;
    padding-left: 5px;
    padding-right: 5px;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
    z-index: -2;
  }

  tr:hover {
    background-color: #B3E5FC;
  }

  .highlighted {
    background-color: #B3E5FC;
  }

  .col-head {
    font-weight: bold;
  }

  td {
    text-align: center;
    margin: 0px;
    padding-left: 5px;
    padding-right: 5px;
    box-sizing: border-box;
  }

  .men-record {
    background-color: gold;
    color: #1565C0;
  }

  .women-record {
    background-color: gold;
    color: #EC407A;
  }
</style>
