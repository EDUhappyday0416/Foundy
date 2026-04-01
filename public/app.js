const { createApp, ref, computed, onMounted, watch, nextTick } = Vue;

const BREEDS = ['全部'];
const COLORS = ['全部'];
const CITIES = ['All'];

const I18N = {
  zh: {
    tagline: 'Lost & Found', title: 'Foundy',
    records: n => `${n} 筆紀錄`, report: '+ 回報',
    filter: '篩選', clearFilter: '清除篩選 ↺',
    all: '全部', found: '拾獲', lost: '走失',
    list: '列表', map: '地圖',
    breed: '品種', color: '毛色', location: '地點',
    loading: '載入中', noRecord: '找不到符合條件的紀錄', beFirst: '成為第一個回報者 →',
    unknownBreed: '未知品種', unknown: '未知',
    keeping: '照顧中', shelter: '已送收容所', released: '已放回',
    resolved: '已找到 / 已歸還',
    detailFound: '拾獲', detailLost: '走失', myReport: '你的回報',
    locLabel: '地點', dateLabel: '日期', breedLabel: '品種', colorLabel: '毛色',
    traitsLabel: '外觀特徵', contactLabel: '聯絡方式',
    markFound: '標記已找到', delete: '刪除', deleteRecord: '刪除紀錄', share: '分享這則紀錄',
    confirmFound: '標記此紀錄為「已找到／已歸還」？',
    confirmDelete: '確定要刪除這則紀錄？此操作無法復原。',
    copied: '連結已複製！',
    applyFilter: n => `套用（${n} 筆）`,
    mapLegendFound: '拾獲', mapLegendLost: '走失', mapLegendResolved: '已解決',
    noMap: '尚無地圖定位資料', noMapSub: '新回報的紀錄會自動顯示在地圖上',
    clickDetail: '點擊查看詳情 →',
  },
  en: {
    tagline: 'Lost & Found', title: 'Foundy',
    records: n => `${n} records`, report: '+ Report',
    filter: 'Filter', clearFilter: 'Clear ↺',
    all: 'All', found: 'Found', lost: 'Lost',
    list: 'List', map: 'Map',
    breed: 'Breed', color: 'Color', location: 'Location',
    loading: 'Loading', noRecord: 'No matching records', beFirst: 'Be the first to report →',
    unknownBreed: 'Unknown breed', unknown: 'Unknown',
    keeping: 'In care', shelter: 'At shelter', released: 'Released',
    resolved: 'Reunited',
    detailFound: 'Found', detailLost: 'Lost', myReport: 'Your report',
    locLabel: 'Location', dateLabel: 'Date', breedLabel: 'Breed', colorLabel: 'Color',
    traitsLabel: 'Description', contactLabel: 'Contact',
    markFound: 'Mark as Reunited', delete: 'Delete', deleteRecord: 'Delete record', share: 'Share this post',
    confirmFound: 'Mark this pet as reunited?',
    confirmDelete: 'Delete this record? This cannot be undone.',
    copied: 'Link copied!',
    applyFilter: n => `Apply (${n})`,
    mapLegendFound: 'Found', mapLegendLost: 'Lost', mapLegendResolved: 'Resolved',
    noMap: 'No map data yet', noMapSub: 'New reports will appear on the map',
    clickDetail: 'View details →',
  },
};

let mapInstance = null;

const App = {
  template: `
  <div class="min-h-screen flex flex-col">

    <!-- ══ HEADER ══ -->
    <header class="fade-up flex items-center justify-between px-5 md:px-8 pt-6 pb-4 border-b border-[#c8a96e22]">
      <div>
        <p class="text-[#c8a96e] text-[10px] tracking-[0.25em] uppercase leading-relaxed">{{ t.tagline }}</p>
        <h1 class="font-serif-display text-3xl md:text-4xl text-[#f0e6cc] leading-tight">{{ t.title }}</h1>
      </div>
      <div class="flex items-center gap-2 md:gap-3">
        <span class="hidden md:block text-[#9a9080] text-sm leading-relaxed">{{ t.records(filtered.length) }}</span>
        <button @click="toggleLang"
          class="px-3 py-1.5 rounded-xl text-xs border border-[#c8a96e33] text-[#c8a96e] hover:bg-[#c8a96e15] transition">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </button>
        <a href="/report.html" class="px-4 py-2 rounded-2xl text-xs md:text-sm font-medium transition bg-[#c8a96e] text-[#1a1a18] hover:bg-[#d4b87a]">
          {{ t.report }}
        </a>
      </div>
    </header>

    <!-- ══ BODY ══ -->
    <div class="flex flex-1 overflow-hidden">

      <!-- 桌機左側篩選欄 -->
      <aside class="hidden md:flex fade-up fade-up-1 w-56 shrink-0 flex-col overflow-y-auto border-r border-[#c8a96e18]">
        <div class="p-5 flex flex-col gap-4">
          <p class="text-[#9a9080] text-[10px] tracking-[0.2em] uppercase leading-relaxed">{{ t.filter }}</p>
          <div v-for="({ label, key, opts }) in filterFields" :key="key">
            <p class="text-[#c8a96e] text-[11px] mb-1.5 leading-relaxed">{{ label }}</p>
            <select v-model="filters[key]"
              class="w-full bg-[#252520] border border-[#c8a96e22] rounded-xl px-3 py-1.5 text-xs
                     text-[#e8e0d0] focus:outline-none focus:border-[#c8a96e66] transition">
              <option v-for="o in opts" :key="o">{{ o }}</option>
            </select>
          </div>
          <button @click="resetFilters" class="text-[11px] text-[#9a9080] hover:text-[#c8a96e] transition text-left leading-relaxed">
            {{ t.clearFilter }}
          </button>
        </div>
      </aside>

      <!-- 主區 -->
      <main class="flex-1 flex flex-col overflow-hidden">

        <!-- 子 header：類型 tabs + 視圖切換 -->
        <div class="shrink-0 flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-[#c8a96e15] gap-3">
          <!-- 類型 tabs -->
          <div class="flex gap-0.5 bg-[#1e1e1c] rounded-xl p-1">
            <button v-for="t in typeOptions" :key="t.val" @click="typeFilter = t.val"
              :class="typeFilter === t.val ? 'bg-[#2a2a28] text-[#e8e0d0]' : 'text-[#5a5650] hover:text-[#9a9080]'"
              class="px-3 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap">
              {{ t.label }}
            </button>
          </div>
          <!-- 視圖切換 -->
          <div class="flex gap-0.5 bg-[#1e1e1c] rounded-xl p-1 shrink-0">
            <button @click="activeView = 'list'"
              :class="activeView === 'list' ? 'bg-[#2a2a28] text-[#e8e0d0]' : 'text-[#5a5650] hover:text-[#9a9080]'"
              class="px-3 py-1 rounded-lg text-xs transition">列表</button>
            <button @click="activeView = 'map'"
              :class="activeView === 'map' ? 'bg-[#2a2a28] text-[#e8e0d0]' : 'text-[#5a5650] hover:text-[#9a9080]'"
              class="px-3 py-1 rounded-lg text-xs transition">地圖</button>
          </div>
        </div>

        <!-- 列表視圖 -->
        <div v-show="activeView === 'list'" class="flex-1 overflow-y-auto px-4 md:px-6 py-5 pb-24 md:pb-6">

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
            <p class="text-sm leading-relaxed">{{ t.noRecord }}</p>
            <a href="/report.html" class="text-[#c8a96e] text-sm hover:underline">{{ t.beFirst }}</a>
          </div>

          <!-- 卡片 Grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            <div
              v-for="(pet, i) in filtered"
              :key="pet.id"
              @click="openDetail(pet)"
              class="pet-card bg-[#222220] rounded-3xl overflow-hidden flex flex-col cursor-pointer
                     shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_4px_rgba(200,169,110,0.08)] fade-up"
              :style="{ animationDelay: (i * 0.04) + 's' }"
            >
              <!-- 照片 4:3 -->
              <div class="relative aspect-[4/3] overflow-hidden bg-[#2a2a28] shrink-0">
                <img v-if="pet.photos && pet.photos[0]" :src="pet.photos[0]" :alt="pet.name"
                  class="absolute inset-0 w-full h-full object-cover transition duration-500 hover:scale-105" />
                <img v-else-if="pet.photo" :src="pet.photo" :alt="pet.name"
                  class="absolute inset-0 w-full h-full object-cover transition duration-500 hover:scale-105" />
                <div v-else class="absolute inset-0 flex items-center justify-center text-[#3a3a38]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                </div>

                <!-- 類型 badge -->
                <span class="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                  :class="pet.report_type === 'lost'
                    ? 'bg-red-900 text-red-300'
                    : 'bg-emerald-900 text-emerald-300'">
                  {{ typeLabel(pet.report_type) }}
                </span>

                <!-- 品種 badge -->
                <span class="absolute bottom-2 left-2 bg-[#1a1a18cc] backdrop-blur-sm text-[#c8a96e]
                             text-[9px] tracking-wider px-2 py-0.5 rounded-full border border-[#c8a96e22]">
                  {{ pet.breed || t.unknownBreed }}
                </span>

                <!-- 多張照片數量 -->
                <span v-if="pet.photos && pet.photos.length > 1"
                  class="absolute bottom-2 right-2 bg-[#1a1a18cc] text-[#9a9080] text-[9px] px-1.5 py-0.5 rounded-full">
                  +{{ pet.photos.length - 1 }}
                </span>

                <!-- 已找到遮罩 -->
                <div v-if="pet.is_resolved"
                  class="absolute inset-0 bg-[#1a1a18bb] flex items-center justify-center">
                  <span class="text-emerald-400 text-xs font-medium bg-[#1a1a18cc] px-3 py-1 rounded-full border border-emerald-800">
                    {{ t.resolved }}
                  </span>
                </div>
              </div>

              <!-- 資訊 -->
              <div class="p-3 md:p-4 flex flex-col gap-1 flex-1">
                <h3 class="font-serif-display text-[#f0e6cc] text-xs md:text-sm leading-snug">{{ petName(pet) }}</h3>
                <p class="text-[10px] text-[#9a9080] leading-relaxed truncate">{{ pet.location }}</p>
                <p class="text-[9px] text-[#5a5650] leading-relaxed">{{ pet.date }}</p>
                <p v-if="pet.traits" class="hidden md:block text-[11px] text-[#7a7268] mt-0.5 line-clamp-2 leading-relaxed">
                  {{ pet.traits }}
                </p>
                <p class="text-[9px] text-[#c8a96e44] mt-auto pt-1 leading-relaxed">{{ t.clickDetail }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 地圖視圖 -->
        <div v-show="activeView === 'map'" class="flex-1 relative min-h-0">
          <div ref="mapEl" class="absolute inset-0"></div>
          <!-- 圖例 -->
          <div class="absolute bottom-6 left-4 bg-[#222220dd] backdrop-blur-sm rounded-2xl p-3 z-[1000] text-xs flex flex-col gap-1.5 border border-[#c8a96e18]">
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#6ee7b7] shrink-0"></span><span class="text-[#9a9080]">{{ t.mapLegendFound }}</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#f87171] shrink-0"></span><span class="text-[#9a9080]">{{ t.mapLegendLost }}</span></div>
            <div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-[#5a5650] shrink-0"></span><span class="text-[#9a9080]">{{ t.mapLegendResolved }}</span></div>
          </div>
          <!-- 無地圖資料提示 -->
          <div v-if="!isLoading && !filtered.some(p => p.lat && p.lng)"
            class="absolute inset-0 flex items-center justify-center z-[999] pointer-events-none">
            <div class="text-center text-[#9a9080] bg-[#222220cc] backdrop-blur-sm rounded-3xl p-6 mx-4">
              <p class="text-sm leading-relaxed mb-2">{{ t.noMap }}</p>
              <p class="text-xs text-[#5a5650] leading-relaxed">{{ t.noMapSub }}</p>
            </div>
          </div>
        </div>

      </main>
    </div>

    <!-- ══ 手機底部欄 ══ -->
    <div class="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e1e1c] border-t border-[#c8a96e22]
                flex items-center gap-2 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <button @click="showFilter = true"
        class="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#2a2a28] rounded-2xl relative">
        <span class="text-xs text-[#9a9080]">{{ t.filter }}</span>
        <span v-if="hasFilter" class="absolute top-1.5 right-3 w-1.5 h-1.5 bg-[#c8a96e] rounded-full"></span>
      </button>
      <a href="/report.html"
        class="flex-1 flex items-center justify-center py-2.5 bg-[#c8a96e] rounded-2xl text-xs font-medium text-[#1a1a18]">
        {{ t.report }}
      </a>
    </div>

    <!-- ══ 手機篩選抽屜 ══ -->
    <transition name="sheet">
      <div v-if="showFilter" class="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-[#0a0a08cc]" @click="showFilter = false"></div>
        <div class="relative bg-[#222220] rounded-t-3xl px-5 pt-4 pb-10 border-t border-[#c8a96e22]
                    shadow-[0_-8px_32px_rgba(0,0,0,0.6)]">
          <div class="w-8 h-1 bg-[#3a3a38] rounded-full mx-auto mb-5"></div>
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-serif-display text-[#f0e6cc] text-lg">{{ t.filter }}</h3>
            <button @click="resetFilters(); showFilter = false"
              class="text-[11px] text-[#9a9080] hover:text-[#c8a96e] transition">{{ t.clearFilter }}</button>
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
            {{ t.applyFilter(filtered.length) }}
          </button>
        </div>
      </div>
    </transition>

    <!-- ══ 詳細頁 Modal ══ -->
    <transition name="modal">
      <div v-if="detail" class="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
        <div class="absolute inset-0 bg-[#0a0a08dd] backdrop-blur-sm" @click="detail = null"></div>

        <div class="modal-panel relative w-full md:max-w-lg bg-[#222220] rounded-t-3xl md:rounded-3xl overflow-hidden
                    shadow-[0_-8px_48px_rgba(0,0,0,0.7)] md:shadow-[0_8px_48px_rgba(0,0,0,0.7)]
                    max-h-[92vh] flex flex-col">

          <!-- 照片輪播 -->
          <div class="relative aspect-[16/9] md:aspect-[4/3] overflow-hidden bg-[#2a2a28] shrink-0">
            <template v-if="detail.photos && detail.photos.length > 0">
              <img :src="detail.photos[activePhotoIdx]" :alt="detail.name"
                class="absolute inset-0 w-full h-full object-cover transition duration-300" />
              <!-- 左右切換 -->
              <button v-if="detail.photos.length > 1 && activePhotoIdx > 0"
                @click.stop="activePhotoIdx--"
                class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1a1a18bb] rounded-full flex items-center justify-center text-[#e8e0d0] text-sm z-10">
                ‹
              </button>
              <button v-if="detail.photos && activePhotoIdx < detail.photos.length - 1"
                @click.stop="activePhotoIdx++"
                class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#1a1a18bb] rounded-full flex items-center justify-center text-[#e8e0d0] text-sm z-10">
                ›
              </button>
              <!-- 圓點 indicator -->
              <div v-if="detail.photos.length > 1"
                class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                <span v-for="(_, idx) in detail.photos" :key="idx"
                  class="w-1.5 h-1.5 rounded-full transition"
                  :class="idx === activePhotoIdx ? 'bg-[#c8a96e]' : 'bg-[#ffffff44]'">
                </span>
              </div>
            </template>
            <img v-else-if="detail.photo" :src="detail.photo" :alt="detail.name"
              class="absolute inset-0 w-full h-full object-cover" />

            <!-- 關閉按鈕 -->
            <button @click="detail = null"
              class="absolute top-3 right-3 w-8 h-8 bg-[#1a1a18bb] backdrop-blur-sm rounded-full
                     flex items-center justify-center text-[#9a9080] hover:text-[#f0e6cc] transition text-sm z-10">
              ✕
            </button>
            <!-- 已找到遮罩 -->
            <div v-if="detail.is_resolved"
              class="absolute inset-0 bg-[#1a1a18aa] flex items-center justify-center z-10">
              <span class="text-emerald-400 font-medium bg-[#1a1a18cc] px-4 py-2 rounded-full border border-emerald-800">
                {{ t.resolved }}
              </span>
            </div>
          </div>

          <!-- 內容 -->
          <div class="overflow-y-auto p-5 md:p-6 flex flex-col gap-4">
            <!-- 標題 -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    :class="detail.report_type === 'lost' ? 'bg-red-900 text-red-300' : 'bg-emerald-900 text-emerald-300'">
                    {{ typeLabel(detail.report_type) }}
                  </span>
                  <span v-if="isOwner(detail)" class="text-[10px] text-[#c8a96e] bg-[#c8a96e15] px-2 py-0.5 rounded-full border border-[#c8a96e33]">
                    {{ t.myReport }}
                  </span>
                </div>
                <h2 class="font-serif-display text-[#f0e6cc] text-2xl leading-snug">{{ petName(detail) }}</h2>
              </div>
            </div>

            <!-- 基本資訊 -->
            <div class="grid grid-cols-2 gap-2.5">
              <div class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">{{ t.locLabel }}</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.location }}</p>
              </div>
              <div class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">{{ t.dateLabel }}</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.date }}</p>
              </div>
              <div v-if="detail.breed" class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">{{ t.breedLabel }}</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.breed }}</p>
              </div>
              <div v-if="detail.color" class="bg-[#1e1e1c] rounded-2xl p-3">
                <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-1 leading-relaxed">{{ t.colorLabel }}</p>
                <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.color }}</p>
              </div>
            </div>

            <!-- 特徵 -->
            <div v-if="detail.traits" class="bg-[#1e1e1c] rounded-2xl p-4">
              <p class="text-[#9a9080] text-[10px] uppercase tracking-wider mb-2 leading-relaxed">{{ t.traitsLabel }}</p>
              <p class="text-[#e8e0d0] text-sm leading-relaxed">{{ detail.traits }}</p>
            </div>

            <!-- 聯絡方式 -->
            <div class="bg-[#c8a96e15] border border-[#c8a96e33] rounded-2xl p-4">
              <p class="text-[#c8a96e] text-[10px] uppercase tracking-wider mb-2 leading-relaxed">{{ t.contactLabel }}</p>
              <p class="text-[#f0e6cc] text-sm font-medium leading-relaxed">{{ detail.contact }}</p>
            </div>

            <!-- 擁有者操作 -->
            <div v-if="isOwner(detail) && !detail.is_resolved" class="flex gap-2">
              <button @click="markFound(detail)"
                class="flex-1 py-2.5 bg-emerald-900 text-emerald-300 rounded-2xl text-sm hover:bg-emerald-800 transition">
                {{ t.markFound }}
              </button>
              <button @click="deletePet(detail)"
                class="py-2.5 px-4 bg-[#2a2a28] text-red-400 rounded-2xl text-sm hover:bg-red-950 transition">
                {{ t.delete }}
              </button>
            </div>
            <div v-else-if="isOwner(detail) && detail.is_resolved">
              <button @click="deletePet(detail)"
                class="w-full py-2.5 bg-[#2a2a28] text-red-400 rounded-2xl text-sm hover:bg-red-950 transition">
                {{ t.deleteRecord }}
              </button>
            </div>

            <!-- 分享 -->
            <button @click="share(detail)"
              class="w-full py-2.5 rounded-2xl border border-[#c8a96e33] text-[#c8a96e] text-sm
                     hover:bg-[#c8a96e15] transition leading-relaxed">
              {{ t.share }}
            </button>
          </div>
        </div>
      </div>
    </transition>

  </div>
  `,

  setup() {
    const lang         = ref(localStorage.getItem('foundy_lang') || 'zh');
    const t            = computed(() => I18N[lang.value]);
    function toggleLang() {
      lang.value = lang.value === 'zh' ? 'en' : 'zh';
      localStorage.setItem('foundy_lang', lang.value);
      // 重設篩選（因為選項文字不同）
      filters.value = { breed: t.value.all, color: t.value.all, location: t.value.all };
      BREEDS.splice(0, BREEDS.length, t.value.all);
      COLORS.splice(0, COLORS.length, t.value.all);
      CITIES.splice(0, CITIES.length, t.value.all);
    }

    const filters      = ref({ breed: '全部', color: '全部', location: '全部' });
    const typeFilter   = ref('all');
    const activeView   = ref('list');
    const mapEl        = ref(null);
    const pets         = ref([]);
    const isLoading    = ref(true);
    const showFilter   = ref(false);
    const detail       = ref(null);
    const activePhotoIdx = ref(0);

    const typeOptions = computed(() => [
      { val: 'all',   label: t.value.all   },
      { val: 'found', label: t.value.found },
      { val: 'lost',  label: t.value.lost  },
    ]);

    onMounted(() => {
      // 初始化篩選預設值
      filters.value = { breed: t.value.all, color: t.value.all, location: t.value.all };
      BREEDS[0] = t.value.all;
      COLORS[0] = t.value.all;
      CITIES[0] = t.value.all;

      fetch('/api/reports')
        .then(r => r.json())
        .then(data => {
          pets.value = data.map(p => ({
            ...p,
            photos: p.photos || (p.photo ? [p.photo] : []),
          }));
          data.forEach(p => {
            if (p.breed    && !BREEDS.includes(p.breed))    BREEDS.push(p.breed);
            if (p.color    && !COLORS.includes(p.color))    COLORS.push(p.color);
            if (p.location && !CITIES.includes(p.location)) CITIES.push(p.location);
          });
        })
        .finally(() => { isLoading.value = false; });
    });

    const filterFields = computed(() => [
      { label: t.value.breed,    key: 'breed',    opts: BREEDS },
      { label: t.value.color,    key: 'color',    opts: COLORS },
      { label: t.value.location, key: 'location', opts: CITIES },
    ]);

    const filtered = computed(() => {
      const all = t.value.all;
      return pets.value.filter(p => {
        if (typeFilter.value !== 'all' && p.report_type !== typeFilter.value) return false;
        if (filters.value.breed    !== all && p.breed    !== filters.value.breed)    return false;
        if (filters.value.color    !== all && p.color    !== filters.value.color)    return false;
        if (filters.value.location !== all && p.location !== filters.value.location) return false;
        return true;
      });
    });

    const hasFilter = computed(() => {
      const all = t.value.all;
      return typeFilter.value !== 'all' ||
        filters.value.breed !== all ||
        filters.value.color !== all ||
        filters.value.location !== all;
    });

    function resetFilters() {
      const all = t.value.all;
      typeFilter.value = 'all';
      filters.value = { breed: all, color: all, location: all };
    }

    // ── 地圖 ────────────────────────────────────────────────────────────────
    function initMap() {
      if (!mapEl.value) return;
      if (mapInstance) {
        mapInstance.invalidateSize();
        updateMarkers();
        return;
      }
      const L = window.L;
      mapInstance = L.map(mapEl.value, { zoomControl: true }).setView([23.97, 120.97], 7);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapInstance);
      updateMarkers();
    }

    function updateMarkers() {
      if (!mapInstance) return;
      const L = window.L;
      mapInstance.eachLayer(layer => {
        if (layer instanceof L.CircleMarker) mapInstance.removeLayer(layer);
      });
      const withCoords = filtered.value.filter(p => p.lat && p.lng);
      if (!withCoords.length) return;
      withCoords.forEach(pet => {
        const marker = L.circleMarker([pet.lat, pet.lng], {
          radius: 9,
          fillColor: pet.is_resolved ? '#5a5650' : (pet.report_type === 'lost' ? '#f87171' : '#6ee7b7'),
          color: '#1a1a18',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(mapInstance);
        marker.bindTooltip(pet.name, { permanent: false });
        marker.on('click', () => { openDetail(pet); });
      });
      const bounds = L.latLngBounds(withCoords.map(p => [p.lat, p.lng]));
      mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    watch(activeView, async view => {
      if (view === 'map') { await nextTick(); initMap(); }
    });
    watch(filtered, () => { if (activeView.value === 'map') updateMarkers(); });

    // ── 詳細頁 ──────────────────────────────────────────────────────────────
    function openDetail(pet) {
      detail.value = pet;
      activePhotoIdx.value = 0;
    }

    // ── 擁有者功能 ───────────────────────────────────────────────────────────
    function isOwner(pet) {
      if (!pet) return false;
      try { return !!JSON.parse(localStorage.getItem('foundy_tokens') || '{}')[pet.id]; }
      catch { return false; }
    }
    function getToken(pet) {
      try { return JSON.parse(localStorage.getItem('foundy_tokens') || '{}')[pet.id] || null; }
      catch { return null; }
    }

    async function markFound(pet) {
      if (!confirm(t.value.confirmFound)) return;
      const token = getToken(pet);
      const res = await fetch(`/api/reports?id=${pet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: token, is_resolved: true }),
      });
      if (res.ok) {
        pet.is_resolved = true;
        if (mapInstance) updateMarkers();
      }
    }

    async function deletePet(pet) {
      if (!confirm(t.value.confirmDelete)) return;
      const token = getToken(pet);
      const res = await fetch(`/api/reports?id=${pet.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edit_token: token }),
      });
      if (res.ok) {
        pets.value = pets.value.filter(p => p.id !== pet.id);
        detail.value = null;
      }
    }

    function share(pet) {
      if (navigator.share) {
        navigator.share({ title: pet.name, url: location.href });
      } else {
        navigator.clipboard.writeText(location.href);
        alert(t.value.copied);
      }
    }

    function petName(p) {
      return (p.breed || t.value.unknown) + ' #' + String(p.id).slice(-4);
    }

    function statusLabel(s) {
      return lang.value === 'en'
        ? ({ keeping: 'In care', shelter: 'At shelter', released: 'Released' }[s] || s)
        : ({ keeping: '照顧中', shelter: '已送收容所', released: '已放回' }[s] || s);
    }

    function typeLabel(s) {
      return lang.value === 'en'
        ? ({ found: 'Found', lost: 'Lost' }[s] || s)
        : ({ found: '拾獲', lost: '走失' }[s] || s);
    }

    return {
      lang, t, toggleLang,
      filters, typeFilter, typeOptions, activeView, mapEl,
      filterFields, pets, filtered, isLoading,
      showFilter, hasFilter, detail, activePhotoIdx,
      petName, statusLabel, typeLabel,
      resetFilters, openDetail, isOwner, markFound, deletePet, share,
    };
  }
};

createApp(App).mount('#app');
