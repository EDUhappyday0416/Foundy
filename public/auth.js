const { createApp, ref, computed } = Vue;

const supabase = window.supabase.createClient(
  'https://ouqvgowpjivtriymntfs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91cXZnb3dwaml2dHJpeW1udGZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNTI1MzEsImV4cCI6MjA5MDYyODUzMX0.X7eBWavBvOu71yQ9dcO448vFhLCBUzeHfnuBUbZZtRk'
);

const App = {
  template: `
  <div class="w-full max-w-sm fade-up">

    <!-- Logo -->
    <div class="text-center mb-8">
      <p class="text-[#c8a96e] text-[10px] tracking-[0.3em] uppercase mb-1">Lost & Found</p>
      <h1 class="font-serif-display text-4xl text-[#f0e6cc]">Foundy</h1>
    </div>

    <!-- Tab -->
    <div class="flex bg-[#1e1e1c] rounded-2xl p-1 mb-5 gap-1">
      <button @click="mode = 'login'"
        :class="mode === 'login' ? 'bg-[#2a2a28] text-[#f0e6cc]' : 'text-[#5a5650] hover:text-[#9a9080]'"
        class="flex-1 py-2 rounded-xl text-sm font-medium transition">
        {{ lang === 'zh' ? '登入' : 'Sign In' }}
      </button>
      <button @click="mode = 'register'"
        :class="mode === 'register' ? 'bg-[#2a2a28] text-[#f0e6cc]' : 'text-[#5a5650] hover:text-[#9a9080]'"
        class="flex-1 py-2 rounded-xl text-sm font-medium transition">
        {{ lang === 'zh' ? '註冊' : 'Sign Up' }}
      </button>
    </div>

    <!-- 表單 -->
    <div class="bg-[#222220] rounded-3xl p-6 shadow-[0_4px_32px_rgba(0,0,0,0.5)] flex flex-col gap-4">

      <div v-if="mode === 'register'">
        <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-1.5 leading-relaxed">
          {{ lang === 'zh' ? '暱稱' : 'Display Name' }}
        </label>
        <input v-model="displayName" type="text"
          :placeholder="lang === 'zh' ? '你的名字' : 'Your name'"
          class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-4 py-2.5 text-sm text-[#e8e0d0]
                 placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
      </div>

      <div>
        <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-1.5 leading-relaxed">Email</label>
        <input v-model="email" type="email" placeholder="you@example.com"
          class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-4 py-2.5 text-sm text-[#e8e0d0]
                 placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
      </div>

      <div>
        <label class="block text-xs text-[#c8a96e] tracking-wider uppercase mb-1.5 leading-relaxed">
          {{ lang === 'zh' ? '密碼' : 'Password' }}
        </label>
        <input v-model="password" type="password"
          :placeholder="lang === 'zh' ? '至少 6 個字元' : 'At least 6 characters'"
          class="w-full bg-[#1a1a18] border border-[#c8a96e22] rounded-2xl px-4 py-2.5 text-sm text-[#e8e0d0]
                 placeholder-[#5a5650] focus:outline-none focus:border-[#c8a96e66] transition" />
      </div>

      <!-- 錯誤訊息 -->
      <p v-if="errMsg" class="text-red-400 text-xs leading-relaxed">{{ errMsg }}</p>

      <!-- 成功訊息 -->
      <p v-if="successMsg" class="text-emerald-400 text-xs leading-relaxed">{{ successMsg }}</p>

      <!-- 送出 -->
      <button @click="submit" :disabled="loading"
        class="w-full py-3 bg-[#c8a96e] hover:bg-[#d4b87a] text-[#1a1a18] font-medium rounded-2xl
               text-sm transition disabled:opacity-50 mt-1">
        <span v-if="loading" class="animate-pulse">...</span>
        <span v-else>{{ mode === 'login' ? (lang === 'zh' ? '登入' : 'Sign In') : (lang === 'zh' ? '建立帳號' : 'Create Account') }}</span>
      </button>

      <!-- 語言切換 -->
      <button @click="toggleLang" class="text-[11px] text-[#5a5650] hover:text-[#9a9080] transition text-center leading-relaxed">
        {{ lang === 'zh' ? 'Switch to English' : '切換繁體中文' }}
      </button>
    </div>

    <p class="text-center mt-4 text-xs text-[#5a5650] leading-relaxed">
      <a href="/" class="hover:text-[#9a9080] transition">← {{ lang === 'zh' ? '回首頁（不登入）' : 'Back to home (no login)' }}</a>
    </p>
  </div>
  `,

  setup() {
    const lang        = ref(localStorage.getItem('foundy_lang') || 'zh');
    const mode        = ref('login');
    const email       = ref('');
    const password    = ref('');
    const displayName = ref('');
    const loading     = ref(false);
    const errMsg      = ref('');
    const successMsg  = ref('');

    // 已登入直接跳轉
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) location.href = '/';
    });

    function toggleLang() {
      lang.value = lang.value === 'zh' ? 'en' : 'zh';
      localStorage.setItem('foundy_lang', lang.value);
    }

    async function submit() {
      errMsg.value    = '';
      successMsg.value = '';
      if (!email.value || !password.value) {
        errMsg.value = lang.value === 'zh' ? '請填寫 Email 和密碼' : 'Please fill in email and password';
        return;
      }
      loading.value = true;
      try {
        if (mode.value === 'register') {
          const { error } = await supabase.auth.signUp({
            email:    email.value,
            password: password.value,
            options:  { data: { display_name: displayName.value } },
          });
          if (error) throw error;
          successMsg.value = lang.value === 'zh'
            ? '註冊成功！請檢查 Email 確認信。'
            : 'Registered! Please check your email to confirm.';
        } else {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.value, password: password.value,
          });
          if (error) throw error;
          // 登入成功，跳轉回原本頁面或首頁
          const redirect = new URLSearchParams(location.search).get('redirect') || '/';
          location.href = redirect;
        }
      } catch (err) {
        const msg = err.message || '';
        if (msg.includes('Invalid login')) {
          errMsg.value = lang.value === 'zh' ? 'Email 或密碼錯誤' : 'Invalid email or password';
        } else if (msg.includes('already registered')) {
          errMsg.value = lang.value === 'zh' ? '此 Email 已被註冊' : 'Email already registered';
        } else {
          errMsg.value = msg;
        }
      } finally {
        loading.value = false;
      }
    }

    return { lang, mode, email, password, displayName, loading, errMsg, successMsg, toggleLang, submit };
  }
};

createApp(App).mount('#app');
