<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { data } from "./../../blocks.data.js";
import { formatDate, applyComplexFilter, splitRRuleByDay } from "./../../utils.js";

const props = defineProps({ block: { type: Object, required: true } });

// --- Events ---
const filteredEvents = computed(() => props.block.events);

// --- Autoplay ---
const startSlider = () => {
  if (filteredEvents.value.length <= 1) return;
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % filteredEvents.value.length;
  }, 5000);
};

// --- Slider state ---
const activeIndex = ref(0);
let timer = null;

// --- Swipe state ---
let startX = 0; // Changed from const to a standard variable

const stopSlider = () => {
  if (timer) clearInterval(timer);
};

function byday(event) {
  let s = splitRRuleByDay(event.byday);
  return [...s.simpleByDay, ...s.simpleByWeek].filter(Boolean);
}

// --- Swipe handlers ---
const onStart = (e) => {
  stopSlider();
  // Support both touch and mouse
  startX = e.touches ? e.touches[0].clientX : e.clientX;
};

const onEnd = (e) => {
  const endX = e.changedTouches ? e.changedTouches[0].clientX : e.touches ? e.touches[0].clientX : e.clientX;
  const diff = startX - endX;

  // Sensitivity threshold of 50px
  if (diff > 50 && activeIndex.value < filteredEvents.value.length - 1) {
    activeIndex.value++;
  } else if (diff < -50 && activeIndex.value > 0) {
    activeIndex.value--;
  }

  startSlider();
};

// --- Lifecycle ---
onMounted(startSlider);
onUnmounted(stopSlider);
</script>

<template>
  <div class="relative z-10 py-10 font-medium">
    <div class="container mx-auto px-4">
      <div class="overflow-hidden min-h-30 relative max-w-xl" @touchstart.passive="onStart" @touchend.passive="onEnd" @mousedown.passive="onStart" @mouseup.passive="onEnd">
        <div class="flex transition-transform duration-500 ease-out" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
          <div v-for="(event, index) in filteredEvents" :key="index" class="min-w-full px-2">
            <div class="bg-black/50 backdrop-blur-xl p-6 rounded-xl text-white overflow-hidden">
              <img v-if="event.images?.[0]" :src="event.images[0]" class="float-right w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-accent object-cover ml-4 mb-2" crossorigin="anonymous" loading="lazy" />

              <div class="block">
                <h2 class="text-3xl font-bold mb-4 leading-tight">
                  {{ event.name || event.title || formatDate(event.type, $frontmatter.lang) }}
                </h2>

                <div class="space-y-2 text-sm">
                  <p class="location-mark">
                    {{ event.locations.join(", ") }}
                  </p>
                  <p class="calendar-mark">
                    {{
                      byday(event)
                        .map((i) => formatDate(i, $frontmatter.lang, "byday"))
                        .join(", ") || event.dates?.map((i) => formatDate(i, $frontmatter.lang)).join(", ")
                    }}
                  </p>
                  <p class="time-mark">
                    {{ event.times.join(", ") }}
                  </p>
                </div>

                <p v-if="event.notes" class="mt-4 italic clear-none">
                  {{ event.notes?.map((i) => formatDate(i, $frontmatter.lang)).join(", ") }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex gap-2 mt-4 ml-4">
          <button v-for="(_, index) in filteredEvents" :key="index" @click="activeIndex = index" class="w-4 h-4 rounded-full transition-colors" :class="activeIndex === index ? 'bg-accent' : 'bg-white'" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Clearfix just in case notes are very short and we want to ensure container height */
.block::after {
  content: "";
  display: table;
  clear: both;
}

.location-mark::before,
.time-mark::before,
.calendar-mark::before {
  content: "";
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.5em;
  vertical-align: middle;
  background-size: contain;
  background-repeat: no-repeat;
}

.location-mark::before {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>');
}

.time-mark::before {
  background-image: url('data:image/svg+xml;utf8,<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"  xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>');
}

.calendar-mark::before {
  background-image: url('data:image/svg+xml;utf8,<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"  xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="16" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>');
}
</style>
