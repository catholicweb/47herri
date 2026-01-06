<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { grid } from "./../../utils.js";
const props = defineProps({ block: { type: Object, required: true } });

// --- Filters ---
const searchQuery = ref("");
const selectedFilter = ref(0);
const filteredItems = computed(() => {
	const needle = selectedFilter.value === 0 ? props.block.filters : [props.block.filters?.[selectedFilter.value]];
	return (props.block.elements || []).filter((item) => {
		const haystack = JSON.stringify(item).toLowerCase();
		const matchesfilter = !props.block.filters || searchQuery.value || needle?.some((word) => haystack.includes(word?.toLowerCase()));
		const matchesSearch = !searchQuery.value || haystack.includes(searchQuery.value.toLowerCase());
		return matchesfilter && matchesSearch;
	});
});

// --- Swipe handlers ---
const activeIndex = ref(0);
let startX = 0;
const onStart = (e) => {
	stopSlider();
	// Support both touch and mouse
	startX = e.touches ? e.touches[0].clientX : e.clientX;
};

const onEnd = (e) => {
	const endX = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
	const diff = startX - endX;

	// Sensitivity threshold of 50px
	if (diff > 50 && activeIndex.value < filteredItems.value.length - 1) {
		activeIndex.value++;
	} else if (diff < -50 && activeIndex.value > 0) {
		activeIndex.value--;
	}

	startSlider();
};

// --- Autoplay ---
const startSlider = () => {
	if (!props.block.tags?.includes("carousel")) return;
	if (filteredItems.value.length <= 1) return;
	timer = setInterval(() => {
		activeIndex.value = (activeIndex.value + 1) % filteredItems.value.length;
	}, 5000);
};
let timer = null;
const stopSlider = () => {
	if (timer) clearInterval(timer);
};
onMounted(() => {
	activeIndex.value = 0;
	startSlider();
});
onUnmounted(stopSlider);
</script>
<template>
	<div v-if="block.filters" class="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-2 my-5">
		<button
			v-for="(filter, index) in block.filters"
			:key="index"
			@click="
				searchQuery = '';
				selectedFilter = index;
			"
			class="px-3 py-2 rounded-full transition-colors duration-200 text-sm cursor-pointer font-bold"
			:class="[selectedFilter === index ? 'bg-[#2d3436] text-white' : 'bg-transparent text-gray-700 hover:bg-gray-200']"
		>
			{{ filter }}
		</button>
	</div>

	<div v-if="block.query" class="relative max-w-md mx-auto mb-5">
		<span class="absolute inset-y-0 left-4 flex items-center text-gray-400">
			<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</span>
		<input v-model="searchQuery" type="text" placeholder="Bilatu" class="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm" />
	</div>

	<div v-if="block?.tags?.includes('carousel')">
		<div class="overflow-hidden relative max-w-xl" @touchstart.passive="onStart" @touchend.passive="onEnd" @mousedown.passive="onStart" @mouseup.passive="onEnd">
			<div class="flex transition-transform duration-500 ease-out" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
				<template v-for="(item, index) in filteredItems">
					<slot :item="item" :index="index"></slot>
				</template>
			</div>
		</div>
		<div class="flex gap-2 mt-4 ml-4">
			<button v-for="(_, index) in filteredItems" :key="index" @click="activeIndex = index" class="w-4 h-4 rounded-full transition-colors" :class="activeIndex === index ? 'bg-accent' : 'bg-white'" />
		</div>
	</div>

	<div v-else :class="grid(block)">
		<template v-for="(item, index) in filteredItems">
			<slot :item="item" :index="index"></slot>
		</template>
	</div>
</template>
