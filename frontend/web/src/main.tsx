import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { initSentry } from '@/lib/monitoring/sentry'
import ErrorBoundary from '@/components/ErrorBoundary'
import { queryClient } from '@/lib/query-client'

// 初始化 Sentry
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="go-genai-stack-theme">
          <App />
          <Toaster />
        </ThemeProvider>
      </ErrorBoundary>
      {/* React Query Devtools（仅在开发环境显示）*/}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
)
