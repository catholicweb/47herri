<script setup>
import { ref, computed } from "vue";
import { data } from "./../../blocks.data.js";
import { useData } from "vitepress";
const { theme, page } = useData();
const config = computed(() => theme.value.config || {});
const props = defineProps({ block: { type: Object, required: true } });

const startX = ref(0);
const currentX = ref(0);
const donate = ref(false);

const cards = computed(() => data.fundraisings.filter((f) => f.lang === page.value.frontmatter.lang));

const numCards = computed(() => cards.value.length);
const currentIndex = ref(cards.value.findIndex((item) => item.name === props.block.name) || 0);

const getCardClass = (index) => {
  const diff = index - currentIndex.value;

  if (diff === 0) return "card-active";
  if (diff === 1) return "card-next-1";
  if (diff === -1) return "card-prev-1";
  if (diff === 2) return "card-next-2";
  if (diff === -2) return "card-prev-2";

  return diff > 0 ? "card-hidden-right" : "card-hidden-left";
};

const nextCard = () => {
  if (currentIndex.value < numCards.value - 1) {
    donate.value = false;
    currentIndex.value++;
  }
};

const prevCard = () => {
  if (currentIndex.value > 0) {
    donate.value = false;
    currentIndex.value--;
  }
};

const handleTouchStart = (e) => {
  startX.value = e.touches[0].clientX;
};

const handleTouchEnd = (e) => {
  const diff = startX.value - e.changedTouches[0].clientX;

  if (diff > 50) {
    nextCard();
  } else if (diff < -50) {
    prevCard();
  }
};

const goToCard = (index) => {
  donate.value = false;
  currentIndex.value = index;
};
</script>

<template>
  <div class="fundraising max-w-3xl mx-auto p-6 my-6">
    <div class="flex flex-col items-center justify-center px-4 overflow-hidden">
      <!-- 3D Carousel Container -->
      <div class="relative w-full max-w-6xl h-[500px] flex items-center justify-center">
        <!-- Cards -->
        <div class="relative w-full" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd">
          <div v-for="(card, index) in cards" :key="card.id" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 transition-all duration-700 ease-out cursor-pointer" :style="getCardClass(index)" @click="goToCard(index)">
            <div class="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
              <!-- Image Section -->
              <div class="relative aspect-16/9 overflow-hidden">
                <div class="absolute inset-0 flex items-center justify-center">
                  <img :src="card.image" loading="lazy" :alt="card.title" class="w-full h-full object-cover" />
                </div>
              </div>

              <!-- Content Section -->
              <div class="p-3">
                <h2 class="text-2xl font-bold text-slate-900 mb-1">{{ card.name }}</h2>
                <p class="text-slate-600 mb-4">{{ card.description }}</p>

                <!-- Progress Stats -->
                <div class="mb-4" v-if="card.goal">
                  <div class="flex justify-between items-baseline mb-2">
                    <span class="text-lg font-bold">{{ card.raised }}€</span>
                    <span class="text-slate-500 text-sm"> de {{ card.goal }}€</span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-gray-200 to-accent rounded-full transition-all duration-500 ease-out" :style="{ width: `${Math.min(card.progress, 100)}%` }"></div>
                  </div>

                  <div class="text-sm text-slate-600 mt-2">{{ card.progress }}% finaciado</div>
                </div>
                <!-- Action Buttons -->
                <div class="flex gap-3">
                  <button v-if="donate == false || index != currentIndex" @click.stop="donate = true" class="flex-1 bg-accent text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-101 transition-all duration-200 cursor-pointer">{{ card.action || "Donar" }}</button>

                  <div v-else v-for="bank in config.bank" class="text-accent">
                    <p v-if="bank.account.includes('https://')">
                      <strong>{{ bank.title }}: </strong><a :href="bank.account">{{ card.action || "Donar" }}</a>
                    </p>
                    <p v-else>
                      <strong>{{ bank.title }}: </strong>{{ bank.account }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Arrows -->
        <button v-if="numCards > 1" @click="prevCard" :disabled="currentIndex === 0" aria-label="Previous card" :class="['absolute left-4 top-1/2 -translate-y-1/2 z-25 w-14 h-14 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-black/50 hover:scale-110 cursor-pointer hidden md:flex', currentIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100']">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <button v-if="numCards > 1" @click="nextCard" aria-label="Next card" :disabled="currentIndex === numCards - 1" :class="['absolute right-4 top-1/2 -translate-y-1/2 z-25 w-14 h-14 rounded-full bg-black/30 backdrop-blur-md text-white flex items-center justify-center transition-all duration-200 hover:bg-black/50 hover:scale-110 cursor-pointer hidden md:flex', currentIndex === numCards - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100']">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
    <!-- Dot Indicators -->
    <div v-if="numCards > 1" class="flex items-center justify-center gap-3 mb-8 mt-2">
      <button v-for="(card, index) in cards" :key="card.id" @click="goToCard(index)" :class="['w-3 h-3 rounded-full transition-all duration-300', currentIndex === index ? 'bg-black w-8' : 'bg-black/30 hover:bg-black/50']" />
    </div>
  </div>
</template>

<style scoped>
.fundraising {
  perspective: 1000px; /* Essential for 3D translateZ to work */
}

/* Base card state */
.card-active,
.card-prev-1,
.card-next-1,
.card-prev-2,
.card-next-2,
.card-hidden-left,
.card-hidden-right {
  position: absolute;
  will-change: transform, opacity;
}

.card-active {
  transform: translateX(0%) scale(1) translateZ(0);
  opacity: 1;
  z-index: 15;
  filter: grayscale(0%);
}

.card-prev-1 {
  transform: translateX(-35%) scale(0.85) translateZ(-100px);
  opacity: 0.6;
  z-index: 10;
  filter: grayscale(80%);
}

.card-next-1 {
  transform: translateX(35%) scale(0.85) translateZ(-100px);
  opacity: 0.6;
  z-index: 10;
  filter: grayscale(80%);
}

.card-prev-2 {
  transform: translateX(-60%) scale(0.7) translateZ(-200px);
  opacity: 0.3;
  z-index: 5;
  filter: grayscale(100%);
}

.card-next-2 {
  transform: translateX(60%) scale(0.7) translateZ(-200px);
  opacity: 0.3;
  z-index: 5;
  filter: grayscale(100%);
}

.card-hidden-left {
  transform: translateX(-80%) scale(0.6) translateZ(-300px);
  opacity: 0;
  z-index: 0;
}

.card-hidden-right {
  transform: translateX(80%) scale(0.6) translateZ(-300px);
  opacity: 0;
  z-index: 0;
}
</style>
