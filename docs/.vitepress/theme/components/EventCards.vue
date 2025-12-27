<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { data } from "./../../blocks.data.js";
import { formatDate, applyComplexFilter, splitRRuleByDay } from "./../../utils.js";

const props = defineProps({
  block: { type: Object, required: true },
});

// --- Slider state ---
const activeIndex = ref(0);
let timer = null;

// --- Swipe state ---
const startX = 0;
const isDragging = ref(false);

// --- Events ---
const filteredEvents = computed(() => {
  let filter = props.block.filter.toLowerCase();
  if (props.block.source == "./pages/index.md") filter = '"byday":[]';
  if (!data?.events) return [];
  return data.events.filter((event) => applyComplexFilter(event, filter));
});

// --- Autoplay ---
const startSlider = () => {
  if (filteredEvents.value.length <= 1) return;
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % filteredEvents.value.length;
  }, 5000);
};

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
  isDragging.value = true;
  startX = e.touches ? e.touches[0].clientX : e.clientX;
};

const onEnd = (e) => {
  if (!isDragging.value) return;
  const endX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
  const diff = startX - endX;

  if (diff > 50 && activeIndex.value < filteredEvents.value.length - 1) activeIndex.value++;
  if (diff < -50 && activeIndex.value > 0) activeIndex.value--;

  isDragging.value = false;
  startSlider();
};

// --- Lifecycle ---
onMounted(startSlider);
onUnmounted(stopSlider);

watch(activeIndex, () => {
  stopSlider();
  startSlider();
});
</script>

<template>
  <div class="relative z-10 pt-11 pb-20 font-medium">
    <div class="container mx-auto px-4">
      <div class="overflow-hidden min-h-60 relative max-w-xl" @touchstart.passive="onStart" @touchend.passive="onEnd">
        <!-- TRACK -->
        <div class="flex transition-transform duration-500 ease-out" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
          <!-- SLIDES -->
          <div v-for="(event, index) in filteredEvents" :key="index" class="min-w-full px-2">
            <div class="bg-black/50 backdrop-blur-xl p-5 rounded-xl text-white">
              <div class="flex flex-row-reverse items-start">
                <img v-if="event.images?.[0]" :src="event.images[0]" class="w-[45%] aspect-square rounded-full border-4 border-[#009c46] object-cover ml-2" />
                <div class="flex-1">
                  <h2 class="text-3xl font-bold mb-4">
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
                      {{ event.times[0] }}
                    </p>
                  </div>

                  <p v-if="event.notes" class="mt-4 italic">
                    {{ event.notes?.map((i) => formatDate(i, $frontmatter.lang)).join(", ") }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DOTS -->
        <div class="flex gap-2 mt-4">
          <button v-for="(_, index) in filteredEvents" :key="index" @click="activeIndex = index" class="w-3 h-3 rounded-full transition-colors" :class="activeIndex === index ? 'bg-accent' : 'bg-white'" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-mark::before {
  content: "";
  display: inline-block;
  padding: 0.5em;
  margin-right: 0.3em;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
}

.time-mark::before {
  content: "";
  display: inline-block;
  padding: 0.5em;
  margin-right: 0.3em;
  background-image: url('data:image/svg+xml;utf8,<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"  xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="12"/><line x1="12" y1="12" x2="16" y2="14"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
}

.calendar-mark::before {
  content: "";
  display: inline-block;
  padding: 0.5em;
  margin-right: 0.3em;
  background-image: url('data:image/svg+xml;utf8,<svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white"  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"  xmlns="http://www.w3.org/2000/svg">    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>    <line x1="16" y1="2" x2="16" y2="6"/>    <line x1="8" y1="2" x2="8" y2="6"/>    <line x1="3" y1="10" x2="21" y2="10"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
}
</style>
