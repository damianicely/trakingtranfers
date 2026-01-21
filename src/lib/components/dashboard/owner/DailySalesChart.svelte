<script lang="ts">
	let { dailySales } = $props<{
		dailySales: Array<{ date: string; amount: number; count: number }>;
	}>();

	// Chart dimensions
	const chartWidth = 800;
	const chartHeight = 300;
	const padding = { top: 40, right: 20, bottom: 40, left: 60 };

	const innerWidth = chartWidth - padding.left - padding.right;
	const innerHeight = chartHeight - padding.top - padding.bottom;

	// Calculate max value for scaling
	const maxAmount = Math.max(...dailySales.map((d) => d.amount), 0) || 100;

	// Scale functions
	const xScale = (index: number) => {
		if (dailySales.length <= 1) return innerWidth / 2;
		return (index / (dailySales.length - 1)) * innerWidth;
	};
	const yScale = (amount: number) => {
		if (maxAmount === 0) return innerHeight;
		return innerHeight - (amount / maxAmount) * innerHeight;
	};

	// Generate line path
	const linePath = $derived.by(() => {
		if (dailySales.length === 0) return '';
		
		const points = dailySales.map((day, index) => {
			const x = padding.left + xScale(index);
			const y = padding.top + yScale(day.amount);
			return `${x},${y}`;
		});

		return `M ${points.join(' L ')}`;
	});

	// Generate area path (for fill under line)
	const areaPath = $derived.by(() => {
		if (dailySales.length === 0) return '';
		
		const linePoints = dailySales.map((day, index) => {
			const x = padding.left + xScale(index);
			const y = padding.top + yScale(day.amount);
			return `${x},${y}`;
		});

		const firstX = padding.left + xScale(0);
		const lastX = padding.left + xScale(dailySales.length - 1);
		const bottomY = padding.top + innerHeight;

		return `M ${firstX},${bottomY} L ${linePoints.join(' L ')} L ${lastX},${bottomY} Z`;
	});

	// Format date for display
	const formatDate = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	};

	// Format currency
	const formatCurrency = (amount: number) => `€${amount.toFixed(0)}`;
</script>

<div class="chart-container">
	<svg viewBox="0 0 {chartWidth} {chartHeight}" class="chart">
		<!-- Y-axis grid lines -->
		{#each Array(5) as _, i}
			{@const value = (maxAmount / 4) * (4 - i)}
			{@const y = padding.top + (i / 4) * innerHeight}
			<line
				x1={padding.left}
				y1={y}
				x2={chartWidth - padding.right}
				y2={y}
				stroke="#e0e0e0"
				stroke-width="1"
			/>
			<text x={padding.left - 10} y={y + 4} text-anchor="end" class="axis-label">
				{formatCurrency(value)}
			</text>
		{/each}

		<!-- Area fill under line -->
		{#if dailySales.length > 0}
			<path d={areaPath} fill="url(#gradient)" opacity="0.3" />
			<defs>
				<linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
					<stop offset="0%" style="stop-color:#007bff;stop-opacity:0.3" />
					<stop offset="100%" style="stop-color:#007bff;stop-opacity:0.1" />
				</linearGradient>
			</defs>
		{/if}

		<!-- Line -->
		{#if dailySales.length > 0}
			<path
				d={linePath}
				fill="none"
				stroke="#007bff"
				stroke-width="3"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="line"
			/>
		{/if}

		<!-- Data points -->
		{#each dailySales as day, index}
			{@const x = padding.left + xScale(index)}
			{@const y = padding.top + yScale(day.amount)}
			<g class="data-point">
				<circle cx={x} cy={y} r="4" fill="#007bff" class="point" />
				{#if day.amount > 0}
					<g class="tooltip-group">
						<rect
							x={x - 30}
							y={y - 45}
							width="60"
							height="35"
							rx="4"
							fill="rgba(0, 0, 0, 0.8)"
							class="tooltip-bg"
						/>
						<text x={x} y={y - 30} text-anchor="middle" class="tooltip-value">
							{formatCurrency(day.amount)}
						</text>
						<text x={x} y={y - 15} text-anchor="middle" class="tooltip-count">
							{day.count} {day.count === 1 ? 'booking' : 'bookings'}
						</text>
					</g>
				{/if}
			</g>
		{/each}

		<!-- X-axis labels -->
		{#each dailySales as day, index}
			{@const x = padding.left + xScale(index)}
			{#if index % 5 === 0 || index === dailySales.length - 1}
				<text
					x={x}
					y={chartHeight - padding.bottom + 20}
					text-anchor="middle"
					class="axis-label"
				>
					{formatDate(day.date)}
				</text>
			{/if}
		{/each}

		<!-- Axes -->
		<line
			x1={padding.left}
			y1={padding.top}
			x2={padding.left}
			y2={chartHeight - padding.bottom}
			stroke="#333"
			stroke-width="2"
		/>
		<line
			x1={padding.left}
			y1={chartHeight - padding.bottom}
			x2={chartWidth - padding.right}
			y2={chartHeight - padding.bottom}
			stroke="#333"
			stroke-width="2"
		/>
	</svg>
</div>

<style>
	.chart-container {
		width: 100%;
		overflow-x: auto;
		background: white;
		padding: 1.5rem;
		border-radius: 8px;
	}

	.chart {
		width: 100%;
		height: auto;
		min-width: 800px;
	}

	.line {
		transition: stroke-width 0.2s;
	}

	.data-point {
		cursor: pointer;
	}

	.point {
		transition: r 0.2s;
	}

	.data-point:hover .point {
		r: 6;
		fill: #0056b3;
	}

	.tooltip-group {
		opacity: 0;
		transition: opacity 0.2s;
		pointer-events: none;
	}

	.data-point:hover .tooltip-group {
		opacity: 1;
	}

	.tooltip-bg {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
	}

	.tooltip-value {
		font-size: 12px;
		font-weight: 600;
		fill: white;
	}

	.tooltip-count {
		font-size: 10px;
		fill: #ccc;
	}

	.axis-label {
		font-size: 11px;
		fill: #666;
	}

	@media (max-width: 768px) {
		.chart-container {
			padding: 1rem;
		}
	}
</style>
