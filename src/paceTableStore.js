import {writable} from 'svelte/store';

export const selectedMinPace = writable(360); // Default max pace 6'00"/km
export const selectedMaxPace = writable(120); // Default min pace 2'00"/km
export const selectedIncrement = writable(1); // Default increment 1"/km
