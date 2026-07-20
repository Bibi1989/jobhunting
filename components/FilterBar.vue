<script setup lang="ts">
import { Search, MapPin, DollarSign } from 'lucide-vue-next'

defineProps<{
  searchQuery: string
  locationFilter: string
  minSalaryFilter: string
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:locationFilter': [value: string]
  'update:minSalaryFilter': [value: string]
  clear: []
}>()
</script>

<template>
  <div class="flex flex-col h-full">
    <div>
      <h3 class="text-xs font-bold uppercase text-indigo-400 tracking-widest mb-5 select-none">Search Filters</h3>
      <div class="space-y-5">
        <div>
          <label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Search Roles</label>
          <div class="relative flex items-center">
            <Search class="absolute left-3.5 text-slate-500 pointer-events-none" :size="13" />
            <input
              type="text"
              placeholder="e.g. Engineer"
              :value="searchQuery"
              class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"
              @input="emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Location Preference</label>
          <div class="relative flex items-center">
            <MapPin class="absolute left-3.5 text-slate-500 pointer-events-none" :size="13" />
            <input
              type="text"
              placeholder="e.g. Remote, NY"
              :value="locationFilter"
              class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"
              @input="emit('update:locationFilter', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <div>
          <label class="block text-[11px] text-slate-400 mb-2 font-bold select-none">Min Salary Range</label>
          <div class="relative flex items-center">
            <DollarSign class="absolute left-3.5 text-slate-500 pointer-events-none" :size="13" />
            <input
              type="number"
              placeholder="e.g. 120000"
              :value="minSalaryFilter"
              class="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500/80 rounded-xl py-2.5 pl-9 pr-3 text-slate-200 text-xs outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-slate-950/60 transition-all duration-300 placeholder:text-slate-600"
              @input="emit('update:minSalaryFilter', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-8 pt-5 border-t border-slate-850">
      <button
        type="button"
        class="w-full py-2.5 bg-slate-950/60 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 text-xs font-bold rounded-xl transition-all duration-300 active:scale-[0.98]"
        @click="emit('clear')"
      >
        Clear Filters
      </button>
    </div>
  </div>
</template>
