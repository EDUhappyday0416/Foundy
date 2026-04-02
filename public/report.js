const { createApp, ref, computed } = Vue;

const BREEDS_ZH = ['不確定', '柴犬', '柯基', '黃金獵犬', '拉布拉多', '貴賓狗', '法鬥', '哈士奇', '橘貓', '虎斑貓', '暹羅貓', '波斯貓', '米克斯', '其他'];
const BREEDS_EN = ['Unknown', 'Shiba Inu', 'Corgi', 'Golden Retriever', 'Labrador', 'Poodle', 'French Bulldog', 'Husky', 'Orange Tabby', 'Tabby', 'Siamese', 'Persian', 'Mixed', 'Other'];
const COLORS_ZH = ['橘色', '棕色', '黑色', '白色', '黃色', '灰色', '黑白', '三花', '其他'];
const COLORS_EN = ['Orange', 'Brown', 'Black', 'White', 'Yellow', 'Gray', 'Black & White', 'Calico', 'Other'];
const MAX_PHOTOS = 5;

const I18N = {
  zh: {
    pageTitle: '回報寵物', backHome: '← 回首頁',
    successTitle: '回報成功！',
    successMsg: '謝謝你！希望能幫助牠找到家人。\n你可以在詳細頁面標記已找到或刪除。',
    reportAgain: '再回報一筆', goHome: '回首頁',
    foundBtn: '我撿到了', lostBtn: '我的寵物走失了',
    photoLabel: n => `照片（最多 ${n} 張）*`,
    photoHint: n => `點擊上傳照片\n最多 ${n} 張`,
    animalType: '動物種類', breed: '品種', color: '毛色',
    foundLoc: '拾獲地點', lostLoc: '走失地點',
    foundDate: '拾獲日期', lostDate: '走失日期',
    traits: '外觀特徵', traitsPlaceholder: 'e.g. 左耳有缺口、戴藍色項圈...',
    contact: '聯絡方式 *', contactPlaceholder: 'e.g. Line ID: abc123 或 0912-345-678',
    status: '目前狀況',
    keeping: '暫時照顧中', shelter: '已送收容所', released: '已放回原地',
    dog: '狗', cat: '貓', other: '其他',
    submitFound: '送出拾獲回報', submitLost: '發布走失協尋',
    uploading: i => `上傳照片 ${i}...`, geocoding: '定位中...', saving: '儲存中...',
    errPhoto: '請至少上傳一張照片', errLocation: '請填寫地點', errContact: '請填寫聯絡方式',
    failMsg: '送出失敗：',
  },
  en: {
    pageTitle: 'Report a Pet', backHome: '← Back',
    successTitle: 'Submitted!',
    successMsg: 'Thank you! We hope this helps reunite them with their family.\nYou can mark as found or delete from the detail page.',
    reportAgain: 'Report another', goHome: 'Go home',
    foundBtn: 'I found a pet', lostBtn: 'My pet is lost',
    photoLabel: n => `Photos (up to ${n}) *`,
    photoHint: n => `Click to upload\nup to ${n} photos`,
    animalType: 'Animal type', breed: 'Breed', color: 'Color',
    foundLoc: 'Location found', lostLoc: 'Last seen location',
    foundDate: 'Date found', lostDate: 'Date lost',
    traits: 'Description', traitsPlaceholder: 'e.g. Notched left ear, blue collar, slim...',
    contact: 'Contact *', contactPlaceholder: 'e.g. Instagram: abc123 or +1-555-0100',
    status: 'Current status',
    keeping: 'In my care', shelter: 'At a shelter', released: 'Released',
    dog: 'Dog', cat: 'Cat', other: 'Other',
    submitFound: 'Submit found pet', submitLost: 'Post lost pet alert',
    uploading: i => `Uploading photo ${i}...`, geocoding: 'Locating...', saving: 'Saving...',
    errPhoto: 'Please upload at least one photo', errLocation: 'Please enter a location', errContact: 'Please enter contact info',
    failMsg: 'Failed: ',
  },
};

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
        <h1 class="font-serif-display text-3xl text-[#f0e6cc]">{{ t.pageTitle }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <button @click="toggleLang"
          class="px-3 py-1.5 rounded-xl text-xs border border-[#c8a96e33] text-[#c8a96e] hover:bg-[#c8a96e15] transition">
          {{ lang === 'zh' ? 'EN' : '中' }}
        </button>
        <a href="/" class="text-[#9a9080] text-sm hover:text-[#c8a96e] transition leading-relaxed">{{ t.backHome }}</a>
      </div>
    </header>

    <div class="max-w-xl mx-auto py-8 px-5">

      <!-- 成功畫面 -->
      <div v-if="submitted" class="bg-[#222220] border border-[#c8a96e33] rounded-3xl p-8 text-center fade-up shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h2 class="font-serif-display text-2xl text-[#f0e6cc] mb-2">{{ t.successTitle }}</h2>
        <p class="text-[#9a9080] text-sm mb-6 leading-relaxed" style="white-space:pre-line">{{ t.successMsg }}</p>
        <div class="flex gap-3 justify-center">
          <button @click="reset" class="px-5 py-2 bg-[#c8a96e] text-[#1a1a18] rounded-2xl hover:bg-[#d4b87a] text-sm transition">{{ t.reportAgain }}</button>
          <a href="/" class="px-5 py-2 bg-[#2a2a28] text-[#9a9080] rounded-2xl hover:bg-[#333330] text-sm transition">{{ t.goHome }}</a>
        </div>
      </div>

      <!-- 表單 -->
      <form v-else @submit.prevent="submit"
        class="bg-[#222220] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-6 flex flex-col gap-5 fade-up">

        <!-- 類型切換 -->
        <div class="flex rounded-2xl bg-[#1a1a18] p-1 gap-1">
          <button type="button" @click="reportType = 'found'"
            :class="reportType === 'found' ? 'bg-[#c8a96e] text-[#1a1a18]' : 'text-[#9a9080] hover:text-[#e8e0d0]'"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium transition">{{ t.foundBtn }}</button>
          <button type="button" @click="reportType = 'lost'"
            :class="reportType === 'lost' ? 'bg-red-500 text-white' : 'text-[#9a9080] hover:text-[#e8e0d0]'"
            class="flex-1 py-2.5 rounded-xl text-sm font-medium transition">{{ t.lostBtn }}</button>
        </div>

        <!-- 照片 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">
            {{ t.photoLabel(MAX_PHOTOS) }}
          </label>
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
          <label v-else class="flex flex-col items-center justify-center border border-dashed border-[#c8a96e44]
                                rounded-3xl p-8 cursor-pointer hover:border-[#c8a96e88] hover:bg-[#c8a96e06] transition">
            <div class="w-10 h-10 rounded-2xl bg-[#2a2a28] flex items-center justify-center text-[#c8a96e] text-xl mb-2 font-light">+</div>
            <span class="text-xs text-[#9a9080] leading-relaxed text-center" style="white-space:pre-line">{{ t.photoHint(MAX_PHOTOS) }}</span>
            <input type="file" accept="image/*" multiple class="hidden" @change="onPhoto" />
          </label>
          <p v-if="errors.photo" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.photo }}</p>
        </div>

        <!-- 動物種類 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.animalType }}</label>
          <div class="flex gap-2">
            <button v-for="opt in typeOptions" :key="opt.val" type="button"
              @click="form.type = opt.val"
              :class="form.type === opt.val ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-sm font-medium transition">{{ opt.label }}</button>
          </div>
        </div>

        <!-- 品種 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.breed }}</label>
          <select v-model="form.breed"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   focus:outline-none focus:border-[#c8a96e66] transition">
            <option v-for="b in breeds" :key="b">{{ b }}</option>
          </select>
        </div>

        <!-- 毛色 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.color }}</label>
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
          <input v-model="form.location" type="text" :placeholder="t.traitsPlaceholder"
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
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.traits }}</label>
          <textarea v-model="form.traits" rows="3" :placeholder="t.traitsPlaceholder"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition resize-none leading-relaxed"></textarea>
        </div>

        <!-- 聯絡方式 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.contact }}</label>
          <input v-model="form.contact" type="text" :placeholder="t.contactPlaceholder"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
          <p v-if="errors.contact" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.contact }}</p>
        </div>

        <!-- 目前狀況（拾獲才顯示）-->
        <div v-if="reportType === 'found'">
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">{{ t.status }}</label>
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
          <span v-else>{{ reportType === 'lost' ? t.submitLost : t.submitFound }}</span>
        </button>
      </form>
    </div>
  </div>
  `,

  setup() {
    const lang          = ref(localStorage.getItem('foundy_lang') || 'zh');
    const t             = computed(() => I18N[lang.value]);
    function toggleLang() {
      lang.value = lang.value === 'zh' ? 'en' : 'zh';
      localStorage.setItem('foundy_lang', lang.value);
    }

    const reportType    = ref('found');
    const form          = ref({
      type: 'dog', breed: '', color: '',
      location: '', date: new Date().toISOString().split('T')[0],
      traits: '', contact: '', status: 'keeping',
    });
    const photoFiles    = ref([]);
    const photoPreviews = ref([]);
    const errors        = ref({});
    const loading       = ref(false);
    const loadingMsg    = ref('');
    const submitted     = ref(false);

    const breeds  = computed(() => lang.value === 'zh' ? BREEDS_ZH : BREEDS_EN);
    const colors  = computed(() => lang.value === 'zh' ? COLORS_ZH : COLORS_EN);

    const typeOptions = computed(() => [
      { val: 'dog', label: t.value.dog },
      { val: 'cat', label: t.value.cat },
      { val: 'other', label: t.value.other },
    ]);
    const statuses = computed(() => [
      { val: 'keeping',  label: t.value.keeping  },
      { val: 'shelter',  label: t.value.shelter  },
      { val: 'released', label: t.value.released },
    ]);

    const locationLabel = computed(() => reportType.value === 'lost' ? t.value.lostLoc : t.value.foundLoc);
    const dateLabel     = computed(() => reportType.value === 'lost' ? t.value.lostDate : t.value.foundDate);

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
      if (!photoFiles.value.length) e.photo    = t.value.errPhoto;
      if (!form.value.location)     e.location = t.value.errLocation;
      if (!form.value.contact)      e.contact  = t.value.errContact;
      errors.value = e;
      return !Object.keys(e).length;
    }

    async function uploadOne(file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'ml_default');
      const res  = await fetch('https://api.cloudinary.com/v1_1/dbnqkt0sg/image/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error('Upload failed');
      return data.secure_url;
    }

    async function submit() {
      if (!validate()) return;
      loading.value = true;
      try {
        const photoUrls = [];
        for (let i = 0; i < photoFiles.value.length; i++) {
          loadingMsg.value = t.value.uploading(i + 1);
          photoUrls.push(await uploadOne(photoFiles.value[i]));
        }
        loadingMsg.value = t.value.geocoding;
        const { lat, lng } = await geocode(form.value.location);
        const editToken = crypto.randomUUID();
        loadingMsg.value = t.value.saving;
        const res = await fetch('/api/reports', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form.value,
            report_type: reportType.value,
            photo: photoUrls[0], photos: photoUrls,
            lat, lng, edit_token: editToken,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (data.id) {
          const tokens = JSON.parse(localStorage.getItem('foundy_tokens') || '{}');
          tokens[data.id] = editToken;
          localStorage.setItem('foundy_tokens', JSON.stringify(tokens));
        }
        submitted.value = true;
      } catch (err) {
        alert(t.value.failMsg + err.message);
      } finally {
        loading.value = false;
      }
    }

    function reset() {
      submitted.value     = false;
      photoFiles.value    = [];
      photoPreviews.value = [];
      form.value = {
        type: 'dog', breed: '', color: '',
        location: '', date: new Date().toISOString().split('T')[0],
        traits: '', contact: '', status: 'keeping',
      };
    }

    return {
      lang, t, toggleLang,
      reportType, form, photoPreviews, errors, loading, loadingMsg, submitted,
      breeds, colors, typeOptions, statuses, MAX_PHOTOS,
      locationLabel, dateLabel,
      onPhoto, removePhoto, submit, reset,
    };
  }
};

createApp(App).mount('#app');
