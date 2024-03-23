<script>
    import {onMount} from 'svelte';

    // Define state variables for pace data and table columns
    let paceData = [];
    let columns = [];

    const distanceDisplayNames = {
      '1609.34': 'Mile',
      '5000': '5km',
      '10000': '10km',
      '21097': 'Semi M.',
      '42195': 'Marathon',
    };

    const paceRange = [90, 120, 180, 240, 300, 360, 420, 480, 540, 600];
    const incrementRange = [1, 2, 5, 10, 15, 20, 30];

    let selectedMinPace = 120; // Default min pace 2'00"/km
    let selectedMaxPace = 360; // Default max pace 6'00"/km
    let selectedIncrement = 1; // Default increment 1"/km
    let highlightedColumn = null;

    // Function to highlight a column.
    function highlightColumn(column) {
      highlightedColumn = column === highlightedColumn ? null : column;
    }

    // Function to fetch pace data from the API
    async function fetchPaceData() {
        try {
            // Perform a POST request to the API
            const response = await fetch('http://localhost:8000/generate_table', {
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
        <select id="min-pace" bind:value={selectedMinPace}>
            {#each paceRange.reverse() as pace}/km
                <option value={pace}>{formatPace(pace)} / km</option>
            {/each}
        </select>
    </div>
    <div>
        <label for="max-pace">Max.</label>
        <select id="max-pace" bind:value={selectedMaxPace}>
            {#each paceRange.reverse() as pace}
                <option value={pace}>{formatPace(pace)} / km</option>
            {/each}
        </select>
    </div>
    <div>
        <label for="increment">Incrément.</label>
        <select id="increment" bind:value={selectedIncrement}>
            {#each incrementRange as increment}
                <option value={increment}>{increment}"</option>
            {/each}
        </select>
    </div>
    <button type="submit">Générer</button>
</form>

<!-- Table markup to display pace data -->
<table>
    <!-- Table header -->
    <thead>
        <tr>
            <th>t/km</th>
            <th>km/h</th>
            {#each columns as column}
                <th on:click={() => highlightColumn(column)}>{distanceDisplayNames[column] || column}</th>
            {/each}
        </tr>
    </thead>
    <!-- Table body -->
    <tbody>
        {#each paceData as row}
            <tr>
                <td class="col-head">{formatPace(row.pace)}</td>
                <td class="col-head">{formatSpeed(row.speed)}</td>
                {#each columns as column}
                    {#if column >= 800}
                        <td on:click={() => highlightColumn(column)} class:highlighted={highlightedColumn === column}>{formatTime(row[column], false)}</td>
                    {:else}
                        <td on:click={() => highlightColumn(column)} class:highlighted={highlightedColumn === column}>{formatTime(row[column], true)}</td>
                    {/if}
                {/each}
            </tr>
        {/each}
    </tbody>
</t ble>

