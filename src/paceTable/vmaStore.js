import {writable} from 'svelte/store';
import {DEFAULT_VMA} from '../utils/constants.js';

export const showVMA = writable(false);
export const selectedVMA = writable(DEFAULT_VMA);
