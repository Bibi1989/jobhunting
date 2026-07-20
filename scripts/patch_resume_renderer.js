import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetFile = path.resolve(__dirname, '../components/ResumeThemeRenderer.vue');

let code = fs.readFileSync(targetFile, 'utf-8');

const newTemplate = `<template>
  <!-- THE CORPORATE THEME -->
  <div
    v-if="formatId === 'the-corporate' || formatId === 'corporate-accent'"
    class="theme-corporate w-full bg-white relative overflow-hidden flex flex-col min-h-[750px] text-slate-800 text-left select-text p-0"
  >
    <header class="bg-[#091426] text-white p-7">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div class="flex flex-col gap-1">
          <h1 class="font-extrabold text-2xl tracking-tight text-white leading-tight">{{ parsed.name }}</h1>
          <p class="text-[10px] uppercase tracking-[0.2em] text-indigo-300 font-bold">{{ parsed.title }}</p>
        </div>
        <div class="flex flex-col gap-1 items-start sm:items-end text-left sm:text-right text-[10px] text-slate-300 font-medium">
          <span class="flex items-center gap-1.5" v-if="parsed.email">{{ parsed.email }}</span>
          <span class="flex items-center gap-1.5" v-if="parsed.phone">{{ parsed.phone }}</span>
          <span class="flex items-center gap-1.5" v-if="parsed.location">{{ parsed.location }}</span>
          <span class="flex items-center gap-1.5 text-indigo-300" v-if="parsed.linkedin || parsed.website">{{ parsed.linkedin || parsed.website }}</span>
        </div>
      </div>
    </header>

    <div class="px-7 py-5">
      <div class="mb-2.5">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Professional Profile</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <p class="text-[10.5px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
    </div>

    <div class="px-7 pb-5">
      <div class="mb-3">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Professional Experience</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <div v-for="(job, index) in parsed.experience" :key="index" class="mb-4 last:mb-0">
        <div class="flex justify-between items-baseline mb-0.5">
          <h4 class="text-[11px] font-bold text-[#091426]">{{ job.title }}</h4>
          <span class="text-[8.5px] text-slate-400 italic uppercase font-bold">{{ job.dates }}</span>
        </div>
        <div class="flex justify-between items-baseline mb-1.5">
          <span class="text-[10px] text-slate-500 font-semibold">{{ job.company }}</span>
          <span class="text-[9px] text-slate-400 font-medium">{{ job.location }}</span>
        </div>
        <ul class="list-none space-y-1 pl-1">
          <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start text-[10px] leading-normal text-slate-600">
            <span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0"></span>
            <p>{{ b }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="px-7 pb-5" v-if="parsed.projects.length">
      <div class="mb-3">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Projects</h3>
        <div class="h-[1px] bg-slate-200 w-full"></div>
      </div>
      <div v-for="(p, pIdx) in parsed.projects" :key="pIdx" class="mb-3.5 last:mb-0">
        <h4 class="text-[11px] font-bold text-[#091426] mb-1.5">{{ p.name }}</h4>
        <ul class="list-none space-y-1 pl-1">
          <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="flex gap-2 items-start text-[10px] leading-normal text-slate-655">
            <span class="mt-1.5 w-1.5 h-1.5 bg-[#091426]/60 shrink-0"></span>
            <p>{{ b }}</p>
          </li>
        </ul>
      </div>
    </div>

    <div class="px-7 pb-8 grid grid-cols-1 md:grid-cols-2 gap-5 mt-auto">
      <div>
        <div class="mb-2.5">
          <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Core Competencies</h3>
          <div class="h-[1px] bg-slate-200 w-full"></div>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(s, sIdx) in parsed.skills" :key="sIdx" class="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded">
            {{ s }}
          </span>
        </div>
      </div>
      <div>
        <div class="mb-2.5">
          <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest mb-1 select-none">Education</h3>
          <div class="h-[1px] bg-slate-200 w-full"></div>
        </div>
        <div class="space-y-2">
          <div v-for="(edu, eduIdx) in parsed.education" :key="eduIdx">
            <h5 class="text-[10px] font-bold text-[#091426]">{{ edu.degree }}</h5>
            <p class="text-[9.5px] text-slate-500 font-medium">{{ edu.school }} <span v-if="edu.dates" class="text-slate-400 font-normal">| {{ edu.dates }}</span></p>
          </div>
        </div>
      </div>
    </div>

    <footer class="absolute bottom-0 left-0 w-full h-[5px] bg-[#091426]"></footer>
  </div>

  <!-- THE EXECUTIVE THEME -->
  <div
    v-else-if="formatId === 'the-executive' || formatId === 'executive-two-column'"
    class="theme-executive w-full bg-white relative p-7 flex flex-col text-slate-800 text-left select-text min-h-[750px]"
  >
    <header class="text-center mb-5 border-b border-slate-200 pb-4">
      <h1 class="text-2xl font-bold tracking-tight text-[#091426] mb-1 leading-tight">{{ parsed.name }}</h1>
      <p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mb-2.5">{{ parsed.title }}</p>
      <div class="flex flex-wrap justify-center gap-x-2.5 gap-y-1 text-[9.5px] text-slate-500 font-medium">
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span class="text-slate-350" v-if="parsed.location && parsed.phone">•</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span class="text-slate-355" v-if="parsed.phone && parsed.email">•</span>
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span class="text-slate-355" v-if="parsed.email && (parsed.linkedin || parsed.website)">•</span>
        <span v-if="parsed.linkedin || parsed.website" class="text-[#006a61]">{{ parsed.linkedin || parsed.website }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left Column (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4">
        <section v-if="parsed.education.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Education</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-2.5">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h3 class="text-[9.5px] font-bold text-slate-800 leading-snug">{{ edu.school }}</h3>
              <p class="text-[9px] italic text-slate-500 leading-snug">{{ edu.degree }}</p>
              <p class="text-[8px] text-slate-400 mt-0.5">{{ edu.dates }}</p>
            </div>
          </div>
        </section>

        <section v-if="parsed.skills.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Core Expertise</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <ul class="flex flex-col gap-1">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex items-center gap-2 text-[9.5px] text-slate-700 font-medium">
              <span class="w-1.5 h-1.5 bg-[#006a61] rotate-45 shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.credentials.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Credentials</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="text-[9px] text-slate-600 space-y-1 font-medium">
            <p v-for="(c, idx) in parsed.credentials" :key="idx">{{ c }}</p>
          </div>
        </section>
      </aside>

      <!-- Right Column (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Executive Summary</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Experience</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-3.5">
            <article v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h3>
                <span class="text-[7.5px] text-slate-400 uppercase font-bold">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] italic text-[#006a61] mb-1 font-semibold">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="flex flex-col gap-1 pl-1">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="relative pl-3 text-[9.5px] text-slate-600 leading-normal before:content-['-'] before:absolute before:left-0 before:font-bold before:text-slate-350">
                  {{ b }}
                </li>
              </ul>
            </article>
          </div>
        </div>

        <div v-if="parsed.projects.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Projects</h2>
          <div class="h-[1px] bg-slate-200 w-full mb-2"></div>
          <div class="flex flex-col gap-3">
            <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
              <h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug">{{ p.name }}</h4>
              <ul class="flex flex-col gap-1 pl-1">
                <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="relative pl-3 text-[9.5px] text-slate-655 leading-normal before:content-['-'] before:absolute before:left-0 before:font-bold before:text-slate-350">
                  {{ b }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- THE STRATEGIST THEME -->
  <div
    v-else-if="formatId === 'the-strategist' || formatId === 'strategist-sidebar'"
    class="theme-strategist w-full bg-white relative flex overflow-hidden min-h-[750px] text-slate-800 text-left select-text p-0"
  >
    <!-- Left Sidebar Column (1/3) -->
    <section class="w-1/3 bg-[#f8f9ff] p-5 border-r border-slate-200 flex flex-col gap-5 shrink-0">
      <!-- Contact Details -->
      <div>
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Contact</h3>
        <div class="flex flex-col gap-1.5 text-[9px] text-slate-600 font-medium">
          <div class="flex items-center gap-1.5" v-if="parsed.email">
            <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span class="truncate">{{ parsed.email }}</span>
          </div>
          <div class="flex items-center gap-1.5" v-if="parsed.phone">
            <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span>{{ parsed.phone }}</span>
          </div>
          <div class="flex items-center gap-1.5" v-if="parsed.location">
            <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span>{{ parsed.location }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-[#006a61]" v-if="parsed.linkedin || parsed.website">
            <span class="w-1 h-1 bg-slate-400 rounded-full"></span>
            <span class="truncate">{{ parsed.linkedin || parsed.website }}</span>
          </div>
        </div>
      </div>

      <!-- Core Expertise -->
      <div v-if="parsed.skills.length">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Expertise</h3>
        <div class="flex flex-col gap-1">
          <div v-for="(s, idx) in parsed.skills" :key="idx" class="text-[9px] text-slate-700 font-bold uppercase tracking-wider bg-white border border-slate-200/80 px-2 py-0.5 rounded shadow-sm text-center truncate">
            {{ s }}
          </div>
        </div>
      </div>

      <!-- Education -->
      <div v-if="parsed.education.length">
        <h3 class="text-[10px] font-bold text-[#091426] uppercase tracking-widest border-b border-slate-300 pb-1 mb-2 select-none">Education</h3>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="text-[9.5px] font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
            <p class="text-[9px] text-slate-500 leading-snug">{{ edu.degree }}</p>
            <p class="text-[8px] text-slate-400 mt-0.5" v-if="edu.dates">{{ edu.dates }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Right Main Column (2/3) -->
    <section class="w-2/3 p-6 flex flex-col gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-[#091426] mb-0.5 leading-tight">{{ parsed.name }}</h1>
        <h2 class="text-[9.5px] font-bold tracking-[0.15em] text-[#006a61] uppercase mb-3 leading-snug">{{ parsed.title }}</h2>
        <div class="h-[2px] bg-gradient-to-r from-[#091426] via-[#006a61] to-transparent w-full opacity-30"></div>
      </div>

      <div v-if="parsed.summary">
        <h3 class="text-[9.5px] font-bold text-slate-400 uppercase tracking-widest mb-1 select-none">Profile</h3>
        <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </div>

      <div v-if="parsed.experience.length">
        <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest mb-2 select-none">Experience</h3>
        <div class="space-y-3">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">· {{ job.location }}</span></p>
            <ul class="space-y-0.5 pl-0.5">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-600">
                <span class="mt-1.5 w-1 h-1 bg-slate-300 rounded-full shrink-0"></span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="parsed.projects.length">
        <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest mb-2 select-none">Projects</h3>
        <div class="space-y-3">
          <div v-for="(p, pIdx) in parsed.projects" :key="pIdx">
            <h4 class="text-[10.5px] font-bold text-slate-800 mb-1 leading-snug">{{ p.name }}</h4>
            <ul class="space-y-0.5 pl-0.5">
              <li v-for="(b, bIdx) in p.bullets" :key="bIdx" class="flex gap-2 items-start text-[9.5px] leading-normal text-slate-655">
                <span class="mt-1.5 w-1.5 h-1.5 bg-slate-350 rounded-full shrink-0"></span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- THE CREATIVE DIRECTOR THEME -->
  <div
    v-else-if="formatId === 'the-creative-director'"
    class="theme-creative-director w-full bg-white relative flex flex-col md:flex-row min-h-[750px] text-slate-800 text-left select-text p-0"
  >
    <div class="w-full md:w-[280px] bg-[#006a61] text-white p-7 flex flex-col justify-between shrink-0">
      <div>
        <h1 class="text-3xl font-black text-white leading-none uppercase break-words">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-widest text-teal-200 mt-2 font-bold">{{ parsed.title }}</p>
        
        <div class="mt-8 space-y-5">
          <div>
            <h4 class="text-[9px] uppercase tracking-widest text-teal-200/60 font-bold border-b border-white/20 pb-1 mb-2">Contact</h4>
            <ul class="space-y-1.5 text-[9.5px] text-white/90">
              <li v-if="parsed.email" class="truncate">{{ parsed.email }}</li>
              <li v-if="parsed.phone">{{ parsed.phone }}</li>
              <li v-if="parsed.location" class="truncate">{{ parsed.location }}</li>
              <li v-if="parsed.linkedin || parsed.website" class="truncate text-teal-200">{{ parsed.linkedin || parsed.website }}</li>
            </ul>
          </div>

          <div v-if="parsed.education.length">
            <h4 class="text-[9px] uppercase tracking-widest text-teal-200/60 font-bold border-b border-white/20 pb-1 mb-2">Education</h4>
            <div class="space-y-2.5 text-[9.5px]">
              <div v-for="(edu, idx) in parsed.education" :key="idx">
                <p class="font-bold text-white/95">{{ edu.degree }}</p>
                <p class="text-white/80">{{ edu.school }} <span v-if="edu.dates">, {{ edu.dates }}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-[8px] text-white/55 mt-8 pt-4 border-t border-white/10 select-none">
        Creative Director Layout
      </div>
    </div>

    <div class="flex-1 bg-white p-8 flex flex-col gap-6">
      <section v-if="parsed.summary">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>Profile</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <p class="text-[11px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-3 flex items-center gap-2">
          <span>Experience</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx" class="relative pl-4 border-l border-teal-200/60">
            <div class="absolute -left-[4px] top-1 w-2 h-2 rounded-full bg-[#006a61]"></div>
            <div class="flex justify-between items-start mb-0.5">
              <h4 class="font-bold text-[11.5px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[8px] text-slate-400 uppercase font-bold">{{ job.dates }}</span>
            </div>
            <p class="text-[#006a61] font-semibold text-[9.5px] mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-450 font-normal">| {{ job.location }}</span></p>
            <ul class="text-[10px] text-slate-600 space-y-1 pl-1 list-disc">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.skills.length">
        <h2 class="text-[10px] font-bold text-[#006a61] uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <span>Skills Matrix</span>
          <span class="h-[1px] flex-1 bg-teal-100"></span>
        </h2>
        <div class="flex flex-wrap gap-1.5">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 bg-teal-50/50 text-[9.5px] font-semibold text-[#006a61] rounded border border-teal-100/50">
            {{ s }}
          </span>
        </div>
      </section>
    </div>
  </div>

  <!-- THE PARTNER THEME -->
  <div
    v-else-if="formatId === 'the-partner'"
    class="theme-partner w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text min-h-[750px]"
  >
    <header class="text-center flex flex-col items-center gap-2 pt-4">
      <h1 class="text-2xl font-semibold tracking-wider text-[#091426] serif">{{ parsed.name }}</h1>
      <p class="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-bold border-y border-slate-200 py-1 w-full max-w-md">{{ parsed.title }}</p>
      <div class="flex flex-wrap justify-center gap-3 text-[9.5px] text-slate-500 mt-1 font-medium">
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.linkedin || parsed.website" class="underline text-slate-700">{{ parsed.linkedin || parsed.website }}</span>
      </div>
    </header>

    <section v-if="parsed.summary" class="mt-2">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Executive Profile</h2>
      <p class="text-[10.5px] leading-relaxed text-slate-650 serif">{{ parsed.summary }}</p>
    </section>

    <section v-if="parsed.experience.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2.5">Professional Experience</h2>
      <div class="space-y-4">
        <div v-for="(job, idx) in parsed.experience" :key="idx">
          <div class="flex justify-between items-baseline mb-0.5">
            <h3 class="text-[11px] font-bold text-slate-800">{{ job.title }}</h3>
            <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
          </div>
          <p class="text-[9.5px] text-slate-500 font-bold italic mb-1">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
          <ul class="space-y-0.5 list-disc pl-4 text-[10px] text-slate-600">
            <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-6 mt-auto">
      <section v-if="parsed.skills.length">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Core Expertise</h2>
        <div class="grid grid-cols-2 gap-y-1 gap-x-2">
          <div v-for="(s, idx) in parsed.skills" :key="idx" class="flex items-center gap-1.5 text-[9.5px] text-slate-650">
            <span class="text-[#091426] font-bold">✓</span>
            <span>{{ s }}</span>
          </div>
        </div>
      </section>

      <section v-if="parsed.education.length">
        <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] border-b-2 border-[#091426] pb-0.5 mb-2">Education</h2>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="text-[10px] font-bold text-slate-850">{{ edu.school }}</h5>
            <p class="text-[9px] text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">| {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- THE INNOVATOR THEME -->
  <div
    v-else-if="formatId === 'the-innovator'"
    class="theme-innovator w-full bg-[#091426] text-white relative p-8 flex flex-col gap-5 text-left select-text min-h-[750px]"
  >
    <div class="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] pointer-events-none"></div>

    <header class="relative border-b border-teal-500/20 pb-5 z-10">
      <h1 class="text-3xl font-black tracking-tight text-white uppercase">{{ parsed.name }}</h1>
      <p class="text-[9.5px] font-bold tracking-[0.2em] text-teal-400 uppercase mt-1">{{ parsed.title }}</p>
      <div class="flex flex-wrap gap-4 text-[9.5px] text-slate-400 mt-4">
        <span v-if="parsed.email">✉ {{ parsed.email }}</span>
        <span v-if="parsed.phone">☎ {{ parsed.phone }}</span>
        <span v-if="parsed.location">⚲ {{ parsed.location }}</span>
        <span v-if="parsed.linkedin || parsed.website" class="text-teal-400">{{ parsed.linkedin || parsed.website }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 relative z-10 flex-grow">
      <!-- Left Column (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-1.5 select-none">Innovation Profile</h2>
          <p class="text-[10.5px] leading-relaxed text-slate-300 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Professional Experience</h2>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx" class="bg-slate-900/20 border border-slate-800/40 p-3 rounded-xl">
              <div class="flex justify-between items-baseline mb-1">
                <h3 class="text-[11px] font-bold text-white">{{ job.title }}</h3>
                <span class="text-[8px] text-teal-300 font-bold bg-teal-950/60 border border-teal-500/20 px-1.5 py-0.5 rounded">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] text-teal-400/90 font-medium mb-2">{{ job.company }} <span v-if="job.location" class="text-slate-500">| {{ job.location }}</span></p>
              <ul class="space-y-1 pl-1 list-none text-[9.5px] text-slate-300">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                  <span class="text-teal-400 font-bold mt-0.5">»</span>
                  <p>{{ b }}</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Right Column (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4">
        <section v-if="parsed.skills.length" class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Technologies</h2>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 bg-slate-950 text-[9px] font-bold text-teal-300 border border-teal-500/20 rounded">
              {{ s }}
            </span>
          </div>
        </section>

        <section v-if="parsed.education.length" class="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl">
          <h2 class="text-[10px] font-bold text-teal-400 uppercase tracking-widest mb-2 select-none">Education</h2>
          <div class="space-y-2.5">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h5 class="text-[9.5px] font-bold text-white">{{ edu.school }}</h5>
              <p class="text-[8.5px] text-slate-400">{{ edu.degree }}</p>
              <p class="text-[8px] text-teal-300/80" v-if="edu.dates">{{ edu.dates }}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>

  <!-- THE DIGITAL NOMAD THEME -->
  <div
    v-else-if="formatId === 'the-digital-nomad'"
    class="theme-digital-nomad w-full bg-white relative flex flex-col md:flex-row min-h-[750px] text-slate-800 text-left select-text p-0"
  >
    <!-- Left Split Column (50%) -->
    <div class="w-full md:w-1/2 bg-[#0b1c30] text-white p-8 flex flex-col justify-between shrink-0">
      <div>
        <h1 class="text-3xl font-black text-white leading-tight uppercase">{{ parsed.name }}</h1>
        <p class="text-[9.5px] uppercase tracking-[0.25em] text-[#ff4e69] font-bold mt-1.5">{{ parsed.title }}</p>
        
        <div class="mt-8 space-y-6">
          <section v-if="parsed.summary">
            <h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5">Nomad Profile</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-300 opacity-90 max-w-sm">{{ parsed.summary }}</p>
          </section>

          <section>
            <h3 class="text-[9.5px] uppercase tracking-widest text-[#ff4e69] font-bold mb-2.5">Contact</h3>
            <ul class="space-y-2 text-[9.5px] text-slate-300">
              <li v-if="parsed.email">✉ {{ parsed.email }}</li>
              <li v-if="parsed.phone">☎ {{ parsed.phone }}</li>
              <li v-if="parsed.location">⚲ {{ parsed.location }}</li>
              <li v-if="parsed.linkedin || parsed.website" class="text-[#ff4e69] font-semibold">{{ parsed.linkedin || parsed.website }}</li>
            </ul>
          </section>
        </div>
      </div>
      <div class="text-[8.5px] text-slate-500 mt-12">
        © {{ new Date().getFullYear() }} Global Nomad Canvas
      </div>
    </div>

    <!-- Right Split Column (50%) -->
    <div class="w-full md:w-1/2 bg-white p-8 flex flex-col gap-6">
      <section v-if="parsed.experience.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-3">Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="font-bold text-[11px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-[#ff4e69] font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[#0b1c30] font-semibold text-[9.5px] mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="text-[9.5px] text-slate-600 space-y-1 list-disc pl-4">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="parsed.skills.length">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2.5">Skills</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 border border-[#0b1c30] rounded-full text-[9px] text-[#0b1c30] font-bold">
            {{ s }}
          </span>
        </div>
      </section>

      <section v-if="parsed.education.length" class="mt-auto">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-[#091426] border-b border-slate-200 pb-1 mb-2">Education</h2>
        <div class="space-y-2">
          <div v-for="(edu, idx) in parsed.education" :key="idx" class="text-[9.5px]">
            <p class="font-bold text-slate-850">{{ edu.degree }}</p>
            <p class="text-slate-500">{{ edu.school }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- THE SOCIAL MEDIA PRO THEME -->
  <div
    v-else-if="formatId === 'the-social-media-pro'"
    class="theme-social-media-pro w-full bg-white relative flex flex-col min-h-[750px] text-slate-800 text-left select-text p-0"
  >
    <!-- Top banner with colorful gradient -->
    <div class="h-28 bg-gradient-to-r from-[#091426] via-[#006a61] to-[#ff4e69] relative shrink-0"></div>

    <div class="px-7 relative flex-grow flex flex-col pb-8">
      <!-- Info overlap block -->
      <div class="flex flex-col sm:flex-row justify-between items-start gap-4 -mt-10 mb-5 relative z-10">
        <div class="w-20 h-20 bg-slate-100 rounded-full border-4 border-white shadow-md flex items-center justify-center shrink-0">
          <span class="text-slate-350 text-xs select-none">📷 Photo</span>
        </div>
        <div class="flex-grow pt-10 sm:pt-12">
          <h1 class="text-2xl font-extrabold text-[#091426] tracking-tight leading-none">{{ parsed.name }}</h1>
          <p class="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">{{ parsed.title }}</p>
        </div>
        <div class="sm:text-right pt-2 sm:pt-12 text-[9.5px] text-slate-500 font-medium space-y-0.5">
          <p v-if="parsed.email">✉ {{ parsed.email }}</p>
          <p v-if="parsed.phone">☎ {{ parsed.phone }}</p>
          <p v-if="parsed.location">⚲ {{ parsed.location }}</p>
          <p v-if="parsed.linkedin || parsed.website" class="text-[#006a61] font-semibold">{{ parsed.linkedin || parsed.website }}</p>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-5 flex-grow">
        <!-- Main Column (col-span-8) -->
        <section class="col-span-8 flex flex-col gap-4">
          <div v-if="parsed.summary">
            <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-1.5">Bio</h3>
            <p class="text-[10.5px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
          </div>

          <div v-if="parsed.experience.length">
            <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Campaign Experience</h3>
            <div class="space-y-3.5">
              <div v-for="(job, idx) in parsed.experience" :key="idx">
                <div class="flex justify-between items-baseline mb-0.5">
                  <h4 class="text-[10.5px] font-bold text-slate-800">{{ job.title }}</h4>
                  <span class="text-[7.5px] text-[#ff4e69] font-bold uppercase">{{ job.dates }}</span>
                </div>
                <p class="text-[9.5px] text-[#006a61] font-bold mb-1">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
                <ul class="space-y-0.5 list-disc pl-4 text-[9.5px] text-slate-600">
                  <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Sidebar Column (col-span-4) -->
        <aside class="col-span-4 flex flex-col gap-4">
          <section v-if="parsed.skills.length">
            <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Capabilities</h3>
            <div class="flex flex-wrap gap-1">
              <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[9px] font-semibold text-slate-700 rounded">
                {{ s }}
              </span>
            </div>
          </section>

          <section v-if="parsed.education.length" class="mt-auto">
            <h3 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2">Education</h3>
            <div class="space-y-2 text-[9.5px]">
              <div v-for="(edu, idx) in parsed.education" :key="idx">
                <p class="font-bold text-slate-800 leading-snug">{{ edu.school }}</p>
                <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
    <div class="h-1 bg-gradient-to-r from-[#091426] via-[#006a61] to-[#ff4e69] shrink-0"></div>
  </div>

  <!-- THE BRAND ARCHITECT THEME -->
  <div
    v-else-if="formatId === 'the-brand-architect'"
    class="theme-brand-architect w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text min-h-[750px] overflow-hidden"
  >
    <!-- Background Monogram Letter -->
    <div class="absolute -top-6 -left-10 text-[160px] font-extrabold text-slate-50 opacity-[0.45] select-none pointer-events-none serif">
      {{ parsed.name ? parsed.name.replace(/^Dr\.\s*/i, '').charAt(0).toUpperCase() : 'M' }}
    </div>

    <header class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[#091426] uppercase serif">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-[0.25em] text-[#006a61] bg-[#091426] text-white px-2 py-0.5 inline-block font-bold mt-2">{{ parsed.title }}</p>
      </div>
      <div class="flex flex-col gap-0.5 text-[9.5px] text-slate-500 font-medium border-l border-slate-350 pl-3 md:pl-0 md:border-l-0 md:border-r md:pr-3 md:text-right">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="parsed.linkedin || parsed.website" class="underline text-slate-655">{{ parsed.linkedin || parsed.website }}</span>
      </div>
    </header>

    <div class="relative z-10 flex flex-col gap-5 flex-grow">
      <section v-if="parsed.summary">
        <h2 class="text-[9.5px] font-bold text-slate-450 uppercase tracking-widest border-b border-slate-250 pb-0.5 mb-2 select-none">Profile</h2>
        <p class="text-[10.5px] leading-relaxed text-slate-600 font-medium">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length">
        <h2 class="text-[9.5px] font-bold text-slate-455 uppercase tracking-widest border-b border-slate-250 pb-0.5 mb-3 select-none">Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="text-[11px] font-bold text-slate-800 leading-snug">{{ job.title }}</h4>
              <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="space-y-1 list-none pl-1 text-[9.5px] text-slate-600">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                <span class="text-[#006a61] font-bold mt-0.5">▪</span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-2 gap-5 mt-auto">
        <section v-if="parsed.skills.length">
          <h2 class="text-[9.5px] font-bold text-slate-455 uppercase tracking-widest border-b border-slate-250 pb-0.5 mb-2 select-none">Expertise</h2>
          <div class="flex flex-wrap gap-1">
            <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2.5 py-0.5 bg-slate-50 border border-slate-200 text-[9px] font-bold text-[#091426] uppercase rounded">
              {{ s }}
            </span>
          </div>
        </section>

        <section v-if="parsed.education.length">
          <h2 class="text-[9.5px] font-bold text-slate-455 uppercase tracking-widest border-b border-slate-250 pb-0.5 mb-2 select-none">Education</h2>
          <div class="space-y-2">
            <div v-for="(edu, idx) in parsed.education" :key="idx" class="text-[9.5px]">
              <h5 class="font-bold text-slate-850 leading-snug">{{ edu.school }}</h5>
              <p class="text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>

  <!-- THE TYPOGRAPHER THEME -->
  <div
    v-else-if="formatId === 'the-typographer'"
    class="theme-typographer w-full bg-white relative p-8 flex flex-col gap-6 text-slate-800 text-left select-text min-h-[750px]"
  >
    <header class="grid grid-cols-12 border-b-2 border-slate-900 pb-5">
      <div class="col-span-8">
        <h1 class="text-3xl font-black tracking-tighter text-slate-900 leading-[0.95] uppercase break-words">{{ parsed.name }}</h1>
        <p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-2 select-none">{{ parsed.title }}</p>
      </div>
      <div class="col-span-4 text-right text-[9.5px] text-slate-500 font-medium space-y-0.5">
        <p v-if="parsed.email">{{ parsed.email }}</p>
        <p v-if="parsed.phone">{{ parsed.phone }}</p>
        <p v-if="parsed.location">{{ parsed.location }}</p>
        <p v-if="parsed.linkedin || parsed.website" class="underline text-slate-800">{{ parsed.linkedin || parsed.website }}</p>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left main content (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-5 border-r border-slate-200 pr-5">
        <div v-if="parsed.summary">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Profile Summary</h2>
          <p class="text-[10px] leading-relaxed text-slate-650 serif">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-3 select-none">Experience Timeline</h2>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-extrabold text-slate-900 uppercase tracking-tight">{{ job.title }}</h3>
                <span class="text-[7.5px] text-slate-400 font-extrabold uppercase">{{ job.dates }}</span>
              </div>
              <p class="text-[9px] text-[#006a61] font-bold uppercase tracking-wider mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="space-y-1 pl-4 list-disc text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- Right sidebar (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-5">
        <section v-if="parsed.skills.length">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Core Stack</h2>
          <ul class="space-y-1 font-bold text-[9px] text-slate-700 uppercase tracking-wider pl-1 list-none">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex gap-1.5 items-center">
              <span class="w-1.5 h-1.5 bg-slate-900 rounded-full shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.education.length" class="mt-auto">
          <h2 class="text-[9.5px] font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-0.5 mb-2 select-none">Academic</h2>
          <div class="space-y-2.5 text-[9px]">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <p class="font-extrabold text-slate-900 uppercase leading-snug">{{ edu.school }}</p>
              <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            </div>
          </div>
        </section>
      </aside>
    </div>
  </div>

  <!-- THE RESEARCHER THEME (ACADEMIC) -->
  <div
    v-else-if="formatId === 'the-researcher' || formatId === 'the-researcher-updated'"
    class="theme-researcher w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text min-h-[750px]"
  >
    <header class="text-center mb-4">
      <h1 class="text-xl font-bold tracking-wide text-slate-900 serif">{{ parsed.name }}</h1>
      <div class="flex flex-wrap justify-center gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-1.5 font-medium">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
        <span v-if="parsed.linkedin || parsed.website" class="underline text-slate-600">{{ parsed.linkedin || parsed.website }}</span>
      </div>
      <p class="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold mt-2 select-none">{{ parsed.title }}</p>
    </header>

    <section v-if="parsed.summary">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Research Profile</h2>
      <p class="text-[10px] leading-relaxed text-slate-655 serif">{{ parsed.summary }}</p>
    </section>

    <section v-if="parsed.experience.length">
      <h2 class="text-[10px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2.5 select-none">Academic Appointments</h2>
      <div class="space-y-4">
        <div v-for="(job, idx) in parsed.experience" :key="idx">
          <div class="flex justify-between items-baseline mb-0.5">
            <h3 class="text-[10.5px] font-bold text-slate-855">{{ job.title }}</h3>
            <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
          </div>
          <p class="text-[9px] text-[#006a61] font-bold mb-1 leading-snug">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
          <ul class="space-y-0.5 list-disc pl-4 text-[9.5px] text-slate-600 leading-normal">
            <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
          </ul>
        </div>
      </div>
    </section>

    <div class="grid grid-cols-2 gap-5 mt-auto">
      <section v-if="parsed.education.length">
        <h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Education</h2>
        <div class="space-y-2 text-[9px]">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <p class="font-bold text-slate-850 leading-snug">{{ edu.school }}</p>
            <p class="text-slate-500 leading-tight">{{ edu.degree }} <span v-if="edu.dates" class="text-slate-400">, {{ edu.dates }}</span></p>
          </div>
        </div>
      </section>

      <section v-if="parsed.skills.length">
        <h2 class="text-[9.5px] font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-0.5 mb-2 select-none">Fields & Methodologies</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[9px] text-slate-700 rounded">
            {{ s }}
          </span>
        </div>
      </section>
    </div>
  </div>

  <!-- THE ENGINEER THEME (TECHNICAL) -->
  <div
    v-else-if="formatId === 'the-engineer'"
    class="theme-engineer w-full bg-white relative flex flex-col md:flex-row min-h-[750px] text-slate-800 text-left select-text p-0 ring-1 ring-slate-200/50"
  >
    <!-- Left Main Content (66%) -->
    <div class="flex-[2] p-6 border-r border-slate-200/80 flex flex-col gap-5">
      <header>
        <h1 class="text-2xl font-extrabold text-slate-900 uppercase tracking-tight leading-none">{{ parsed.name }}</h1>
        <p class="text-[9.5px] font-bold uppercase tracking-widest text-[#006a61] mt-1.5 pb-2 border-b border-slate-100">{{ parsed.title }}</p>
        <div class="flex flex-wrap gap-3 text-[9.5px] text-slate-500 mt-2 font-medium">
          <span v-if="parsed.email">✉ {{ parsed.email }}</span>
          <span v-if="parsed.location">⚲ {{ parsed.location }}</span>
          <span v-if="parsed.linkedin || parsed.website" class="text-[#006a61]">{{ parsed.linkedin || parsed.website }}</span>
        </div>
      </header>

      <section v-if="parsed.summary">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none">Profile</h2>
        <p class="text-[10px] leading-relaxed text-slate-600">{{ parsed.summary }}</p>
      </section>

      <section v-if="parsed.experience.length" class="flex-grow">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-3 select-none">Engineering Experience</h2>
        <div class="space-y-4">
          <div v-for="(job, idx) in parsed.experience" :key="idx">
            <div class="flex justify-between items-baseline mb-0.5">
              <h4 class="font-bold text-[10.5px] text-slate-800">{{ job.title }}</h4>
              <span class="text-[7.5px] text-slate-400 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">{{ job.dates }}</span>
            </div>
            <p class="text-[9px] text-[#006a61] font-bold mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
            <ul class="space-y-0.5 list-none pl-0.5 text-[9.5px] text-slate-600 leading-normal">
              <li v-for="(b, bIdx) in job.bullets" :key="bIdx" class="flex gap-2 items-start">
                <span class="text-slate-400 mt-1 shrink-0 font-bold">▪</span>
                <p>{{ b }}</p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>

    <!-- Right Sidebar Content (33%) -->
    <div class="flex-1 bg-slate-50/50 p-6 flex flex-col gap-5 shrink-0">
      <section v-if="parsed.skills.length">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2.5 select-none">Stack & Tools</h2>
        <div class="flex flex-wrap gap-1">
          <span v-for="(s, idx) in parsed.skills" :key="idx" class="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-semibold text-slate-700">
            {{ s }}
          </span>
        </div>
      </section>

      <section v-if="parsed.education.length" class="mt-auto">
        <h2 class="text-[9.5px] font-bold text-slate-800 uppercase tracking-widest border-b-2 border-slate-900 pb-0.5 mb-2 select-none">Education</h2>
        <div class="space-y-2.5 text-[9px]">
          <div v-for="(edu, idx) in parsed.education" :key="idx">
            <h5 class="font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
            <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            <p class="text-slate-400 text-[8px] mt-0.5" v-if="edu.dates">{{ edu.dates }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- THE DISTINGUISHED THEME -->
  <div
    v-else-if="formatId === 'the-distinguished'"
    class="theme-distinguished w-full bg-white relative p-8 flex flex-col gap-5 text-slate-800 text-left select-text min-h-[750px]"
  >
    <div class="absolute top-0 left-0 right-0 h-1 bg-[#091426] shrink-0"></div>

    <header class="flex flex-col sm:flex-row justify-between items-end border-b border-slate-200 pb-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-[#091426] serif">{{ parsed.name }}</h1>
        <p class="text-[9px] uppercase tracking-[0.2em] text-[#006a61] font-bold mt-1">{{ parsed.title }}</p>
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[9.5px] text-slate-500 mt-2 sm:mt-0 font-medium">
        <span v-if="parsed.email">{{ parsed.email }}</span>
        <span v-if="parsed.phone">{{ parsed.phone }}</span>
        <span v-if="parsed.location">{{ parsed.location }}</span>
      </div>
    </header>

    <div class="grid grid-cols-12 gap-5 flex-grow">
      <!-- Left sidebar (col-span-4) -->
      <aside class="col-span-4 flex flex-col gap-4 border-r border-slate-200 pr-4">
        <section v-if="parsed.skills.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Expertise</h2>
          <div class="h-[1px] bg-slate-250 w-full mb-2"></div>
          <ul class="flex flex-col gap-1 list-none pl-0.5 text-[9.5px] text-slate-655 font-medium">
            <li v-for="(s, idx) in parsed.skills" :key="idx" class="flex gap-1.5 items-center">
              <span class="w-1.5 h-1.5 bg-[#006a61] rounded-full shrink-0"></span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </section>

        <section v-if="parsed.education.length" class="mt-auto">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Credentials</h2>
          <div class="h-[1px] bg-slate-250 w-full mb-2"></div>
          <div class="space-y-2 text-[9px]">
            <div v-for="(edu, idx) in parsed.education" :key="idx">
              <h5 class="font-bold text-slate-800 leading-snug">{{ edu.school }}</h5>
              <p class="text-slate-500 leading-tight">{{ edu.degree }}</p>
            </div>
          </div>
        </section>
      </aside>

      <!-- Right main body (col-span-8) -->
      <section class="col-span-8 flex flex-col gap-4">
        <div v-if="parsed.summary">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Professional Profile</h2>
          <div class="h-[1px] bg-slate-250 w-full mb-2"></div>
          <p class="text-[10.5px] leading-relaxed text-slate-600 serif">{{ parsed.summary }}</p>
        </div>

        <div v-if="parsed.experience.length">
          <h2 class="text-[10px] font-bold uppercase tracking-wider text-[#091426] mb-1 select-none">Experience Timeline</h2>
          <div class="h-[1px] bg-slate-250 w-full mb-2"></div>
          <div class="space-y-4">
            <div v-for="(job, idx) in parsed.experience" :key="idx">
              <div class="flex justify-between items-baseline mb-0.5">
                <h3 class="text-[10.5px] font-bold text-slate-855">{{ job.title }}</h3>
                <span class="text-[8px] text-slate-400 font-bold uppercase">{{ job.dates }}</span>
              </div>
              <p class="text-[9.5px] text-[#006a61] font-bold mb-1.5">{{ job.company }} <span v-if="job.location" class="text-slate-400 font-normal">| {{ job.location }}</span></p>
              <ul class="space-y-0.5 list-disc pl-4 text-[9.5px] text-slate-600">
                <li v-for="(b, bIdx) in job.bullets" :key="bIdx">{{ b }}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>

  <!-- PLAIN MARKDOWN FALLBACK (DEFAULT) -->
  <div v-else class="markdown-preview max-w-none text-left" v-html="plainHtml" />
</template>`;

// Replace `<template>` and `</template>` wrapper in components/ResumeThemeRenderer.vue
const templateStart = code.indexOf('<template>');
const templateEnd = code.indexOf('</template>') + 11;

if (templateStart === -1 || templateEnd === -1) {
  console.error("Could not find template tags boundaries!");
  process.exit(1);
}

code = code.substring(0, templateStart) + newTemplate + code.substring(templateEnd);

fs.writeFileSync(targetFile, code);
console.log("Successfully patched ResumeThemeRenderer.vue!");
