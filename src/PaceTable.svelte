<script>
    import { onMount } from 'svelte';

    // Define state variables for pace data and table columns
    let paceData = [];
    let columns = [];

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
                    min_pace: 120,
                    max_pace: 360,
                    increment: 1
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
    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let formattedTime = '';
        if (hours > 0) {
            formattedTime += `${hours}h`;
        }

        if (minutes > 0 || hours > 0) {
            formattedTime += `${hours > 0 ? minutes.toString().padStart(2, '0') : minutes}'`;
        }
        formattedTime += `${remainingSeconds.toString().padStart(2, '0')}"`;

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

<!-- Table markup to display pace data -->
<table>
    <!-- Table header -->
    <thead>
        <tr>
            <th>s/km</th>
            <th>km/h</th>
            {#each columns as column}
                <th>{column}</th>
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
                    <td>{formatTime(row[column])}</td>
                {/each}
            </tr>
        {/each}
    </tbody>
</table>

