<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loader2, Eye, EyeOff, ArrowLeft } from 'lucide-vue-next'
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

const handleTestLogin = async () => {
  email.value = 'test@example.com'
  password.value = 'test'
  await handleLogin()
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
  <div class="w-full min-h-screen lg:grid lg:grid-cols-1 overflow-hidden relative flex items-center justify-center">
    <!-- Background Patterns -->
    <div class="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
      <div class="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
    </div>

    <div class="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div class="mx-auto grid w-[350px] gap-6 bg-card p-6 border rounded-xl shadow-sm">
        <div class="grid gap-2 text-center">
          <div class="flex justify-center mb-4">
             <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
               <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-7 h-7">
                 <path d="M8 16v-6a2 2 0 1 1 4 0v6m-4-3h4m4-5v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
               </svg>
             </div>
          </div>
          <h1 class="text-3xl font-bold">AIGen UI</h1>
          <p class="text-balance text-muted-foreground">
             {{ currentView === 'login' ? '登录以继续使用' : currentView === 'register' ? '创建账户以开始' : '重置您的密码' }}
          </p>
        </div>

        <!-- Login Form -->
        <form v-if="currentView === 'login'" @submit.prevent="handleLogin" class="grid gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="email">邮箱</label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
              :class="{ 'border-destructive': email && !isEmailValid }"
            />
          </div>
          <div class="grid gap-2">
            <div class="flex items-center">
              <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" for="password">密码</label>
              <button 
                  type="button"
                  class="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-primary transition-colors" 
                  @click="switchView('forgot-password')"
                >
                  忘记密码?
              </button>
            </div>
            <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                />
                <button 
                  type="button" 
                  class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
            </div>
          </div>
          <Button type="submit" class="w-full" :disabled="!canSubmitLogin || authStore.isLoading">
             <Loader2 v-if="authStore.isLoading" class="mr-2 h-4 w-4 animate-spin" />
             登录
          </Button>

          <div class="relative my-2">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t" />
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-card px-2 text-muted-foreground">或者</span>
            </div>
          </div>

          <Button type="button" variant="outline" class="w-full" @click="handleTestLogin" :disabled="authStore.isLoading">
             测试账户登录
          </Button>
          
          <div class="mt-4 text-center text-sm">
            还没有账户?
            <button type="button" class="underline underline-offset-4 hover:text-primary" @click="switchView('register')">
              立即注册
            </button>
          </div>
        </form>

        <!-- Register Form -->
        <form v-else-if="currentView === 'register'" @submit.prevent="handleRegister" class="grid gap-4">
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="fullName">姓名</label>
            <Input id="fullName" v-model="fullName" placeholder="您的姓名" />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="email">邮箱</label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
              :class="{ 'border-destructive': email && !isEmailValid }"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="password">密码</label>
             <div class="relative">
                <Input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                />
                <button 
                  type="button" 
                  class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="h-4 w-4" />
                  <EyeOff v-else class="h-4 w-4" />
                </button>
            </div>
          </div>
           <div class="grid gap-2">
              <label class="text-sm font-medium" for="confirm-password">确认密码</label>
              <Input
                id="confirm-password"
                v-model="confirmPassword"
                type="password"
                required
                :class="{ 'border-destructive': confirmPassword && !passwordsMatch }"
              />
            </div>
          <Button type="submit" class="w-full" :disabled="!canSubmitRegister || authStore.isLoading">
             <Loader2 v-if="authStore.isLoading" class="mr-2 h-4 w-4 animate-spin" />
             创建账户
          </Button>
          <div class="mt-4 text-center text-sm">
            已有账户?
            <button type="button" class="underline underline-offset-4 hover:text-primary" @click="switchView('login')">
              立即登录
            </button>
          </div>
        </form>

        <!-- Forgot Password Form -->
        <form v-else @submit.prevent="handleForgotPassword" class="grid gap-4">
           <div class="flex items-center mb-2">
             <button type="button" class="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors" @click="switchView('login')">
               <ArrowLeft class="mr-1 h-3 w-3" /> 返回登录
             </button>
           </div>
          <div class="grid gap-2">
            <label class="text-sm font-medium" for="email">邮箱</label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="m@example.com"
              required
              :class="{ 'border-destructive': email && !isEmailValid }"
            />
          </div>
          <Button type="submit" class="w-full" :disabled="!canSubmitForgot || authStore.isLoading">
             <Loader2 v-if="authStore.isLoading" class="mr-2 h-4 w-4 animate-spin" />
             发送重置链接
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
