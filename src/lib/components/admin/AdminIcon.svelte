<script lang="ts">
	import { icons, type AdminIconName } from '$lib/icons/admin';

	let { name, size = 20, class: className = '' } = $props<{
		name: AdminIconName;
		size?: number;
		class?: string;
	}>();

	const path = $derived(icons[name] ?? '');
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	{@html path}
</svg>
