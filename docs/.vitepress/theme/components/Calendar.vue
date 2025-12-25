<script setup>
import { data } from "./../../blocks.data.js";
import { formatDate, slugify, applyComplexFilter, accessMultikey, toArray } from "./../../utils.js";
const props = defineProps({ block: { type: Object, required: true } });

function groupEvents(events, fields) {
  if (fields.length === 0) return events;
  const field = fields[0];
  const grouped = events.reduce((acc, event) => {
    const key_array = accessMultikey(event, field);
    for (const key of key_array) {
      if (!acc[key]) acc[key] = [];
      if (fields.length > 1) acc[key].push(event);
    }
    return acc;
  }, {});
  Object.keys(grouped).forEach((key) => {
    grouped[key] = groupEvents(grouped[key], fields.slice(1));
  });
  return grouped;
}

function groupData(data, filter, order) {
  const filtered = data.filter((obj) => applyComplexFilter(obj, filter));

  return groupEvents(filtered, order);
}

let groups = [
  {
    title: "Próximas celebraciones",
    filter: "!masses",
    order: ["title", "dates", "", "times", "locations+rrule-byday+language-euskaraz"],
  },
  {
    title: "Horario de Misas",
    filter: "masses",
    order: ["weekday", "times", "", "locations", "exceptions+rrule-byday+language-euskaraz"],
  },
];

function getSubKeys(table) {
  const keys = new Set();
  for (const row in table) {
    for (const subKey in table[row]) keys.add(subKey);
  }
  return Array.from(keys);
}
</script>

<template>
  <h2 class="text-4xl text-center font-bold py-6">{{ block.title }}</h2>
  <div class="calendar container mx-auto px-4 pb-8 flex flex-wrap gap-4">
    <div v-for="group in groups" class="w-full py-4">
      <h2 :id="slugify(group.title)" class="text-4xl text-center mx-auto font-bold my-3 w-full">
        {{ formatDate(group.title, $frontmatter.lang) }}
      </h2>
      <!-- Primer grupo dividir en headers -->
      <div class="flex flex-row flex-wrap justify-center">
        <div v-for="(table, tableKey) in groupData(data.events, group.filter, group.order)" class="w-full md:w-1/2 lg:w-1/3 my-4 px-4" :class="tableKey">
          <h3 :id="slugify(tableKey)" class="text-xl text-gray-800 mb-3 border-b-3 border-accent pb-1">
            {{ formatDate(tableKey, $frontmatter.lang) }}
          </h3>
          <div class="overflow-x-auto bg-white">
            <table class="min-w-full border-collapse [border-style:hidden]">
              <!-- Añadir cabezera a la tabla (solo si hay hay subfields)-->
              <thead v-if="getSubKeys(table)[0] != ''" class="bg-gray-50 text-gray-600 uppercase text-xs tracking-wide">
                <tr>
                  <th class="px-4 py-2 text-left w-36">&nbsp;</th>
                  <th v-for="subKey in getSubKeys(table)" class="px-4 py-2 text-left">
                    {{ formatDate(subKey, $frontmatter.lang) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Añadir columnas a la tabla -->
                <tr v-for="(row, rowKey, rowIndex) in table" class="odd:bg-white even:bg-gray-50">
                  <td class="px-4 py-3 border-1">
                    {{ formatDate(rowKey, $frontmatter.lang) }}
                  </td>
                  <!-- Añadir filas -->
                  <td v-for="subKey in getSubKeys(table)" class="px-4 py-3 align-top border-1">
                    <!-- Cada fila de la tabla puede tener múltiples elementos -->
                    <p v-for="(line, lineKey) in row[subKey]" class="flex items-center gap-2 mb-1 mr-2">
                      {{ formatDate(lineKey, $frontmatter.lang) }}
                      <span class="extra italic text-sm">
                        {{
                          Object.keys(line)
                            .map((i) => formatDate(i, $frontmatter.lang))
                            .join(", ")
                        }}</span
                      >
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.calendar .extra:before {
  content: " - ";
}
.calendar .extra:after {
  content: "";
}
.calendar h1:empty,
.calendar h3:empty,
.calendar td:empty,
.calendar th:empty,
.calendar tr:empty,
.calendar i:empty,
.calendar span:empty {
  display: none !important;
}
</style>
