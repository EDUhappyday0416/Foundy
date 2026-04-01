const { createApp, ref, computed, onMounted } = Vue;

const BREEDS = ['全部'];
const COLORS = ['全部'];
const CITIES = ['全部'];

async function aiCompare(pet, file) {
  // TODO: replace with real POST /api/compare
  await new Promise(r => setTimeout(r, 1200));
  return Math.floor(Math.random() * 40 + 55);
}

const App = {
  template: `
  <div class="min-h-screen flex flex-col">

    <!-- ══ HEADER ══ -->
    <header class="fade-up flex items-center justify-between px-5 md:px-8 pt-6 pb-4 border-b border-[#c8a96e22]">
      <div>
        <p class="text-[#c8a96e] text-[10px] tracking-[0.25em] uppercase leading-relaxed">Lost & Found</p>
        <h1 class="font-serif-display text-3xl md:text-4xl text-[#f0e6cc] leading-tight">Foundy</h1>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <span class="hidden md:block text-[#9a9080] text-sm leading-relaxed">{{ filtered.length }} 筆紀錄</span>
        <a href="/report.html"
          class="px-4 py-2 rounded-2xl text-xs md:text-sm font-medium transition bg-[#c8a96e] text-[#1a1a18] hover:bg-[#d4b87a]">
          + 回報拾獲
        </a>
      </div>
    </header>

    <!-- ══ BODY ══ -->
    <div class="flex flex-1 overflow-hidden">

      <!-- ── 桌機左側欄（md 以上才顯示）── -->
      <aside class="hidden md:flex fade-up fade-up-1 w-60 shrink-0 flex-col overflow-y-auto border-r border-[#c8a96e18]">
        <div class="p-5 border-b border-[#c8a96e15]">
          <p class="text-[#c8a96e] text-[10px] tracking-[0.2em] uppercase mb-3 leading-relaxed">AI 比對你的寵物</p>
          <label class="block cursor-pointer group">
            <div v-if="!userPhoto"
              class="rounded-3xl border border-dashed border-[#c8a96e44] p-6
                     flex flex-col items-center gap-2
                     group-hover:border-[#c8a96e88] group-hover:bg-[#c8a96e06] transition">
              <div class="w-10 h-10 rounded-2xl bg-[#2a2a28] flex items-center justify-center text-[#c8a96e] text-lg font-light">+</div>
              <p class="text-[11px] text-[#9a9080] text-center leading-relaxed">上傳走失寵物的照片<br/>再點卡片「AI 比對」</p>
            </div>
            <div v-else class="rounded-3xl overflow-hidden border border-[#c8a96e33] relative">
              <img :src="userPhoto" class="w-full h-36 object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-[#1a1a18cc] to-transparent flex items-end p-3">
                <p class="text-[10px] text-[#c8a96e] leading-relaxed">已上傳 — 點卡片 AI 比對</p>
              </div>
            </div>
            <input type="file" accept="image/*" class="hidden" @change="onUpload" />
          </label>
        </div>
        <div class="p-5 flex flex-col gap-4">
          <p class="text-[#9a9080] text-[10px] tracking-[0.2em] uppercase leading-relaxed">篩選條件</p>
          <div v-for="({ label, key, opts }) in filterFields" :key="key">
            <p class="text-[#c8a96e] text-[11px] mb-1.5 leading-relaxed">{{ label }}</p>
            <select v-model="filters[key]"
              class="w-full bg-[#252520] border border-[#c8a96e22] rounded-xl px-3 py-1.5 text-xs
                     text-[#e8e0d0] focus:outline-none focus:border-[#c8a96e66] transition">
              <option v-for="o in opts" :key="o">{{ o }}</option>
            </select>
          </div>
          <button @click="resetFilters" class="text-[11px] text-[#9a9080] hover:text-[#c8a96e] transition text-left leading-relaxed">
            清除篩選 ↺
          </button>
        </div>
      </aside>

      <!-- ── 右側卡片區 ── -->
      <main class="flex-1 overflow-y-auto px-4 md:px-6 py-5 pb-28 md:pb-6">

        <!-- Loading 骨架 -->
        <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          <div v-for="n in 8" :key="n" class="bg-[#222220] rounded-3xl overflow-hidden animate-pulse">
            <div class="bg-[#2a2a28] aspect-[4/3]"></div>
            <div class="p-4 flex flex-col gap-2">
              <div class="h-3 bg-[#2a2a28] rounded w-3/4"></div>
              <div class="h-2.5 bg-[#2a2a28] rounded w-1/2"></div>
            </div>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="filtered.length === 0"
          class="flex flex-col items-center justify-center h-full text-[#9a9080] gap-3 fade-up py-20">
          <p class="text-sm leading-relaxed">找不到符合條件的紀錄</p>
          <a href="/report.html" class="text-[#c8a96e] text-sm hover:underline">成為第一個回報者 →</a>
        </div>

        <!-- 卡片 Grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
          <div
            v-for="(pet, i) in filtered"
            :key="pet.id"
            class="pet-card bg-[#222220] rounded-3xl overflow-hidden flex flex-col
                   shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_4px_rgba(200,169,110,0.08)]
                   fade-up"
            :style="{ animationDelay: (i * 0.05) + 's' }"
          >
            <!-- 照片：固定 4:3，不爆版 -->
            <div class="relative aspect-[4/3] overflow-hidden bg-[#2a2a28] shrink-0">
              <img v-if="pet.photo" :src="pet.photo" :alt="pet.name"
                class="absolute inset-0 w-full h-full object-cover transition duration-500 hover:scale-105" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-[#3a3a38]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <span class="absolute bottom-2 left-2 bg-[#1a1a18cc] backdrop-blur-sm text-[#c8a96e]
                           text-[9px] md:text-[10px] tracking-wider px-2 py-0.5 rounded-full border border-[#c8a96e22]">
                {{ pet.breed || '未知品種' }}
              </span>
              <span v-if="pet.status" class="absolute top-2 right-2 text-[9px] md:text-[10px] px-1.5 py-0.5 rounded-full"
                :class="{
                  'bg-emerald-900 text-emerald-300': pet.status === 'keeping',
                  'bg-amber-900  text-amber-300':    pet.status === 'shelter',
                  'bg-stone-700  text-stone-300':    pet.status === 'released',
                }">
                {{ { keeping:'照顧中', shelter:'收容所', released:'已放回' }[pet.status] }}
              </span>
            </div>

            <!-- 資訊 -->
            <div class="p-3 md:p-4 flex flex-col gap-1 flex-1">
              <h3 class="font-serif-display text-[#f0e6cc] text-xs md:text-sm leading-snug">{{ pet.name }}</h3>
              <p class="text-[10px] md:text-[11px] text-[#9a9080] leading-relaxed truncate">{{ pet.location }}</p>
              <p class="text-[9px] md:text-[10px] text-[#5a5650] leading-relaxed">{{ pet.found }}</p>
              <p v-if="pet.traits" class="hidden md:block text-[11px] text-[#7a7268] mt-0.5 line-clamp-2 leading-relaxed">
                {{ pet.traits }}
              </p>
              <!-- 聯絡（點擊展開） -->
              <div v-if="pet.contact" class="mt-1">
                <button @click="pet._showContact = !pet._showContact"
                  class="text-[9px] md:text-[10px] text-[#c8a96e] hover:text-[#d4b87a] transition leading-relaxed">
                  {{ pet._showContact ? '收起' : '聯絡方式 ›' }}
                </button>
                <p v-if="pet._showContact"
                  class="mt-1 text-[10px] md:text-[11px] text-[#e8e0d0] bg-[#2a2a28] rounded-xl px-3 py-2 leading-relaxed">
                  {{ pet.contact }}
                </p>
              </div>
              <!-- 相似度 -->
              <div v-if="pet.score !== undefined" class="mt-2">
                <div class="flex items-center gap-2 mb-1">
                  <div class="flex-1 h-1 bg-[#333330] rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-700"
                      :style="{ width: pet.score + '%',
                        background: pet.score >= 80 ? '#6ee7b7' : pet.score >= 60 ? '#c8a96e' : '#f87171' }">
                    </div>
                  </div>
                  <span class="text-xs font-medium tabular-nums"
                    :class="pet.score >= 80 ? 'text-emerald-400' : pet.score >= 60 ? 'text-[#c8a96e]' : 'text-red-400'">
                    {{ pet.score }}%
                  </span>
                </div>
                <p class="hidden md:block text-[10px] leading-relaxed"
                  :class="pet.score >= 80 ? 'text-emerald-500' : pet.score >= 60 ? 'text-[#c8a96e99]' : 'text-red-500'">
                  {{ scoreLabel(pet.score) }}
                </p>
              </div>
            </div>

            <!-- AI 比對按鈕 -->
            <div class="px-3 md:px-4 pb-3 md:pb-4 shrink-0">
              <button @click="compare(pet)" :disabled="!userPhoto || pet.loading"
                class="w-full py-2 rounded-2xl text-[10px] md:text-xs font-medium tracking-wide transition"
                :class="userPhoto && !pet.loading
                  ? 'bg-[#c8a96e] text-[#1a1a18] hover:bg-[#d4b87a]'
                  : 'bg-[#2a2a28] text-[#3a3a38] cursor-not-allowed'">
                <span v-if="pet.loading" class="animate-pulse">比對中...</span>
                <span v-else>AI 比對</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ══ 手機底部固定欄（md 以下顯示）══ -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e1c] border-t border-[#c8a96e22]
                flex items-center gap-2 px-4 py-3
                shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">

      <!-- 上傳照片 -->
      <label class="flex-1 cursor-pointer">
        <div class="flex items-center justify-center gap-2 py-2.5 rounded-2xl transition"
          :class="userPhoto ? 'bg-[#c8a96e22] border border-[#c8a96e44]' : 'bg-[#2a2a28]'">
          <div v-if="userPhoto" class="w-6 h-6 rounded-lg overflow-hidden shrink-0">
            <img :src="userPhoto" class="w-full h-full object-cover" />
          </div>
          <span class="text-xs font-medium"
            :class="userPhoto ? 'text-[#c8a96e]' : 'text-[#9a9080]'">
            {{ userPhoto ? '已上傳照片' : '上傳我的寵物' }}
          </span>
        </div>
        <input type="file" accept="image/*" class="hidden" @change="onUpload" />
      </label>

      <!-- 篩選按鈕 -->
      <button @click="showFilter = true"
        class="flex items-center gap-1.5 px-4 py-2.5 bg-[#2a2a28] rounded-2xl relative">
        <span class="text-xs text-[#9a9080]">篩選</span>
        <span v-if="hasFilter" class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#c8a96e] rounded-full"></span>
      </button>
    </div>

    <!-- ══ 手機篩選底部抽屜 ══ -->
    <transition name="sheet">
      <div v-if="showFilter" class="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-[#0a0a08cc]" @click="showFilter = false"></div>
        <!-- 抽屜 -->
        <div class="relative bg-[#222220] rounded-t-3xl px-5 pt-4 pb-10
                    border-t border-[#c8a96e22]
                    shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
          <div class="w-8 h-1 bg-[#3a3a38] rounded-full mx-auto mb-5"></div>
          <div class="flex items-center justify-between mb-5">
            <h3 class="font-serif-display text-[#f0e6cc] text-lg">篩選</h3>
            <button @click="resetFilters(); showFilter = false"
              class="text-[11px] text-[#9a9080] hover:text-[#c8a96e] transition">清除全部</button>
          </div>
          <div class="flex flex-col gap-4">
            <div v-for="({ label, key, opts }) in filterFields" :key="key">
              <p class="text-[#c8a96e] text-xs mb-2 leading-relaxed">{{ label }}</p>
              <div class="flex flex-wrap gap-2">
                <button v-for="o in opts" :key="o"
                  @click="filters[key] = o"
                  :class="filters[key] === o
                    ? 'bg-[#c8a96e] text-[#1a1a18]'
                    : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
                  class="px-3 py-1.5 rounded-full text-xs transition">{{ o }}</button>
              </div>
            </div>
          </div>
          <button @click="showFilter = false"
            class="mt-6 w-full py-3 bg-[#c8a96e] text-[#1a1a18] rounded-2xl text-sm font-medium">
            套用（{{ filtered.length }} 筆）
          </button>
        </div>
      </div>
    </transition>

  </div>
  `,

  setup() {
    const filters    = ref({ breed: '全部', color: '全部', location: '全部' });
    const userPhoto  = ref(null);
    const userFile   = ref(null);
    const pets       = ref([]);
    const isLoading  = ref(true);
    const showFilter = ref(false);

    onMounted(() => {
      fetch('/api/reports')
        .then(r => r.json())
        .then(data => {
          pets.value = data.map(p => ({
            ...p,
            name:         p.breed ? p.breed + ' #' + String(p.id).slice(-4) : '未知 #' + String(p.id).slice(-4),
            found:        p.date,
            score:        undefined,
            loading:      false,
            _showContact: false,
          }));
          BREEDS.splice(1);
          COLORS.splice(1);
          CITIES.splice(1);
          data.forEach(p => {
            if (p.breed    && !BREEDS.includes(p.breed))    BREEDS.push(p.breed);
            if (p.color    && !COLORS.includes(p.color))    COLORS.push(p.color);
            if (p.location && !CITIES.includes(p.location)) CITIES.push(p.location);
          });
        })
        .finally(() => { isLoading.value = false; });
    });

    const filterFields = [
      { label: '品種', key: 'breed',    opts: BREEDS },
      { label: '毛色', key: 'color',    opts: COLORS },
      { label: '地點', key: 'location', opts: CITIES },
    ];

    const filtered = computed(() => pets.value.filter(p => {
      if (filters.value.breed    !== '全部' && p.breed    !== filters.value.breed)    return false;
      if (filters.value.color    !== '全部' && p.color    !== filters.value.color)    return false;
      if (filters.value.location !== '全部' && p.location !== filters.value.location) return false;
      return true;
    }));

    const hasFilter = computed(() =>
      filters.value.breed !== '全部' || filters.value.color !== '全部' || filters.value.location !== '全部'
    );

    function resetFilters() {
      filters.value = { breed: '全部', color: '全部', location: '全部' };
    }

    function onUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      userFile.value  = file;
      userPhoto.value = URL.createObjectURL(file);
    }

    async function compare(pet) {
      if (!userPhoto.value) return;
      pet.loading = true;
      pet.score   = undefined;
      try {
        pet.score = await aiCompare(pet.photo, userFile.value);
      } finally {
        pet.loading = false;
      }
    }

    function scoreLabel(s) {
      if (s >= 85) return '極高相似度，強烈建議聯絡！';
      if (s >= 70) return '中高相似度，值得確認。';
      return '相似度偏低。';
    }

    return {
      filters, filterFields, userPhoto, isLoading, showFilter,
      pets, filtered, hasFilter,
      resetFilters, onUpload, compare, scoreLabel,
    };
  }
};

createApp(App).mount('#app');
