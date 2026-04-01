const { createApp, ref, computed, onMounted } = Vue;

const BREEDS = ['全部'];
const COLORS = ['全部'];
const CITIES = ['全部'];

const STATUS_MAP = { keeping: '照顧中', shelter: '已送收容所', released: '已放回' };

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

      <!-- ── 桌機左側篩選欄 ── -->
      <aside class="hidden md:flex fade-up fade-up-1 w-60 shrink-0 flex-col overflow-y-auto border-r border-[#c8a96e18]">
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
      <main class="flex-1 overflow-y-auto px-4 md:px-6 py-5 pb-20 md:pb-6">

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
            @click="openDetail(pet)"
            class="pet-card bg-[#222220] rounded-3xl overflow-hidden flex flex-col cursor-pointer
                   shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_4px_rgba(200,169,110,0.08)]
                   fade-up"
            :style="{ animationDelay: (i * 0.05) + 's' }"
          >
            <!-- 照片 4:3 -->
            <div class="relative aspect-[4/3] overflow-hidden bg-[#2a2a28] shrink-0">
              <img v-if="pet.photo" :src="pet.photo" :alt="pet.name"
                class="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105" />
              <div v-else class="absolute inset-0 flex items-center justify-center text-[#3a3a38]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
              <span class="absolute bottom-2 left-2 bg-[#1a1a18cc] backdrop-blur-sm text-[#c8a96e]
                           text-[9px] tracking-wider px-2 py-0.5 rounded-full border border-[#c8a96e22]">
                {{ pet.breed || '未知品種' }}
              </span>
              <span v-if="pet.status" class="absolute top-2 right-2 text-[9px] px-1.5 py-0.5 rounded-full"
                :class="{
                  'bg-emerald-900 text-emerald-300': pet.status === 'keeping',
                  'bg-amber-900  text-amber-300':    pet.status === 'shelter',
                  'bg-stone-700  text-stone-300':    pet.status === 'released',
                }">
                {{ STATUS_MAP[pet.status] || pet.status }}
              </span>
            </div>

            <!-- 資訊 -->
            <div class="p-3 md:p-4 flex flex-col gap-1 flex-1">
              <h3 class="font-serif-display text-[#f0e6cc] text-xs md:text-sm leading-snug">{{ pet.name }}</h3>
              <p class="text-[10px] text-[#9a9080] leading-relaxed truncate">{{ pet.location }}</p>
              <p class="text-[9px] text-[#5a5650] leading-relaxed">{{ pet.date }}</p>
              <p v-if="pet.traits" class="hidden md:block text-[11px] text-[#7a7268] mt-0.5 line-clamp-2 leading-relaxed">
                {{ pet.traits }}
              </p>
              <p class="text-[9px] text-[#c8a96e55] mt-auto pt-1 leading-relaxed">點擊查看詳情 →</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- ══ 手機底部篩選欄 ══ -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e1c] border-t border-[#c8a96e22]
                flex items-center gap-2 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <button @click="showFilter = true"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2a2a28] rounded-2xl relative">
        <span class="text-xs text-[#9a9080]">篩選</span>
        <span v-if="hasFilter" class="absolute top-1.5 right-3 w-1.5 h-1.5 bg-[#c8a96e] rounded-full"></span>
      </button>
      <a href="/report.html"
        class="flex-1 flex items-center justify-center py-2.5 bg-[#c8a96e] rounded-2xl text-xs font-medium text-[#1a1a18]">
        + 回報拾獲
      </a>
    </div>

    <!-- ══ 手機篩選抽屜 ══ -->
    <transition name="sheet">
      <div v-if="showFilter" class="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-[#0a0a08cc]" @click="showFilter = false"></div>
        <div class="relative bg-[#222220] rounded-t-3xl px-5 pt-4 pb-10 border-t border-[#c8a96e22]
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
                  :class="filters[key] === o ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080]'"
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

    <!-- ══ 詳細頁 Modal ══ -->
    <transition name="modal">
      <div v-if="detail" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-[#0a0a08dd] backdrop-blur-sm" @click="detail = null"></div>

        <!-- Panel -->
        <div class="relative w-full md:max-w-lg bg-[#222220] rounded-t-3xl md:rounded-3xl overflow-hidden
                    shadow-[0_-8px_48px_rgba(0,0,0,0.7)] md:shadow-[0_8px_48px_rgba(0,0,0,0.7)]
                    max-h-[92vh] flex flex-col">

          <!-- 照片 -->
          <div class="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden bg-[#2a2a28] shrink-0">
            <img v-if="detail.photo" :src="detail.photo" :alt="detail.name"
              class="absolute inset-0 w-full h-full object-cover" />
            <!-- 關閉按鈕 -->
            <button @click="detail = null"
              class="absolute top-3 right-3 w-8 h-8 bg-[#1a1a18bb] backdrop-blur-sm rounded-full
                     flex items-center justify-center text-[#9a9080] hover:text-[#f0e6cc] transition text-sm">
              ✕
            </button>
            <!-- 狀態 badge -->
            <span v-if="detail.status" class="absolute bottom-3 left-3 text-xs px-3 py-1 rounded-full font-medium"
              :class="{
                'bg-emerald-900 text-emerald-300': detail.status === 'keeping',
                'bg-amber-900  text-amber-300':    detail.status === 'shelter',
                'bg-stone-700  text-stone-300':    detail.status === 'released',
              }">
              {{ STATUS_MAP[detail.status] }}
            </span>
          </div>

          <!-- 內容 -->
          <div class="overflow-y-auto p-6 flex flex-col gap-5">
            <!-- 標題區 -->
            <div>
              <p class="text-[#c8a96e] text-[10px] tracking-[0.2em] uppercase mb-1 leading-relaxed">
                {{ detail.type === 'dog' ? '狗' : detail.type === 'cat' ? '貓' : '其他' }}
              </p>
              <h2 class="font-serif-display text-[#f0e6cc] text-2xl leading-snug">{{ detail.name }}</h2>
            </div>

            <!-- 基本資訊 grid -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">地點</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.location }}</p>
              </div>
              <div class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">拾獲日期</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.date }}</p>
              </div>
              <div v-if="detail.breed" class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">品種</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.breed }}</p>
              </div>
              <div v-if="detail.color" class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">毛色</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.color }}</p>
              </div>
            </div>

            <!-- 特徵描述 -->
            <div v-if="detail.traits" class="bg-[#1e1e1c] rounded-2xl p-4">
              <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-2 leading-relaxed">外觀特徵</p>
              <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.traits }}</p>
            </div>

            <!-- 聯絡方式（重點區塊） -->
            <div class="bg-[#c8a96e15] border border-[#c8a96e33] rounded-2xl p-4">
              <p class="text-[#c8a96e] text-[10px] uppercase tracking-wider mb-2 leading-relaxed">聯絡拾獲者</p>
              <p class="text-[#f0e6cc] text-sm font-medium leading-relaxed">{{ detail.contact }}</p>
            </div>

            <!-- 分享按鈕 -->
            <button @click="share(detail)"
              class="w-full py-3 rounded-2xl border border-[#c8a96e33] text-[#c8a96e] text-sm
                     hover:bg-[#c8a96e15] transition leading-relaxed">
              分享這則紀錄
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
  `,

  setup() {
    const filters    = ref({ breed: '全部', color: '全部', location: '全部' });
    const pets       = ref([]);
    const isLoading  = ref(true);
    const showFilter = ref(false);
    const detail     = ref(null);

    onMounted(() => {
      fetch('/api/reports')
        .then(r => r.json())
        .then(data => {
          pets.value = data.map(p => ({
            ...p,
            name: p.breed ? p.breed + ' #' + String(p.id).slice(-4) : '未知 #' + String(p.id).slice(-4),
          }));
          BREEDS.splice(1); COLORS.splice(1); CITIES.splice(1);
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

    function openDetail(pet) {
      detail.value = pet;
    }

    function share(pet) {
      if (navigator.share) {
        navigator.share({ title: pet.name, text: `${pet.location} 發現一隻寵物`, url: location.href });
      } else {
        navigator.clipboard.writeText(location.href);
        alert('連結已複製！');
      }
    }

    return {
      filters, filterFields, pets, filtered, isLoading,
      showFilter, hasFilter, detail, STATUS_MAP,
      resetFilters, openDetail, share,
    };
  }
};

createApp(App).mount('#app');
