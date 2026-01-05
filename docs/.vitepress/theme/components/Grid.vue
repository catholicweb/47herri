<script setup>
import { ref, computed } from "vue";
import { grid } from "./../../utils.js";

const props = defineProps({ block: { type: Object, required: true } });

const searchQuery = ref("");
const selectedFilter = ref(0);
// Filter logic: combining Category + Search Text
const filteredItems = computed(() => {
	return (props.block.elements || []).filter((item) => {
		const haystack = JSON.stringify(item).toLowerCase();
		const matchesfilter = searchQuery.value || selectedFilter.value === 0 || haystack.includes(props.block.filters?.[selectedFilter.value]?.toLowerCase());
		const matchesSearch = haystack.includes(searchQuery.value.toLowerCase());
		return matchesfilter && matchesSearch;
	});
});
</script>
<template>
	<div class="w-full max-w-6xl mx-auto p-4 mb-8">
		<div v-if="block.filters" class="max-w-4xl mx-auto px-6 flex flex-wrap justify-center gap-2 my-5">
			<button
				v-for="(filter, index) in block.filters"
				:key="index"
				@click="
					searchQuery = '';
					selectedFilter = index;
				"
				class="px-2 py-2 rounded-full transition-colors duration-200 text-sm cursor-pointer font-bold"
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

		<div :class="grid(block)">
			<template v-for="(item, index) in filteredItems">
				<slot :item="item" :index="index"></slot>
			</template>
		</div>
	</div>
</template>
