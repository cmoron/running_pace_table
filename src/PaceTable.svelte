<script>
  import {onMount} from 'svelte';
  import {formatPace, formatSpeed, formatTime} from './utils.js';

  // State variables for storing pace data and table columns
  let paceData = [];
  let columns = [];

  // State for toggling visibility of world records and managing their state
  let showWorldRecords = false;
  let worldRecords = {};
  let isLoadingRecords = false;

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

  // Default selected pace values
  let selectedMinPace = 360; // Default max pace 6'00"/km
  let selectedMaxPace = 120; // Default min pace 2'00"/km
  let selectedIncrement = 1; // Default increment 1"/km

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
          min_pace: selectedMinPace,
          max_pace: selectedMaxPace,
          increment: selectedIncrement,
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
   * Fetches world record data from an external API.
   */
  async function fetchWorldRecords() {
    isLoadingRecords = true;
    try {
      const response = await fetch('https://running-pace-api.moron.at/get_world_records');
      if (response.ok) {
        worldRecords = await response.json();
      } else {
        console.error('Error retrieving world records');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      isLoadingRecords = false;
    }
  }

  /**
   * Checks if a given time for a distance is a men's world record.
   * @param {string} distance - The distance for which to check the record.
   * @param {number} time - The time achieved for the distance.
   * @return {boolean} - True if the time is a world record for men; otherwise, false.
   */
  function isMenWR(distance, time) {
    if (isLoadingRecords) return false;
    const record = worldRecords['men'][distance];
    return isWR(distance, time, record);
  }

  /**
   * Checks if a given time for a distance is a women's world record.
   * @param {string} distance - The distance for which to check the record.
   * @param {number} time - The time achieved for the distance.
   * @return {boolean} - True if the time is a world record for women; otherwise, false.
   */
  function isWomenWR(distance, time) {
    if (isLoadingRecords) return false;
    const record = worldRecords['women'][distance];
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
    const timeDiff = distance * selectedIncrement / 1000;
    const prevTime = time + timeDiff;
    const nextTime = time - timeDiff;
    return Math.abs(time - record) < Math.abs(prevTime - record) &&
      Math.abs(time - record) < Math.abs(nextTime - record);
  }

  /**
   * Toggles the visibility of world records in the UI.
   */
  function toggleWorldRecords() {
    showWorldRecords = !showWorldRecords;
    if (showWorldRecords) {
      fetchWorldRecords();
    }
  }

  // Fetch initial data when component mounts
  onMount(fetchPaceData);

  // Reactively update paceData whenever records are not loading
  $: if (!isLoadingRecords) {
    paceData = paceData.map((row) => ({...row}));
  }

</script>

<div class="top-container">
  <div>
    <form on:submit|preventDefault={fetchPaceData}>
      <div>
        <label for="min-pace">Min.</label>
        <select id="min-pace" class="material-select" bind:value={selectedMinPace} on:change={fetchPaceData}>
          {#each paceRange as pace}/km
            <option value={pace}>{formatPace(pace)} / km</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="max-pace">Max.</label>
        <select id="max-pace" class="material-select" bind:value={selectedMaxPace} on:change={fetchPaceData}>
          {#each paceRange as pace}
            <option value={pace}>{formatPace(pace)} / km</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="increment">Incrément.</label>
        <select id="increment" class="material-select" bind:value={selectedIncrement} on:change={fetchPaceData}>
          {#each incrementRange as increment}
            <option value={increment}>{increment}"</option>
          {/each}
        </select>
      </div>
    </form>
    <label class="switch-label" for="wr-switch">World Records</label>
    <label class="switch">
      <input id="wr-switch" type="checkbox" on:click={toggleWorldRecords}>
      <span class="slider round"></span>
    </label>
    {#if isLoadingRecords}
      <div class="spinner"></div>
    {/if}
  </div>
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
              class:men-record={showWorldRecords && isMenWR(column, row[column])}
              class:women-record={showWorldRecords && isWomenWR(column, row[column])}>
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

  .men-record {
    background-color: #1565C0;
    color: #fff;
  }

  .women-record {
    background-color: #EC407A;
    color: #fff;
  }

  .switch-label {
    vertical-align: middle;
  }
  .switch {
    position: relative;
    display: inline-block;
    width: 40px;
    height: 24px;
    vertical-align: middle;
  }

  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    -webkit-transition: .4s;
    transition: .4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
  }

  input:checked + .slider {
    background-color: #2196F3;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(16px);
    -ms-transform: translateX(16px);
    transform: translateX(16px);
  }

  .slider.round {
    border-radius: 34px;
  }

  .slider.round:before {
    border-radius: 50%;
  }

  .spinner {
    height: 12px;
    width: 12px;
    display: inline-block;
    vertical-align: -3px;
    margin-left: 10px;
    -webkit-animation: rotation 1s infinite linear;
    -moz-animation: rotation 1s infinite linear;
    -o-animation: rotation 1s infinite linear;
    animation: rotation 1s infinite linear;
    border:3px solid rgba(0,0,0,.2);
    border-radius:100%;
  }

  .spinner:before {
    content:"";
    display:block;
    position:absolute;
    left:-3px;
    top:-3px;
    height:100%;
    width:100%;
    border-top:3px solid rgba(0,0,0,.8);
    border-left:3px solid transparent;
    border-bottom:3px solid transparent;
    border-right:3px solid transparent;
    border-radius:100%;
  }

  @-webkit-keyframes rotation {
    from {-webkit-transform: rotate(0deg);}
    to {-webkit-transform: rotate(359deg);}
  }
  @-moz-keyframes rotation {
    from {-moz-transform: rotate(0deg);}
    to {-moz-transform: rotate(359deg);}
  }
  @-o-keyframes rotation {
    from {-o-transform: rotate(0deg);}
    to {-o-transform: rotate(359deg);}
  }
  @keyframes rotation {
    from {transform: rotate(0deg);}
    to {transform: rotate(359deg);}
  }
</style>
