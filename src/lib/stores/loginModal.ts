import { writable } from 'svelte/store';

/** When set to true, the login modal (in the layout) should open. Any page can set this to open the modal. */
export const openLoginModal = writable<boolean>(false);
