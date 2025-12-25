<script setup>
import { ref, computed } from "vue";

import { data } from "./../../blocks.data.js";

// Props allow you to pass the data from VitePress data loaders or a simple array
const props = defineProps({
  block: { type: Object, required: true },
});

const searchQuery = ref("");
const selectedFilter = ref(props.block.filters[0]);
const allItems = props.block.category == "pages" ? data.pages : data.videos;

// Filter logic: combining Category + Search Text
const filteredItems = computed(() => {
  return allItems.filter((item) => {
    const haystack = JSON.stringify(item).toLowerCase();
    const needle = selectedFilter.value === "Todos" ? props.block.filters : [selectedFilter.value];
    const matchesfilter = needle.some((word) => haystack.includes(word.toLowerCase()));
    const matchesSearch = haystack.includes(searchQuery.value.toLowerCase());
    return matchesfilter && matchesSearch;
  });
});
</script>

<template>
  <div v-if="block.title" class="text-center pt-12 px-6">
    <h2 class="my-2 text-4xl font-bold">{{ block.title }}</h2>
  </div>
  <div class="w-full max-w-3xl mx-auto p-4 mb-8">
    <div class="flex flex-wrap justify-center gap-4 mb-8">
      <button
        v-for="filter in block.filters"
        :key="filter"
        @click="
          searchQuery = '';
          selectedFilter = filter;
        "
        class="px-6 py-2 rounded-full transition-colors duration-200 cursor-pointer font-bold"
        :class="[selectedFilter === filter ? 'bg-[#2d3436] text-white' : 'bg-transparent hover:bg-gray-200']"
      >
        {{ filter }}
      </button>
    </div>

    <div class="relative max-w-md mx-auto mb-10">
      <span class="absolute inset-y-0 left-4 flex items-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input v-model="searchQuery" type="text" placeholder="Bilatu" class="placeholder-gray-400 w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all shadow-sm" />
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <a v-for="item in filteredItems" :key="item.url" :href="item.url" class="group flex flex-col overflow-hidden rounded-xl bg-[#2d3436] transition-transform">
        <div class="aspect-[4/3] overflow-hidden bg-gray-200">
          <img :src="item.image" :alt="item.title" class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        </div>
        <div class="p-4 text-center">
          <h3 class="text-white font-bold capitalize text-lg m-0">
            {{ item.title }}
          </h3>
        </div>
      </a>
    </div>
  </div>
</template>
