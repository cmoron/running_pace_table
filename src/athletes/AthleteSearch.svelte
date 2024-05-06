<script>
  import {onMount} from 'svelte';
  import {writable} from 'svelte/store';
  import {debounce} from 'lodash-es';
  import {selectedAthletes} from './athletesStore.js';

  const athleteSuggestions = writable([]);
  const isLoading = {};
  let inputElement;
  let searchQuery = '';
  let controller;

  /**
   * Fetches athlete records from the API and logs the data to the console.
   * @param {Object} athlete - The athlete object to fetch records for.
   */
  async function fetchAthleteRecords(athlete) {
    isLoading[athlete.id] = true;
    try {
      const response = await fetch(
          `${import.meta.env.VITE_API_URL}/get_athlete_records?ident=${encodeURIComponent(athlete.id)}`);
      if (response.ok) {
        return response.json();
      } else {
        console.error('Failed to fetch athlete records');
      }
    } catch (error) {
      console.error('Error fetching athlete records:', error);
    } finally {
      // set isLoading a false pour cet athlete
      isLoading[athlete.id] = false;
    }
  }

  /**
   * Toggles the visibility of athlete records in the UI and fetches the records if visible.
   * @param {Object} athlete - The athlete object to toggle records for.
   */
  function toggleAthleteRecords(athlete) {
    selectedAthletes.toggleVisible(athlete.id);
    if (selectedAthletes.isAthleteVisible(athlete.id)) {
      selectedAthletes.setLoading(athlete.id, true);
      fetchAthleteRecords(athlete).then((records) => {
        selectedAthletes.setRecords(athlete.id, records);
      }).catch((error) => {
        console.error('Error fetching athlete records:', error);
        selectedAthletes.setLoading(athlete.id, false);
      });
    }
  }

  /**
   * Checks if athlete records are currently loading.
   * @param {string} athleteId - The ID of the athlete to check loading state for.
   * @return {boolean} - True if records are loading, false otherwise.
   */
  function isLoadingRecords(athleteId) {
    return isLoading[athleteId] || false;
  }

  /**
   * Debounced function to fetch athlete data from the API based on the user's query.
   * It only triggers the API request if the query length is 2 or more characters to reduce unnecessary requests.
   * @param {string} query - The search text input by the user to find athletes.
   */
  const fetchAthletes = debounce(async (query) => {
    if (query.length < 3) {
      athleteSuggestions.set([]);
      return;
    }

    if (controller) {
      controller.abort();
    }

    controller = new AbortController();
    const signal = controller.signal;

    try {
      const response = await fetch(
          `${import.meta.env.VITE_API_URL}/get_athletes?name=${encodeURIComponent(query)}`,
          {signal},
      );
      if (response.ok) {
        const data = await response.json();
        athleteSuggestions.set(data);
      } else {
        console.error('Failed to fetch athlete data');
        athleteSuggestions.set([]);
      }
    } catch (error) {
      console.error('Error fetching athlete data:', error);
      athleteSuggestions.set([]);
    }
  }, 200); // Delay in milliseconds

  /**
   * Selects an athlete from the suggestions list and adds them to the selected athletes list.
   * @param {Object} athlete - The athlete object to add to the selected athletes list.
   */
  function selectAthlete(athlete) {
    searchQuery = '';
    selectedAthletes.addAthlete(athlete);
    fetchAthleteRecords(athlete).then((records) => {
      selectedAthletes.setRecords(athlete.id, records);
    }).catch((error) => {
      console.error('Error fetching athlete records:', error);
    });
    athleteSuggestions.set([]);
  }

  /**
   * Deletes an athlete from the selected athletes list.
   * @param {Object} athlete - The athlete object to delete.
   */
  function deleteAthlete(athlete) {
    selectedAthletes.removeAthlete(athlete.id);
  }

  /**
   * Closes the suggestions list if a click event occurs outside the search input element.
   * This provides a way for users to dismiss the suggestions by clicking outside the input area.
   * @param {MouseEvent} event - The click event triggered outside the search input.
   */
  function handleClickOutside(event) {
    if (inputElement && !inputElement.contains(event.target)) {
      athleteSuggestions.set([]);
    }
  }

  onMount(() => {
    const storedAthletes = localStorage.getItem('selectedAthletes');
    if (storedAthletes) {
      selectedAthletes.setAthletes(JSON.parse(storedAthletes));
    }

    selectedAthletes.subscribe(($selectedAthletes) => {
      localStorage.setItem('selectedAthletes', JSON.stringify($selectedAthletes));
    });

    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  });

</script>

<div class="athlete-search">

  <input type="text" bind:value={searchQuery}
         bind:this={inputElement}
         on:input="{() => fetchAthletes(searchQuery)}"
         placeholder="Rechercher un athlète..."
         class="search-input" />
  {#if $athleteSuggestions.length}
    <ul class="suggestions">
      {#each $athleteSuggestions as athlete}
        <li>
          <button on:click={() => selectAthlete(athlete)} class="suggestion-btn">
            {athlete.name} {athlete.birth_date || ''}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#each $selectedAthletes as athlete}
    <div class="selected-athlete">
      <label class="switch">
        <input
        id="athlete-switch-{athlete.id}"
        type="checkbox"
        checked={athlete.visible}
        on:change={() => toggleAthleteRecords(athlete)}
        >
        <span class="slider round"></span>
      </label>
      <button on:click={() => deleteAthlete(athlete)} class="delete-athlete-btn">x</button>
      <span class="color-indicator" style="background-color: {athlete.color};"></span>
      <a href={athlete.url} target="_blank" rel="noopener noreferrer">
        {athlete.name}
      </a>
      {#if isLoadingRecords(athlete.id)}
        <div class="spinner"></div>
      {/if}
    </div>
  {/each}

</div>

<style>
  .athlete-search {
    margin-top: 10px;
    margin-bottom: 10px;
    position: relative;
  }

  .search-input {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 10px;
    width: 50%;
  }

  .suggestions {
    list-style: none;
    margin-top: 4px;
    padding: 10px;
    background: white;
    width: 50%;
    border: 1px solid #ccc;
    border-radius: 4px;
    position: absolute;
    z-index: 1;
  }

  .suggestion-btn {
    width: 100%;
    background: none;
    border: none;
    text-align: left;
    padding: 8px 12px;
    cursor: pointer;
  }

  .suggestion-btn:hover {
    background-color: #f0f0f0;
  }

  .selected-athlete {
    margin-top: 5px;
    font-size: 16px;
  }

  .delete-athlete-btn {
    background: none;
    border: none;
    color: red;
    font-size: 16px;
    cursor: pointer;
    margin-right: 5px;
  }

  .color-indicator {
    width: 20px;
    height: 20px;
    display: inline-block;
    margin-right: 5px;
    vertical-align: middle;
  }

</style>
