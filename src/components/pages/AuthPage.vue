<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'vue-sonner'

const authStore = useAuthStore()

// View state: 'login' | 'register' | 'forgot-password'
const currentView = ref<'login' | 'register' | 'forgot-password'>('login')

// Form state
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const fullName = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

// Form validation
const isEmailValid = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return email.value === '' || emailRegex.test(email.value)
})

const isPasswordValid = computed(() => {
  return password.value === '' || password.value.length >= 6
})

const passwordsMatch = computed(() => {
  return confirmPassword.value === '' || password.value === confirmPassword.value
})

const canSubmitLogin = computed(() => {
  return email.value && password.value && isEmailValid.value && !authStore.isLoading
})

const canSubmitRegister = computed(() => {
  return email.value && password.value && confirmPassword.value && 
         isEmailValid.value && isPasswordValid.value && passwordsMatch.value && 
         !authStore.isLoading
})

const canSubmitForgot = computed(() => {
  return email.value && isEmailValid.value && !authStore.isLoading
})

// Actions
const handleLogin = async () => {
  if (!canSubmitLogin.value) return
  
  const result = await authStore.signInWithPassword(email.value, password.value)
  
  if (result.success) {
    toast.success('登录成功', { description: '欢迎回来！' })
  } else {
    toast.error('登录失败', { description: result.error || '请重试' })
  }
}

const handleRegister = async () => {
  if (!canSubmitRegister.value) return
  
  const result = await authStore.signUp(email.value, password.value, {
    full_name: fullName.value || undefined
  })
  
  if (result.success) {
    if (result.message) {
      toast.info('注册成功', { description: result.message })
    } else {
      toast.success('注册成功', { description: '欢迎加入！' })
    }
    // After successful registration, switch to login view
    if (result.message) {
      currentView.value = 'login'
    }
  } else {
    toast.error('注册失败', { description: result.error || '请重试' })
  }
}

const handleForgotPassword = async () => {
  if (!canSubmitForgot.value) return
  
  const result = await authStore.resetPassword(email.value)
  
  if (result.success) {
    toast.success('邮件已发送', { description: result.message })
    currentView.value = 'login'
  } else {
    toast.error('发送失败', { description: result.error || '请重试' })
  }
}

const switchView = (view: 'login' | 'register' | 'forgot-password') => {
  currentView.value = view
  // Reset form
  password.value = ''
  confirmPassword.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
}
</script>

<template>
  <div class="auth-container">
    <!-- Background gradient -->
    <div class="auth-background">
      <div class="auth-gradient-1"></div>
      <div class="auth-gradient-2"></div>
    </div>
    
    <!-- Auth Card -->
    <div class="auth-card">
      <!-- Logo / Brand -->
      <div class="auth-header">
        <div class="auth-logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">ShadcnWork</span>
        </div>
        
        <h1 class="auth-title">
          {{ currentView === 'login' ? '欢迎回来' : currentView === 'register' ? '创建账户' : '重置密码' }}
        </h1>
        <p class="auth-subtitle">
          {{ currentView === 'login' ? '登录以继续使用' : currentView === 'register' ? '注册一个新账户' : '我们将发送重置链接到您的邮箱' }}
        </p>
      </div>

      <!-- Login Form -->
      <form v-if="currentView === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <div class="input-wrapper">
            <Mail class="input-icon" />
            <Input 
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="input-with-icon"
              :class="{ 'input-error': email && !isEmailValid }"
            />
          </div>
          <span v-if="email && !isEmailValid" class="error-text">请输入有效的邮箱地址</span>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <Input 
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="input-with-icon input-password"
            />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="form-footer">
          <button type="button" class="link-button" @click="switchView('forgot-password')">
            忘记密码？
          </button>
        </div>

        <Button 
          type="submit" 
          class="submit-button"
          :disabled="!canSubmitLogin"
        >
          <Loader2 v-if="authStore.isLoading" class="w-4 h-4 mr-2 animate-spin" />
          登录
        </Button>

        <p class="switch-view-text">
          还没有账户？
          <button type="button" class="link-button inline" @click="switchView('register')">
            立即注册
          </button>
        </p>
      </form>

      <!-- Register Form -->
      <form v-else-if="currentView === 'register'" @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label class="form-label">姓名 <span class="optional">(可选)</span></label>
          <div class="input-wrapper">
            <User class="input-icon" />
            <Input 
              v-model="fullName"
              type="text"
              placeholder="您的姓名"
              class="input-with-icon"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <div class="input-wrapper">
            <Mail class="input-icon" />
            <Input 
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="input-with-icon"
              :class="{ 'input-error': email && !isEmailValid }"
            />
          </div>
          <span v-if="email && !isEmailValid" class="error-text">请输入有效的邮箱地址</span>
        </div>

        <div class="form-group">
          <label class="form-label">密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <Input 
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="至少6个字符"
              class="input-with-icon input-password"
              :class="{ 'input-error': password && !isPasswordValid }"
            />
            <button type="button" class="password-toggle" @click="showPassword = !showPassword">
              <Eye v-if="!showPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
          <span v-if="password && !isPasswordValid" class="error-text">密码至少需要6个字符</span>
        </div>

        <div class="form-group">
          <label class="form-label">确认密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <Input 
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="再次输入密码"
              class="input-with-icon input-password"
              :class="{ 'input-error': confirmPassword && !passwordsMatch }"
            />
            <button type="button" class="password-toggle" @click="showConfirmPassword = !showConfirmPassword">
              <Eye v-if="!showConfirmPassword" class="w-4 h-4" />
              <EyeOff v-else class="w-4 h-4" />
            </button>
          </div>
          <span v-if="confirmPassword && !passwordsMatch" class="error-text">两次输入的密码不一致</span>
        </div>

        <Button 
          type="submit" 
          class="submit-button"
          :disabled="!canSubmitRegister"
        >
          <Loader2 v-if="authStore.isLoading" class="w-4 h-4 mr-2 animate-spin" />
          注册
        </Button>

        <p class="switch-view-text">
          已有账户？
          <button type="button" class="link-button inline" @click="switchView('login')">
            立即登录
          </button>
        </p>
      </form>

      <!-- Forgot Password Form -->
      <form v-else @submit.prevent="handleForgotPassword" class="auth-form">
        <button type="button" class="back-button" @click="switchView('login')">
          <ArrowLeft class="w-4 h-4 mr-1" />
          返回登录
        </button>

        <div class="form-group">
          <label class="form-label">邮箱</label>
          <div class="input-wrapper">
            <Mail class="input-icon" />
            <Input 
              v-model="email"
              type="email"
              placeholder="your@email.com"
              class="input-with-icon"
              :class="{ 'input-error': email && !isEmailValid }"
            />
          </div>
          <span v-if="email && !isEmailValid" class="error-text">请输入有效的邮箱地址</span>
        </div>

        <Button 
          type="submit" 
          class="submit-button"
          :disabled="!canSubmitForgot"
        >
          <Loader2 v-if="authStore.isLoading" class="w-4 h-4 mr-2 animate-spin" />
          发送重置链接
        </Button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  background: hsl(var(--background));
}

.auth-background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.auth-gradient-1 {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%);
  top: -200px;
  right: -200px;
  animation: float 20s ease-in-out infinite;
}

.auth-gradient-2 {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
  animation: float 25s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(30px, -30px); }
  50% { transform: translate(-20px, 20px); }
  75% { transform: translate(20px, 10px); }
}

.auth-card {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.logo-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%);
  border-radius: 12px;
  color: hsl(var(--primary-foreground));
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
}

.auth-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0 0 0.5rem 0;
}

.auth-subtitle {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.form-label .optional {
  font-weight: 400;
  color: hsl(var(--muted-foreground));
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.875rem;
  width: 1rem;
  height: 1rem;
  color: hsl(var(--muted-foreground));
  pointer-events: none;
  z-index: 1;
}

.input-with-icon {
  padding-left: 2.5rem !important;
}

.input-password {
  padding-right: 2.5rem !important;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.password-toggle:hover {
  color: hsl(var(--foreground));
}

.input-error {
  border-color: hsl(var(--destructive)) !important;
}

.error-text {
  font-size: 0.75rem;
  color: hsl(var(--destructive));
}

.form-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: -0.5rem;
}

.link-button {
  background: none;
  border: none;
  color: hsl(var(--primary));
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s, text-decoration 0.2s;
}

.link-button:hover {
  text-decoration: underline;
}

.link-button.inline {
  display: inline;
  font-weight: 500;
}

.submit-button {
  width: 100%;
  height: 2.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.switch-view-text {
  text-align: center;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  margin: 0;
}

.back-button {
  display: inline-flex;
  align-items: center;
  background: none;
  border: none;
  color: hsl(var(--muted-foreground));
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  transition: color 0.2s;
}

.back-button:hover {
  color: hsl(var(--foreground));
}

/* Dark mode enhancements */
:root.dark .auth-card {
  background: hsl(var(--card) / 0.95);
  backdrop-filter: blur(8px);
}
</style>
