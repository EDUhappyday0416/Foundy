const { createApp, ref } = Vue;

const BREEDS = ['不確定', '柴犬', '柯基', '黃金獵犬', '拉布拉多', '貴賓狗', '法鬥', '哈士奇',
                '橘貓', '虎斑貓', '暹羅貓', '波斯貓', '米克斯', '其他'];
const COLORS  = ['橘色', '棕色', '黑色', '白色', '黃色', '灰色', '黑白', '三花', '其他'];

const App = {
  template: `
  <div class="min-h-screen">
    <!-- Header -->
    <header class="px-8 pt-8 pb-5 border-b border-[#c8a96e22] flex items-end justify-between fade-up">
      <div>
        <p class="text-[#c8a96e] text-xs tracking-[0.25em] uppercase mb-1 leading-relaxed">Report Found Pet</p>
        <h1 class="font-serif-display text-3xl text-[#f0e6cc]">回報拾獲寵物</h1>
      </div>
      <a href="index.html" class="text-[#9a9080] text-sm hover:text-[#c8a96e] transition leading-relaxed">← 回 Dashboard</a>
    </header>

    <div class="max-w-xl mx-auto py-10 px-6">

      <!-- 成功訊息 -->
      <div v-if="submitted" class="bg-[#222220] border border-[#c8a96e33] rounded-3xl p-8 text-center fade-up
                                    shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h2 class="font-serif-display text-2xl text-[#f0e6cc] mb-2">回報成功！</h2>
        <p class="text-[#9a9080] text-sm mb-6 leading-relaxed">謝謝你！我們已收到你的拾獲紀錄，希望能幫助牠找到家人。</p>
        <div class="flex gap-3 justify-center">
          <button @click="reset" class="px-5 py-2 bg-[#c8a96e] text-[#1a1a18] rounded-2xl hover:bg-[#d4b87a] text-sm transition">再回報一筆</button>
          <a href="index.html" class="px-5 py-2 bg-[#2a2a28] text-[#9a9080] rounded-2xl hover:bg-[#333330] text-sm transition">回 Dashboard</a>
        </div>
      </div>

      <!-- 表單 -->
      <form v-else @submit.prevent="submit"
        class="bg-[#222220] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.4),0_1px_4px_rgba(200,169,110,0.06)]
               p-7 flex flex-col gap-6 fade-up">
        <h2 class="font-serif-display text-xl text-[#f0e6cc]">填寫拾獲資訊</h2>

        <!-- 照片上傳 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">寵物照片 *</label>
          <label class="flex flex-col items-center justify-center border border-dashed border-[#c8a96e44]
                         rounded-3xl p-6 cursor-pointer hover:border-[#c8a96e88] hover:bg-[#c8a96e06] transition">
            <span v-if="!photoPreview" class="text-xs text-[#5a5650] mb-2">+</span>
            <img v-else :src="photoPreview" class="w-full max-h-52 object-contain rounded-2xl mb-2" />
            <span class="text-xs text-[#9a9080] leading-relaxed">{{ photoPreview ? '點擊更換照片' : '點擊上傳照片' }}</span>
            <input type="file" accept="image/*" class="hidden" @change="onPhoto" />
          </label>
          <p v-if="errors.photo" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.photo }}</p>
        </div>

        <!-- 動物種類 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">動物種類 *</label>
          <div class="flex gap-2">
            <button type="button" @click="form.type='dog'"
              :class="form.type==='dog' ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-sm font-medium transition">狗</button>
            <button type="button" @click="form.type='cat'"
              :class="form.type==='cat' ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-sm font-medium transition">貓</button>
            <button type="button" @click="form.type='other'"
              :class="form.type==='other' ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-sm font-medium transition">其他</button>
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
              :class="form.color===c ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="px-3 py-1 rounded-full text-xs transition">{{ c }}</button>
          </div>
        </div>

        <!-- 拾獲地點 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">拾獲地點 *</label>
          <input v-model="form.location" type="text" placeholder="e.g. 台北市大安區和平東路"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
          <p v-if="errors.location" class="text-red-400 text-xs mt-1 leading-relaxed">{{ errors.location }}</p>
        </div>

        <!-- 拾獲日期 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">拾獲日期</label>
          <input v-model="form.date" type="date"
            class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-3 py-2 text-sm text-[#e8e0d0]
                   focus:outline-none focus:border-[#c8a96e66] transition" />
        </div>

        <!-- 特徵描述 -->
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

        <!-- 目前狀況 -->
        <div>
          <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-2 leading-relaxed">目前狀況</label>
          <div class="flex gap-2">
            <button v-for="s in statuses" :key="s.val" type="button"
              @click="form.status = s.val"
              :class="form.status===s.val ? 'bg-[#c8a96e] text-[#1a1a18]' : 'bg-[#2a2a28] text-[#9a9080] hover:bg-[#333330]'"
              class="flex-1 py-2 rounded-2xl text-xs font-medium transition">{{ s.label }}</button>
          </div>
        </div>

        <!-- 送出 -->
        <button type="submit" :disabled="loading"
          class="w-full py-3 bg-[#c8a96e] hover:bg-[#d4b87a] text-[#1a1a18] font-medium rounded-2xl transition disabled:opacity-50 text-sm tracking-wide">
          <span v-if="loading" class="animate-pulse">送出中...</span>
          <span v-else>送出回報</span>
        </button>
      </form>
    </div>
  </div>
  `,

  setup() {
    const form = ref({
      type: 'dog', breed: '不確定', color: '', location: '',
      date: new Date().toISOString().split('T')[0],
      traits: '', contact: '', status: 'keeping',
    });
    const photoFile    = ref(null);
    const photoPreview = ref('');
    const errors       = ref({});
    const loading      = ref(false);
    const submitted    = ref(false);

    const breeds   = BREEDS;
    const colors   = COLORS;
    const statuses = [
      { val: 'keeping',  label: '暫時照顧中' },
      { val: 'shelter',  label: '已送收容所' },
      { val: 'released', label: '已放回原地' },
    ];

    function onPhoto(e) {
      const file = e.target.files[0];
      if (!file) return;
      photoFile.value    = file;
      photoPreview.value = URL.createObjectURL(file);
    }

    function validate() {
      const e = {};
      if (!photoFile.value)      e.photo    = '請上傳照片';
      if (!form.value.location)  e.location = '請填寫拾獲地點';
      if (!form.value.contact)   e.contact  = '請填寫聯絡方式';
      errors.value = e;
      return Object.keys(e).length === 0;
    }

    async function submit() {
      if (!validate()) return;
      loading.value = true;

      try {
        // Step 1：直接上傳圖片到 Cloudinary（不經過 server）
        const cfd = new FormData();
        cfd.append('file',         photoFile.value);
        cfd.append('upload_preset', 'ml_default');
        const cRes  = await fetch('https://api.cloudinary.com/v1_1/dbnqkt0sg/image/upload', { method: 'POST', body: cfd });
        const cData = await cRes.json();
        if (!cData.secure_url) throw new Error('圖片上傳失敗');

        // Step 2：把資料（含圖片 URL）存到 Supabase
        const res = await fetch('/api/reports', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            photo:    cData.secure_url,
            type:     form.value.type,
            breed:    form.value.breed,
            color:    form.value.color,
            location: form.value.location,
            date:     form.value.date,
            traits:   form.value.traits,
            contact:  form.value.contact,
            status:   form.value.status,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        submitted.value = true;
      } catch (err) {
        alert('送出失敗：' + err.message);
      } finally {
        loading.value = false;
      }
    }

    function reset() {
      submitted.value    = false;
      photoFile.value    = null;
      photoPreview.value = '';
      form.value = { type: 'dog', breed: '不確定', color: '', location: '',
        date: new Date().toISOString().split('T')[0], traits: '', contact: '', status: 'keeping' };
    }

    return { form, photoPreview, errors, loading, submitted, breeds, colors, statuses, onPhoto, submit, reset };
  }
};

createApp(App).mount('#app');
