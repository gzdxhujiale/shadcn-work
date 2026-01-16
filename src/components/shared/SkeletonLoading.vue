<template>
  <div class="skeleton-layout">
    <!-- Skeleton Sidebar -->
    <div class="skeleton-sidebar">
      <div class="skeleton-logo"></div>
      <div class="skeleton-nav">
        <div v-for="i in 3" :key="i" class="skeleton-nav-item"></div>
      </div>
    </div>

    <!-- Skeleton Content -->
    <div class="skeleton-content">
      <!-- Skeleton Breadcrumb -->
      <div class="skeleton-breadcrumb">
        <div class="skeleton-breadcrumb-item"></div>
        <div class="skeleton-breadcrumb-item"></div>
      </div>

      <!-- Skeleton Filters -->
      <div class="skeleton-filters">
        <div v-for="i in 4" :key="i" class="skeleton-filter"></div>
      </div>

      <!-- Skeleton Table -->
      <div class="skeleton-table">
        <div class="skeleton-table-header"></div>
        <div v-for="i in 8" :key="i" class="skeleton-table-row"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background: hsl(var(--background));
}

/* Sidebar */
.skeleton-sidebar {
  width: 280px;
  border-right: 1px solid hsl(var(--border));
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.skeleton-logo {
  height: 48px;
  background: hsl(var(--muted));
  border-radius: 0.5rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.skeleton-nav-item {
  height: 40px;
  background: hsl(var(--muted));
  border-radius: 0.375rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-nav-item:nth-child(2) {
  animation-delay: 0.2s;
}

.skeleton-nav-item:nth-child(3) {
  animation-delay: 0.4s;
}

/* Content */
.skeleton-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Breadcrumb */
.skeleton-breadcrumb {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.skeleton-breadcrumb-item {
  height: 20px;
  width: 80px;
  background: hsl(var(--muted));
  border-radius: 0.25rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Filters */
.skeleton-filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.skeleton-filter {
  height: 40px;
  background: hsl(var(--muted));
  border-radius: 0.375rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Table */
.skeleton-table {
  flex: 1;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-table-header {
  height: 48px;
  background: hsl(var(--muted));
  border-radius: 0.375rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.skeleton-table-row {
  height: 60px;
  background: hsl(var(--muted));
  border-radius: 0.375rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
