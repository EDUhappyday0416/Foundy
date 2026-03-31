const { createApp, ref, computed } = Vue;

// ─── Mock Data (replace with real API) ───────────────────────────────────────
const MOCK_PETS = [
  { id: 1, name: '橘貓 #001', breed: '橘貓', color: '橘色', location: '台北市信義區', photo: 'https://placecats.com/300/200', found: '2026-03-28', traits: '左耳有缺口、無項圈' },
  { id: 2, name: '柴犬 #002', breed: '柴犬', color: '棕色', location: '新北市板橋區', photo: 'https://place-puppy.com/300x200', found: '2026-03-27', traits: '戴紅色項圈、體型偏瘦' },
  { id: 3, name: '米克斯 #003', breed: '米克斯', color: '黑白', location: '台中市西屯區', photo: 'https://placecats.com/301/200', found: '2026-03-26', traits: '尾巴捲曲、眼神溫馴' },
  { id: 4, name: '貴賓 #004', breed: '貴賓狗', color: '白色', location: '台北市大安區', photo: 'https://place-puppy.com/301x200', found: '2026-03-25', traits: '已剪毛、非常親人' },
  { id: 5, name: '虎斑 #005', breed: '虎斑貓', color: '灰色', location: '高雄市前鎮區', photo: 'https://placecats.com/302/200', found: '2026-03-24', traits: '懷孕中、需緊急認領' },
  { id: 6, name: '黃金獵犬 #006', breed: '黃金獵犬', color: '金色', location: '新北市淡水區', photo: 'https://place-puppy.com/302x200', found: '2026-03-23', traits: '戴晶片、年齡約3歲' },
];

const BREEDS  = ['全部', '橘貓', '虎斑貓', '米克斯', '柴犬', '貴賓狗', '黃金獵犬'];
const COLORS  = ['全部', '橘色', '棕色', '黑白', '白色', '灰色', '金色'];
const CITIES  = ['全部', '台北市信義區', '新北市板橋區', '台中市西屯區', '台北市大安區', '高雄市前鎮區', '新北市淡水區'];

// ─── AI Compare (calls your backend /api/compare) ────────────────────────────
async function aiCompare(shelterPhotoUrl, userPhotoFile) {
  // In production, POST to your Node backend which calls OpenAI
  // Here we simulate a delay + random score for demo
  await new Promise(r => setTimeout(r, 1200));
  return Math.floor(Math.random() * 40 + 55); // 55~94
}

// ─── App Component ────────────────────────────────────────────────────────────
const App = {
  template: `
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <header class="bg-amber-500 text-white px-6 py-4 flex items-center gap-3 shadow-md">
      <span class="text-2xl">🐾</span>
      <h1 class="text-xl font-bold tracking-wide">寵物協尋 Dashboard</h1>
      <span class="ml-auto text-sm opacity-80">共 {{ filtered.length }} 筆收容紀錄</span>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- ── Left Sidebar: Filters ── -->
      <aside class="w-64 bg-white shadow-md p-5 flex flex-col gap-6 overflow-y-auto shrink-0">
        <div>
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">上傳您的寵物照片</h2>
          <label class="flex flex-col items-center justify-center border-2 border-dashed border-amber-300 rounded-xl p-4 cursor-pointer hover:bg-amber-50 transition">
            <span class="text-3xl mb-1">📷</span>
            <span class="text-xs text-gray-500">點擊上傳或拖曳</span>
            <input type="file" accept="image/*" class="hidden" @change="onUpload" />
          </label>
          <div v-if="userPhoto" class="mt-2 rounded-lg overflow-hidden border border-amber-200">
            <img :src="userPhoto" class="w-full h-32 object-cover" />
            <p class="text-center text-xs text-green-600 py-1 bg-green-50">照片已上傳 ✓</p>
          </div>
        </div>

        <hr class="border-gray-100" />

        <div>
          <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">篩選條件</h2>
          <div class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">品種</label>
              <select v-model="filters.breed" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option v-for="b in breeds" :key="b">{{ b }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">毛色</label>
              <select v-model="filters.color" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option v-for="c in colors" :key="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">遺失地點</label>
              <select v-model="filters.location" class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300">
                <option v-for="l in cities" :key="l">{{ l }}</option>
              </select>
            </div>
            <button @click="resetFilters" class="text-xs text-amber-600 underline text-left">清除篩選</button>
          </div>
        </div>
      </aside>

      <!-- ── Right: Card List ── -->
      <main class="flex-1 overflow-y-auto p-6">
        <div v-if="filtered.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
          <span class="text-5xl">🔍</span>
          <p>找不到符合條件的寵物</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <div
            v-for="pet in filtered"
            :key="pet.id"
            class="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden flex flex-col"
          >
            <!-- Photo -->
            <div class="relative">
              <img :src="pet.photo" :alt="pet.name" class="w-full h-44 object-cover" />
              <span class="absolute top-2 right-2 bg-amber-400 text-white text-xs px-2 py-0.5 rounded-full">{{ pet.breed }}</span>
            </div>

            <!-- Info -->
            <div class="p-4 flex flex-col gap-1 flex-1">
              <h3 class="font-semibold text-gray-800">{{ pet.name }}</h3>
              <p class="text-xs text-gray-500">📍 {{ pet.location }}</p>
              <p class="text-xs text-gray-500">🗓 拾獲日：{{ pet.found }}</p>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ pet.traits }}</p>

              <!-- Similarity badge -->
              <div v-if="pet.score !== undefined" class="mt-2">
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      class="h-2 rounded-full transition-all duration-700"
                      :class="scoreColor(pet.score)"
                      :style="{ width: pet.score + '%' }"
                    ></div>
                  </div>
                  <span class="text-sm font-bold" :class="scoreTextColor(pet.score)">{{ pet.score }}%</span>
                </div>
                <p class="text-xs mt-0.5" :class="scoreTextColor(pet.score)">{{ scoreLabel(pet.score) }}</p>
              </div>
            </div>

            <!-- AI Compare Button -->
            <div class="px-4 pb-4">
              <button
                @click="compare(pet)"
                :disabled="!userPhoto || pet.loading"
                class="w-full py-2 rounded-xl text-sm font-semibold transition"
                :class="userPhoto && !pet.loading
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
              >
                <span v-if="pet.loading" class="animate-pulse">🤖 比對中...</span>
                <span v-else>🔍 AI 比對</span>
              </button>
              <p v-if="!userPhoto" class="text-xs text-center text-gray-400 mt-1">請先上傳您的寵物照片</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  `,

  setup() {
    const filters   = ref({ breed: '全部', color: '全部', location: '全部' });
    const userPhoto = ref(null);
    const userFile  = ref(null);
    const pets      = ref(MOCK_PETS.map(p => ({ ...p, score: undefined, loading: false })));

    const breeds = BREEDS;
    const colors = COLORS;
    const cities = CITIES;

    const filtered = computed(() => pets.value.filter(p => {
      if (filters.value.breed    !== '全部' && p.breed    !== filters.value.breed)    return false;
      if (filters.value.color    !== '全部' && p.color    !== filters.value.color)    return false;
      if (filters.value.location !== '全部' && p.location !== filters.value.location) return false;
      return true;
    }));

    function resetFilters() {
      filters.value = { breed: '全部', color: '全部', location: '全部' };
    }

    function onUpload(e) {
      const file = e.target.files[0];
      if (!file) return;
      userFile.value = file;
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

    function scoreColor(s) {
      if (s >= 80) return 'bg-green-500';
      if (s >= 60) return 'bg-yellow-400';
      return 'bg-red-400';
    }
    function scoreTextColor(s) {
      if (s >= 80) return 'text-green-600';
      if (s >= 60) return 'text-yellow-600';
      return 'text-red-500';
    }
    function scoreLabel(s) {
      if (s >= 85) return '極高相似度，強烈建議聯絡！';
      if (s >= 70) return '中高相似度，值得確認。';
      return '相似度偏低。';
    }

    return { filters, userPhoto, pets, filtered, breeds, colors, cities, resetFilters, onUpload, compare, scoreColor, scoreTextColor, scoreLabel };
  }
};

createApp(App).mount('#app');
