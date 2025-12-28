<template>
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

  <div class="video mb-8 px-2" :class="grid(block)">
    <div v-for="(item, i) in filteredItems" :key="i">
      <div class="relative">
        <div v-if="playingVideo === item.src" class="w-full h-full items-center rounded-lg overflow-hidden cursor-pointer aspect-[16/9]">
          <iframe :src="item.src" data-testid="embed-iframe" width="100%" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" class="w-full h-full rounded-lg overflow-hidden"></iframe>
        </div>

        <div v-else @click="handleClick(item)" class="w-full h-full relative facade rounded-lg overflow-hidden cursor-pointer aspect-[16/9]">
          <img :src="item.image" :alt="`Thumbnail for ${item.title}`" :fetchpriority="block.index >= 1 ? 'low' : 'high'" :loading="block.index >= 1 ? 'lazy' : 'eager'" class="absolute inset-0 w-full h-full object-cover rounded-lg" />

          <div class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 text-center to-transparent flex items-end">
            <h3 class="text-lg font-bold text-white mb-2 w-full px-4">{{ item.title }}</h3>
          </div>

          <div class="absolute inset-0 flex items-center justify-center logo" :class="logo(item)"></div>
        </div>
      </div>

      <div v-if="item.publishedAt && !block.filters?.length" class="pt-2 text-center w-full text-black">
        {{ formatDate(item.publishedAt, $frontmatter.lang) }}
        <div class="w-[14px] h-[14px] mx-auto rounded-full bg-accent"></div>
        <div class="h-[4px] -mt-[8px] bg-accent -mx-[8px]"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { formatDate, grid } from "./../../utils.js";

const props = defineProps({
  block: {
    type: Object,
    required: true,
  },
});
let videos = props.block.elements;

const searchQuery = ref("");
const selectedFilter = ref(0);
// Filter logic: combining Category + Search Text
const filteredItems = computed(() => {
  return videos
    .filter((item) => {
      const haystack = JSON.stringify(item).toLowerCase();
      const matchesfilter = selectedFilter.value === 0 || haystack.includes(props.block.filters?.[selectedFilter.value]?.toLowerCase());
      const matchesSearch = haystack.includes(searchQuery.value.toLowerCase());
      return matchesfilter && matchesSearch;
    })
    .slice(0, 50);
});

function logo(item) {
  if (item.src.includes("youtube")) return "youtube-logo";
  if (item.src.includes("spotify")) return "spotify-logo";
  if (item.src.includes("videmo")) return "vimeo-logo";
  return "generic-logo";
}

function ratio(ratio) {
  const validRatios = {
    "aspect-[9/16]": 0.5625,
    "aspect-[16/9]": 1.777,
    "aspect-[3/1]": 3,
    "aspect-[4/3]": 1.333,
    "aspect-[1/1]": 1.0,
  };
  return Object.keys(validRatios).reduce((closest, key) => {
    return Math.abs(validRatios[key] - ratio) < Math.abs(validRatios[closest] - ratio) ? key : closest;
  });
}

const playingVideo = ref(null);

function handleClick(item) {
  playingVideo.value = item.src;
}
</script>

<style>
/* YouTube logo overlay centrado */
.youtube-logo {
  background-image: url("data:image/svg+xml,%3Csvg width='159' height='110' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='m154 17.5c-1.82-6.73-7.07-12-13.8-13.8-9.04-3.49-96.6-5.2-122 0.1-6.73 1.82-12 7.07-13.8 13.8-4.08 17.9-4.39 56.6 0.1 74.9 1.82 6.73 7.07 12 13.8 13.8 17.9 4.12 103 4.7 122 0 6.73-1.82 12-7.07 13.8-13.8 4.35-19.5 4.66-55.8-0.1-75z' fill='%23f00'/%3E%3Cpath d='m105 55-40.8-23.4v46.8z' fill='%23fff'/%3E%3C/svg%3E%0A");
  background-size: 18%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.generic-logo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M8 5v14l11-7z'/%3E%3C/svg%3E");
  background-color: rgba(0, 0, 0, 0.2);
  background-size: 18%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.spotify-logo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 168 168'%3E%3Ccircle cx='84' cy='84' r='84' fill='black'/%3E%3Cpath d='M83.7 0C37.5 0 0 37.5 0 83.7c0 46.3 37.5 83.7 83.7 83.7 46.3 0 83.7-37.5 83.7-83.7S130 0 83.7 0zM122 120.8c-1.4 2.5-4.6 3.2-7 1.7-19.8-12-44.5-14.7-73.7-8-2.8.5-5.6-1.2-6.2-4-.2-2.8 1.5-5.6 4-6.2 32-7.3 59.6-4.2 81.6 9.3 2.6 1.5 3.4 4.7 1.8 7.2zM132.5 98c-2 3-6 4-9 2.2-22.5-14-56.8-18-83.4-9.8-3.2 1-7-1-8-4.3s1-7 4.6-8c30.4-9 68.2-4.5 94 11 3 2 4 6 2 9zm1-23.8c-27-16-71.6-17.5-97.4-9.7-4 1.3-8.2-1-9.5-5.2-1.3-4 1-8.5 5.2-9.8 29.6-9 78.8-7.2 109.8 11.2 3.7 2.2 5 7 2.7 10.7-2 3.8-7 5-10.6 2.8z' fill='%2392d500'/%3E%3C/svg%3E");
  background-size: 18%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

.vimeo-logo {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 168 168'%3E%3Cpath d='M0 48.3c0-1.6 0.4-2.7 1.2-3.5s1.9-1.2 3.4-1.2h13.2c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H4.6c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3zM39.7 48.3h16.4c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H39.7c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3zM72.4 57.2h16.3c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v9.3c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2H72.4c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5v-9.3c0-1.6 0.4-2.7 1.2-3.5 0.8-0.8 1.9-1.2 3.4-1.2zM72.4 72.3h16.3v-5.8H72.4v5.8zM118.2 48.3h16.4c1.6 0 2.7 0.4 3.4 1.2 0.8 0.8 1.2 1.9 1.2 3.5v71.5c0 1.6-0.4 2.7-1.2 3.5-0.8 0.8-1.9 1.2-3.4 1.2h-16.4c-1.6 0-2.7-0.4-3.4-1.2-0.8-0.8-1.2-1.9-1.2-3.5V48.3z' fill='%23fff'/%3E%3C/svg%3E");
  background-size: 18%;
  background-position: center;
  background-repeat: no-repeat;
  transition: transform 0.3s;
}

/* efecto hover opcional */
.facade:hover .logo {
  transform: scale(1.1);
}

.hidescrollbar::-webkit-scrollbar {
  display: none;
}
</style>
