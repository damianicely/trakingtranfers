<script lang="ts">
	import { language } from '$lib/stores/language';
	import { translations } from '$lib/translations';
	import AccountInfo from '$lib/components/dashboard/AccountInfo.svelte';

	let { data } = $props<{
		data: {
			user?: { username: string; id: string; role: string };
		};
	}>();

	const roleLabel = $derived(translations[$language].dashboard_role_owner);
</script>

<div class="owner-account-section">
	{#if data.user}
		<AccountInfo user={data.user} {roleLabel} />
	{:else}
		<p class="empty-state">Account information not available.</p>
	{/if}
</div>

<style>
	.owner-account-section {
		width: 100%;
	}

	.empty-state {
		color: #666;
		font-style: italic;
	}
</style>
