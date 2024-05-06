import {writable} from 'svelte/store';
import {DEFAULT_MIN_PACE, DEFAULT_MAX_PACE, DEFAULT_INCREMENT} from '../utils/constants.js';

export const selectedMinPace = writable(DEFAULT_MIN_PACE);
export const selectedMaxPace = writable(DEFAULT_MAX_PACE);
export const selectedIncrement = writable(DEFAULT_INCREMENT);
