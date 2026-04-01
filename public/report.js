const { createApp, ref, computed } = Vue;

const BREEDS = ['不確定', '柴犬', '柯基', '黃金獵犬', '拉布拉多', '貴賓狗', '法鬥', '哈士奇',
                '橘貓', '虎斑貓', '暹羅貓', '波斯貓', '米克斯', '其他'];
const COLORS  = ['橘色', '棕色', '黑色', '白色', '黃色', '灰色', '黑白', '三花', '其他'];
const MAX_PHOTOS = 5;

async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'zh-TW,en' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {}
  return { lat: null, lng: null };
}

const App = {
  template: `
  <div class="min-h-screen">
    <header class="px-6 md:px-8 pt-7 pb-5 border-b border-[#c8a96e22] flex items-end justify-between fade-up">
      <div>
        <p class="text-[#c8a96e] text-[10px] tracking-[0.25em] uppercase mb-1 leading-relaxed">Report</p>
        <h1 class="font-serif-display text-3xl text-[#f0e6cc]">回報寵物</h1>
      </div>
      <a href="/" class="text-[#9a9080] text-sm hover:text-[#c8a96e] transition leading-relaxed">← 回首頁</a>
    </header>

    <div class="max-w-xl mx-auto py-8 px-5">

      <!-- 成功畫面 -->
      <div v-if="submitted" class="bg-[#222220] border border-[#c8a96e33] rounded-3xl p-8 text-center fade-up shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h2 class="font-serif-display text-2xl text-[#f0e6cc] mb-2">回報成功！</h2>
        <p class="text-[#9a9080] text-sm mb-6 leading-relaxed">謝謝你！希望能幫助牠找到家人。<br/>你可以在詳細頁面標記已找到或刪除。</p>
        <div class="flex gap-3 justify-center">
          <button @click="reset" class="px-5 py-2 bg-[#c8a96e] text-[#1a1a18] rounded-2xl hover:bg-[#d4b87a] text-sm transition">再回報一筆</button>
          <a href="/" class="px-5 py-2 bg-[#2a2a28] text-[#9a9080] rounded-2xl hover:bg-[#333330] text-sm transition">回首頁</a>
        </div>
      </div>

      <!-- 表單 -->
      <form v-else @submit.prevent="submit"
        class="bg-[#222220] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-6 flex flex-col gap-5 fade-up">

        <!-- 類型切換 -->
        <div class="flex rounded-2xl bg-[#1a1a18] p-1 gap-1">
          <button type="button" @click="reportType = 'found'"
            :class="reportType === 'found' ? 'bg-[#c8a96e] text-[#1a1a18]' : 'text-[#9a9080] hover:text-[#e8e0d0]'"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium transition">我撿到了</button>
          <button type="button" @click="reportType = 'lost'"
            :class="reportType === 'lost' ? 'bg-red-500 text-white' : 'text-[#9a9080] hover:text-[#e8e0d0]'"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium transition">我的寵物走失了</button>
        </div>

        <!-- 照片（最多 5 張）-->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">
            照片（最多 {{ MAX_PHOTOS }} 張）*
          </label>
          <!-- 已上傳預覽 -->
          <div v-if="photoPreviews.length > 0" class="flex gap-2 mb-2 flex-wrap">
            <div v-for="(src, idx) in photoPreviews" :key="idx" class="relative shrink-0">
              <img :src="src" class="w-20 h-20 object-cover rounded-2xl border border-[#c8a96e22]" />
              <button type="button" @click="removePhoto(idx)"
                class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1a1a18] rounded-full flex items-center justify-center
                       text-[#9a9080] hover:text-red-400 text-xs border border-[#3a3a38] transition">✕</button>
            </div>
            <label v-if="photoPreviews.length < MAX_PHOTOS" class="cursor-pointer shrink-0">
              <div class="w-20 h-20 rounded-2xl border border-dashed border-[#c8a96e44]
                           flex items-center justify-center text-[#c8a96e] text-2xl
                           hover:border-[#c8a96e88] hover:bg-[#c8a96e06] transition font-light">+</div>
              <input type="file" accept="image/*" multiple class="hidden" @change="onPhoto" />
            </label>
          </div>
          <!-- 空狀態 -->
          <label v-else class="flex flex-col items-center justify-center border border-dashed border-[#c8a96e44]
                                rounded-3xl p-8 cursor-pointer hover:border-[#c8a96e88] hover:bg-[#c8a96e06] transition">
            <div class="w-10 h-10 rounded-2xl bg-[#2a2a28] flex items-center justify-center text-[#c8a96e] text-xl mb-2 font-light">+</div>
            <span class="text-xs text-[#9a9080] leading-relaxed text-center">點擊上傳照片<br/>最多 {{ MAX_PHOTOS }} 張</span>
            <input type="file" accept="image/*" multiple class="hidden" @change="onPhoto" />
          </label>
          <p v-if="errors.photo" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.photo }}</p>
        </div>

        <!-- 動物種類 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">動物種類</label>
          <div class="flex gap-2">
            <button v-for="t in typeOptions" :key="t.val" type="button"
              @click="form.type = t.val"
              :class="form.type === t.val ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-sm font-medium transition">{{ t.label }}</button>
          </div>
        </div>

        <!-- 品種 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">品種</label>
          <select v-model="form.breed"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   focus:outline-none focus:border-[#c8a96e66] transition">
            <option v-for="b in breeds" :key="b">{{ b }}</option>
          </select>
        </div>

        <!-- 毛色 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">毛色</label>
          <div class="flex flex-wrap gap-2">
            <button v-for="c in colors" :key="c" type="button"
              @click="form.color = c"
              :class="form.color === c ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="px-3 py-1 rounded-full text-xs transition">{{ c }}</button>
          </div>
        </div>

        <!-- 地點 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ locationLabel }} *</label>
          <input v-model="form.location" type="text" :placeholder="'e.g. 台北市大安區和平東路'"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
          <p v-if="errors.location" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.location }}</p>
        </div>

        <!-- 日期 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ dateLabel }}</label>
          <input v-model="form.date" type="date"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   focus:outline-none focus:border-[#c8a96e66] transition" />
        </div>

        <!-- 特徵 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">外觀特徵</label>
          <textarea v-model="form.traits" rows="3" placeholder="e.g. 左耳有缺口、戴藍色項圈、體型偏瘦..."
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition resize-none leading-relaxed"></textarea>
        </div>

        <!-- 聯絡方式 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">聯絡方式 *</label>
          <input v-model="form.contact" type="text" placeholder="e.g. Line ID: abc123 或 0912-345-678"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
          <p v-if="errors.contact" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.contact }}</p>
        </div>

        <!-- 目前狀況（拾獲才顯示）-->
        <div v-if="reportType === 'found'">
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">目前狀況</label>
          <div class="flex gap-2">
            <button v-for="s in statuses" :key="s.val" type="button"
              @click="form.status = s.val"
              :class="form.status === s.val ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-xs font-medium transition">{{ s.label }}</button>
          </div>
        </div>

        <!-- 送出 -->
        <button type="submit" :disabled="loading"
          class="w-full py-3 font-medium rounded-2xl transition disabled:opacity-50 text-sm tracking-wide"
          :class="reportType === 'lost' ? 'bg-red-500 hover:bg-red-400 text-white' : 'bg-[#c8a96e] hover:bg-[#d4b87a] text-[#1a1a18]'">
          <span v-if="loading" class="animate-pulse">{{ loadingMsg }}</span>
          <span v-else>{{ reportType === 'lost' ? '發布走失協尋' : '送出拾獲回報' }}</span>
        </button>
      </form>
    </div>
  </div>
  `,

  setup() {
    const reportType    = ref('found');
    const form          = ref({
      type: 'dog', breed: '不確定', color: '',
      location: '', date: new Date().toISOString().split('T')[0],
      traits: '', contact: '', status: 'keeping',
    });
    const photoFiles    = ref([]);
    const photoPreviews = ref([]);
    const errors        = ref({});
    const loading       = ref(false);
    const loadingMsg    = ref('上傳照片中...');
    const submitted     = ref(false);

    const breeds      = BREEDS;
    const colors      = COLORS;
    const typeOptions = [{ val: 'dog', label: '狗' }, { val: 'cat', label: '貓' }, { val: 'other', label: '其他' }];
    const statuses    = [
      { val: 'keeping',  label: '暫時照顧中' },
      { val: 'shelter',  label: '已送收容所' },
      { val: 'released', label: '已放回原地' },
    ];

    const locationLabel = computed(() => reportType.value === 'lost' ? '走失地點' : '拾獲地點');
    const dateLabel     = computed(() => reportType.value === 'lost' ? '走失日期' : '拾獲日期');

    function onPhoto(e) {
      const files     = Array.from(e.target.files || []);
      const remaining = MAX_PHOTOS - photoFiles.value.length;
      files.slice(0, remaining).forEach(file => {
        photoFiles.value.push(file);
        photoPreviews.value.push(URL.createObjectURL(file));
      });
      e.target.value = '';
    }

    function removePhoto(idx) {
      photoFiles.value.splice(idx, 1);
      photoPreviews.value.splice(idx, 1);
    }

    function validate() {
      const e = {};
      if (!photoFiles.value.length) e.photo    = '請至少上傳一張照片';
      if (!form.value.location)     e.location = '請填寫地點';
      if (!form.value.contact)      e.contact  = '請填寫聯絡方式';
      errors.value = e;
      return !Object.keys(e).length;
    }

    async function uploadOne(file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'ml_default');
      const res  = await fetch('https://api.cloudinary.com/v1_1/dbnqkt0sg/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error('圖片上傳失敗');
      return data.secure_url;
    }

    async function submit() {
      if (!validate()) return;
      loading.value = true;
      try {
        // 上傳所有照片
        const photoUrls = [];
        for (let i = 0; i < photoFiles.value.length; i++) {
          loadingMsg.value = `上傳照片 ${i + 1} / ${photoFiles.value.length}...`;
          photoUrls.push(await uploadOne(photoFiles.value[i]));
        }

        // 地理編碼
        loadingMsg.value = '定位中...';
        const { lat, lng } = await geocode(form.value.location);

        // edit token
        const editToken = crypto.randomUUID();

        // 送出
        loadingMsg.value = '儲存中...';
        const res = await fetch('/api/reports', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form.value,
            report_type: reportType.value,
            photo:      photoUrls[0],
            photos:     photoUrls,
            lat, lng,
            edit_token: editToken,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // 存 token
        if (data.id) {
          const tokens = JSON.parse(localStorage.getItem('foundy_tokens') || '{}');
          tokens[data.id] = editToken;
          localStorage.setItem('foundy_tokens', JSON.stringify(tokens));
        }
        submitted.value = true;
      } catch (err) {
        alert('送出失敗：' + err.message);
      } finally {
        loading.value = false;
      }
    }

    function reset() {
      submitted.value     = false;
      photoFiles.value    = [];
      photoPreviews.value = [];
      form.value = {
        type: 'dog', breed: '不確定', color: '',
        location: '', date: new Date().toISOString().split('T')[0],
        traits: '', contact: '', status: 'keeping',
      };
    }

    return {
      reportType, form, photoPreviews, errors, loading, loadingMsg, submitted,
      breeds, colors, typeOptions, statuses, MAX_PHOTOS,
      locationLabel, dateLabel,
      onPhoto, removePhoto, submit, reset,
    };
  }
};

createApp(App).mount('#app');
