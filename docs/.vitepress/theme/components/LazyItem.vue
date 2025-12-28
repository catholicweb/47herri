<template>
  <div ref="el">
    <slot v-if="visible" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const visible = ref(false);
const el = ref(null);
let observer;

onMounted(() => {
  observer = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting) {
        visible.value = true;
        observer.disconnect();
      }
    },
    { rootMargin: "200px" },
  );

  observer.observe(el.value);
});

onUnmounted(() => observer?.disconnect());
</script>
