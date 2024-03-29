<script>
    import {onMount} from 'svelte';

    // Define state variables for pace data and table columns
    let paceData = [];
    let columns = [];

    const distanceDisplayNames = {
      '1609.34': 'Mile',
      '5000': '5km',
      '10000': '10km',
      '20000': '20km',
      '21097': 'Semi M.',
      '42195': 'Marathon',
    };

    const paceRange = [90, 120, 180, 240, 300, 360, 420, 480, 540, 600];
    const incrementRange = [1, 2, 5, 10, 15, 20, 30];
    const highlighted = {
      column: null,
      row: null,
    };

    function handleHighlight(event, column, row) {
      // Empêche la propagation de l'événement vers les éléments parents dans le DOM
      event.stopPropagation();

      // Met à jour l'état de la colonne sélectionnée si la valeur de colonne est fournie
      if (column !== null && column !== undefined) {
        highlighted.column = column === highlighted.column ? null : column;
      }

      // Met à jour l'état de la ligne sélectionnée si la valeur de ligne est fournie
      if (row !== null && row !== undefined) {
        highlighted.row = row === highlighted.row ? null : row;
      }
    }

    let selectedMinPace = 360; // Default max pace 6'00"/km
    let selectedMaxPace = 120; // Default min pace 2'00"/km
    let selectedIncrement = 1; // Default increment 1"/km
    let highlightedColumn = null;
    let highlightedRow = null;

    // Function to highlight a column.
    function highlightColumn(column) {
      highlightedColumn = column === highlightedColumn ? null : column;
    }

    function highlightRow(row) {
      highlightedRow = row === highlightedRow ? null : row;
    }

    // Function to fetch pace data from the API
    async function fetchPaceData() {
      try {
        // Perform a POST request to the API
        const response = await fetch(`${import.meta.env.VITE_API_URL}/generate_table`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          // Use default initial values
          body: JSON.stringify({
            min_pace: selectedMinPace,
            max_pace: selectedMaxPace,
            increment: selectedIncrement
          })
        });

        // Handle the API response
        if (response.ok) {
          // Parse JSON response and update paceData
          paceData = await response.json();

          // If data is available, extract and sort column keys
          if (paceData.length > 0) {
            columns = Object.keys(paceData[0]).filter(key => key !== 'pace' && key != 'speed');
            columns.sort((a, b) => parseInt(a) - parseInt(b));
          }
        } else {
          console.error('Error fetching data from the API');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }

    // Fetch data on component mount
    onMount(fetchPaceData);

    // Function to format time from seconds to human-readable format
    function formatTime(seconds, withCentiseconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const fullSeconds = Math.floor(seconds % 60);
      const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100);

      let formattedTime = '';
      if (hours > 0) {
        formattedTime += `${hours}h`;
      }
      if (minutes > 0 || hours > 0) {
        formattedTime += `${hours > 0 ? minutes.toString().padStart(2, '0') : minutes}'`;
      }
      formattedTime += `${fullSeconds.toString().padStart(2, '0')}"`;

      if (withCentiseconds) {
        formattedTime += `${centiseconds.toString().padStart(2, '0')}`;
      }

      return formattedTime;
    }

    // Function to format pace from seconds per km to min/km
    function formatPace(secondsPerKm) {
      const minutes = Math.floor(secondsPerKm / 60);
      const seconds = secondsPerKm % 60;
      return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
    }

    function formatSpeed(speed) {
      return speed.toFixed(2);
    }

</script>

<form on:submit|preventDefault={fetchPaceData}>
  <div>
    <label for="min-pace">Min.</label>
    <select id="min-pace" class="material-select" bind:value={selectedMinPace}>
      {#each paceRange.reverse() as pace}/km
        <option value={pace}>{formatPace(pace)} / km</option>
      {/each}
    </select>
  </div>
  <div>
    <label for="max-pace">Max.</label>
    <select id="max-pace" class="material-select" bind:value={selectedMaxPace}>
      {#each paceRange.reverse() as pace}
        <option value={pace}>{formatPace(pace)} / km</option>
      {/each}
    </select>
  </div>
  <div>
    <label for="increment">Incrément.</label>
    <select id="increment" class="material-select" bind:value={selectedIncrement}>
      {#each incrementRange as increment}
        <option value={increment}>{increment}"</option>
      {/each}
    </select>
  </div>
  <button class="material-button" type="submit">Générer</button>
</form>

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
          <td on:click={(event) => handleHighlight(event, column, row)} class:highlighted={highlighted.column === column || highlighted.row === row}>
            {#if column >= 800} <!-- Display centiseconds only for < 800 -->
              {formatTime(row[column], false)}
            {:else}
              {formatTime(row[column], true)}
            {/if}
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
